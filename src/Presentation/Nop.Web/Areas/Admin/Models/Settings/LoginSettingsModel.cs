using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;
using Nop.Web.Framework.Models;
using Nop.Web.Framework.Mvc.ModelBinding;

namespace Nop.Web.Areas.Admin.Models.Settings;

/// <summary>
/// Represents a login settings model
/// </summary>
public partial record LoginSettingsModel : BaseNopModel, ISettingsModel
{
    #region Properties

    /// <summary>
    /// Gets or sets the default login method
    /// </summary>
    [NopResourceDisplayName("Admin.Configuration.Settings.CustomerUser.LoginSettings.DefaultLoginMethod")]
    public string DefaultLoginMethod { get; set; }

    /// <summary>
    /// Gets or sets available login methods
    /// </summary>
    public IList<SelectListItem> AvailableLoginMethods { get; set; } = new List<SelectListItem>();

    /// <summary>
    /// Gets or sets a value indicating whether users can change login method during session
    /// </summary>
    [NopResourceDisplayName("Admin.Configuration.Settings.CustomerUser.LoginSettings.AllowUserToChangeLoginMethod")]
    public bool AllowUserToChangeLoginMethod { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether to remember last used login method
    /// </summary>
    [NopResourceDisplayName("Admin.Configuration.Settings.CustomerUser.LoginSettings.RememberLastUsedMethod")]
    public bool RememberLastUsedMethod { get; set; }

    public int ActiveStoreScopeConfiguration { get; set; }

    #endregion
}
