using Nop.Core.Domain.Orders;
using Nop.Services.Common;
using Nop.Services.Customers;
using Nop.Services.Events;
using Nop.Services.Orders;
using Nop.Plugin.Misc.RiderManagement.Services;

namespace Nop.Plugin.Misc.RiderManagement.Services;

/// <summary>
/// Listens to nopCommerce order events.
/// When an order is placed:
///  1. Promotes it from Pending → Processing (so no manual admin step needed).
///  2. Creates a pending DeliveryOrder record immediately.
///  3. Broadcasts a real-time notification to ALL active, available riders.
///
/// NOTE: We do everything here in OrderPlacedEvent instead of relying on
/// OrderStatusChangedEvent, because CheckOrderStatusAsync does not re-fire
/// the status-changed event when the status is already set before it runs.
/// </summary>
public class OrderEventConsumer : IConsumer<OrderPlacedEvent>
{
    #region Fields

    private readonly IAddressService _addressService;
    private readonly ICustomerService _customerService;
    private readonly IDeliveryOrderService _deliveryOrderService;
    private readonly IRiderNotificationService _notificationService;
    private readonly IOrderService _orderService;
    private readonly IOrderProcessingService _orderProcessingService;

    #endregion

    #region Ctor

    public OrderEventConsumer(
        IAddressService addressService,
        ICustomerService customerService,
        IDeliveryOrderService deliveryOrderService,
        IRiderNotificationService notificationService,
        IOrderService orderService,
        IOrderProcessingService orderProcessingService)
    {
        _addressService = addressService;
        _customerService = customerService;
        _deliveryOrderService = deliveryOrderService;
        _notificationService = notificationService;
        _orderService = orderService;
        _orderProcessingService = orderProcessingService;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Fires immediately when an order is placed.
    /// Promotes Pending → Processing, creates a DeliveryOrder record,
    /// and notifies all available riders so they can accept or reject.
    /// </summary>
    public async Task HandleEventAsync(OrderPlacedEvent eventMessage)
    {
        if (eventMessage?.Order == null)
            return;

        var order = eventMessage.Order;

        // 1. Promote Pending → Processing (skip if already promoted by payment gateway)
        if (order.OrderStatus == OrderStatus.Pending)
        {
            order.OrderStatus = OrderStatus.Processing;
            await _orderService.UpdateOrderAsync(order);
            // Run internal nopCommerce checks (inventory, payment capture, etc.)
            await _orderProcessingService.CheckOrderStatusAsync(order);
        }

        // 2. Create the pending delivery record (idempotent — skips if already exists)
        await _deliveryOrderService.CreatePendingDeliveryOrderAsync(order.Id);

        // 3. Build notification payload
        // Convert USD → INR at 1 USD = 83 INR for rider-facing display.
        var orderTotal = "₹" + (order.OrderTotal * 83m).ToString("N2");
        var address = order.ShippingAddressId.HasValue
            ? await _addressService.GetAddressByIdAsync(order.ShippingAddressId.Value)
            : null;
        var shippingAddress = address != null
            ? $"{address.Address1}, {address.City}"
            : string.Empty;
        var deliveryCity = address?.City ?? string.Empty;

        // Fetch customer name and phone so the rider knows who they're delivering to
        var customer = await _customerService.GetCustomerByIdAsync(order.CustomerId);
        var customerName = customer != null
            ? $"{customer.FirstName} {customer.LastName}".Trim()
            : string.Empty;
        if (string.IsNullOrWhiteSpace(customerName))
            customerName = customer?.Username ?? customer?.Email ?? string.Empty;
        var customerPhone = address?.PhoneNumber ?? customer?.Phone ?? string.Empty;

        // 4. Broadcast to same-city available riders (fewest active orders first)
        await _notificationService.SendNewOrderToAllAvailableRidersAsync(
            order.Id,
            orderTotal,
            shippingAddress,
            deliveryCity,
            customerName,
            customerPhone);
    }

    #endregion
}
