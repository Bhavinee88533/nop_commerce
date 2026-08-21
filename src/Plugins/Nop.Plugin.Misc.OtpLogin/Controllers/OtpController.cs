using System.Collections.Concurrent;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Nop.Core;
using Nop.Core.Domain.Customers;
using Nop.Core.Domain.Messages;
using Nop.Plugin.Misc.OtpLogin.Services;
using Nop.Services.Authentication;
using Nop.Services.Configuration;
using Nop.Services.Customers;
using Nop.Services.Messages;

namespace Nop.Plugin.Misc.OtpLogin.Controllers;

/// <summary>
/// OTP (One-Time Password) controller.
/// Implements: 6-digit OTP, hashed storage, expiry, retry limits,
/// resend cooldown, delivery status tracking, email/SMS delivery,
/// and auto-registration / sign-in on successful verification.
/// </summary>
[Route("otp")]
public class OtpController : Controller
{
    #region Constants / Tunables

    private const int OTP_LENGTH = 6;
    private const int OTP_EXPIRY_SECONDS = 5 * 60;          // 5 minutes
    private const int MAX_VERIFY_ATTEMPTS = 5;
    private const int MAX_RESENDS = 3;
    private const int RESEND_LOCK_SECONDS = 60;             // 60 seconds between resends
    private const int RESEND_COOLDOWN_SECONDS = 15 * 60;    // 15 min cooldown after max resends

    #endregion

    #region In-memory store (per-process)

    private static readonly ConcurrentDictionary<string, OtpRecord> _store = new();

    // Holds verified-but-not-yet-registered new users awaiting registration form completion
    private static readonly ConcurrentDictionary<string, PendingRegistration> _pendingRegistrations = new();

