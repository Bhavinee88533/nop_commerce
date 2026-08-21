import { Component, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { RiderNotificationService, IncomingOrder } from './rider-notification.service';
import { CommonModule } from '@angular/common';
import { RiderApiService } from './rider-api.service';
import { RiderDashboardData } from './rider.models';
import { Subscription } from 'rxjs';

/**
 * nopCommerce rider dashboard.
 *
 * Includes profile, status toggle, earnings, active jobs, available orders,
 * delivery history highlights, and logout action.
 * Connects to the SignalR hub to receive real-time new order notifications.
 *
 * FIX: NgZone injected so that setInterval / setTimeout created inside SignalR
 * callbacks (which run outside Angular's zone) are wrapped with ngZone.run().
 * Without this, signal updates from the countdown tick never trigger change
 * detection, so the timer displays 0 and the auto-reject never fires visually.
 */
@Component({
  selector: 'app-rider-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rider-dashboard.component.html',
  styleUrl: './rider-dashboard.component.css'
})
export class RiderDashboardComponent implements OnInit, OnDestroy {
  private static readonly selectedOrderStorageKey = 'rider_selected_active_order_id';
  private readonly dashboardState = signal<RiderDashboardData | null>(null);
  private readonly selectedActiveOrderIdState = signal<number>(0);
  private readonly loadingState = signal(true);
  private readonly statusSavingState = signal(false);
  private readonly errorMessageState = signal('');
  private readonly refreshingState = signal(false);
  private readonly lastUpdatedState = signal<string>('');
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private orderSub: Subscription | null = null;
  private expiredSub: Subscription | null = null;
  private acceptedSub: Subscription | null = null;
  private readonly orderTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private countdownTick: ReturnType<typeof setInterval> | null = null;
  private static readonly AUTO_REJECT_SECONDS = 60;

  /** Incoming orders waiting for Accept/Reject */
  readonly pendingOrders = signal<IncomingOrder[]>([]);

  /** Resolved city name from GPS coordinates (reverse geocoded) */
  readonly displayLocation = signal<string>('');

  /** Remaining seconds per orderId — updated by a setInterval tick */
  readonly orderCountdowns = signal<Partial<Record<number, number>>>({});

  getCountdown(orderId: number): number {
    return this.orderCountdowns()[orderId] ?? 0;
  }

  getCountdownPercent(orderId: number, totalSeconds: number): number {
    const remaining = this.orderCountdowns()[orderId] ?? 0;
    return Math.round((remaining / totalSeconds) * 100);
  }

  get dashboard(): RiderDashboardData | null {
    return this.dashboardState();
  }

  get loading(): boolean {
    return this.loadingState();
  }

  get statusSaving(): boolean {
    return this.statusSavingState();
  }

  get errorMessage(): string {
    return this.errorMessageState();
  }

  get refreshing(): boolean {
    return this.refreshingState();
  }

  get lastUpdated(): string {
    return this.lastUpdatedState();
  }

  get selectedActiveOrderId(): number {
    return this.selectedActiveOrderIdState();
  }

  constructor(
    private readonly riderApi: RiderApiService,
    private readonly notificationService: RiderNotificationService,
    private readonly ngZone: NgZone   // ← ADDED: needed to bring SignalR callbacks back into Angular's zone
  ) {}

  ngOnInit(): void {
    // Load dashboard, then connect to SignalR using the rider's customerId
    this.riderApi.getSession().subscribe({
      next: (session) => {
        if (session?.customerId) {
          this.notificationService.connectToHub(session.customerId);
        } else {
          console.warn('[Dashboard] Session returned no customerId — SignalR hub not connected');
        }
      },
      error: (err) => {
        console.error('[Dashboard] getSession() failed — SignalR hub not connected:', err);
      }
    });

    // Subscribe to incoming orders from the hub
    this.orderSub = this.notificationService.newOrder$.subscribe(order => {
      const current = this.pendingOrders();
      // Avoid duplicates
      if (!current.some(o => o.orderId === order.orderId)) {
        this.pendingOrders.set([...current, order]);
        this.startOrderTimer(order.orderId, order.expiresInSeconds ?? RiderDashboardComponent.AUTO_REJECT_SECONDS);
      }
    });

    // Server confirmed the timer expired — dismiss the card silently
    this.expiredSub = this.notificationService.orderExpired$.subscribe(orderId => {
      this.clearOrderTimer(orderId);
      this.removePendingOrder(orderId);
    });

    // Another rider accepted — dismiss this rider's card
    this.acceptedSub = this.notificationService.orderAccepted$.subscribe(orderId => {
      this.clearOrderTimer(orderId);
      this.removePendingOrder(orderId);
    });

    this.loadDashboard(true);
    this.refreshTimer = setInterval(() => this.loadDashboard(false), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.countdownTick) {
      clearInterval(this.countdownTick);
      this.countdownTick = null;
    }
    this.orderSub?.unsubscribe();
    this.expiredSub?.unsubscribe();
    this.acceptedSub?.unsubscribe();
    this.orderTimers.forEach((t) => clearTimeout(t));
    this.orderTimers.clear();
    this.notificationService.disconnectFromHub();
  }

  acceptOrder(order: IncomingOrder): void {
    this.clearOrderTimer(order.orderId);
    this.riderApi.acceptOrder(order.orderId).subscribe({
      next: () => {
        this.removePendingOrder(order.orderId);
        // Mark rider as unavailable in UI immediately
        const dashboard = this.dashboardState();
        if (dashboard) {
          this.dashboardState.set({ ...dashboard, availability: false });
        }
        this.loadDashboard(false);
      },
      error: (err) => {
        // 409 Conflict = another rider already accepted this order — just dismiss it
        if (err?.status === 409) {
          this.removePendingOrder(order.orderId);
          this.errorMessageState.set('Order was already accepted by another rider.');
        } else {
          this.errorMessageState.set(err?.error?.error ?? 'Failed to accept order.');
        }
      }
    });
  }

  rejectOrder(order: IncomingOrder): void {
    this.clearOrderTimer(order.orderId);
    this.riderApi.rejectOrder(order.orderId).subscribe({
      next: () => this.removePendingOrder(order.orderId),
      error: () => this.removePendingOrder(order.orderId)
    });
  }

  /**
   * Starts a per-order countdown and schedules an auto-reject.
   *
   * FIX: Both setInterval (countdown tick) and setTimeout (auto-reject) are now
   * wrapped in this.ngZone.run(). SignalR hub callbacks execute outside Angular's
   * NgZone, so any timers created inside them also run outside the zone. Angular
   * signals only schedule change detection when a signal write happens inside the
   * zone (or via the signals scheduler microtask). Without ngZone.run(), the
   * orderCountdowns signal updates every second but Angular never re-renders, so
   * the countdown appears frozen at the initial value and the auto-reject fires
   * the HTTP call but the card is never removed from the view.
   */
  private startOrderTimer(orderId: number, seconds: number = RiderDashboardComponent.AUTO_REJECT_SECONDS): void {
    // Set initial countdown value — this write happens synchronously inside the
    // subscriber which may already be outside zone, so wrap it too.
    this.ngZone.run(() => {
      this.orderCountdowns.update(prev => ({ ...prev, [orderId]: seconds }));
    });

    // Start the global 1-second tick only once — reused across all pending orders.
    if (!this.countdownTick) {
      // ↓ FIXED: wrap setInterval in ngZone.run() so every tick is inside the zone
      this.countdownTick = this.ngZone.run(() =>
        setInterval(() => {
          this.orderCountdowns.update(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => {
              next[+k] = Math.max(0, (next[+k] ?? 0) - 1);
            });
            return next;
          });
        }, 1000)
      );
    }

    // ↓ FIXED: wrap setTimeout in ngZone.run() so removePendingOrder() triggers
    //   change detection and the card is actually removed from the DOM.
    const timer = this.ngZone.run(() =>
      setTimeout(() => {
        this.clearOrderTimer(orderId);
        this.riderApi.rejectOrder(orderId).subscribe({
          next: () => this.removePendingOrder(orderId),
          error: () => this.removePendingOrder(orderId)
        });
      }, seconds * 1000)
    );

    this.orderTimers.set(orderId, timer);
  }

  private clearOrderTimer(orderId: number): void {
    const timer = this.orderTimers.get(orderId);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.orderTimers.delete(orderId);
    }
    this.orderCountdowns.update(prev => {
      const next = { ...prev };
      delete next[orderId];
      return next;
    });

    // Stop global tick when no more pending orders
    if (this.orderTimers.size === 0 && this.countdownTick) {
      clearInterval(this.countdownTick);
      this.countdownTick = null;
    }
  }

  private removePendingOrder(orderId: number): void {
    this.pendingOrders.set(this.pendingOrders().filter(o => o.orderId !== orderId));
  }

  manualRefresh(): void {
    this.loadDashboard(false);
  }

  loadDashboard(showLoader: boolean): void {
    if (showLoader) {
      this.loadingState.set(true);
    } else {
      this.refreshingState.set(true);
    }

    this.errorMessageState.set('');

    this.riderApi.getDashboard().subscribe({
      next: (result) => {
        const normalized = this.normalizeDashboard(result as unknown as Record<string, unknown>);
        this.dashboardState.set(normalized);
        this.syncSelectedOrder(normalized);
        this.resolveLocation(normalized.currentLocation);
        this.loadingState.set(false);
        this.refreshingState.set(false);
        this.lastUpdatedState.set(new Date().toLocaleTimeString());
      },
      error: (error) => {
        this.loadingState.set(false);
        this.refreshingState.set(false);
        this.errorMessageState.set(error?.error?.error ?? 'Unable to load rider dashboard.');
      }
    });
  }

  toggleOnline(): void {
    const dashboard = this.dashboardState();
    if (!dashboard || this.statusSavingState()) {
      return;
    }

    const nextOnline = dashboard.riderStatus !== 'Online';
    this.statusSavingState.set(true);

    this.riderApi
      .updateStatus({
        isOnline: nextOnline,
        availability: dashboard.availability
      })
      .subscribe({
        next: (result) => {
          const riderStatus = this.getStringProp(result.rider as unknown as Record<string, unknown>, 'riderStatus', 'RiderStatus', dashboard.riderStatus);
          this.statusSavingState.set(false);
          this.dashboardState.set({
            ...dashboard,
            riderStatus
          });
        },
        error: () => {
          this.statusSavingState.set(false);
          this.errorMessageState.set('Unable to update rider status. Please retry.');
        }
      });
  }

  toggleAvailability(): void {
    const dashboard = this.dashboardState();
    if (!dashboard || this.statusSavingState()) {
      return;
    }

    const nextAvailability = !dashboard.availability;
    this.statusSavingState.set(true);

    this.riderApi
      .updateStatus({
        isOnline: dashboard.riderStatus === 'Online',
        availability: nextAvailability
      })
      .subscribe({
        next: (result) => {
          const availability = this.getBooleanProp(result.rider as unknown as Record<string, unknown>, 'availability', 'Availability', dashboard.availability);
          this.statusSavingState.set(false);
          this.dashboardState.set({
            ...dashboard,
            availability
          });
        },
        error: () => {
          this.statusSavingState.set(false);
          this.errorMessageState.set('Unable to update availability. Please retry.');
        }
      });
  }

  /** Resolves GPS coords to city name via OpenStreetMap Nominatim. If not GPS, shows as-is. */
  private resolveLocation(location: string): void {
    if (!location) {
      this.displayLocation.set('Location not set');
      return;
    }

    const gpsMatch = location.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
    if (!gpsMatch) {
      // Already a city name
      this.displayLocation.set(location);
      return;
    }

    const lat = gpsMatch[1];
    const lon = gpsMatch[2];
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    fetch(url, { headers: { 'Accept-Language': 'en' } })
      .then(r => r.json())
      .then((data: { address?: { city?: string; town?: string; village?: string; state_district?: string; state?: string } }) => {
        const addr = data.address;
        const city = addr?.city ?? addr?.town ?? addr?.village ?? addr?.state_district ?? addr?.state ?? location;
        this.displayLocation.set(city);
      })
      .catch(() => this.displayLocation.set(location));
  }

  logout(): void {
    window.location.href = '/logout?returnUrl=%2Frider';
  }

  backToStore(): void {
    window.location.href = '/';
  }

  goToAcceptedOrders(): void {
    window.location.href = '/rider/accepted-orders';
  }

  goToDeliveryHistory(): void {
    window.location.href = '/rider/past-deliveries';
  }

  openActiveDelivery(): void {
    const selectedOrderId = this.selectedActiveOrderIdState();
    if (selectedOrderId <= 0) {
      this.errorMessageState.set('No active delivery order is available right now.');
      return;
    }
    window.location.href = `/rider/orders/${selectedOrderId}`;
  }

  private syncSelectedOrder(dashboard: RiderDashboardData): void {
    const ids = dashboard.activeOrderIds;
    if (ids.length === 0) {
      this.selectedActiveOrderIdState.set(0);
      this.setStoredSelectedOrderId(0);
      return;
    }

    const selectedFromState = this.selectedActiveOrderIdState();
    if (selectedFromState > 0 && ids.includes(selectedFromState)) {
      return;
    }

    const selectedFromStorage = this.getStoredSelectedOrderId();
    if (selectedFromStorage > 0 && ids.includes(selectedFromStorage)) {
      this.selectedActiveOrderIdState.set(selectedFromStorage);
      return;
    }

    // Keep primary order as default selection unless rider selects a different one.
    const fallback = dashboard.activeOrderId > 0 ? dashboard.activeOrderId : ids[0];
    this.selectedActiveOrderIdState.set(fallback);
    this.setStoredSelectedOrderId(fallback);
  }

  private getStoredSelectedOrderId(): number {
    const raw = window.localStorage.getItem(RiderDashboardComponent.selectedOrderStorageKey);
    if (!raw) {
      return 0;
    }

    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  }

  private setStoredSelectedOrderId(orderId: number): void {
    if (orderId <= 0) {
      window.localStorage.removeItem(RiderDashboardComponent.selectedOrderStorageKey);
      return;
    }

    window.localStorage.setItem(RiderDashboardComponent.selectedOrderStorageKey, String(orderId));
  }

  private getNumberArrayProp(raw: Record<string, unknown>, camel: string, pascal: string): number[] {
    const value = raw[camel] ?? raw[pascal];
    if (Array.isArray(value)) {
      return value.filter((v): v is number => typeof v === 'number');
    }
    return [];
  }

  private getStringProp(raw: Record<string, unknown>, camel: string, pascal: string, fallback: string): string {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === 'string') {
      return value;
    }

    return fallback;
  }

  private getNumberProp(raw: Record<string, unknown>, camel: string, pascal: string, fallback: number): number {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return fallback;
  }

  private getBooleanProp(raw: Record<string, unknown>, camel: string, pascal: string, fallback: boolean): boolean {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    return fallback;
  }

  private normalizeDashboard(raw: Record<string, unknown>): RiderDashboardData {
    return {
      riderId: this.getNumberProp(raw, 'riderId', 'RiderId', 0),
      riderName: this.getStringProp(raw, 'riderName', 'RiderName', ''),
      riderStatus: this.getStringProp(raw, 'riderStatus', 'RiderStatus', 'Offline'),
      availability: this.getBooleanProp(raw, 'availability', 'Availability', false),
      isApproved: this.getBooleanProp(raw, 'isApproved', 'IsApproved', false),
      vehicleType: this.getStringProp(raw, 'vehicleType', 'VehicleType', ''),
      currentLocation: this.getStringProp(raw, 'currentLocation', 'CurrentLocation', ''),
      activeDeliveries: this.getNumberProp(raw, 'activeDeliveries', 'ActiveDeliveries', 0),
      activeOrderId: this.getNumberProp(raw, 'activeOrderId', 'ActiveOrderId', 0),
      activeOrderIds: this.getNumberArrayProp(raw, 'activeOrderIds', 'ActiveOrderIds'),
      availableOrders: this.getNumberProp(raw, 'availableOrders', 'AvailableOrders', 0),
      deliveredCount: this.getNumberProp(raw, 'deliveredCount', 'DeliveredCount', 0),
      earnings: this.getNumberProp(raw, 'earnings', 'Earnings', 0)
    };
  }
}