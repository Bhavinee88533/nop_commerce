using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Nop.Plugin.Misc.OtpLogin.Services;

/// <summary>
/// Dedicated SMTP configuration for the OTP login flow.
/// Read from appsettings.json under the "OtpEmail" section.
/// </summary>
public class OtpEmailOptions
{
    public bool Enabled { get; set; } = true;
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = false;
    public string Username { get; set; }
    public string Password { get; set; }
    public string FromAddress { get; set; }
    public string FromDisplayName { get; set; } = "nopCommerce OTP";
}

public interface IOtpEmailSender
{
    Task<(bool ok, string error)> SendAsync(string toEmail, string subject, string htmlBody);
    bool IsConfigured { get; }
}

public class OtpEmailSender : IOtpEmailSender
{
    private readonly OtpEmailOptions _options;
    private readonly ILogger<OtpEmailSender> _logger;

    public OtpEmailSender(OtpEmailOptions options, ILogger<OtpEmailSender> logger)
    {
        _options = options ?? new OtpEmailOptions();
        _logger = logger;
    }

    public bool IsConfigured =>
        _options.Enabled &&
        !string.IsNullOrWhiteSpace(_options.Host) &&
        !string.IsNullOrWhiteSpace(_options.Username) &&
        !string.IsNullOrWhiteSpace(_options.Password) &&
        !string.IsNullOrWhiteSpace(_options.FromAddress);

    public async Task<(bool ok, string error)> SendAsync(string toEmail, string subject, string htmlBody)
    {
        if (!IsConfigured)
            return (false, "OTP email is not configured in appsettings.json (section 'OtpEmail').");

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_options.FromDisplayName, _options.FromAddress));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            using var smtp = new SmtpClient();
            // Use CancellationToken.None so no external cancellation interferes
            await smtp.ConnectAsync(_options.Host, _options.Port, SecureSocketOptions.Auto, CancellationToken.None);
            await smtp.AuthenticateAsync(_options.Username, _options.Password, CancellationToken.None);
            await smtp.SendAsync(message, CancellationToken.None);
            await smtp.DisconnectAsync(true, CancellationToken.None);

            _logger.LogInformation("OTP email sent to {To} via MailKit SMTP {Host}:{Port}",
                toEmail, _options.Host, _options.Port);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OTP email send failed to {To}", toEmail);
            return (false, ex.Message);
        }
    }
}
