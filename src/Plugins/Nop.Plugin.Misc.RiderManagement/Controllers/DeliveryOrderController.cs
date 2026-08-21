using Microsoft.AspNetCore.Mvc;
using Nop.Plugin.Misc.RiderManagement.Domains;
using Nop.Plugin.Misc.RiderManagement.Models.Admin;
using Nop.Plugin.Misc.RiderManagement.Services;
using Nop.Services.Orders;
using Nop.Services.Security;
using Nop.Web.Framework;
using Nop.Web.Framework.Controllers;
using Nop.Web.Framework.Mvc.Filters;

namespace Nop.Plugin.Misc.RiderManagement.Controllers;

/// <summary>
/// Handles delivery order assignment and retrieval APIs.
///
/// User stories covered:
///   - Assign/reassign riders (one active rider per order, no duplicates)
///   - GET rider details by OrderId
///   - GET all orders for a RiderId
///   - Rider must be IsAvailable = true
/// </summary>
[AuthorizeAdmin]
[Area(AreaNames.ADMIN)]
[AutoValidateAntiforgeryToken]
public class DeliveryOrderController : BasePluginController
{
    #region Fields

    private readonly IDeliveryOrderService _deliveryOrderService;
    private readonly IOrderService _orderService;
    private readonly IPermissionService _permissionService;
    private readonly IRiderService _riderService;

    #endregion

    #region Ctor

    public DeliveryOrderController(
        IDeliveryOrderService deliveryOrderService,
        IOrderService orderService,
        IPermissionService permissionService,
        IRiderService riderService)
    {
        _deliveryOrderService = deliveryOrderService;
        _orderService = orderService;
        _permissionService = permissionService;
        _riderService = riderService;
    }

    #endregion

    #region Methods

    /// <summary>
    /// POST /Admin/DeliveryOrder/Assign
    /// Assigns or reassigns an available rider to an order.
    /// Business rules: one rider per order, rider must be IsAvailable=true, no duplicates.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] AssignRiderModel model)
    {
        if (!await _permissionService.AuthorizeAsync(StandardPermission.Orders.ORDERS_CREATE_EDIT_DELETE))
            return Forbid();

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Validate order exists
        var order = await _orderService.GetOrderByIdAsync(model.OrderId);
        if (order == null)
            return BadRequest(new { error = $"Order with ID {model.OrderId} does not exist." });

        try
        {
            var deliveryOrder = await _deliveryOrderService.AssignRiderAsync(model.OrderId, model.RiderId);
            return Ok(MapToModel(deliveryOrder, await _riderService.GetRiderByIdAsync(model.RiderId)));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>
    /// GET /Admin/DeliveryOrder/ByOrder/{orderId}
    /// Returns rider details for a given OrderId.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ByOrder(int orderId, int id = 0)
    {
        if (orderId == 0) orderId = id;

        if (!await _permissionService.AuthorizeAsync(StandardPermission.Orders.ORDERS_VIEW))
            return Forbid();

        var deliveryOrder = await _deliveryOrderService.GetDeliveryOrderByOrderIdAsync(orderId);
        if (deliveryOrder == null)
            return NotFound(new { error = $"No delivery record found for Order ID {orderId}." });

        Rider rider = null;
        if (deliveryOrder.RiderId.HasValue)
            rider = await _riderService.GetRiderByIdAsync(deliveryOrder.RiderId.Value);

        return Ok(MapToModel(deliveryOrder, rider));
    }

    /// <summary>
    /// GET /Admin/DeliveryOrder/ByRider/{riderId}
    /// Returns all orders assigned to a given RiderId.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ByRider(int riderId, int id = 0)
    {
        if (riderId == 0) riderId = id;

        if (!await _permissionService.AuthorizeAsync(StandardPermission.Orders.ORDERS_VIEW))
            return Forbid();

        var rider = await _riderService.GetRiderByIdAsync(riderId);
        if (rider == null)
            return NotFound(new { error = $"Rider with ID {riderId} does not exist." });

        var deliveryOrders = await _deliveryOrderService.GetDeliveryOrdersByRiderIdAsync(riderId);

        var result = deliveryOrders.Select(d => MapToModel(d, rider)).ToList();
        return Ok(result);
    }

    #endregion

    #region Utilities

    private static DeliveryOrderModel MapToModel(DeliveryOrder deliveryOrder, Rider rider)
    {
        return new DeliveryOrderModel
        {
            Id = deliveryOrder.Id,
            OrderId = deliveryOrder.OrderId,
            RiderId = deliveryOrder.RiderId,
            RiderName = rider?.Name,
            RiderPhone = rider?.Phone,
            Status = deliveryOrder.Status.ToString(),
            AssignedAtUtc = deliveryOrder.AssignedAtUtc,
            CreatedOnUtc = deliveryOrder.CreatedOnUtc
        };
    }

    #endregion
}
