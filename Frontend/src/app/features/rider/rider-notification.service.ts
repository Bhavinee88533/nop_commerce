import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

import { RiderApiService } from './rider-api.service';

export interface NotificationOptions {
  id: string;
  title: string;
  message: string;
  soundUrl?: string;
  data?: any;
}

export interface IncomingOrder {
  notificationId: string;
  orderId: number;
  orderTotal: string;
  shippingAddress: string;
  customerName: string;
  customerPhone: string;
  sentAtUtc: string;
  expiresInSeconds?: number;
}

@Injectable({ providedIn: 'root' })
export class RiderNotificationService implements OnDestroy {

  private shownNotifications = new Set<string>();

  private hubConnection: signalR.HubConnection | null = null;

  /**
   * Track active timers so we can clear them
   * if another rider accepts the order
   */
  private activeTimers = new Map<number, any>();


  // ─────────────────────────────────────────────────────────────
  // RXJS EVENTS
  // ─────────────────────────────────────────────────────────────

  /** New order pushed from SignalR */
  readonly newOrder$ = new Subject<IncomingOrder>();

  /** Another rider accepted */
  readonly orderAccepted$ = new Subject<number>();

  /** Server-side expiration */
  readonly orderExpired$ = new Subject<number>();

  /** Current rider accepted */
  readonly orderAcceptedByCurrentRider$ = new Subject<number>();

  /** Current rider rejected OR timeout */
  readonly orderRejected$ = new Subject<number>();


  constructor(
    private readonly riderApi: RiderApiService
  ) {}


  // ─────────────────────────────────────────────────────────────
  // SIGNALR HUB
  // ─────────────────────────────────────────────────────────────

  connectToHub(customerId: number): void {

    if (this.hubConnection) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/rider-notifications', {
        withCredentials: true
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();


    // -----------------------------------------------------------
    // NEW ORDER
    // -----------------------------------------------------------

    this.hubConnection.on(
      'NewOrderAvailable',
      (payload: IncomingOrder) => {

        console.log(
          '[SignalR] New order received:',
          payload.orderId
        );

        this.newOrder$.next(payload);

        this.notifyRider({
          id: payload.notificationId ?? `order-${payload.orderId}`,
          title: '🛵 New Order Available!',
          message:
            `Order #${payload.orderId} — ${payload.orderTotal}` +
            `${payload.shippingAddress ? ' · ' + payload.shippingAddress : ''}`,
          data: payload
        });
      }
    );


    // -----------------------------------------------------------
    // ORDER EXPIRED FROM SERVER
    // -----------------------------------------------------------

    this.hubConnection.on(
      'OrderNotificationExpired',
      (payload: { orderId: number }) => {

        console.log(
          '[SignalR] Order expired:',
          payload.orderId
        );

        this.clearOrderTimer(payload.orderId);

        this.orderExpired$.next(payload.orderId);
      }
    );


    // -----------------------------------------------------------
    // ANOTHER RIDER ACCEPTED
    // -----------------------------------------------------------

    this.hubConnection.on(
      'OrderAlreadyAccepted',
      (payload: { orderId: number }) => {

        console.log(
          '[SignalR] Already accepted by another rider:',
          payload.orderId
        );

        this.clearOrderTimer(payload.orderId);

        this.orderAccepted$.next(payload.orderId);
      }
    );


    // -----------------------------------------------------------
    // RE-REGISTER AFTER AUTO-RECONNECT
    // After a dropped connection SignalR reconnects with a new connection ID,
    // so the server-side group membership is lost — we must re-invoke RegisterRider.
    // -----------------------------------------------------------

    this.hubConnection.onreconnected(() => {

      console.log(
        '[SignalR] Reconnected — re-registering rider',
        customerId
      );

      this.hubConnection?.invoke('RegisterRider', customerId)
        .catch(err => console.error(
          '[SignalR] Re-register after reconnect failed:',
          err
        ));
    });


    // -----------------------------------------------------------
    // START CONNECTION
    // -----------------------------------------------------------

    this.hubConnection
      .start()
      .then(() => {

        console.log(
          '[SignalR] Connected — registering rider',
          customerId
        );

        return this.hubConnection!.invoke(
          'RegisterRider',
          customerId
        );
      })
      .catch(err => {

        console.error(
          '[SignalR] Connection error:',
          err
        );

        // Clear the reference so connectToHub() can retry on next attempt.
        this.hubConnection = null;
      });
  }


  disconnectFromHub(): void {

    if (this.hubConnection) {

      // Null the reference first so the guard in connectToHub() unblocks
      // immediately — the old connection finishes stopping in the background.
      const conn = this.hubConnection;
      this.hubConnection = null;
      conn.stop().catch(() => {});
    }
  }


  ngOnDestroy(): void {

    this.disconnectFromHub();

    this.activeTimers.forEach(timer => {
      clearInterval(timer);
    });

    this.activeTimers.clear();

    this.newOrder$.complete();
    this.orderAccepted$.complete();
    this.orderExpired$.complete();
    this.orderAcceptedByCurrentRider$.complete();
    this.orderRejected$.complete();
  }


  // ─────────────────────────────────────────────────────────────
  // NOTIFICATION ENTRY
  // ─────────────────────────────────────────────────────────────

  notifyRider(options: NotificationOptions): void {

    if (this.shownNotifications.has(options.id)) {
      return;
    }

    this.shownNotifications.add(options.id);

    this.playSound(options.soundUrl);
  }


  // ─────────────────────────────────────────────────────────────
  // REJECT HELPER
  // ─────────────────────────────────────────────────────────────

  private rejectOrder(
    orderId: number,
    dismiss: () => void
  ): void {

    this.riderApi
      .rejectOrder(orderId)
      .subscribe({

        next: (response) => {

          console.log(
            '[API] Order rejected:',
            response
          );

          this.orderRejected$
            .next(orderId);

          dismiss();
        },

        error: (err) => {

          console.error(
            '[API] Reject failed:',
            err
          );

          dismiss();
        }
      });
  }


  // ─────────────────────────────────────────────────────────────
  // CLEAR TIMER
  // ─────────────────────────────────────────────────────────────

  private clearOrderTimer(orderId: number): void {

    const timer =
      this.activeTimers.get(orderId);

    if (timer) {

      clearInterval(timer);

      this.activeTimers.delete(orderId);
    }
  }


  // ─────────────────────────────────────────────────────────────
  // AUDIO
  // ─────────────────────────────────────────────────────────────

  private playSound(soundUrl?: string): void {

    if (soundUrl) {

      try {

        const audio = new Audio(soundUrl);

        audio.play()
          .catch(() => this.playBeep());

        return;

      } catch {

        // fallback to beep
      }
    }

    this.playBeep();
  }


  private playBeep(): void {

    try {

      const ctx = new AudioContext();

      const oscillator =
        ctx.createOscillator();

      const gain =
        ctx.createGain();

      oscillator.connect(gain);

      gain.connect(ctx.destination);

      oscillator.type = 'sine';

      oscillator.frequency.setValueAtTime(
        880,
        ctx.currentTime
      );

      gain.gain.setValueAtTime(
        0.4,
        ctx.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.6
      );

      oscillator.start(ctx.currentTime);

      oscillator.stop(ctx.currentTime + 0.6);

    } catch {

      // ignore audio errors
    }
  }
}