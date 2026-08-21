using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Nop.Web.Framework.Mvc.Routing;

namespace Nop.Plugin.Misc.SearchBot.Infrastructure;

public class RouteProvider : IRouteProvider
{
    public void RegisterRoutes(IEndpointRouteBuilder endpointRouteBuilder)
    {
        endpointRouteBuilder.MapControllerRoute(
            name: "Plugin.Misc.SearchBot.Search",
            pattern: "api/search-bot/search",
            defaults: new { controller = "SearchBot", action = "Search" });
    }

    public int Priority => 99;
}
