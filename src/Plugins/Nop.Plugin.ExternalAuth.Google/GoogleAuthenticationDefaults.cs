namespace Nop.Plugin.ExternalAuth.Google;

/// <summary>
/// Represents the defaults for the Google authentication plugin.
/// </summary>
public class GoogleAuthenticationDefaults
{
    #region Properties

    /// <summary>
    /// Gets the plugin system name. Must match SystemName in plugin.json exactly.
    /// </summary>
    public static string SystemName => "ExternalAuth.Google";

    /// <summary>
    /// Gets the key used to store the error callback URL in <see cref="Microsoft.AspNetCore.Authentication.AuthenticationProperties"/>.
    /// </summary>
    public static string ErrorCallback => "ErrorCallback";

    /// <summary>
    /// Gets the route name for the login callback endpoint registered in <see cref="Infrastructure.RouteProvider"/>.
    /// </summary>
    public static string LoginCallbackRoute => "Plugin.ExternalAuth.Google.LoginCallback";

    #endregion
}
