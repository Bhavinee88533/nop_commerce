import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

/** Payload shape for the NewOrderAvailable SignalR event */
export interface IncomingOrderPayload {
  notificationId: string;
  orderId: number;
  orderTotal: string;
  shippingAddress: string;
  customerName: string;
  customerPhone: string;
  sentAtUtc: string;
}

/**
 * Manages the persistent SignalR connection to /rider-notifications.
 * Exposes strongly-typed subjects for IncomingOrder and OrderTaken events
 * so the dashboard component can subscribe without managing the hub directly.
 */
@Injectable({ providedIn: 'root' })
export class RiderSignalRService implements OnDestroy {
  private hubConnection: signalR.HubConnection | null = null;

  /** Emits when the backend sends an IncomingOrder (targeted assignment). */
  readonly incomingOrder$ = new Subject<IncomingOrderPayload>();

  /** Emits when an order the rider was holding has been taken by someone else. */
  readonly orderTaken$ = new Subject<{ orderId: number }>();

  /** Emits when the connection state changes (for UI indicators). */
  readonly connected$ = new Subject<boolean>();

  /**
   * Starts the SignalR hub connection and registers this rider.
   * @param customerId The nopCommerce CustomerId of the logged-in rider.
   */
  async connect(customerId: number): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return; // Already connected
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/rider-notifications', {
        withCredentials: true
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Handle incoming order notification (targeted to this rider only)
    this.hubConnection.on('NewOrderAvailable', (payload: IncomingOrderPayload) => {
      this.incomingOrder$.next(payload);
    });

    // Handle order taken by another rider (dismiss card)
    this.hubConnection.on('OrderTaken', (payload: { orderId: number }) => {
      this.orderTaken$.next(payload);
    });

    this.hubConnection.onreconnecting(() => this.connected$.next(false));
    this.hubConnection.onreconnected(() => {
      this.connected$.next(true);
      this.hubConnection?.invoke('RegisterRider', customerId).catch(() => {});
    });
    this.hubConnection.onclose(() => this.connected$.next(false));

    try {
      await this.hubConnection.start();
      await this.hubConnection.invoke('RegisterRider', customerId);
      this.connected$.next(true);
    } catch (err) {
      console.error('[RiderSignalR] Connection failed:', err);
      this.connected$.next(false);
    }
  }

  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect().catch(() => {});
  }
}
