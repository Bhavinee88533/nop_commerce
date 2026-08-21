using System.Net.Http.Headers;
using System.Text;
using Microsoft.Extensions.Logging;

namespace Nop.Plugin.Misc.OtpLogin.Services;

/// <summary>
/// SMS provider configuration. Read from appsettings.json under "OtpSms".
/// Currently supports Twilio (https://www.twilio.com/).
/// Independent of the nopCommerce admin so OTP SMS has its own fixed sender.
/// </summary>
public class OtpSmsOptions
{
    public bool Enabled { get; set; } = false;

    /// <summary>"twilio" (default) — extend later for other providers.</summary>
    public string Provider { get; set; } = "twilio";

    /// <summary>Twilio Account SID (starts with "AC...").</summary>
    public string AccountSid { get; set; }

    /// <summary>Twilio Auth Token.</summary>
    public string AuthToken { get; set; }

    /// <summary>Sender phone number in E.164 format, e.g. "+15005550006".</summary>
    public string FromNumber { get; set; }
}

public interface IOtpSmsSender
{
    Task<(bool ok, string error)> SendAsync(string toE164, string message);
    bool IsConfigured { get; }
}

/// <summary>
/// Minimal Twilio REST API client (no Twilio SDK needed).
/// Posts to /2010-04-01/Accounts/{Sid}/Messages.json with Basic auth.
/// </summary>
public class OtpSmsSender : IOtpSmsSender
{
    private readonly OtpSmsOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<OtpSmsSender> _logger;

    public OtpSmsSender(OtpSmsOptions options,
        IHttpClientFactory httpClientFactory,
        ILogger<OtpSmsSender> logger)
    {
        _options = options ?? new OtpSmsOptions();
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public bool IsConfigured =>
        _options.Enabled &&
        !string.IsNullOrWhiteSpace(_options.AccountSid) &&
        !string.IsNullOrWhiteSpace(_options.AuthToken) &&
        !string.IsNullOrWhiteSpace(_options.FromNumber);

    public async Task<(bool ok, string error)> SendAsync(string toE164, string message)
    {
        if (!IsConfigured)
            return (false, "OTP SMS is not configured in appsettings.json (section 'OtpSms').");

        if (!string.Equals(_options.Provider, "twilio", StringComparison.OrdinalIgnoreCase))
            return (false, $"Unsupported SMS provider: {_options.Provider}");

        try
        {
            var url = $"https://api.twilio.com/2010-04-01/Accounts/{_options.AccountSid}/Messages.json";

            var form = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("To", toE164),
                new KeyValuePair<string, string>("From", _options.FromNumber),
                new KeyValuePair<string, string>("Body", message)
            });

            var http = _httpClientFactory.CreateClient();
            http.Timeout = TimeSpan.FromSeconds(15);

            var basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.AccountSid}:{_options.AuthToken}"));
            using var req = new HttpRequestMessage(HttpMethod.Post, url) { Content = form };
            req.Headers.Authorization = new AuthenticationHeaderValue("Basic", basic);

            using var res = await http.SendAsync(req);
            var body = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("Twilio SMS send failed for {To}: {Status} {Body}", toE164, (int)res.StatusCode, body);
                // Twilio returns JSON like {"code":21211,"message":"Invalid 'To' Phone Number","status":400}
                return (false, $"Twilio {(int)res.StatusCode}: {body}");
            }

            _logger.LogInformation("OTP SMS sent to {To} via Twilio", toE164);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OTP SMS send failed to {To}", toE164);
            return (false, ex.Message);
        }
    }
}