    private sealed class PendingRegistration
    {
        public string Token { get; set; }
        public string Type { get; set; }       // "email" or "mobile"
        public string Email { get; set; }
        public string CountryCode { get; set; }
        public string Mobile { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    private sealed class OtpRecord
    {
        public string SessionId { get; set; }
        public string Type { get; set; }
        public string Destination { get; set; }
        public string CountryCode { get; set; }
        public string Mobile { get; set; }
        public string Email { get; set; }
        public string CodeHash { get; set; }
        public DateTime IssuedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public int VerifyAttempts { get; set; }
        public int ResendCount { get; set; }
        public DateTime NextResendAvailableAt { get; set; }
        public DateTime CooldownUntil { get; set; }
        public string DeliveryStatus { get; set; }
        public string DeliveryError { get; set; }
        public bool Verified { get; set; }
    }

    #endregion

    #region Fields

    protected readonly IEmailAccountService _emailAccountService;
    protected readonly IEmailSender _emailSender;
    protected readonly IQueuedEmailService _queuedEmailService;
    protected readonly EmailAccountSettings _emailAccountSettings;
    protected readonly ICustomerService _customerService;
    protected readonly ICustomerRegistrationService _customerRegistrationService;
    protected readonly IAuthenticationService _authenticationService;
    protected readonly IStoreContext _storeContext;
    protected readonly CustomerSettings _customerSettings;
    protected readonly IOtpEmailSender _otpEmailSender;
    protected readonly IOtpSmsSender _otpSmsSender;
    protected readonly ILogger<OtpController> _logger;
    protected readonly ISettingService _settingService;

    #endregion

    #region Ctor

    public OtpController(
        IEmailAccountService emailAccountService,
        IEmailSender emailSender,
        IQueuedEmailService queuedEmailService,
        EmailAccountSettings emailAccountSettings,
        ICustomerService customerService,
        ICustomerRegistrationService customerRegistrationService,
        IAuthenticationService authenticationService,
        IStoreContext storeContext,
        CustomerSettings customerSettings,
        IOtpEmailSender otpEmailSender,
        IOtpSmsSender otpSmsSender,
        ILogger<OtpController> logger,
        ISettingService settingService)
    {
        _emailAccountService = emailAccountService;
        _emailSender = emailSender;
        _queuedEmailService = queuedEmailService;
        _emailAccountSettings = emailAccountSettings;
        _customerService = customerService;
        _customerRegistrationService = customerRegistrationService;
        _authenticationService = authenticationService;
        _storeContext = storeContext;
        _customerSettings = customerSettings;
        _otpEmailSender = otpEmailSender;
        _otpSmsSender = otpSmsSender;
        _logger = logger;
        _settingService = settingService;
    }

    #endregion

    #region Helpers

    private static string GenerateOtp()
    {
        var bytes = new byte[4];
        RandomNumberGenerator.Fill(bytes);
        var num = BitConverter.ToUInt32(bytes, 0) % 1_000_000u;
        return num.ToString("D6");
    }

    private static string Hash(string value)
    {
        using var sha = SHA256.Create();
        var data = sha.ComputeHash(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(data);
    }

    private static string NewSessionId() => Guid.NewGuid().ToString("N");

    private static string MaskEmail(string email)
    {
        if (string.IsNullOrEmpty(email) || !email.Contains('@')) return email;
        var parts = email.Split('@');
        var name = parts[0];
        var masked = name.Length <= 2 ? name[..1] + "*" :
                     name[..1] + new string('*', Math.Max(1, name.Length - 2)) + name[^1..];
        return $"{masked}@{parts[1]}";
    }

    private static string MaskMobile(string cc, string mobile)
    {
        if (string.IsNullOrEmpty(mobile)) return $"{cc}";
        var visible = mobile.Length <= 4 ? mobile : mobile[^4..];
        var masked = mobile.Length <= 4 ? mobile : new string('*', mobile.Length - 4) + visible;
        return $"{cc} {masked}";
    }

    /// <summary>Resolves the absolute path to a file shipped under Content/ in the plugin output directory.</summary>
    private static string GetPluginContentPath(string fileName)
    {
        var asmDir = Path.GetDirectoryName(typeof(OtpController).Assembly.Location) ?? "";
        return Path.Combine(asmDir, "Content", fileName);
    }

    private async Task<(string status, string error)> SendOtpEmailAsync(string toEmail, string code, int expirySeconds)
    {
        var minutes = expirySeconds / 60;
        var subject = $"Your login OTP: {code}";
        var body = $@"
            <div style='font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;'>
                <h2 style='color:#222;margin:0 0 10px;'>Your One-Time Password</h2>
                <p style='color:#555;margin:0 0 18px;'>Use the code below to sign in. It is valid for <strong>{minutes} minutes</strong>.</p>
                <div style='font-size:30px;letter-spacing:8px;font-weight:700;background:#f5f7fb;color:#1a1a1a;padding:14px;border-radius:6px;text-align:center;'>{code}</div>
                <p style='color:#888;font-size:12px;margin-top:18px;'>If you did not request this code, please ignore this email.</p>
            </div>";

        // ===== Path A: dedicated OTP SMTP from appsettings.json =====
        if (_otpEmailSender.IsConfigured)
        {
            // Fire-and-forget: don't block the HTTP request waiting for SMTP handshake.
            // The OTP is already saved to DB — the user gets "sent" instantly and the
            // email arrives within seconds once the background task completes.
            _ = Task.Run(async () =>
            {
                var (ok, err) = await _otpEmailSender.SendAsync(toEmail, subject, body);
                if (!ok)
                    _logger.LogWarning("[BG] OTP email failed for {Email}: {Err}", toEmail, err);
            });
            return ("sent", null);
        }

        // ===== Path B: nopCommerce admin email account =====
        EmailAccount account = null;
        try
        {
            account = await _emailAccountService.GetEmailAccountByIdAsync(_emailAccountSettings.DefaultEmailAccountId)
                      ?? (await _emailAccountService.GetAllEmailAccountsAsync()).FirstOrDefault();

            if (account == null)
                return ("failed", "OTP email is not configured. Set 'OtpEmail' in appsettings.json OR configure an email account in Admin.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load email account for OTP");
            return ("failed", "Failed to load email account: " + ex.Message);
        }

        Exception directError = null;
        try
        {
            await _emailSender.SendEmailAsync(account, subject, body,
                account.Email, account.DisplayName,
                toEmail, toEmail);
            return ("sent", null);
        }
        catch (Exception ex)
        {
            directError = ex;
        }

        try
        {
            await _queuedEmailService.InsertQueuedEmailAsync(new QueuedEmail
            {
                Priority = QueuedEmailPriority.High,
                From = account.Email,
                FromName = account.DisplayName,
                To = toEmail,
                ToName = toEmail,
                Subject = subject,
                Body = body,
                CreatedOnUtc = DateTime.UtcNow,
                EmailAccountId = account.Id
            });
            return ("queued", "Direct send failed: " + (directError?.Message ?? "unknown") + ". Queued for retry.");
        }
        catch (Exception ex)
        {
            return ("failed", "Direct: " + (directError?.Message ?? "unknown") + "; Queue: " + ex.Message);
        }
    }

    private static void Cleanup()
    {
        var cutoff = DateTime.UtcNow.AddHours(-1);
        foreach (var kv in _store)
        {
            if (kv.Value.ExpiresAt < cutoff && kv.Value.CooldownUntil < cutoff)
                _store.TryRemove(kv.Key, out _);
        }
    }

    /// <summary>Validates mobile number. For +91 (India): must be 10 digits starting with 6–9.</summary>
    private static (bool valid, string error) ValidateMobile(string countryCode, string mobile)
    {
        var cc  = (countryCode ?? "").Trim().TrimStart('+');
        var mob = (mobile ?? "").Trim();

        if (string.IsNullOrEmpty(mob) || !System.Text.RegularExpressions.Regex.IsMatch(mob, @"^\d+$"))
            return (false, "Please enter a valid mobile number.");

        if (cc == "91") // India
        {
            if (mob.Length != 10 || !"6789".Contains(mob[0]))
                return (false, "Please enter a valid mobile number.");
        }
        else
        {
            if (mob.Length < 6 || mob.Length > 15)
                return (false, "Please enter a valid mobile number.");
        }

        return (true, null);
    }

    private async Task<(string status, string error)> SendOtpSmsAsync(string countryCode, string mobile, string code, int expirySeconds)
    {
        var minutes = expirySeconds / 60;
        var msg = $"Your nopCommerce OTP is {code}. Valid for {minutes} minutes. Do not share this code.";

        // Build E.164 number: "+91" + "9876543210"
        var cc = (countryCode ?? "").Trim();
        if (!cc.StartsWith("+")) cc = "+" + cc.TrimStart('+');
        var to = cc + (mobile ?? "").Trim();

        if (_otpSmsSender.IsConfigured)
        {
            var (ok, err) = await _otpSmsSender.SendAsync(to, msg);
            if (ok) return ("sent", null);
            // Twilio failed (e.g. trial account / unverified number) — log for dev testing ONLY
            _logger.LogWarning("[DEV MODE] OTP for {To} is {Code} (Twilio error: {Err})", to, code, err);
            return ("failed", err);
        }

        // No SMS provider configured → log OTP for dev testing ONLY, never expose in response
        _logger.LogInformation("[DEV MODE] OTP for {To} is {Code}", to, code);
        return ("demo", null);
    }

    #endregion

    #region DTOs

    public class OtpRequestDto
    {
        public string Type { get; set; }
        public string CountryCode { get; set; }
        public string Mobile { get; set; }
        public string Email { get; set; }
    }

    public class OtpVerifyDto
    {
        public string SessionId { get; set; }
        public string Code { get; set; }
    }

    public class OtpResendDto
    {
        public string SessionId { get; set; }
    }

    public class OtpCompleteRegistrationDto
    {
        public string RegistrationToken { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }   // required when OTP type=mobile
        public string Phone { get; set; }   // optional when OTP type=email
    }

    #endregion

    #region UI pages (static HTML served from plugin)

    [HttpGet("login")]
    public IActionResult Login()
    {
        var path = GetPluginContentPath("otp-login.html");
        if (!System.IO.File.Exists(path)) return NotFound("OTP login page not found.");
        Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
        return PhysicalFile(path, "text/html; charset=utf-8");
    }

    [HttpGet("theme.css")]
    public IActionResult ThemeCss()
    {
        var path = GetPluginContentPath("otp-theme.css");
        if (!System.IO.File.Exists(path)) return NotFound("OTP theme stylesheet not found.");
        Response.Headers["Cache-Control"] = "public, max-age=300";
        return PhysicalFile(path, "text/css; charset=utf-8");
    }

    [HttpGet("verify-page")]
    public IActionResult VerifyPage()
    {
        var path = GetPluginContentPath("otp-verify.html");
        if (!System.IO.File.Exists(path)) return NotFound("OTP verify page not found.");
        Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
        return PhysicalFile(path, "text/html; charset=utf-8");
    }

    /// <summary>
    /// Get default login method configured by admin
    /// </summary>
    [HttpGet("default-method")]
    public async Task<IActionResult> GetDefaultLoginMethod()
    {
        try
        {
            var loginSettings = await _settingService.LoadSettingAsync<LoginSettings>();
            var defaultMethod = loginSettings.DefaultLoginMethod ?? "OtpEmail";

            // Normalize to frontend format (lowercase)
            var frontendMethod = defaultMethod == "OtpMobile" ? "mobile" : "email";

            return Ok(new
            {
                ok = true,
                defaultMethod = frontendMethod,
                allowChange = loginSettings.AllowUserToChangeLoginMethod,
                rememberChoice = loginSettings.RememberLastUsedMethod
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting default login method");
            return Ok(new { ok = false, defaultMethod = "email", allowChange = true, rememberChoice = true });
        }
    }

    #endregion

    #region Admin login

    public class AdminLoginDto
    {
        public string Email    { get; set; }
        public string Password { get; set; }
    }

    [HttpPost("admin-login")]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> AdminLogin([FromBody] AdminLoginDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return Ok(new { ok = false, error = "Email and password are required." });

        try
        {
            // Validate credentials using nopCommerce's built-in registration service
            var result = await _customerRegistrationService.ValidateCustomerAsync(
                dto.Email.Trim(), dto.Password.Trim());

            if (result != CustomerLoginResults.Successful)
            {
                // Generic message — never reveal whether email exists or password is wrong (prevents user enumeration)
                return Ok(new { ok = false, error = "Invalid email or password." });
            }

            // Load customer and verify admin role
            var customer = await _customerService.GetCustomerByEmailAsync(dto.Email.Trim().ToLowerInvariant());
            if (customer == null)
                return Ok(new { ok = false, error = "Account not found." });

            var isAdmin = await _customerService.IsAdminAsync(customer);
            if (!isAdmin)
                return Ok(new { ok = false, error = "Access denied. This login is for administrators only." });

            // Sign in and redirect to admin panel
            await _authenticationService.SignInAsync(customer, isPersistent: false);
            _logger.LogInformation("Admin login successful for {Email}", dto.Email);

            return Ok(new { ok = true, redirectUrl = "/Admin/" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin login error for {Email}", dto.Email);
            return Ok(new { ok = false, error = "Login failed: " + ex.Message });
        }
    }

    #endregion

    #region API endpoints

    [HttpPost("request")]
    [IgnoreAntiforgeryToken]
    public new async Task<IActionResult> Request([FromBody] OtpRequestDto dto)
    {
        Cleanup();

        if (dto == null || string.IsNullOrWhiteSpace(dto.Type))
            return BadRequest(new { ok = false, error = "Invalid request." });

        var type = dto.Type.ToLowerInvariant();
        string destinationDisplay;
        string toEmail = null;

        if (type == "email")
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || !dto.Email.Contains('@'))
                return BadRequest(new { ok = false, error = "Invalid email." });
            toEmail = dto.Email.Trim();
            destinationDisplay = MaskEmail(toEmail);
        }
        else if (type == "mobile")
        {
            if (string.IsNullOrWhiteSpace(dto.Mobile) || string.IsNullOrWhiteSpace(dto.CountryCode))
                return BadRequest(new { ok = false, error = "Please enter a valid mobile number." });

            var (valid, validationError) = ValidateMobile(dto.CountryCode, dto.Mobile);
            if (!valid)
                return BadRequest(new { ok = false, error = validationError });

            destinationDisplay = MaskMobile(dto.CountryCode.Trim(), dto.Mobile.Trim());
        }
        else
        {
            return BadRequest(new { ok = false, error = "Invalid type." });
        }

        var sessionId = NewSessionId();
        var code = GenerateOtp();
        var now = DateTime.UtcNow;

        var record = new OtpRecord
        {
            SessionId = sessionId,
            Type = type,
            Destination = destinationDisplay,
            CountryCode = dto.CountryCode?.Trim(),
            Mobile = dto.Mobile?.Trim(),
            Email = toEmail,
            CodeHash = Hash(code),
            IssuedAt = now,
            ExpiresAt = now.AddSeconds(OTP_EXPIRY_SECONDS),
            VerifyAttempts = 0,
            ResendCount = 0,
            NextResendAvailableAt = now.AddSeconds(RESEND_LOCK_SECONDS),
            CooldownUntil = DateTime.MinValue,
            DeliveryStatus = "pending"
        };

        string deliveryStatus;
        string deliveryError = null;

        if (type == "email")
        {
            var (status, err) = await SendOtpEmailAsync(toEmail, code, OTP_EXPIRY_SECONDS);
            deliveryStatus = status;
            deliveryError = err;
        }
        else
        {
            var (status, err) = await SendOtpSmsAsync(dto.CountryCode, dto.Mobile, code, OTP_EXPIRY_SECONDS);
            deliveryStatus = status;
            deliveryError = err;

            // If Twilio is configured but send failed, block with an error.
            // "demo" (no SMS provider) continues normally and surfaces demoCode in the response.
            if (status == "failed")
            {
                return Ok(new
                {
                    ok = false,
                    error = "We are unable to send the OTP at the moment. Please try again later."
                });
            }
        }

        record.DeliveryStatus = deliveryStatus;
        record.DeliveryError = deliveryError;
        _store[sessionId] = record;

        // Store the selected login method in session for consistency
        var loginSettings = await _settingService.LoadSettingAsync<LoginSettings>();
        if (loginSettings.RememberLastUsedMethod && HttpContext?.Session != null)
        {
            HttpContext.Session.SetString(NopCustomerLoginDefaults.SelectedLoginMethodSessionKey,
                type == "mobile" ? "OtpMobile" : "OtpEmail");
        }

        return Ok(new
        {
            ok = true,
            sessionId,
            destination = destinationDisplay,
            expiresInSeconds = OTP_EXPIRY_SECONDS,
            resendAvailableInSeconds = RESEND_LOCK_SECONDS,
            maxResends = MAX_RESENDS,
            maxVerifyAttempts = MAX_VERIFY_ATTEMPTS,
            deliveryStatus = record.DeliveryStatus,
            deliveryError = record.DeliveryError,
            // demoCode is exposed when delivery is in demo or failed mode (no real OTP was delivered).
            // In production with working SMTP/SMS, deliveryStatus is "sent"/"queued" and demoCode is null.
            demoCode = record.DeliveryStatus is "demo" or "failed" ? code : null,
            message = deliveryStatus switch
            {
                "sent"   => $"OTP sent to {destinationDisplay}.",
                "queued" => $"OTP sent to {destinationDisplay}.",
                "demo"   => $"OTP sent to {destinationDisplay}.",
                _        => $"OTP sent to {destinationDisplay}."
            }
        });
    }

    [HttpPost("verify")]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> Verify([FromBody] OtpVerifyDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.SessionId) || string.IsNullOrWhiteSpace(dto.Code))
            return BadRequest(new { ok = false, error = "Invalid request." });

        if (!_store.TryGetValue(dto.SessionId, out var rec))
            return NotFound(new { ok = false, error = "No active OTP session. Please request a new OTP." });

        if (rec.Verified)
            return Ok(new { ok = true, message = "Already verified." });

        if (DateTime.UtcNow > rec.ExpiresAt)
            return Ok(new { ok = false, expired = true, error = "OTP has expired. Please request a new one." });

        if (rec.VerifyAttempts >= MAX_VERIFY_ATTEMPTS)
            return Ok(new { ok = false, locked = true, error = "Too many incorrect attempts. Please request a new OTP." });

        rec.VerifyAttempts += 1;
        var match = string.Equals(Hash(dto.Code.Trim()), rec.CodeHash, StringComparison.Ordinal);

        if (!match)
        {
            var remaining = MAX_VERIFY_ATTEMPTS - rec.VerifyAttempts;
            return Ok(new
            {
                ok = false,
                error = remaining > 0
                    ? $"Incorrect OTP. {remaining} attempt(s) remaining."
                    : "Incorrect OTP. Maximum attempts reached. Please request a new OTP.",
                attemptsRemaining = remaining
            });
        }

        rec.Verified = true;
        _store.TryRemove(dto.SessionId, out _);

        try
        {
            Customer customer = null;

            if (rec.Type == "email")
            {
                // Email login: look up directly by email
                var email = rec.Email?.Trim().ToLowerInvariant();
                if (string.IsNullOrEmpty(email))
                    return Ok(new { ok = false, error = "Could not determine user identity from OTP session." });

                customer = await _customerService.GetCustomerByEmailAsync(email);
            }
            else
            {
                // Phone login: look up by stored phone number
                var fullPhone = (rec.CountryCode ?? "") + rec.Mobile;
                if (string.IsNullOrEmpty(fullPhone))
                    return Ok(new { ok = false, error = "Could not determine user identity from OTP session." });

                var matches = await _customerService.GetAllCustomersAsync(phone: fullPhone, pageSize: 1);
                customer = matches.FirstOrDefault();

                // Fallback: also check the legacy @otp.local email format
                if (customer == null)
                {
                    var legacyEmail = $"{rec.CountryCode?.TrimStart('+')}{rec.Mobile}@otp.local";
                    customer = await _customerService.GetCustomerByEmailAsync(legacyEmail);
                }
            }

            if (customer == null)
            {
                // New user — store pending registration and redirect to registration page
                var regToken = Guid.NewGuid().ToString("N");
                _pendingRegistrations[regToken] = new PendingRegistration
                {
                    Token = regToken,
                    Type = rec.Type,
                    Email = rec.Email,
                    CountryCode = rec.CountryCode,
                    Mobile = rec.Mobile,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(15)
                };

                return Ok(new
                {
                    ok = true,
                    isNewUser = true,
                    registrationToken = regToken,
                    redirectUrl = $"/otp/register-page?token={regToken}&type={rec.Type}",
                    message = "OTP verified. Please complete your registration."
                });
            }

            if (!customer.Active)
            {
                customer.Active = true;
                await _customerService.UpdateCustomerAsync(customer);
            }

            await _authenticationService.SignInAsync(customer, isPersistent: true);

            return Ok(new
            {
                ok = true,
                isNewUser = false,
                redirectUrl = "/",
                message = "OTP verified successfully. Signing you in..."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OTP verify -> sign-in failed");
            return Ok(new { ok = false, error = "Verified, but sign-in failed: " + ex.Message });
        }
    }

    [HttpPost("resend")]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> Resend([FromBody] OtpResendDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.SessionId))
            return BadRequest(new { ok = false, error = "Invalid request." });

        if (!_store.TryGetValue(dto.SessionId, out var rec))
            return NotFound(new { ok = false, error = "No active OTP session." });

        var now = DateTime.UtcNow;

        if (rec.CooldownUntil > now)
        {
            var waitSec = (int)Math.Ceiling((rec.CooldownUntil - now).TotalSeconds);
            return Ok(new { ok = false, cooldown = true, waitSeconds = waitSec,
                error = $"Resend limit reached. Try again in {waitSec} seconds." });
        }

        if (rec.CooldownUntil != DateTime.MinValue && rec.CooldownUntil <= now)
        {
            rec.ResendCount = 0;
            rec.CooldownUntil = DateTime.MinValue;
        }

        if (rec.NextResendAvailableAt > now)
        {
            var waitSec = (int)Math.Ceiling((rec.NextResendAvailableAt - now).TotalSeconds);
            return Ok(new { ok = false, waitSeconds = waitSec,
                error = $"Please wait {waitSec} seconds before requesting again." });
        }

        if (rec.ResendCount >= MAX_RESENDS)
        {
            rec.CooldownUntil = now.AddSeconds(RESEND_COOLDOWN_SECONDS);
            return Ok(new
            {
                ok = false,
                cooldown = true,
                waitSeconds = RESEND_COOLDOWN_SECONDS,
                error = $"Resend limit reached. Try again in {RESEND_COOLDOWN_SECONDS / 60} minutes."
            });
        }

        var code = GenerateOtp();
        rec.CodeHash = Hash(code);
        rec.IssuedAt = now;
        rec.ExpiresAt = now.AddSeconds(OTP_EXPIRY_SECONDS);
        rec.VerifyAttempts = 0; // Reset so user gets full retry allowance on new OTP
        rec.ResendCount += 1;
        rec.NextResendAvailableAt = now.AddSeconds(RESEND_LOCK_SECONDS);
        rec.DeliveryStatus = "pending";

        string deliveryStatus;

        if (rec.Type == "email" && !string.IsNullOrEmpty(rec.Email))
        {
            var (status, err) = await SendOtpEmailAsync(rec.Email, code, OTP_EXPIRY_SECONDS);
            deliveryStatus = status;
            rec.DeliveryError = err;
            // OTP is never exposed in the API response — check server logs if delivery fails.
            if (status == "failed")
                _logger.LogWarning("OTP email resend failed for {Email}: {Err}. OTP for testing: {Code}", rec.Email, err, code);
        }
        else
        {
            var (status, err) = await SendOtpSmsAsync(rec.CountryCode, rec.Mobile, code, OTP_EXPIRY_SECONDS);
            deliveryStatus = status;
            rec.DeliveryError = err;
            // OTP is never exposed in the API response for SMS — check server logs for testing.
        }

        rec.DeliveryStatus = deliveryStatus;

        return Ok(new
        {
            ok = true,
            destination = rec.Destination,
            expiresInSeconds = OTP_EXPIRY_SECONDS,
            resendAvailableInSeconds = RESEND_LOCK_SECONDS,
            resendCount = rec.ResendCount,
            maxResends = MAX_RESENDS,
            deliveryStatus = rec.DeliveryStatus,
            message = deliveryStatus switch
            {
                "sent"   => $"A new OTP has been sent to {rec.Destination}.",
                "queued" => $"A new OTP has been sent to {rec.Destination}.",
                "demo"   => $"A new OTP has been sent to {rec.Destination}.",
                _        => $"A new OTP has been sent to {rec.Destination}."
            }
        });
    }

    [HttpGet("register-page")]
    public IActionResult RegisterPage([FromQuery] string token)
    {
        var path = GetPluginContentPath("otp-register.html");
        if (!System.IO.File.Exists(path))
            return NotFound("Registration page not found.");
        return Content(System.IO.File.ReadAllText(path), "text/html");
    }

    [HttpPost("complete-registration")]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> CompleteRegistration([FromBody] OtpCompleteRegistrationDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.RegistrationToken))
            return BadRequest(new { ok = false, error = "Invalid request." });

        if (!_pendingRegistrations.TryGetValue(dto.RegistrationToken, out var pending))
            return Ok(new { ok = false, error = "Registration session expired or invalid. Please start again." });

        if (DateTime.UtcNow > pending.ExpiresAt)
        {
            _pendingRegistrations.TryRemove(dto.RegistrationToken, out _);
            return Ok(new { ok = false, expired = true, error = "Registration session expired. Please start over." });
        }

        if (string.IsNullOrWhiteSpace(dto.FirstName))
            return Ok(new { ok = false, error = "First name is required." });
        if (string.IsNullOrWhiteSpace(dto.LastName))
            return Ok(new { ok = false, error = "Last name is required." });

        // For phone OTP users, email is required
        if (pending.Type == "mobile" && string.IsNullOrWhiteSpace(dto.Email))
            return Ok(new { ok = false, error = "Email address is required." });

        // Validate email format properly (not just Contains('@'))
        if (pending.Type == "mobile")
        {
            var emailToCheck = dto.Email.Trim();
            if (emailToCheck.Length > 254 ||
                !System.Text.RegularExpressions.Regex.IsMatch(emailToCheck,
                    @"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$"))
                return Ok(new { ok = false, error = "Please enter a valid email address." });
        }

        // For email OTP users, validate phone if provided
        if (pending.Type == "email" && !string.IsNullOrWhiteSpace(dto.Phone))
        {
            // Extract country code and number from stored full phone (e.g. "+919876543210")
            // dto.Phone here is the full E.164 string built by the frontend
            var phoneDigits = System.Text.RegularExpressions.Regex.Replace(dto.Phone, @"[^\d]", "");
            if (phoneDigits.Length < 5 || phoneDigits.Length > 15)
                return Ok(new { ok = false, error = "Please enter a valid mobile number." });
        }

        _pendingRegistrations.TryRemove(dto.RegistrationToken, out _);

        try
        {
            // Determine the account email: use real email for both flows
            string accountEmail = pending.Type == "email"
                ? pending.Email?.Trim().ToLowerInvariant()
                : dto.Email.Trim().ToLowerInvariant();

            // Phone supplied during email-OTP registration (optional)
            string phoneToStore = pending.Type == "mobile"
                ? (pending.CountryCode ?? "") + pending.Mobile
                : (string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim());

            // Guard: check if this email is already registered
            var existing = await _customerService.GetCustomerByEmailAsync(accountEmail);
            if (existing != null)
            {
                // If phone was provided, update it on the existing account
                if (!string.IsNullOrEmpty(phoneToStore) && string.IsNullOrEmpty(existing.Phone))
                {
                    existing.Phone = phoneToStore;
                    await _customerService.UpdateCustomerAsync(existing);
                }
                await _authenticationService.SignInAsync(existing, isPersistent: true);
                return Ok(new { ok = true, isNewUser = false, redirectUrl = "/", message = "An account with this email already exists. Signed in." });
            }

            // If phone OTP: also guard against duplicate phone number
            if (pending.Type == "mobile")
            {
                var fullPhone = (pending.CountryCode ?? "") + pending.Mobile;
                var phoneMatches = await _customerService.GetAllCustomersAsync(phone: fullPhone, pageSize: 1);
                var phoneExisting = phoneMatches.FirstOrDefault();
                if (phoneExisting != null)
                {
                    await _authenticationService.SignInAsync(phoneExisting, isPersistent: true);
                    return Ok(new { ok = true, isNewUser = false, redirectUrl = "/", message = "An account with this phone number already exists. Signed in." });
                }
            }

            var store = await _storeContext.GetCurrentStoreAsync();
            var newCustomer = new Customer
            {
                CustomerGuid = Guid.NewGuid(),
                Active = true,
                CreatedOnUtc = DateTime.UtcNow,
                LastActivityDateUtc = DateTime.UtcNow,
                RegisteredInStoreId = store.Id
            };
            await _customerService.InsertCustomerAsync(newCustomer);

            var randomPwd = Convert.ToBase64String(RandomNumberGenerator.GetBytes(18)) + "!Aa1";
            var registrationRequest = new CustomerRegistrationRequest(
                newCustomer,
                accountEmail,
                accountEmail,
                randomPwd,
                _customerSettings.DefaultPasswordFormat,
                store.Id,
                isApproved: true);

            var regResult = await _customerRegistrationService.RegisterCustomerAsync(registrationRequest);
            if (!regResult.Success)
            {
                var errs = string.Join("; ", regResult.Errors ?? new List<string>());
                _logger.LogWarning("OTP registration failed for {Email}: {Errors}", accountEmail, errs);
                return Ok(new { ok = false, error = "Could not create account: " + errs });
            }

            newCustomer.FirstName = dto.FirstName.Trim();
            newCustomer.LastName = dto.LastName.Trim();
            if (!string.IsNullOrEmpty(phoneToStore))
                newCustomer.Phone = phoneToStore;

            await _customerService.UpdateCustomerAsync(newCustomer);
            await _authenticationService.SignInAsync(newCustomer, isPersistent: true);

            _logger.LogInformation("New customer registered via OTP: {Email}", accountEmail);

            return Ok(new { ok = true, isNewUser = true, redirectUrl = "/", message = "Account created successfully. Welcome!" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OTP complete-registration failed");
            return Ok(new { ok = false, error = "Registration failed: " + ex.Message });
        }
    }

    [HttpGet("status/{sessionId}")]
    [IgnoreAntiforgeryToken]
    public IActionResult Status(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || !_store.TryGetValue(sessionId, out var rec))
            return NotFound(new { ok = false, error = "No active OTP session." });

        var now = DateTime.UtcNow;
        return Ok(new
        {
            ok = true,
            destination = rec.Destination,
            type = rec.Type,
            expiresInSeconds = Math.Max(0, (int)(rec.ExpiresAt - now).TotalSeconds),
            resendAvailableInSeconds = Math.Max(0, (int)(rec.NextResendAvailableAt - now).TotalSeconds),
            cooldownSeconds = rec.CooldownUntil > now ? (int)(rec.CooldownUntil - now).TotalSeconds : 0,
            resendCount = rec.ResendCount,
            maxResends = MAX_RESENDS,
            verifyAttempts = rec.VerifyAttempts,
            maxVerifyAttempts = MAX_VERIFY_ATTEMPTS,
            deliveryStatus = rec.DeliveryStatus
        });
    }

    #endregion
}
