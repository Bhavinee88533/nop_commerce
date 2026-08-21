using Nop.Core.Configuration;

namespace Nop.Plugin.ExternalAuth.Google;

/// <summary>
/// Represents settings for the Google authentication plugin.
/// Persisted via <see cref="Nop.Services.Configuration.ISettingService"/>.
/// </summary>
public class GoogleExternalAuthSettings : ISettings
{
    #region Properties

    /// <summary>
    /// Gets or sets the Google OAuth 2.0 Client ID.
    /// </summary>
    public string ClientId { get; set; }

    /// <summary>
    /// Gets or sets the Google OAuth 2.0 Client Secret.
    /// SECURITY: This value is stored server-side only and must never be rendered in views, JavaScript, or logs.
    /// </summary>
    public string ClientSecret { get; set; }

    /// <summary>
    /// Gets or sets optional additional OAuth scopes beyond openid/profile/email (space-separated).
    /// Reserved for phase 2. Leave empty in phase 1.
    /// </summary>
    public string AdditionalScopes { get; set; }

    /// <summary>
    /// Gets or sets the text displayed on the sign-in button on the login page.
    /// </summary>
    public string LoginButtonText { get; set; }

    /// <summary>
    /// Gets or sets the text displayed on the button when shown on the registration page.
    /// </summary>
    public string RegisterButtonText { get; set; }

    /// <summary>
    /// Gets or sets the display order of this provider within the external-methods block.
    /// </summary>
    public int DisplayOrder { get; set; }

    #endregion
}
