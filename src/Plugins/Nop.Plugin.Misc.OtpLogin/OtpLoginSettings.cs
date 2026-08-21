using Nop.Core.Configuration;

namespace Nop.Plugin.Misc.OtpLogin;

/// <summary>
/// Plugin-level settings stored in the nopCommerce Settings table (per-store).
/// Editable from the OTP admin page at /otp/admin.
/// </summary>
public class OtpLoginSettings : ISettings
{
    /// <summary>
    /// When true, an optional "Phone number" field is displayed on the
    /// registration page for users who sign up via email OTP.
    /// </summary>
    public bool ShowPhoneOnRegistration { get; set; } = true;
}
