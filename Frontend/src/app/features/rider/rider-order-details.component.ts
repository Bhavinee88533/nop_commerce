import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RiderApiService } from './rider-api.service';
import { DeliveryStatusId, RiderDeliveryAddress, RiderOrderDetails, RiderOrderItemSummary } from './rider.models';

interface PendingStatusAction {
  status: DeliveryStatusId;
  label: string;
  confirmMessage: string;
}

@Component({
  selector: 'app-rider-order-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rider-order-details.component.html',
  styleUrl: './rider-order-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiderOrderDetailsComponent implements OnInit {
  private readonly loadingState = signal(true);
  private readonly orderDetailsState = signal<RiderOrderDetails | null>(null);
  private readonly errorMessageState = signal('');
  private readonly showFullPhoneState = signal(false);
  private readonly statusUpdatingState = signal(false);
  private readonly pendingStatusActionState = signal<PendingStatusAction | null>(null);
  private currentOrderId = 0;

  get loading(): boolean {
    return this.loadingState();
  }

  get orderDetails(): RiderOrderDetails | null {
    return this.orderDetailsState();
  }

  get errorMessage(): string {
    return this.errorMessageState();
  }

  get showFullPhone(): boolean {
    return this.showFullPhoneState();
  }

  get statusUpdating(): boolean {
    return this.statusUpdatingState();
  }

  get pendingStatusAction(): PendingStatusAction | null {
    return this.pendingStatusActionState();
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly riderApi: RiderApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((paramMap) => {
      const orderId = Number(paramMap.get('orderId'));
      if (!Number.isInteger(orderId) || orderId <= 0) {
        this.loadingState.set(false);
        this.errorMessageState.set('Invalid order id.');
        return;
      }

      this.currentOrderId = orderId;
      this.fetchOrderDetails(orderId);
    });
  }

  retry(): void {
    if (this.currentOrderId > 0) {
      this.fetchOrderDetails(this.currentOrderId);
    }
  }

  goBackToDashboard(): void {
    window.location.href = '/rider/dashboard';
  }

  togglePhoneMask(): void {
    this.showFullPhoneState.set(!this.showFullPhoneState());
  }

  /** Returns the next valid status action for the current order, or null when no action is available. */
  getNextStatusAction(details: RiderOrderDetails): PendingStatusAction | null {
    switch (details.deliveryStatusId) {
      case DeliveryStatusId.Assigned:
        return { status: DeliveryStatusId.PickedUp, label: 'Picked', confirmMessage: 'Mark this order as Picked Up?' };
      case DeliveryStatusId.PickedUp:
        return { status: DeliveryStatusId.InTransit, label: 'Out for Delivery', confirmMessage: 'Mark this order as Out for Delivery?' };
      case DeliveryStatusId.InTransit:
        return { status: DeliveryStatusId.Delivered, label: 'Delivered', confirmMessage: 'Mark this order as Delivered?' };
      default:
        return null;
    }
  }

  /** Opens the confirmation dialog for a status update. */
  promptStatusUpdate(action: PendingStatusAction): void {
    this.pendingStatusActionState.set(action);
    this.errorMessageState.set('');
  }

  /** Dismisses the confirmation dialog without making changes. */
  cancelStatusUpdate(): void {
    this.pendingStatusActionState.set(null);
  }

  /** Confirms and executes the pending status update. */
  confirmStatusUpdate(): void {
    const pending = this.pendingStatusActionState();
    const details = this.orderDetailsState();
    if (!pending || !details || this.statusUpdatingState()) {
      return;
    }

    this.statusUpdatingState.set(true);
    this.pendingStatusActionState.set(null);
    this.errorMessageState.set('');

    this.riderApi.updateDeliveryStatus(details.orderId, pending.status).subscribe({
      next: (response) => {
        this.statusUpdatingState.set(false);
        if (response.success) {
          // Instant UI update — no reload required
          this.orderDetailsState.set({
            ...details,
            deliveryStatusId: pending.status,
            deliveryStatus: this.statusIdToLabel(pending.status)
          });
        } else {
          this.errorMessageState.set(response.message || 'Unable to update delivery status.');
        }
      },
      error: (err) => {
        this.statusUpdatingState.set(false);
        this.errorMessageState.set(err?.error?.message ?? 'Failed to update delivery status. Please try again.');
      }
    });
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

  openMapNavigation(): void {
    const details = this.orderDetailsState();
    if (!details) {
      return;
    }

    const address = details.deliveryAddress;
    const latitude = address.latitude;
    const longitude = address.longitude;

    // Prefer precise coordinates when available.
    // TODO: Backend currently returns null coordinates; wire geocoding/provider lat/long when available.
    const hasCoordinates = typeof latitude === 'number' && Number.isFinite(latitude) && typeof longitude === 'number' && Number.isFinite(longitude);

    const mapUrl = hasCoordinates
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.getSingleLineAddress(address))}`;

    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  }

  getAddressLines(address: RiderDeliveryAddress): string[] {
    const lines = [
      this.safe(address.address1),
      this.safe(address.address2),
      [this.safe(address.city), this.safe(address.stateProvince), this.safe(address.zipPostalCode)].filter(Boolean).join(', '),
      this.safe(address.country)
    ];

    return lines.filter((line) => line.length > 0);
  }

  getCustomerDisplayName(details: RiderOrderDetails): string {
    if (details.customer.customerName) {
      return details.customer.customerName;
    }

    const fullName = [details.deliveryAddress.firstName, details.deliveryAddress.lastName].filter(Boolean).join(' ').trim();
    return fullName || 'Customer';
  }

  getContactPhone(): string {
    const phone = this.orderDetailsState()?.deliveryAddress.phoneNumber;
    if (!phone) {
      return 'Phone not available';
    }

    if (this.showFullPhoneState()) {
      return phone;
    }

    return this.maskPhone(phone);
  }

  getStatusClass(status: string): string {
    const normalized = status.toLowerCase();

    if (normalized === 'pending') {
      return 'status-pending';
    }

    if (normalized === 'assigned') {
      return 'status-assigned';
    }

    if (normalized === 'out for delivery') {
      return 'status-out';
    }

    if (normalized === 'delivered') {
      return 'status-delivered';
    }

    return 'status-default';
  }

  getLineTotal(item: RiderOrderItemSummary): number {
    if (item.totalPrice > 0) {
      return item.totalPrice;
    }

    return item.unitPrice * item.quantity;
  }

  getCurrencySymbol(currencyCode?: string): string {
    if (!currencyCode || currencyCode.toUpperCase() === 'INR') {
      return 'Rs';
    }

    return currencyCode.toUpperCase();
  }

  trackByProductId(index: number, item: RiderOrderItemSummary): number {
    return item.productId || index;
  }

  private fetchOrderDetails(orderId: number): void {
    this.loadingState.set(true);
    this.errorMessageState.set('');
    this.showFullPhoneState.set(false);

    this.riderApi.getOrderDetails(orderId).subscribe({
      next: (result) => {
        this.orderDetailsState.set(this.normalizeOrderDetails(result as unknown as Record<string, unknown>));
        this.loadingState.set(false);
      },
      error: (error) => {
        this.loadingState.set(false);
        this.orderDetailsState.set(null);
        this.errorMessageState.set(error?.error?.error ?? 'Unable to load order details. Please try again.');
      }
    });
  }

  private normalizeOrderDetails(raw: Record<string, unknown>): RiderOrderDetails {
    const customerRaw = this.getObject(raw, 'customer', 'Customer');
    const addressRaw = this.getObject(raw, 'deliveryAddress', 'DeliveryAddress');
    const itemsRaw = this.getArray(raw, 'items', 'Items');

    return {
      orderId: this.getNumber(raw, 'orderId', 'OrderId', 0),
      deliveryOrderId: this.getNumber(raw, 'deliveryOrderId', 'DeliveryOrderId', 0),
      customOrderNumber: this.getString(raw, 'customOrderNumber', 'CustomOrderNumber', ''),
      orderTotal: this.getNumber(raw, 'orderTotal', 'OrderTotal', 0),
      currencyCode: this.getString(raw, 'currencyCode', 'CurrencyCode', 'INR'),
      deliveryStatus: this.getString(raw, 'deliveryStatus', 'DeliveryStatus', 'Pending'),
      deliveryStatusId: this.getNumber(raw, 'deliveryStatusId', 'DeliveryStatusId', 0),
      assignedAtUtc: this.getString(raw, 'assignedAtUtc', 'AssignedAtUtc', ''),
      createdOnUtc: this.getString(raw, 'createdOnUtc', 'CreatedOnUtc', ''),
      deliveryInstructions: this.getString(raw, 'deliveryInstructions', 'DeliveryInstructions', ''),
      customer: {
        customerId: this.getNumber(customerRaw, 'customerId', 'CustomerId', 0),
        customerName: this.getString(customerRaw, 'customerName', 'CustomerName', ''),
        email: this.getString(customerRaw, 'email', 'Email', '')
      },
      deliveryAddress: {
        firstName: this.getString(addressRaw, 'firstName', 'FirstName', ''),
        lastName: this.getString(addressRaw, 'lastName', 'LastName', ''),
        company: this.getString(addressRaw, 'company', 'Company', ''),
        address1: this.getString(addressRaw, 'address1', 'Address1', ''),
        address2: this.getString(addressRaw, 'address2', 'Address2', ''),
        city: this.getString(addressRaw, 'city', 'City', ''),
        stateProvince: this.getString(addressRaw, 'stateProvince', 'StateProvince', ''),
        country: this.getString(addressRaw, 'country', 'Country', ''),
        zipPostalCode: this.getString(addressRaw, 'zipPostalCode', 'ZipPostalCode', ''),
        phoneNumber: this.getString(addressRaw, 'phoneNumber', 'PhoneNumber', ''),
        latitude: this.getNullableNumber(addressRaw, 'latitude', 'Latitude'),
        longitude: this.getNullableNumber(addressRaw, 'longitude', 'Longitude')
      },
      items: itemsRaw.map((itemRaw) => ({
        productId: this.getNumber(itemRaw, 'productId', 'ProductId', 0),
        itemName: this.getString(itemRaw, 'itemName', 'ItemName', 'Item'),
        quantity: this.getNumber(itemRaw, 'quantity', 'Quantity', 0),
        unitPrice: this.getNumber(itemRaw, 'unitPrice', 'UnitPrice', 0),
        totalPrice: this.getNumber(itemRaw, 'totalPrice', 'TotalPrice', 0)
      }))
    };
  }

  private getObject(raw: Record<string, unknown>, camel: string, pascal: string): Record<string, unknown> {
    const value = raw[camel] ?? raw[pascal];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private getArray(raw: Record<string, unknown>, camel: string, pascal: string): Record<string, unknown>[] {
    const value = raw[camel] ?? raw[pascal];
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
  }

  private getString(raw: Record<string, unknown>, camel: string, pascal: string, fallback: string): string {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === 'string') {
      return value;
    }

    return fallback;
  }

  private getNumber(raw: Record<string, unknown>, camel: string, pascal: string, fallback: number): number {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === 'number' && Number.isFinite(value)) {
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

  private getNullableNumber(raw: Record<string, unknown>, camel: string, pascal: string): number | null {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 4) {
      return phone;
    }

    const lastFour = digits.slice(-4);
    return `***-***-${lastFour}`;
  }

  private getSingleLineAddress(address: RiderDeliveryAddress): string {
    const fullAddress = [
      this.safe(address.address1),
      this.safe(address.address2),
      this.safe(address.city),
      this.safe(address.stateProvince),
      this.safe(address.zipPostalCode),
      this.safe(address.country)
    ]
      .filter(Boolean)
      .join(', ')
      .trim();

    return fullAddress || 'delivery destination';
  }

  private safe(value?: string): string {
    return (value ?? '').trim();
  }
}
