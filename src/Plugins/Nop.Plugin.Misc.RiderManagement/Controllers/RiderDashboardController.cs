using Microsoft.AspNetCore.Mvc;
using Nop.Services.Authentication;
using Nop.Plugin.Misc.RiderManagement.Services;

namespace Nop.Plugin.Misc.RiderManagement.Controllers;

/// <summary>
/// Serves the rider-facing notification dashboard.
/// The rider must be logged in as a nopCommerce customer whose CustomerId
/// matches an active Rider record.
/// </summary>
public class RiderDashboardController : Controller
{
    #region Fields

    private readonly IAuthenticationService _authenticationService;
    private readonly IRiderService _riderService;

    #endregion

    #region Ctor

    public RiderDashboardController(
        IAuthenticationService authenticationService,
        IRiderService riderService)
    {
        _authenticationService = authenticationService;
        _riderService = riderService;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Displays the rider notification dashboard.
    /// Redirects to login if the customer is not authenticated or has no rider record.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var customer = await _authenticationService.GetAuthenticatedCustomerAsync();
        if (customer == null)
            return RedirectToRoute("Login");

        // Find the rider record for this customer
        var riders = await _riderService.GetAllRidersAsync();
        var rider = riders.FirstOrDefault(r => r.CustomerId == customer.Id);

        if (rider == null)
            return RedirectToRoute("HomePage");

        ViewBag.CustomerId = customer.Id;
        ViewBag.RiderName = rider.Name;
        ViewBag.HubPath = RiderManagementDefaults.RiderNotificationHubPath;

        return View("~/Plugins/Misc.RiderManagement/Views/RiderDashboard.cshtml");
    }

    #endregion
}
