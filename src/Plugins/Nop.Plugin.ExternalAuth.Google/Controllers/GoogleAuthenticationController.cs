using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Nop.Core;
using Nop.Core.Http;
using Nop.Plugin.ExternalAuth.Google.Models;
using Nop.Services.Authentication.External;
using Nop.Services.Configuration;
using Nop.Services.Localization;
using Nop.Services.Messages;
using Nop.Services.Security;
using Nop.Web.Framework;
using Nop.Web.Framework.Controllers;
using Nop.Web.Framework.Mvc.Filters;

namespace Nop.Plugin.ExternalAuth.Google.Controllers;

/// <summary>
/// Handles admin configuration, OAuth login initiation, and OAuth callback processing
/// for the Google external authentication plugin.
/// </summary>
[AutoValidateAntiforgeryToken]
public class GoogleAuthenticationController : BasePluginController
{
    #region Fields

    protected readonly GoogleExternalAuthSettings _googleExternalAuthSettings;
    protected readonly IAuthenticationPluginManager _authenticationPluginManager;
    protected readonly IExternalAuthenticationService _externalAuthenticationService;
    protected readonly ILocalizationService _localizationService;
    protected readonly INotificationService _notificationService;
    protected readonly IOptionsMonitorCache<GoogleOptions> _optionsCache;
    protected readonly IPermissionService _permissionService;
    protected readonly ISettingService _settingService;
    protected readonly IStoreContext _storeContext;
    protected readonly IWorkContext _workContext;

    #endregion

    #region Ctor

