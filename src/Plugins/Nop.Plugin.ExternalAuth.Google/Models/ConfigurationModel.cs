using Nop.Web.Framework.Models;
using Nop.Web.Framework.Mvc.ModelBinding;
using System.ComponentModel.DataAnnotations;

namespace Nop.Plugin.ExternalAuth.Google.Models;

/// <summary>
/// Represents the configuration view model for the Google authentication admin page.
/// </summary>
public record ConfigurationModel : BaseNopModel
{
    #region Properties

    /// <summary>
    /// Gets or sets the Google OAuth 2.0 Client ID.
    /// </summary>
    [Required]
    [NopResourceDisplayName("Plugins.ExternalAuth.Google.ClientId")]
    public string ClientId { get; set; }

    /// <summary>
    /// Gets or sets the Google OAuth 2.0 Client Secret.
    /// SECURITY: Rendered as type="password" in the admin view — never in JavaScript or logs.
    /// </summary>
    [Required]
    [NopResourceDisplayName("Plugins.ExternalAuth.Google.ClientSecret")]
    public string ClientSecret { get; set; }

    /// <summary>
    /// Gets or sets the login button text displayed on the storefront sign-in button.
    /// </summary>
    [StringLength(200)]
    [NopResourceDisplayName("Plugins.ExternalAuth.Google.LoginButtonText")]
    public string LoginButtonText { get; set; }

    /// <summary>
    /// Gets or sets the register button text displayed on the storefront registration button.
    /// </summary>
    [StringLength(200)]
    [NopResourceDisplayName("Plugins.ExternalAuth.Google.RegisterButtonText")]
    public string RegisterButtonText { get; set; }

    /// <summary>
    /// Gets or sets the position order within the external authentication methods block.
    /// </summary>
    [NopResourceDisplayName("Plugins.ExternalAuth.Google.DisplayOrder")]
    public int DisplayOrder { get; set; }

    #endregion
}
