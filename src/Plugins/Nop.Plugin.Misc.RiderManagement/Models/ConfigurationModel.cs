namespace Nop.Plugin.Misc.RiderManagement.Models;

/// <summary>
/// Model for the admin configuration page.
/// </summary>
public record ConfigurationModel
{
    /// <summary>
    /// Gets or sets an informational message shown on the configure page.
    /// </summary>
    public string ModuleStatus { get; init; } = string.Empty;
}
