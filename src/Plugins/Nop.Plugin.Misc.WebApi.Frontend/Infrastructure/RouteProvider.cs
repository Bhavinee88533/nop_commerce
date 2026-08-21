using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Nop.Web.Framework.Mvc.Routing;

namespace Nop.Plugin.Misc.WebApi.Frontend.Infrastructure;

/// <summary>
/// Registers explicit rider API and SPA fallback routes for the frontend plugin.
/// </summary>
public class RouteProvider : IRouteProvider
{
    public void RegisterRoutes(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.Session",
            pattern: "api/rider/session",
            defaults: new { controller = "RiderPortalApi", action = "Session" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.Exists",
            pattern: "api/rider/exists",
            defaults: new { controller = "RiderPortalApi", action = "Exists" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.Onboard",
            pattern: "api/rider/onboard",
            defaults: new { controller = "RiderPortalApi", action = "Onboard" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.Profile",
            pattern: "api/rider/profile",
            defaults: new { controller = "RiderPortalApi", action = "Profile" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.ByCustomer",
            pattern: "api/rider/by-customer/{customerId:int}",
            defaults: new { controller = "RiderPortalApi", action = "GetByCustomerId" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.Status",
            pattern: "api/rider/status",
            defaults: new { controller = "RiderPortalApi", action = "UpdateStatus" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.Dashboard",
            pattern: "api/rider/dashboard",
            defaults: new { controller = "RiderPortalApi", action = "Dashboard" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.AcceptOrder",
            pattern: "api/rider/accept-order",
            defaults: new { controller = "RiderPortalApi", action = "AcceptOrder" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.RejectOrder",
            pattern: "api/rider/reject-order",
            defaults: new { controller = "RiderPortalApi", action = "RejectOrder" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.OrderDetails",
            pattern: "api/rider/orders/{orderId:int}",
            defaults: new { controller = "RiderPortalApi", action = "OrderDetails" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.ActiveDeliveries",
            pattern: "api/rider/active-deliveries",
            defaults: new { controller = "RiderPortalApi", action = "ActiveDeliveries" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.UpdateDeliveryStatus",
            pattern: "api/rider/delivery-status",
            defaults: new { controller = "RiderPortalApi", action = "UpdateDeliveryStatus" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.TestNotification",
            pattern: "api/rider/test-notification",
            defaults: new { controller = "RiderPortalApi", action = "TestNotification" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.SimulateOrder",
            pattern: "api/rider/simulate-order",
            defaults: new { controller = "RiderPortalApi", action = "SimulateOrder" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderApi.PastDeliveries",
            pattern: "api/rider/past-deliveries",
            defaults: new { controller = "RiderPortalApi", action = "PastDeliveries" });

        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.WebApi.Frontend.RiderSpa",
            pattern: "rider/{*path}",
            defaults: new { controller = "RiderPortal", action = "Index" });
    }

    public int Priority => 100;
}
