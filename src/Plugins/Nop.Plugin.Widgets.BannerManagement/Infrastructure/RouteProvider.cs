using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Nop.Web.Framework;
using Nop.Web.Framework.Mvc.Routing;

namespace Nop.Plugin.Widgets.BannerManagement.Infrastructure;

public class RouteProvider : IRouteProvider
{
    public void RegisterRoutes(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapControllerRoute(name: BannerManagementDefaults.ListRouteName,
            pattern: "Admin/BannerManagement/{action=List}/{id?}",
            defaults: new { controller = "BannerManagement", area = AreaNames.ADMIN });
    }

    public int Priority => 0;
}