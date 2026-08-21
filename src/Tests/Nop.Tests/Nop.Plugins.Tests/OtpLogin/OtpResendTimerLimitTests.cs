using AwesomeAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Nop.Plugin.Misc.OtpLogin.Controllers;
using Nop.Plugin.Misc.OtpLogin.Services;
using NUnit.Framework;

namespace Nop.Tests.Nop.Plugins.Tests.OtpLogin;

/// <summary>
/// Covers acceptance criteria for Resend OTP throttling and timer (points 15–22):
///   15. Resend OTP option is disabled initially (60-second lock after first request)
///   16. Resend becomes available after 60 seconds
///   17. Countdown data (resendAvailableInSeconds) is included in every API response
///   18. Timer ticks are client-driven; backend provides correct seconds each call
///   19. Maximum of 3 resend attempts allowed per session
///   20. Cooldown period of 15 minutes (900 s) applied after max resends
///   21. New OTP invalidates previous OTP (CodeHash is replaced on every resend)
///   22. Attempt counter resets after cooldown expires
/// </summary>
[TestFixture]
public class OtpResendTimerLimitTests
{
    private Mock<IOtpEmailSender> _email;
    private Mock<IOtpSmsSender>   _sms;
    private OtpController         _controller;

    [SetUp]
    public void SetUp()
    {
        OtpControllerTestHarness.ClearStaticOtpStore();
        // FailingEmailSender surfaces demoCode on resend too so the new code is observable
        _email      = OtpControllerTestHarness.FailingEmailSender();
        _sms        = OtpControllerTestHarness.DemoModeSmsSender();
        _controller = OtpControllerTestHarness.Build(_email, _sms);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<string> RequestEmailSessionAsync(string email = "user@example.com")
    {
        var r = (OkObjectResult)await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email", Email = email
        });
        return OtpControllerTestHarness.Get<string>(r.Value, "sessionId");
    }

    /// <summary>Bypasses the 60-second resend lock by backdating NextResendAvailableAt.</summary>
    private static void UnlockResend(string sessionId)
        => OtpControllerTestHarness.SetStoredField(
               sessionId, "NextResendAvailableAt", DateTime.UtcNow.AddSeconds(-1));

    // ── AC 15: Resend is locked for 60 seconds after initial request ─────────

    [Test]
    public async Task Request_Response_IncludesResendAvailableIn_60Seconds()
    {
        var result = (OkObjectResult)await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email", Email = "user@example.com"
        });

        OtpControllerTestHarness.Get<int>(result.Value, "resendAvailableInSeconds")
            .Should().Be(60, "resend must be locked for exactly 60 seconds after the initial OTP request");
    }

    [Test]
    public async Task Resend_ReturnsError_WhenCalledBeforeThe60SecondLockExpires()
    {
        var sessionId = await RequestEmailSessionAsync();
        // Do NOT unlock – resend is called immediately while lock is active

        var result = (OkObjectResult)await _controller.Resend(
            new OtpController.OtpResendDto { SessionId = sessionId });

        OtpControllerTestHarness.Get<bool>(result.Value, "ok").Should().BeFalse();
        OtpControllerTestHarness.Get<int>(result.Value,  "waitSeconds")
            .Should().BeGreaterThan(0, "client must be told how many seconds to wait");
    }

    // ── AC 16 + 17: Resend available after lock; countdown in response ────────

    [Test]
    public async Task Resend_Succeeds_WhenLockPeriodHasPassed()
    {
        var sessionId = await RequestEmailSessionAsync();
        UnlockResend(sessionId);

        var result = (OkObjectResult)await _controller.Resend(
            new OtpController.OtpResendDto { SessionId = sessionId });

        OtpControllerTestHarness.Get<bool>(result.Value, "ok").Should().BeTrue();
    }

    [Test]
    public async Task Resend_Response_IncludesResendAvailableInSeconds_ForNextCountdown()
    {
        var sessionId = await RequestEmailSessionAsync();
        UnlockResend(sessionId);

        var result = (OkObjectResult)await _controller.Resend(
            new OtpController.OtpResendDto { SessionId = sessionId });

        OtpControllerTestHarness.Get<int>(result.Value, "resendAvailableInSeconds")
            .Should().Be(60, "after a successful resend the next lock must also be 60 seconds");
    }

    [Test]
    public async Task Resend_Response_IncludesMaxResends_ForClientTimer()
    {
        var sessionId = await RequestEmailSessionAsync();
        UnlockResend(sessionId);

        var result = (OkObjectResult)await _controller.Resend(
            new OtpController.OtpResendDto { SessionId = sessionId });

        OtpControllerTestHarness.Get<int>(result.Value, "maxResends")
            .Should().Be(3, "client needs maxResends to render the resend attempt counter");
    }

    // ── AC 19: Maximum 3 resend attempts ─────────────────────────────────────

    [Test]
    public async Task Resend_IncreasesResendCount_OnEachSuccessfulResend()
    {
        var sessionId = await RequestEmailSessionAsync();

        for (var i = 1; i <= 3; i++)
        {
            UnlockResend(sessionId);
            var r = (OkObjectResult)await _controller.Resend(
                new OtpController.OtpResendDto { SessionId = sessionId });

            OtpControllerTestHarness.Get<bool>(r.Value, "ok").Should().BeTrue();
            OtpControllerTestHarness.Get<int>(r.Value,  "resendCount")
                .Should().Be(i, $"resend #{i} must report resendCount = {i}");
        }
    }

    [Test]
    public async Task Resend_ReturnsNotFound_ForUnknownSessionId()
    {
        var result = await _controller.Resend(new OtpController.OtpResendDto
        {
            SessionId = Guid.NewGuid().ToString("N")
        });

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ── AC 20: Cooldown of 15 minutes after max resends ──────────────────────

    [Test]
    public async Task Resend_AppliesCooldown_WhenMaxResendsIsReached()
    {
        var sessionId = await RequestEmailSessionAsync();

        // Pre-set ResendCount to MAX so the very next call triggers cooldown
        OtpControllerTestHarness.SetStoredField(sessionId, "ResendCount", 3);
        UnlockResend(sessionId);

        var result = (OkObjectResult)await _controller.Resend(
            new OtpController.OtpResendDto { SessionId = sessionId });

        OtpControllerTestHarness.Get<bool>(result.Value, "ok").Should().BeFalse();
        OtpControllerTestHarness.Get<bool>(result.Value, "cooldown").Should().BeTrue();
        OtpControllerTestHarness.Get<int>(result.Value,  "waitSeconds")
            .Should().Be(900, "cooldown after max resends must be 15 minutes = 900 seconds");
    }

    [Test]
    public async Task Resend_ReturnsError_WhileCooldownIsActive()
    {
        var sessionId = await RequestEmailSessionAsync();

        // Simulate an active 15-minute cooldown
        OtpControllerTestHarness.SetStoredField(sessionId, "CooldownUntil",
            DateTime.UtcNow.AddMinutes(15));

        var result = (OkObjectResult)await _controller.Resend(
            new OtpController.OtpResendDto { SessionId = sessionId });

        OtpControllerTestHarness.Get<bool>(result.Value, "ok").Should().BeFalse();
        OtpControllerTestHarness.Get<bool>(result.Value, "cooldown").Should().BeTrue();
        OtpControllerTestHarness.Get<int>(result.Value,  "waitSeconds").Should().BeGreaterThan(0);
    }

    // ── AC 21: New OTP invalidates previous OTP ──────────────────────────────

    [Test]
    public async Task Resend_ReplacesCodeHash_InvalidatingThePreviousOtp()
    {
        var sessionId    = await RequestEmailSessionAsync();
        var originalHash = OtpControllerTestHarness.ReadStoredField<string>(sessionId, "CodeHash");

        UnlockResend(sessionId);
        await _controller.Resend(new OtpController.OtpResendDto { SessionId = sessionId });

        var newHash = OtpControllerTestHarness.ReadStoredField<string>(sessionId, "CodeHash");
        newHash.Should().NotBe(originalHash,
            "a resent OTP must have a new hash — the old code must no longer be valid");
    }

    [Test]
    public async Task Resend_ResetsVerifyAttempts_ToZero_SoUserGetsFullRetryAllowance()
    {
        var sessionId = await RequestEmailSessionAsync();

        // Simulate 3 wrong verify attempts
        OtpControllerTestHarness.SetStoredField(sessionId, "VerifyAttempts", 3);

        UnlockResend(sessionId);
        await _controller.Resend(new OtpController.OtpResendDto { SessionId = sessionId });

        OtpControllerTestHarness.ReadStoredField<int>(sessionId, "VerifyAttempts")
            .Should().Be(0, "resending a new OTP must reset the verify-attempt counter to 0");
    }

    // ── AC 22: Resend counter resets after cooldown expires ──────────────────

    [Test]
    public async Task Resend_ResetsResendCounter_WhenExpiredCooldownIsDetected()
    {
        var sessionId = await RequestEmailSessionAsync();

        // Simulate a past cooldown with a maxed-out counter
        OtpControllerTestHarness.SetStoredField(sessionId, "ResendCount",  3);
        OtpControllerTestHarness.SetStoredField(sessionId, "CooldownUntil",
            DateTime.UtcNow.AddSeconds(-1)); // expired cooldown
        UnlockResend(sessionId);

        var result = (OkObjectResult)await _controller.Resend(
            new OtpController.OtpResendDto { SessionId = sessionId });

        // Cooldown expired → ResendCount reset to 0 → resend proceeds
        OtpControllerTestHarness.Get<bool>(result.Value, "ok").Should().BeTrue(
            "after the cooldown expires the resend counter must reset and resend must succeed");
        OtpControllerTestHarness.Get<int>(result.Value, "resendCount")
            .Should().Be(1, "first resend after a reset cooldown should show count = 1");
    }
}
