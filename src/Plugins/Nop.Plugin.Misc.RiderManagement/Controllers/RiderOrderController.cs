using Microsoft.AspNetCore.Mvc;
using Nop.Plugin.Misc.RiderManagement.Models;
using Nop.Plugin.Misc.RiderManagement.Services;
using Nop.Services.Authentication;

namespace Nop.Plugin.Misc.RiderManagement.Controllers;

/// <summary>
/// Rider-facing API for accepting or rejecting an order notification.
/// Requires the caller to be authenticated as a nopCommerce customer who has
/// an active Rider record (i.e., a registered delivery rider).
/// Anti-forgery is bypassed here because the dashboard sends the token via
/// the X-XSRF-TOKEN header, but we rely on authentication as the primary guard.
/// </summary>
[IgnoreAntiforgeryToken]
public class RiderOrderController : Controller
{
    #region Fields

    private readonly IAuthenticationService _authenticationService;
    private readonly IDeliveryOrderService _deliveryOrderService;
    private readonly IRiderNotificationService _notificationService;
    private readonly IRiderService _riderService;

    #endregion

    #region Ctor

    public RiderOrderController(
        IAuthenticationService authenticationService,
        IDeliveryOrderService deliveryOrderService,
        IRiderNotificationService notificationService,
        IRiderService riderService)
    {
        _authenticationService = authenticationService;
        _deliveryOrderService = deliveryOrderService;
        _notificationService = notificationService;
        _riderService = riderService;
    }

    #endregion

    #region Methods

    /// <summary>
    /// POST /RiderOrder/Accept
    /// Called when the rider taps the Accept button on a notification card.
    /// Assigns the order to the rider and broadcasts <c>OrderAlreadyAccepted</c>
    /// to all other riders so their cards are dismissed immediately.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Accept([FromBody] RiderOrderActionModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (rider, error) = await GetAuthenticatedRiderAsync();
        if (rider == null)
            return error!;

        try
        {
            await _deliveryOrderService.AssignRiderAsync(model.OrderId, rider.Id);

            // Tell every other rider their notification card for this order is now stale.
            await _notificationService.BroadcastOrderAcceptedAsync(model.OrderId, rider.CustomerId);

            return Ok(new { success = true, message = "Order accepted successfully." });
        }
        catch (InvalidOperationException ex)
        {
            // Order was already taken by another rider.
            return Conflict(new { success = false, error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    /// <summary>
    /// POST /RiderOrder/Reject
    /// Called when the rider taps the Reject button or when the 30-second countdown
    /// expires client-side. This is a rider-local action: the order stays Pending
    /// so other riders can still accept it. No DB change is made here.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Reject([FromBody] RiderOrderActionModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Confirm the caller is a valid rider; ignore the response for a rejection.
        var (_, error) = await GetAuthenticatedRiderAsync();
        if (error != null)
            return error;

        // Rider-local action — the notification card is removed on the client.
        // Other riders are unaffected; the order remains Pending.
        return Ok(new { success = true, message = "Order rejected." });
    }

    #endregion

    #region Helpers

    /// <summary>
    /// Resolves the authenticated rider for the current request.
    /// Returns <c>(rider, null)</c> on success, or <c>(null, actionResult)</c> on failure.
    /// </summary>
    private async Task<(Domains.Rider rider, IActionResult error)> GetAuthenticatedRiderAsync()
    {
        var customer = await _authenticationService.GetAuthenticatedCustomerAsync();
        if (customer == null)
            return (null, Unauthorized(new { error = "Not authenticated." }));

        var riders = await _riderService.GetAllRidersAsync();
        var rider = riders.FirstOrDefault(r => r.CustomerId == customer.Id);
        if (rider == null)
            return (null, StatusCode(403, new { error = "No rider record found for this account." }));

        return (rider, null);
    }

    #endregion
}