    /// <summary>
    /// Initializes a new instance of <see cref="GoogleAuthenticationController"/>.
    /// </summary>
    public GoogleAuthenticationController(
        GoogleExternalAuthSettings googleExternalAuthSettings,
        IAuthenticationPluginManager authenticationPluginManager,
        IExternalAuthenticationService externalAuthenticationService,
        ILocalizationService localizationService,
        INotificationService notificationService,
        IOptionsMonitorCache<GoogleOptions> optionsCache,
        IPermissionService permissionService,
        ISettingService settingService,
        IStoreContext storeContext,
        IWorkContext workContext)
    {
        _googleExternalAuthSettings = googleExternalAuthSettings;
        _authenticationPluginManager = authenticationPluginManager;
        _externalAuthenticationService = externalAuthenticationService;
        _localizationService = localizationService;
        _notificationService = notificationService;
        _optionsCache = optionsCache;
        _permissionService = permissionService;
        _settingService = settingService;
        _storeContext = storeContext;
        _workContext = workContext;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Displays the admin configuration form for this plugin.
    /// </summary>
    [AuthorizeAdmin]
    [Area(AreaNames.ADMIN)]
    [CheckPermission(StandardPermission.Configuration.MANAGE_EXTERNAL_AUTHENTICATION_METHODS)]
    public IActionResult Configure()
    {
        var model = new ConfigurationModel
        {
            ClientId = _googleExternalAuthSettings.ClientId,
            // ClientSecret is mapped but rendered as type="password" in the view.
            ClientSecret = _googleExternalAuthSettings.ClientSecret,
            LoginButtonText = _googleExternalAuthSettings.LoginButtonText,
            RegisterButtonText = _googleExternalAuthSettings.RegisterButtonText,
            DisplayOrder = _googleExternalAuthSettings.DisplayOrder
        };

        return View("~/Plugins/ExternalAuth.Google/Views/Configure.cshtml", model);
    }

    /// <summary>
    /// Saves the admin configuration form for this plugin.
    /// </summary>
    [HttpPost]
    [AuthorizeAdmin]
    [Area(AreaNames.ADMIN)]
    [CheckPermission(StandardPermission.Configuration.MANAGE_EXTERNAL_AUTHENTICATION_METHODS)]
    public async Task<IActionResult> Configure(ConfigurationModel model)
    {
        if (!ModelState.IsValid)
            return Configure();

        // Persist the updated settings.
        _googleExternalAuthSettings.ClientId = model.ClientId;
        // SECURITY: ClientSecret is written to settings only — never emitted to responses.
        _googleExternalAuthSettings.ClientSecret = model.ClientSecret;
        _googleExternalAuthSettings.LoginButtonText = model.LoginButtonText;
        _googleExternalAuthSettings.RegisterButtonText = model.RegisterButtonText;
        _googleExternalAuthSettings.DisplayOrder = model.DisplayOrder;

        await _settingService.SaveSettingAsync(_googleExternalAuthSettings);

        // Force the Google middleware to reload credentials on the next auth request.
        _optionsCache.TryRemove(GoogleDefaults.AuthenticationScheme);

        _notificationService.SuccessNotification(
            await _localizationService.GetResourceAsync("Admin.Plugins.Saved"));

        return Configure();
    }

    /// <summary>
    /// Initiates the Google OAuth 2.0 authentication challenge.
    /// Validates that the plugin is active and credentials are configured before redirecting.
    /// </summary>
    /// <param name="returnUrl">The URL to return to after successful authentication.</param>
    public async Task<IActionResult> Login(string returnUrl)
    {
        var store = await _storeContext.GetCurrentStoreAsync();
        var customer = await _workContext.GetCurrentCustomerAsync();

        var methodIsAvailable = await _authenticationPluginManager
            .IsPluginActiveAsync(GoogleAuthenticationDefaults.SystemName, customer, store.Id);

        if (!methodIsAvailable)
            throw new NopException(await _localizationService.GetResourceAsync("Plugins.ExternalAuth.Google.Login.Error"));

        if (string.IsNullOrEmpty(_googleExternalAuthSettings.ClientId) ||
            string.IsNullOrEmpty(_googleExternalAuthSettings.ClientSecret))
            throw new NopException(await _localizationService.GetResourceAsync("Plugins.ExternalAuth.Google.Login.Error"));

        var authenticationProperties = new AuthenticationProperties
        {
            RedirectUri = Url.Action("LoginCallback", "GoogleAuthentication", new { returnUrl })
        };

        // Store the login page URL so the OnRemoteFailure handler can redirect there on error.
        authenticationProperties.SetString(
            GoogleAuthenticationDefaults.ErrorCallback,
            Url.RouteUrl(NopRouteNames.General.LOGIN, new { returnUrl }));

        return Challenge(authenticationProperties, GoogleDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// Processes the Google OAuth callback after the ASP.NET Core Google middleware has validated
    /// the authorization code and produced an authentication ticket at /signin-google.
    /// </summary>
    /// <param name="returnUrl">The URL to redirect to after successful authentication.</param>
    public async Task<IActionResult> LoginCallback(string returnUrl)
    {
        // Retrieve the authentication ticket produced by the Google middleware.
        var authenticateResult = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

        if (!authenticateResult.Succeeded || !authenticateResult.Principal.Claims.Any())
            return RedirectToRoute(NopRouteNames.General.LOGIN);

        // Extract required claims from the Google principal.
        var email = authenticateResult.Principal
            .FindFirst(c => c.Type == ClaimTypes.Email)?.Value;

        // Email is required — without it we cannot match or register the customer.
        if (string.IsNullOrWhiteSpace(email))
        {
            _notificationService.ErrorNotification(
                await _localizationService.GetResourceAsync("Plugins.ExternalAuth.Google.Login.EmailPermissionDenied"));
            return RedirectToRoute(NopRouteNames.General.LOGIN);
        }

        var externalIdentifier = authenticateResult.Principal
            .FindFirst(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        var externalDisplayIdentifier = authenticateResult.Principal
            .FindFirst(c => c.Type == ClaimTypes.Name)?.Value;

        // Build the parameters for nopCommerce external authentication pipeline.
        // AccessToken is intentionally NOT set — phase 1 security constraint (no token persistence).
        var authenticationParameters = new ExternalAuthenticationParameters
        {
            ProviderSystemName = GoogleAuthenticationDefaults.SystemName,
            Email = email,
            ExternalIdentifier = externalIdentifier,
            ExternalDisplayIdentifier = externalDisplayIdentifier,
            Claims = authenticateResult.Principal.Claims
                .Select(c => new ExternalAuthenticationClaim(c.Type, c.Value))
                .ToList()
        };

        // Hand off to nopCommerce: matches existing customer by email/external record,
        // signs them in, or auto-registers a new customer and raises CustomerAutoRegisteredByExternalMethodEvent.
        return await _externalAuthenticationService.AuthenticateAsync(authenticationParameters, returnUrl);
    }

    #endregion
}
