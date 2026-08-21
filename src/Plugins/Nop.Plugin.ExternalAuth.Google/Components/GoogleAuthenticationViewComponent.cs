using Microsoft.AspNetCore.Mvc;
using Nop.Web.Framework.Components;

namespace Nop.Plugin.ExternalAuth.Google.Components;

/// <summary>
/// View component that renders the Google sign-in button on the storefront.
/// Called by nopCommerce's <c>ExternalMethodsViewComponent</c> on the login and register pages
/// via <see cref="GoogleAuthenticationMethod.GetPublicViewComponent"/>.
/// </summary>
public class GoogleAuthenticationViewComponent : NopViewComponent
{
    #region Methods

    /// <summary>
    /// Returns the Google sign-in button fragment view.
    /// </summary>
    /// <param name="widgetZone">Widget zone identifier (required by contract; not used here).</param>
    /// <param name="additionalData">Additional data (required by contract; not used here).</param>
    /// <returns>The rendered view component result.</returns>
    public async Task<IViewComponentResult> InvokeAsync(string widgetZone, object additionalData)
    {
        return await ViewAsync("~/Plugins/ExternalAuth.Google/Views/PublicInfo.cshtml");
    }

    #endregion
}
