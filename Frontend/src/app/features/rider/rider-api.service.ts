import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PastDeliveriesFilter,
  PastDeliveriesResponse,
  RiderActiveDelivery,
  RiderDashboardData,
  RiderOrderDetails,
  RiderOnboardRequest,
  RiderProfile,
  RiderSession,
  RiderStatusRequest,
  UpdateDeliveryStatusRequest,
  UpdateDeliveryStatusResponse
} from './rider.models';

/**
 * Rider API service.
 *
 * All endpoints use the existing customer auth cookie (withCredentials=true),
 * so no separate rider login token is stored on the client.
 */
@Injectable({ providedIn: 'root' })
export class RiderApiService {
  private readonly baseUrl = '/api/rider';

  constructor(private readonly http: HttpClient) {}

  getSession(): Observable<RiderSession> {
    return this.http.get<RiderSession>(`${this.baseUrl}/session`, { withCredentials: true });
  }

  checkExists(): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.baseUrl}/exists`, { withCredentials: true });
  }

  onboard(payload: RiderOnboardRequest): Observable<{ ok: boolean; alreadyExists: boolean; redirectUrl: string; rider: RiderProfile }> {
    return this.http.post<{ ok: boolean; alreadyExists: boolean; redirectUrl: string; rider: RiderProfile }>(
      `${this.baseUrl}/onboard`,
      payload,
      { withCredentials: true }
    );
  }

  getProfile(): Observable<RiderProfile> {
    return this.http.get<RiderProfile>(`${this.baseUrl}/profile`, { withCredentials: true });
  }

  updateStatus(payload: RiderStatusRequest): Observable<{ ok: boolean; rider: RiderProfile }> {
    return this.http.patch<{ ok: boolean; rider: RiderProfile }>(`${this.baseUrl}/status`, payload, { withCredentials: true });
  }

  getDashboard(): Observable<RiderDashboardData> {
    return this.http.get<RiderDashboardData>(`${this.baseUrl}/dashboard`, { withCredentials: true });
  }

  acceptOrder(orderId: number): Observable<{ ok: boolean; orderId: number; riderId: number; deliveryOrderId: number }> {
    return this.http.post<{ ok: boolean; orderId: number; riderId: number; deliveryOrderId: number }>(
      `${this.baseUrl}/accept-order?orderId=${orderId}`,
      {},
      { withCredentials: true }
    );
  }

  rejectOrder(orderId: number): Observable<{ ok: boolean; orderId: number; riderId: number }> {
    return this.http.post<{ ok: boolean; orderId: number; riderId: number }>(
      `${this.baseUrl}/reject-order?orderId=${orderId}`,
      {},
      { withCredentials: true }
    );
  }

  getOrderDetails(orderId: number): Observable<RiderOrderDetails> {
    return this.http.get<RiderOrderDetails>(`${this.baseUrl}/orders/${orderId}`, { withCredentials: true });
  }

  /** Returns active delivery orders (Assigned/PickedUp/InTransit) with per-order status for the current rider. */
  getActiveDeliveries(): Observable<RiderActiveDelivery[]> {
    return this.http.get<RiderActiveDelivery[]>(`${this.baseUrl}/active-deliveries`, { withCredentials: true });
  }

  /** Advances the delivery status of an order along the allowed progression. */
  updateDeliveryStatus(orderId: number, status: number): Observable<UpdateDeliveryStatusResponse> {
    const payload: UpdateDeliveryStatusRequest = { orderId, status };
    return this.http.patch<UpdateDeliveryStatusResponse>(`${this.baseUrl}/delivery-status`, payload, { withCredentials: true });
  }

  /** Returns a paginated list of past (delivered/failed) delivery orders for the current rider. */
  getPastDeliveries(filter: PastDeliveriesFilter): Observable<PastDeliveriesResponse> {
    let params = new HttpParams()
      .set('pageIndex', String(filter.pageIndex))
      .set('pageSize', String(filter.pageSize));
    if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) params = params.set('dateTo', filter.dateTo);
    if (filter.statusId != null) params = params.set('statusId', String(filter.statusId));
    return this.http.get<PastDeliveriesResponse>(`${this.baseUrl}/past-deliveries`, { params, withCredentials: true });
  }
}
