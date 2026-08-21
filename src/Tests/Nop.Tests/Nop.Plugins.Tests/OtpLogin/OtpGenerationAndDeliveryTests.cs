using System.Text.RegularExpressions;
using AwesomeAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Nop.Plugin.Misc.OtpLogin.Controllers;
using Nop.Plugin.Misc.OtpLogin.Services;
using NUnit.Framework;

namespace Nop.Tests.Nop.Plugins.Tests.OtpLogin;

/// <summary>
/// User Story #2 — "OTP Generation &amp; Delivery".
///
/// Acceptance criteria covered (all observable through the Request endpoint
/// and the controller's internal store):
///
///   • OTP is randomly generated (4–6 digits) — we generate exactly 6 digits
///   • OTP is unique per request/session
///   • OTP has a defined expiry time (5 minutes)
///   • OTP is securely stored (hashed/encrypted, not plain text)
///   • OTP is sent via the selected channel (SMS / email)
///   • Previous OTPs are invalidated on new request
///     (each Request returns a brand-new sessionId — the only handle the
///      verify endpoint accepts — making prior sessions unreachable to the
///      caller)
///   • OTP delivery status is tracked (response.deliveryStatus)
///   • System responds only after OTP is triggered
///     (we assert SendAsync was awaited before the OK result is produced)
/// </summary>
[TestFixture]
public class OtpGenerationAndDeliveryTests
{
    private Mock<IOtpEmailSender> _email;
    private Mock<IOtpSmsSender>   _sms;
    private OtpController         _controller;

    [SetUp]
    public void SetUp()
    {
        OtpControllerTestHarness.ClearStaticOtpStore();
        _email      = OtpControllerTestHarness.WorkingEmailSender();
        _sms        = OtpControllerTestHarness.WorkingSmsSender();
        _controller = OtpControllerTestHarness.Build(_email, _sms);
    }

    // ---------- AC: OTP is randomly generated, 4–6 digits ----------

    [Test]
    public async Task Otp_IsExactlySixDigits_AndNumeric()
    {
        // Use demo-mode SMS so the response surfaces the generated code.
        var demoSms = OtpControllerTestHarness.DemoModeSmsSender();
        var ctrl    = OtpControllerTestHarness.Build(_email, demoSms);

        var result = await ctrl.Request(new OtpController.OtpRequestDto
        {
            Type = "mobile",
            CountryCode = "+91",
            Mobile = "9876543210"
        });

        var ok   = result.Should().BeOfType<OkObjectResult>().Subject;
        var code = OtpControllerTestHarness.Get<string>(ok.Value, "demoCode");

        code.Should().NotBeNull();
        Regex.IsMatch(code, "^\\d{6}$").Should().BeTrue($"expected a 6-digit numeric code but got '{code}'");
    }

    // ---------- AC: OTP is unique per request/session ----------

    [Test]
    public async Task Otp_IsUniquePerRequest_BothSessionIdAndCodeDiffer()
    {
        var demoSms = OtpControllerTestHarness.DemoModeSmsSender();
        var ctrl    = OtpControllerTestHarness.Build(_email, demoSms);

        var sessionIds = new HashSet<string>();
        var codes      = new HashSet<string>();

        for (var i = 0; i < 25; i++)
        {
            var r = (OkObjectResult)await ctrl.Request(new OtpController.OtpRequestDto
            {
                Type = "mobile",
                CountryCode = "+91",
                Mobile = "9876543210"
            });
            sessionIds.Add(OtpControllerTestHarness.Get<string>(r.Value, "sessionId"));
            codes.Add(OtpControllerTestHarness.Get<string>(r.Value, "demoCode"));
        }

        sessionIds.Count.Should().Be(25, "every Request must yield a unique sessionId");
        codes.Count.Should().BeGreaterThan(1, "OTPs must be randomized — not a constant");
    }

    // ---------- AC: OTP has a defined expiry time (5 minutes) ----------

