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
/// Covers acceptance criteria for OTP Verification (points 8–14):
///   8.  User can enter OTP in input field (server accepts 6-digit code)
///   9.  System validates OTP against stored hashed value
///   10. Login succeeds if OTP is correct and within expiry
///   11. Error message shown for incorrect OTP
///   12. Error message shown for expired OTP
///   13. Retry allowed within defined limits (MAX = 5 attempts)
///   14. User proceeds to next step after success (redirectUrl / registrationToken)
/// </summary>
[TestFixture]
public class OtpVerificationTests
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
        // FailingEmailSender causes the controller to expose demoCode in the response
        // so tests can retrieve the plaintext OTP without touching real SMTP.
        _email           = OtpControllerTestHarness.FailingEmailSender();
        _sms             = OtpControllerTestHarness.DemoModeSmsSender();
        _customerService = new Mock<ICustomerService>();
        _authService     = new Mock<IAuthenticationService>();
        _controller      = OtpControllerTestHarness.BuildFull(_email, _sms, _customerService, _authService);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Requests an email OTP using a failing sender so the plaintext code is
    /// surfaced in the response <c>demoCode</c> field.
    /// </summary>
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

    // ── AC 8: Server-side input validation ───────────────────────────────────

    [Test]
    public async Task Verify_ReturnsBadRequest_WhenDtoIsNull()
    {
        var result = await _controller.Verify(null);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [TestCase(null,    "123456")]
    [TestCase("",      "123456")]
    [TestCase("   ",   "123456")]
    [TestCase("valid", null)]
    [TestCase("valid", "")]
    public async Task Verify_ReturnsBadRequest_WhenSessionIdOrCodeIsMissing(
        string sessionId, string code)
    {
        var result = await _controller.Verify(
            new OtpController.OtpVerifyDto { SessionId = sessionId, Code = code });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Test]
    public async Task Verify_ReturnsNotFound_WhenSessionIdIsUnknown()
    {
        var result = await _controller.Verify(new OtpController.OtpVerifyDto
        {
            SessionId = Guid.NewGuid().ToString("N"),
            Code      = "123456"
        });

        var nf = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        OtpControllerTestHarness.Get<bool>(nf.Value,   "ok").Should().BeFalse();
        OtpControllerTestHarness.Get<string>(nf.Value, "error")
            .Should().Contain("No active OTP session");
    }

    // ── AC 9: OTP validated against stored hash ──────────────────────────────

    [Test]
    public async Task Verify_ReturnsOkTrue_WhenCorrectCodeIsSubmitted()
    {
        var (sessionId, code) = await RequestEmailOtpAsync();

        var result = (OkObjectResult)await _controller.Verify(
            new OtpController.OtpVerifyDto { SessionId = sessionId, Code = code });

        OtpControllerTestHarness.Get<bool>(result.Value, "ok").Should().BeTrue();
    }

    // ── AC 11: Error message for incorrect OTP ───────────────────────────────

    [Test]
    public async Task Verify_ReturnsIncorrectOtpError_WhenWrongCodeIsSubmitted()
    {
        var (sessionId, code) = await RequestEmailOtpAsync();
        var wrongCode = code == "000000" ? "111111" : "000000";

        var result = (OkObjectResult)await _controller.Verify(
            new OtpController.OtpVerifyDto { SessionId = sessionId, Code = wrongCode });

        OtpControllerTestHarness.Get<bool>(result.Value,   "ok").Should().BeFalse();
        OtpControllerTestHarness.Get<string>(result.Value, "error")
            .Should().Contain("Incorrect OTP");
    }

    [Test]
    public async Task Verify_ShowsRemainingAttempts_InErrorMessage_AfterFirstWrongAttempt()
    {
        var (sessionId, code) = await RequestEmailOtpAsync();
        var wrongCode = code == "000000" ? "111111" : "000000";

        var result = (OkObjectResult)await _controller.Verify(
            new OtpController.OtpVerifyDto { SessionId = sessionId, Code = wrongCode });

        // First wrong attempt out of MAX=5 leaves 4 remaining
        OtpControllerTestHarness.Get<string>(result.Value, "error")
            .Should().Contain("4 attempt(s) remaining");
        OtpControllerTestHarness.Get<int>(result.Value, "attemptsRemaining").Should().Be(4);
    }

    // ── AC 13: Retry within defined limits (MAX = 5) ─────────────────────────

    [Test]
    public async Task Verify_IncrementsAttemptCounter_OnEachWrongSubmission()
    {
        var (sessionId, code) = await RequestEmailOtpAsync();
        var wrongCode = code == "000000" ? "111111" : "000000";

        for (var i = 1; i <= 3; i++)
        {
            await _controller.Verify(
                new OtpController.OtpVerifyDto { SessionId = sessionId, Code = wrongCode });

            OtpControllerTestHarness.ReadStoredField<int>(sessionId, "VerifyAttempts")
                .Should().Be(i, $"attempt #{i} must increment the stored counter to {i}");
        }
    }

    [Test]
    public async Task Verify_ReturnsLockedError_AfterAllFiveAttemptsAreExhausted()
    {
        var (sessionId, code) = await RequestEmailOtpAsync();
        var wrongCode = code == "000000" ? "111111" : "000000";

        // Exhaust the 5 allowed attempts
        for (var i = 0; i < 5; i++)
            await _controller.Verify(
                new OtpController.OtpVerifyDto { SessionId = sessionId, Code = wrongCode });

        // 6th attempt must be rejected with locked = true
        var result = (OkObjectResult)await _controller.Verify(
            new OtpController.OtpVerifyDto { SessionId = sessionId, Code = wrongCode });

        OtpControllerTestHarness.Get<bool>(result.Value, "ok").Should().BeFalse();
        OtpControllerTestHarness.Get<bool>(result.Value, "locked").Should().BeTrue();
    }

    // ── AC 12: Error message for expired OTP ─────────────────────────────────

    [Test]
    public async Task Verify_ReturnsExpiredFlag_WhenOtpSessionHasExpired()
    {
        var (sessionId, _) = await RequestEmailOtpAsync();
        OtpControllerTestHarness.SetStoredField(sessionId, "ExpiresAt",
            DateTime.UtcNow.AddSeconds(-1));

        var result = (OkObjectResult)await _controller.Verify(
            new OtpController.OtpVerifyDto { SessionId = sessionId, Code = "123456" });

        OtpControllerTestHarness.Get<bool>(result.Value, "ok").Should().BeFalse();
        OtpControllerTestHarness.Get<bool>(result.Value, "expired").Should().BeTrue();
    }

    [Test]
    public async Task Verify_ReturnsDescriptiveExpiredMessage_WhenOtpHasExpired()
    {
        var (sessionId, _) = await RequestEmailOtpAsync();
        OtpControllerTestHarness.SetStoredField(sessionId, "ExpiresAt",
            DateTime.UtcNow.AddSeconds(-1));

        var result = (OkObjectResult)await _controller.Verify(
            new OtpController.OtpVerifyDto { SessionId = sessionId, Code = "123456" });

        OtpControllerTestHarness.Get<string>(result.Value, "error")
            .Should().NotBeNullOrWhiteSpace()
            .And.ContainEquivalentOf("expired");
    }

    // ── AC 14: User proceeds to next step after success ──────────────────────

    [Test]
    public async Task Verify_ReturnsNewUserFlow_WithRegistrationToken_WhenEmailNotRegistered()
    {
        // Default ICustomerService mock returns null → triggers new-user path
        var (sessionId, code) = await RequestEmailOtpAsync();

        var result = (OkObjectResult)await _controller.Verify(
            new OtpController.OtpVerifyDto { SessionId = sessionId, Code = code });

        OtpControllerTestHarness.Get<bool>(result.Value,   "ok").Should().BeTrue();
        OtpControllerTestHarness.Get<bool>(result.Value,   "isNewUser").Should().BeTrue();
        OtpControllerTestHarness.Get<string>(result.Value, "registrationToken")
            .Should().NotBeNullOrWhiteSpace(
                "a registration token must be issued so the new user can complete sign-up");
    }

    // ── AC 10 + 14: Login succeeds, session created, redirect returned ────────

    [Test]
    public async Task Verify_SignsInExistingCustomer_AndReturnsHomeRedirect()
    {
        const string email    = "existing@corp.io";
        var          customer = new Customer { Id = 99, Active = true };

        _customerService
            .Setup(x => x.GetCustomerByEmailAsync(email))
            .ReturnsAsync(customer);
        _authService
            .Setup(x => x.SignInAsync(It.IsAny<Customer>(), It.IsAny<bool>()))
            .Returns(Task.CompletedTask);

        var (sessionId, code) = await RequestEmailOtpAsync(email);

        var result = (OkObjectResult)await _controller.Verify(
            new OtpController.OtpVerifyDto { SessionId = sessionId, Code = code });

        OtpControllerTestHarness.Get<bool>(result.Value,   "ok").Should().BeTrue();
        OtpControllerTestHarness.Get<bool>(result.Value,   "isNewUser").Should().BeFalse();
        OtpControllerTestHarness.Get<string>(result.Value, "redirectUrl").Should().Be("/");

        _authService.Verify(x => x.SignInAsync(customer, true), Times.Once,
            "a successful OTP verification must trigger sign-in to issue the auth cookie");
    }
}
