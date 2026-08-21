using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Nop.Web.Framework;
using Nop.Web.Framework.Mvc.Routing;
using Nop.Plugin.Misc.RiderManagement.Hubs;

namespace Nop.Plugin.Misc.RiderManagement.Infrastructure;

/// <summary>
/// Registers plugin-specific routes with ASP.NET Core endpoint routing.
/// </summary>
public class RouteProvider : IRouteProvider
{
    /// <summary>
    /// Gets the route provider priority. Higher values are registered first.
    /// </summary>
    public int Priority => 200;

    /// <summary>
    /// Registers plugin routes.
    /// </summary>
    public void RegisterRoutes(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapControllerRoute(
            name: RiderManagementDefaults.ConfigureRouteName,
            pattern: "Admin/RiderManagement/Configure",
            defaults: new { controller = "RiderManagement", action = "Configure", area = AreaNames.ADMIN });

        endpointRouteBuilder.MapControllerRoute(
            name: RiderManagementDefaults.RiderListRouteName,
            pattern: "Admin/RiderManagement/List",
            defaults: new { controller = "RiderManagement", action = "List", area = AreaNames.ADMIN });

        endpointRouteBuilder.MapControllerRoute(
            name: RiderManagementDefaults.RiderCreateRouteName,
            pattern: "Admin/RiderManagement/Create",
            defaults: new { controller = "RiderManagement", action = "Create", area = AreaNames.ADMIN });

        endpointRouteBuilder.MapControllerRoute(
            name: RiderManagementDefaults.RiderEditRouteName,
            pattern: "Admin/RiderManagement/Edit/{id:int}",
            defaults: new { controller = "RiderManagement", action = "Edit", area = AreaNames.ADMIN });

        endpointRouteBuilder.MapControllerRoute(
            name: RiderManagementDefaults.RiderDeleteRouteName,
            pattern: "Admin/RiderManagement/Delete/{id:int}",
            defaults: new { controller = "RiderManagement", action = "Delete", area = AreaNames.ADMIN });

        // Delivery Order API routes
        endpointRouteBuilder.MapControllerRoute(
            name: RiderManagementDefaults.DeliveryAssignRouteName,
            pattern: "Admin/DeliveryOrder/Assign",
            defaults: new { controller = "DeliveryOrder", action = "Assign", area = AreaNames.ADMIN });

        endpointRouteBuilder.MapControllerRoute(
            name: RiderManagementDefaults.DeliveryByOrderRouteName,
            pattern: "Admin/DeliveryOrder/ByOrder/{orderId:int}",
            defaults: new { controller = "DeliveryOrder", action = "ByOrder", area = AreaNames.ADMIN });

        endpointRouteBuilder.MapControllerRoute(
            name: RiderManagementDefaults.DeliveryByRiderRouteName,
            pattern: "Admin/DeliveryOrder/ByRider/{riderId:int}",
            defaults: new { controller = "DeliveryOrder", action = "ByRider", area = AreaNames.ADMIN });

        // Rider SPA: serve the Angular index.html for all /rider/* routes.
        // The Angular router handles sub-routes (dashboard, login, onboarding, etc.)
        // internally. Static assets under /rider/browser/ are served by the static
        // files middleware before routing, so they are never caught by these rules.
        endpointRouteBuilder.MapFallbackToFile("rider/{*path}", "rider/browser/index.html");
        endpointRouteBuilder.MapFallbackToFile("rider", "rider/browser/index.html");

        // Rider order accept / reject API (non-admin, authenticated riders only)
        endpointRouteBuilder.MapControllerRoute(
            name: RiderManagementDefaults.RiderOrderAcceptRouteName,
            pattern: "RiderOrder/Accept",
            defaults: new { controller = "RiderOrder", action = "Accept" });

        endpointRouteBuilder.MapControllerRoute(
            name: RiderManagementDefaults.RiderOrderRejectRouteName,
            pattern: "RiderOrder/Reject",
            defaults: new { controller = "RiderOrder", action = "Reject" });

        // SignalR hub
        endpointRouteBuilder.MapHub<RiderNotificationHub>(RiderManagementDefaults.RiderNotificationHubPath);
    }
}
