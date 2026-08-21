using Nop.Plugin.ExternalAuth.Google.Components;
using Nop.Services.Authentication.External;
using Nop.Services.Configuration;
using Nop.Services.Helpers;
using Nop.Services.Localization;
using Nop.Services.Plugins;

namespace Nop.Plugin.ExternalAuth.Google;

/// <summary>
/// Represents the Google external authentication plugin.
/// Implements <see cref="IExternalAuthenticationMethod"/> so nopCommerce registers
/// and renders this provider through the existing external-methods infrastructure.
/// </summary>
public class GoogleAuthenticationMethod : BasePlugin, IExternalAuthenticationMethod
{
    #region Fields

    protected readonly ILocalizationService _localizationService;
    protected readonly ISettingService _settingService;
    protected readonly IWebHelper _webHelper;

    #endregion

    #region Ctor

    /// <summary>
    /// Initializes a new instance of <see cref="GoogleAuthenticationMethod"/>.
    /// </summary>
    public GoogleAuthenticationMethod(
        ILocalizationService localizationService,
        ISettingService settingService,
        IWebHelper webHelper)
    {
        _localizationService = localizationService;
        _settingService = settingService;
        _webHelper = webHelper;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Returns the URL of the admin configuration page for this plugin.
    /// </summary>
    public override string GetConfigurationPageUrl()
    {
        return $"{_webHelper.GetStoreLocation()}Admin/GoogleAuthentication/Configure";
    }

    /// <summary>
    /// Returns the type of the view component used to render the Google sign-in button
    /// on the storefront login and register pages.
    /// </summary>
    public Type GetPublicViewComponent()
    {
        return typeof(GoogleAuthenticationViewComponent);
    }

    /// <summary>
    /// Saves default settings and registers localization resources when the plugin is installed.
    /// </summary>
    /// <returns>A task representing the asynchronous operation.</returns>
    public override async Task InstallAsync()
    {
        // Save default settings (credentials intentionally left empty — admin must configure).
        await _settingService.SaveSettingAsync(new GoogleExternalAuthSettings
        {
            LoginButtonText = "Sign in with Google",
            RegisterButtonText = "Register with Google",
            DisplayOrder = 0
        });

        // Register localization resources.
        await _localizationService.AddOrUpdateLocaleResourceAsync(new Dictionary<string, string>
        {
            ["Plugins.ExternalAuth.Google.ClientId"] = "Client ID",
            ["Plugins.ExternalAuth.Google.ClientId.Hint"] = "Enter the Google OAuth 2.0 Client ID from your Google Cloud Console credentials.",
            ["Plugins.ExternalAuth.Google.ClientSecret"] = "Client Secret",
            ["Plugins.ExternalAuth.Google.ClientSecret.Hint"] = "Enter the Google OAuth 2.0 Client Secret. This value is stored server-side and never exposed to the browser.",
            ["Plugins.ExternalAuth.Google.LoginButtonText"] = "Login button text",
            ["Plugins.ExternalAuth.Google.LoginButtonText.Hint"] = "Text displayed on the sign-in button. Leave blank to use the default.",
            ["Plugins.ExternalAuth.Google.RegisterButtonText"] = "Register button text",
            ["Plugins.ExternalAuth.Google.RegisterButtonText.Hint"] = "Text displayed on the button when shown on the registration page.",
            ["Plugins.ExternalAuth.Google.DisplayOrder"] = "Display order",
            ["Plugins.ExternalAuth.Google.DisplayOrder.Hint"] = "Order position within the external authentication methods block.",
            ["Plugins.ExternalAuth.Google.Instructions"] = "<p>To configure authentication with Google, follow these steps:<br/><ol><li>Go to the <a href=\"https://console.cloud.google.com/\" target=\"_blank\">Google Cloud Console</a> and sign in.</li><li>Create or select a project.</li><li>Navigate to <b>APIs and Services &rarr; Credentials</b>.</li><li>Click <b>Create Credentials &rarr; OAuth client ID</b>.</li><li>Choose <b>Web application</b> as the application type.</li><li>Under <b>Authorized redirect URIs</b>, add: <code>{0:s}signin-google</code></li><li>Click <b>Create</b> and copy your Client ID and Client Secret below.</li></ol></p>",
            ["Plugins.ExternalAuth.Google.Login.Error"] = "An error occurred during Google authentication. Please try again.",
            ["Plugins.ExternalAuth.Google.Login.Cancelled"] = "Google sign-in was cancelled. Please try again or use another method.",
            ["Plugins.ExternalAuth.Google.Login.EmailPermissionDenied"] = "Google sign-in requires email permission. Please try again and grant email access."
        });

        await base.InstallAsync();
    }

    /// <summary>
    /// Deletes plugin settings and removes all localization resources when the plugin is uninstalled.
    /// </summary>
    /// <returns>A task representing the asynchronous operation.</returns>
    public override async Task UninstallAsync()
    {
        // Remove all settings for this plugin.
        await _settingService.DeleteSettingAsync<GoogleExternalAuthSettings>();

        // Remove all locale resources registered by this plugin.
        await _localizationService.DeleteLocaleResourcesAsync("Plugins.ExternalAuth.Google");

        await base.UninstallAsync();
    }

    #endregion
}
