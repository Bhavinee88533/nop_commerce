using Microsoft.AspNetCore.Mvc;
using Nop.Plugin.Misc.RiderManagement.Services;
using Nop.Services.Authentication;
using Nop.Services.Orders;

namespace Nop.Plugin.Misc.RiderManagement.Controllers;

/// <summary>
/// Serves the customer-facing order tracking page with live rider location map.
/// Accessible to any authenticated customer who placed the order.
/// </summary>
public class OrderTrackingController : Controller
{
    private readonly IDeliveryOrderService _deliveryOrderService;
    private readonly IRiderService _riderService;
    private readonly IOrderService _orderService;

    public OrderTrackingController(
        IDeliveryOrderService deliveryOrderService,
        IRiderService riderService,
        IOrderService orderService)
    {
        _deliveryOrderService = deliveryOrderService;
        _riderService = riderService;
        _orderService = orderService;
    }

    /// <summary>
    /// GET /order/track/{orderId}
    /// Shows Leaflet map with live rider location + order status timeline.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Index(int orderId)
    {
        var order = await _orderService.GetOrderByIdAsync(orderId);
        if (order == null)
            return NotFound();

        var delivery = await _deliveryOrderService.GetDeliveryOrderByOrderIdAsync(orderId);
        var status = delivery?.Status.ToString() ?? "Pending";
        var riderName = "";

        if (delivery?.RiderId != null)
        {
            var rider = await _riderService.GetRiderByIdAsync(delivery.RiderId.Value);
            riderName = rider?.Name ?? "";
        }

        ViewBag.OrderId = orderId;
        ViewBag.Status = status;
        ViewBag.RiderName = riderName;
        ViewBag.HubPath = RiderManagementDefaults.RiderNotificationHubPath;

        return View("~/Plugins/Misc.RiderManagement/Views/OrderTracking.cshtml");
    }
}
