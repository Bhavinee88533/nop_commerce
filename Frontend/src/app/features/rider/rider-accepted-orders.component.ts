import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiderApiService } from './rider-api.service';
import { DeliveryStatusId, RiderActiveDelivery } from './rider.models';

interface ConfirmingAction {
  orderId: number;
  status: DeliveryStatusId;
  message: string;
}

@Component({
  selector: 'app-rider-accepted-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rider-accepted-orders.component.html',
  styleUrl: './rider-accepted-orders.component.css'
})
export class RiderAcceptedOrdersComponent implements OnInit {
  private static readonly selectedOrderStorageKey = 'rider_selected_active_order_id';

  private readonly activeDeliveriesState = signal<RiderActiveDelivery[]>([]);
  private readonly loadingState = signal(true);
  private readonly errorState = signal('');
  private readonly selectedOrderIdState = signal<number>(0);
  private readonly confirmingState = signal<ConfirmingAction | null>(null);
  private readonly statusUpdatingState = signal(false);

  get activeDeliveries(): RiderActiveDelivery[] {
    return this.activeDeliveriesState();
  }

  get loading(): boolean {
    return this.loadingState();
  }

  get errorMessage(): string {
    return this.errorState();
  }

  get selectedOrderId(): number {
    return this.selectedOrderIdState();
  }

  get confirming(): ConfirmingAction | null {
    return this.confirmingState();
  }

  get statusUpdating(): boolean {
    return this.statusUpdatingState();
  }

  constructor(private readonly riderApi: RiderApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadingState.set(true);
    this.errorState.set('');

    this.riderApi.getActiveDeliveries().subscribe({
      next: (deliveries) => {
        this.activeDeliveriesState.set(deliveries);
        this.syncSelection(deliveries.map(d => d.orderId));
        this.loadingState.set(false);
      },
      error: (err) => {
        this.loadingState.set(false);
        this.errorState.set(err?.error?.error ?? 'Unable to load accepted orders.');
      }
    });
  }

  getNextAction(delivery: RiderActiveDelivery): { label: string; status: DeliveryStatusId; message: string } | null {
    switch (delivery.deliveryStatusId) {
      case DeliveryStatusId.Assigned:
        return { label: 'Picked', status: DeliveryStatusId.PickedUp, message: 'Mark this order as Picked Up?' };
      case DeliveryStatusId.PickedUp:
        return { label: 'Out for Delivery', status: DeliveryStatusId.InTransit, message: 'Mark this order as Out for Delivery?' };
      case DeliveryStatusId.InTransit:
        return { label: 'Delivered', status: DeliveryStatusId.Delivered, message: 'Mark this order as Delivered?' };
      default:
        return null;
    }
  }

  getStatusClass(statusId: number): string {
    switch (statusId) {
      case DeliveryStatusId.Assigned: return 'status-assigned';
      case DeliveryStatusId.PickedUp: return 'status-pickedup';
      case DeliveryStatusId.InTransit: return 'status-intransit';
      case DeliveryStatusId.Delivered: return 'status-delivered';
      default: return 'status-default';
    }
  }

  promptStatusUpdate(delivery: RiderActiveDelivery, action: { label: string; status: DeliveryStatusId; message: string }): void {
    this.confirmingState.set({ orderId: delivery.orderId, status: action.status, message: action.message });
    this.errorState.set('');
  }

  cancelStatusUpdate(): void {
    this.confirmingState.set(null);
  }

  confirmStatusUpdate(): void {
    const confirming = this.confirmingState();
    if (!confirming || this.statusUpdatingState()) {
      return;
    }

    this.statusUpdatingState.set(true);
    this.confirmingState.set(null);

    this.riderApi.updateDeliveryStatus(confirming.orderId, confirming.status).subscribe({
      next: (response) => {
        this.statusUpdatingState.set(false);
        if (response.success) {
          // Instant UI update
          this.activeDeliveriesState.set(
            this.activeDeliveriesState()
              .map(d => d.orderId === confirming.orderId
                ? { ...d, deliveryStatusId: confirming.status, deliveryStatus: this.statusIdToLabel(confirming.status) }
                : d
              )
              // Remove delivered orders from the active list
              .filter(d => d.deliveryStatusId !== DeliveryStatusId.Delivered)
          );
        } else {
          this.errorState.set(response.message || 'Unable to update delivery status.');
        }
      },
      error: (err) => {
        this.statusUpdatingState.set(false);
        this.errorState.set(err?.error?.message ?? 'Failed to update delivery status. Please try again.');
      }
    });
  }

  chooseOrder(orderId: number): void {
    this.selectedOrderIdState.set(orderId);
    this.setStoredSelectedOrderId(orderId);
    window.location.href = '/rider/dashboard';
  }

  openOrderDetails(orderId: number): void {
    window.location.href = `/rider/orders/${orderId}`;
  }

  backToDashboard(): void {
    window.location.href = '/rider/dashboard';
  }

  private statusIdToLabel(status: DeliveryStatusId): string {
    switch (status) {
      case DeliveryStatusId.Assigned: return 'Assigned';
      case DeliveryStatusId.PickedUp: return 'Picked Up';
      case DeliveryStatusId.InTransit: return 'Out for Delivery';
      case DeliveryStatusId.Delivered: return 'Delivered';
      default: return 'Unknown';
    }
  }

  private syncSelection(activeOrderIds: number[]): void {
    if (activeOrderIds.length === 0) {
      this.selectedOrderIdState.set(0);
      this.setStoredSelectedOrderId(0);
      return;
    }

    const stored = this.getStoredSelectedOrderId();
    if (stored > 0 && activeOrderIds.includes(stored)) {
      this.selectedOrderIdState.set(stored);
      return;
    }

    const fallback = activeOrderIds[0];
    this.selectedOrderIdState.set(fallback);
    this.setStoredSelectedOrderId(fallback);
  }

  private getStoredSelectedOrderId(): number {
    const raw = window.localStorage.getItem(RiderAcceptedOrdersComponent.selectedOrderStorageKey);
    if (!raw) {
      return 0;
    }
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  }

  private setStoredSelectedOrderId(orderId: number): void {
    if (orderId <= 0) {
      window.localStorage.removeItem(RiderAcceptedOrdersComponent.selectedOrderStorageKey);
      return;
    }
    window.localStorage.setItem(RiderAcceptedOrdersComponent.selectedOrderStorageKey, String(orderId));
  }
}
