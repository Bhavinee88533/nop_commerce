using Nop.Core.Configuration;

namespace Nop.Core.Domain.Customers;

/// <summary>
/// Login settings
/// </summary>
public class LoginSettings : ISettings
{
    /// <summary>
    /// Gets or sets the default login method
    /// Possible values: "OtpEmail", "OtpMobile"
    /// </summary>
    public string DefaultLoginMethod { get; set; } = "OtpEmail";

    /// <summary>
    /// Gets or sets a value indicating whether users can change login method during session
    /// </summary>
    public bool AllowUserToChangeLoginMethod { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to remember last used login method
    /// </summary>
    public bool RememberLastUsedMethod { get; set; } = true;
}
