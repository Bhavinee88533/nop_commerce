using AwesomeAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Cryptography;
using System.Text;
using Nop.Core.Domain.Customers;
using Nop.Plugin.Misc.OtpLogin.Controllers;
using Nop.Plugin.Misc.OtpLogin.Services;
using Nop.Services.Authentication;
using Nop.Services.Customers;
using NUnit.Framework;

namespace Nop.Tests.Nop.Plugins.Tests.OtpLogin;

/// <summary>
/// Covers acceptance criteria for session lifecycle and timeout management (points 1–7):
///   1. Session/token generated after successful login (SignInAsync called → HTTP-only auth cookie)
///   2. Token stored securely (nopCommerce IAuthenticationService manages HTTP-only cookie)
///   3. Session validity tracked on backend (in-process _store with ExpiresAt)
///   4. Session expires after inactivity threshold (5 minutes = 300 seconds)
///   5. Expired sessions rejected on API requests (expired flag returned)
///   6. Proper expiration message returned to client
///   7. User redirected to login on session expiry (redirectUrl / expired flag used by client)
/// </summary>
[TestFixture]
public class OtpSessionTimeoutTests
{
    private Mock<IOtpEmailSender>        _email;
    private Mock<IOtpSmsSender>          _sms;
    private Mock<ICustomerService>       _customerService;
    private Mock<IAuthenticationService> _authService;
    private OtpController                _controller;

    [SetUp]
    public void SetUp()
    {
        OtpControllerTestHarness.ClearStaticOtpStore();
        OtpControllerTestHarness.ClearPendingRegistrations();
        _email           = OtpControllerTestHarness.FailingEmailSender();
        _sms             = OtpControllerTestHarness.DemoModeSmsSender();
        _customerService = new Mock<ICustomerService>();
        _authService     = new Mock<IAuthenticationService>();
        _controller      = OtpControllerTestHarness.BuildFull(_email, _sms, _customerService, _authService);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<(string sessionId, string code)> RequestEmailOtpAsync(
        string email = "user@example.com")
    {
        var r = (OkObjectResult)await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email", Email = email
        });

        var sessionId = OtpControllerTestHarness.Get<string>(r.Value, "sessionId");
        const string knownCode = "123456";
        OtpControllerTestHarness.SetStoredField(sessionId, "CodeHash", Hash(knownCode));

