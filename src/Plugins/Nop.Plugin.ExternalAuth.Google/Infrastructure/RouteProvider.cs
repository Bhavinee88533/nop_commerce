using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Nop.Web.Framework.Mvc.Routing;

namespace Nop.Plugin.ExternalAuth.Google.Infrastructure;

/// <summary>
/// Registers plugin-specific routes with ASP.NET Core endpoint routing.
/// Discovered by the nopCommerce route registration pipeline via IRouteProvider reflection scan.
/// </summary>
public class RouteProvider : IRouteProvider
{
    #region Methods

    /// <summary>
    /// Registers the Google authentication callback route.
    /// </summary>
    /// <param name="endpointRouteBuilder">The endpoint route builder.</param>
    public void RegisterRoutes(IEndpointRouteBuilder endpointRouteBuilder)
    {
        // Login callback route — the app-level handler after ASP.NET Core Google middleware
        // processes the OAuth response at /signin-google (the middleware's own callback path).
        // Note: the admin must register {store_url}/signin-google in Google Cloud Console,
        // NOT this URL. See plugin documentation for the two-URL distinction.
        endpointRouteBuilder.MapControllerRoute(
            GoogleAuthenticationDefaults.LoginCallbackRoute,
            "google/login-callback",
            new { controller = "GoogleAuthentication", action = "LoginCallback" });
    }

    #endregion

    #region Properties

    /// <summary>
    /// Gets the route provider priority. Lower values execute first.
    /// </summary>
    public int Priority => 0;

    #endregion
}