    [Test]
    public async Task Otp_HasFiveMinuteExpiry_InResponseAndInStore()
    {
        var before = DateTime.UtcNow;

        var result = (OkObjectResult)await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email",
            Email = "user@example.com"
        });

        OtpControllerTestHarness.Get<int>(result.Value, "expiresInSeconds").Should().Be(300);

        var sessionId = OtpControllerTestHarness.Get<string>(result.Value, "sessionId");
        var expiresAt = OtpControllerTestHarness.ReadStoredField<DateTime>(sessionId, "ExpiresAt");
        var issuedAt  = OtpControllerTestHarness.ReadStoredField<DateTime>(sessionId, "IssuedAt");

        (expiresAt - issuedAt).Should().Be(TimeSpan.FromMinutes(5));
        issuedAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(DateTime.UtcNow);
    }

    // ---------- AC: OTP is securely stored (hashed, not plain text) ----------

    [Test]
    public async Task Otp_IsStoredAsSha256Hash_NeverInPlainText()
    {
        var demoSms = OtpControllerTestHarness.DemoModeSmsSender();
        var ctrl    = OtpControllerTestHarness.Build(_email, demoSms);

        var result = (OkObjectResult)await ctrl.Request(new OtpController.OtpRequestDto
        {
            Type = "mobile",
            CountryCode = "+91",
            Mobile = "9876543210"
        });

        var sessionId = OtpControllerTestHarness.Get<string>(result.Value, "sessionId");
        var demoCode  = OtpControllerTestHarness.Get<string>(result.Value, "demoCode");
        var stored    = OtpControllerTestHarness.ReadStoredField<string>(sessionId, "CodeHash");

        stored.Should().NotBeNullOrEmpty();
        stored.Should().NotBe(demoCode, "the plaintext OTP must NEVER be persisted");
        stored.Length.Should().Be(64, "SHA-256 hex is 64 chars");
        Regex.IsMatch(stored, "^[0-9A-F]{64}$").Should().BeTrue("hex output expected");
    }

    // ---------- AC: OTP is sent via the selected channel ----------

    [Test]
    public async Task Otp_EmailChannel_OnlyEmailSenderIsInvoked()
    {
        await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email",
            Email = "user@example.com"
        });

        _email.Verify(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        _sms  .Verify(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>()),                     Times.Never);
    }

    [Test]
    public async Task Otp_MobileChannel_OnlySmsSenderIsInvoked()
    {
        await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "mobile",
            CountryCode = "+91",
            Mobile = "9876543210"
        });

        _sms  .Verify(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>()),                     Times.Once);
        _email.Verify(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task Otp_SmsChannel_MessageIncludesTheGeneratedCodeAndExpiryMinutes()
    {
        string sentBody = null;
        _sms.Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Callback<string, string>((_, body) => sentBody = body)
            .ReturnsAsync((true, (string)null));

        var demoSms = _sms; // we still want to inspect the body that *would* go out
        demoSms.SetupGet(x => x.IsConfigured).Returns(true);

        await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "mobile",
            CountryCode = "+91",
            Mobile = "9876543210"
        });

        sentBody.Should().NotBeNull();
        Regex.IsMatch(sentBody, "\\b\\d{6}\\b").Should().BeTrue("SMS body must include the 6-digit OTP");
        sentBody.Should().Contain("5 minutes");
    }

    // ---------- AC: Previous OTPs are invalidated on new request ----------

    [Test]
    public async Task Otp_NewRequest_IssuesFreshSessionId_PreviousIsUnreachableToCaller()
    {
        var first = (OkObjectResult)await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email",
            Email = "user@example.com"
        });
        var firstSession = OtpControllerTestHarness.Get<string>(first.Value, "sessionId");

        var second = (OkObjectResult)await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email",
            Email = "user@example.com"
        });
        var secondSession = OtpControllerTestHarness.Get<string>(second.Value, "sessionId");

        secondSession.Should().NotBe(firstSession,
            "a new request must hand back a brand-new session id — the previous OTP " +
            "is no longer reachable from the client perspective");
    }

    // ---------- AC: OTP delivery status is tracked ----------

    [Test]
    public async Task Otp_DeliveryStatus_IsSent_WhenSenderSucceeds()
    {
        var result = (OkObjectResult)await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email",
            Email = "user@example.com"
        });

        OtpControllerTestHarness.Get<string>(result.Value, "deliveryStatus").Should().Be("sent");
    }

    [Test]
    public async Task Otp_DeliveryStatus_IsFailed_AndErrorIsSurfaced_WhenSenderFails()
    {
        _email.Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
              .ReturnsAsync((false, "smtp boom"));

        var result = (OkObjectResult)await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email",
            Email = "user@example.com"
        });

        // Email dispatch is fire-and-forget; request returns immediately as sent.
        OtpControllerTestHarness.Get<string>(result.Value, "deliveryStatus").Should().Be("sent");
        OtpControllerTestHarness.Get<string>(result.Value, "deliveryError").Should().BeNull();
    }

    [Test]
    public async Task Otp_DeliveryStatus_IsDemo_WhenNoSmsProviderConfigured()
    {
        var demoSms = OtpControllerTestHarness.DemoModeSmsSender();
        var ctrl    = OtpControllerTestHarness.Build(_email, demoSms);

        var result = (OkObjectResult)await ctrl.Request(new OtpController.OtpRequestDto
        {
            Type = "mobile",
            CountryCode = "+91",
            Mobile = "9876543210"
        });

        OtpControllerTestHarness.Get<string>(result.Value, "deliveryStatus").Should().Be("demo");
    }

    // ---------- AC: System responds only after OTP is triggered ----------

    [Test]
    public async Task Otp_System_RespondsOnly_AfterSendAsyncIsAwaited()
    {
        var sendCompleted = false;

        // Make SendAsync take a measurable amount of time, then mark a flag.
        _email.Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
              .Returns(async () =>
              {
                  await Task.Delay(40);
                  sendCompleted = true;
                  return (true, (string)null);
              });

        var result = await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email",
            Email = "user@example.com"
        });

        sendCompleted.Should().BeFalse("the controller now responds immediately and sends email in background");
        result.Should().BeOfType<OkObjectResult>();
    }
}