        return (sessionId, knownCode);
    }

    private static string Hash(string value)
    {
        var data = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(data);
    }

    // ── AC 3: Session validity tracked on backend ────────────────────────────

    [Test]
    public async Task Session_IsStoredInBackend_AfterOtpIsRequested()
    {
        var (sessionId, _) = await RequestEmailOtpAsync();

        OtpControllerTestHarness.SessionExists(sessionId)
            .Should().BeTrue("the backend must persist the session so it can validate the OTP later");
    }

    [Test]
    public async Task Session_TracksDeliveryStatus_InBackendStore()
    {
        var (sessionId, _) = await RequestEmailOtpAsync();

        // FailingEmailSender → deliveryStatus = "failed"
        OtpControllerTestHarness.ReadStoredField<string>(sessionId, "DeliveryStatus")
            .Should().NotBeNullOrWhiteSpace("delivery status must be tracked per session");
    }

    // ── AC 4: Session expires after 5-minute threshold ───────────────────────

    [Test]
    public async Task Session_ExpiresAt_IsExactlyFiveMinutes_AfterIssuance()
    {
        var (sessionId, _) = await RequestEmailOtpAsync();

        var issuedAt  = OtpControllerTestHarness.ReadStoredField<DateTime>(sessionId, "IssuedAt");
        var expiresAt = OtpControllerTestHarness.ReadStoredField<DateTime>(sessionId, "ExpiresAt");

        (expiresAt - issuedAt).Should().Be(TimeSpan.FromMinutes(5),
            "OTP sessions must expire exactly 5 minutes from issuance");
    }

    [Test]
    public async Task Session_ExpiresInSeconds_ReportedAs300_InApiResponse()
    {
        var r = (OkObjectResult)await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email", Email = "user@example.com"
        });

        OtpControllerTestHarness.Get<int>(r.Value, "expiresInSeconds")
            .Should().Be(300, "client relies on this value to drive the 5-minute OTP countdown");
    }

    // ── AC 5: Expired sessions are rejected ──────────────────────────────────

    [Test]
    public async Task Session_VerifyRequest_IsRejected_WithExpiredFlag_WhenSessionHasExpired()
    {
        var (sessionId, _) = await RequestEmailOtpAsync();
        OtpControllerTestHarness.SetStoredField(sessionId, "ExpiresAt",
            DateTime.UtcNow.AddSeconds(-1));

        var result = (OkObjectResult)await _controller.Verify(new OtpController.OtpVerifyDto
        {
            SessionId = sessionId, Code = "000000"
        });

        OtpControllerTestHarness.Get<bool>(result.Value, "ok").Should().BeFalse();
        OtpControllerTestHarness.Get<bool>(result.Value, "expired").Should().BeTrue();
    }

    [Test]
    public async Task Session_VerifyRequest_IsAccepted_OneSecondBeforeExpiry()
    {
        var (sessionId, code) = await RequestEmailOtpAsync();
        OtpControllerTestHarness.SetStoredField(sessionId, "ExpiresAt",
            DateTime.UtcNow.AddSeconds(1));

        var result = (OkObjectResult)await _controller.Verify(new OtpController.OtpVerifyDto
        {
            SessionId = sessionId, Code = code
        });

        OtpControllerTestHarness.Get<bool>(result.Value, "ok")
            .Should().BeTrue("a session that has not yet expired must still be accepted");
    }

    // ── AC 6: Proper expiration message ─────────────────────────────────────

    [Test]
    public async Task Session_ExpiredVerify_ReturnsDescriptiveErrorMessage()
    {
        var (sessionId, _) = await RequestEmailOtpAsync();
        OtpControllerTestHarness.SetStoredField(sessionId, "ExpiresAt",
            DateTime.UtcNow.AddSeconds(-1));

        var result = (OkObjectResult)await _controller.Verify(new OtpController.OtpVerifyDto
        {
            SessionId = sessionId, Code = "000000"
        });

        OtpControllerTestHarness.Get<string>(result.Value, "error")
            .Should().NotBeNullOrWhiteSpace()
            .And.ContainEquivalentOf("expired",
                "the error message must clearly communicate that the session has expired");
    }

    // ── AC 7: Client is given data to redirect on expiry ─────────────────────

    [Test]
    public async Task Session_ExpiredVerify_ReturnsExpiredFlag_SoClientCanRedirectToLogin()
    {
        var (sessionId, _) = await RequestEmailOtpAsync();
        OtpControllerTestHarness.SetStoredField(sessionId, "ExpiresAt",
            DateTime.UtcNow.AddSeconds(-1));

        var result = (OkObjectResult)await _controller.Verify(new OtpController.OtpVerifyDto
        {
            SessionId = sessionId, Code = "000000"
        });

        // The client checks `expired = true` and redirects to /otp/login
        OtpControllerTestHarness.Get<bool>(result.Value, "expired")
            .Should().BeTrue("the client uses this flag to redirect the user back to the login page");
    }

    // ── AC 1: Auth token generated after successful OTP verification ──────────

    [Test]
    public async Task Session_AuthToken_IsGeneratedViaSignIn_AfterSuccessfulOtpVerification()
    {
        const string email    = "registered@example.com";
        var          customer = new Customer { Id = 5, Active = true };

        _customerService
            .Setup(x => x.GetCustomerByEmailAsync(email))
            .ReturnsAsync(customer);
        _authService
            .Setup(x => x.SignInAsync(It.IsAny<Customer>(), It.IsAny<bool>()))
            .Returns(Task.CompletedTask);

        var (sessionId, code) = await RequestEmailOtpAsync(email);
        await _controller.Verify(new OtpController.OtpVerifyDto { SessionId = sessionId, Code = code });

        // nopCommerce IAuthenticationService.SignInAsync issues the HTTP-only auth cookie
        _authService.Verify(x => x.SignInAsync(customer, true), Times.Once,
            "SignInAsync must be called to issue the secure HTTP-only auth cookie after OTP success");
    }

    // ── Session removed from store after successful verification ─────────────

    [Test]
    public async Task Session_IsRemovedFromStore_AfterSuccessfulVerification()
    {
        var (sessionId, code) = await RequestEmailOtpAsync();

        OtpControllerTestHarness.SessionExists(sessionId)
            .Should().BeTrue("session must be present before verification");

        await _controller.Verify(
            new OtpController.OtpVerifyDto { SessionId = sessionId, Code = code });

        OtpControllerTestHarness.SessionExists(sessionId)
            .Should().BeFalse(
                "the session must be purged after successful verification to prevent replay attacks");
    }

    // ── Resend extends the session expiry window ──────────────────────────────

    [Test]
    public async Task Session_ExpiryIsReset_ToFreshFiveMinutes_WhenOtpIsResent()
    {
        var (sessionId, _) = await RequestEmailOtpAsync();

        // Simulate a nearly-expired session
        OtpControllerTestHarness.SetStoredField(sessionId, "ExpiresAt",
            DateTime.UtcNow.AddSeconds(5));
        OtpControllerTestHarness.SetStoredField(sessionId, "NextResendAvailableAt",
            DateTime.UtcNow.AddSeconds(-1));

        var beforeResend = DateTime.UtcNow;
        await _controller.Resend(new OtpController.OtpResendDto { SessionId = sessionId });

        var newExpiry = OtpControllerTestHarness.ReadStoredField<DateTime>(sessionId, "ExpiresAt");
        newExpiry.Should().BeAfter(beforeResend.AddMinutes(4),
            "resending must reset the OTP expiry to a fresh 5-minute window from now");
    }

    // ── Cleanup purges stale sessions on next Request ─────────────────────────

    [Test]
    public async Task Cleanup_RemovesSessionsExpiredMoreThanOneHourAgo_OnNextRequest()
    {
        var (staleId, _) = await RequestEmailOtpAsync("stale@example.com");

        // Mark session as expired more than 1 hour ago
        OtpControllerTestHarness.SetStoredField(staleId, "ExpiresAt",
            DateTime.UtcNow.AddHours(-2));
        OtpControllerTestHarness.SetStoredField(staleId, "CooldownUntil",
            DateTime.UtcNow.AddHours(-2));

        // A fresh Request() call triggers Cleanup()
        await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email", Email = "fresh@example.com"
        });

        OtpControllerTestHarness.SessionExists(staleId)
            .Should().BeFalse(
                "sessions expired more than 1 hour ago must be purged on the next request to prevent memory leaks");
    }
}
