export interface RiderSession {
  authenticated: boolean;
  customerId: number;
  name: string;
  email: string;
  isRider: boolean;
  riderId?: number;
}

/**
 * Numeric delivery status values — must stay in sync with DeliveryOrderStatus enum on the backend.
 */
export enum DeliveryStatusId {
  Pending = 0,
  Assigned = 1,
  PickedUp = 2,
  InTransit = 3,
  Delivered = 4,
  Failed = 5
}

export interface UpdateDeliveryStatusRequest {
  orderId: number;
  status: number;
}

export interface UpdateDeliveryStatusResponse {
  success: boolean;
  message: string;
}

/** Summary returned by GET api/rider/active-deliveries */
export interface RiderActiveDelivery {
  orderId: number;
  deliveryStatusId: number;
  deliveryStatus: string;
  customerName: string;
}

export interface RiderProfile {
  id: number;
  customerId: number;
  name: string;
  email: string;
  phone: string;
  riderStatus: string;
  availability: boolean;
  vehicleType: string;
  licenseNumber: string;
  currentLocation: string;
  isApproved: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface RiderDashboardData {
  riderId: number;
  riderName: string;
  riderStatus: string;
  availability: boolean;
  isApproved: boolean;
  vehicleType: string;
  currentLocation: string;
  activeDeliveries: number;
  activeOrderId: number;
  activeOrderIds: number[];
  availableOrders: number;
  deliveredCount: number;
  earnings: number;
}

export interface RiderOnboardRequest {
  vehicleType: string;
  licenseNumber: string;
  currentLocation?: string;
  availability?: boolean;
}

export interface RiderStatusRequest {
  isOnline: boolean;
  availability: boolean;
  currentLocation?: string;
}

export interface RiderOrderItemSummary {
  productId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface RiderOrderCustomerInfo {
  customerId: number;
  customerName: string;
  email?: string;
}

export interface RiderDeliveryAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  stateProvince?: string;
  country?: string;
  zipPostalCode?: string;
  phoneNumber?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface RiderOrderDetails {
  orderId: number;
  deliveryOrderId: number;
  customOrderNumber?: string;
  orderTotal: number;
  currencyCode?: string;
  deliveryStatus: string;
  deliveryStatusId: number;
  assignedAtUtc?: string;
  createdOnUtc?: string;
  customer: RiderOrderCustomerInfo;
  deliveryAddress: RiderDeliveryAddress;
  deliveryInstructions?: string;
  items: RiderOrderItemSummary[];
}

export interface PastDelivery {
  orderId: number;
  deliveryOrderId: number;
  customOrderNumber?: string;
  orderTotal: number;
  currencyCode: string;
  deliveryStatus: string;
  deliveryStatusId: number;
  customerName: string;
  deliveryAddress?: string;
  assignedAtUtc?: string;
  pickedUpOnUtc?: string;
  inTransitOnUtc?: string;
  deliveredOnUtc?: string;
  createdOnUtc?: string;
}

export interface PastDeliveriesResponse {
  items: PastDelivery[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface PastDeliveriesFilter {
  pageIndex: number;
  pageSize: number;
  dateFrom?: string;
  dateTo?: string;
  statusId?: number;
}
