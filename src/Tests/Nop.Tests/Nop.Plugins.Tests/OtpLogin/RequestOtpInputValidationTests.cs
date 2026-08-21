using AwesomeAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Nop.Plugin.Misc.OtpLogin.Controllers;
using Nop.Plugin.Misc.OtpLogin.Services;
using NUnit.Framework;

namespace Nop.Tests.Nop.Plugins.Tests.OtpLogin;

/// <summary>
/// User Story #1 — "Enter mobile/email and request OTP".
///
/// Covers the server-side acceptance criteria that are testable at the
/// controller layer (UI-only AC such as dropdown rendering / button
/// enabled-state are not in scope of unit tests):
///
///   • Input validation is applied (format, length, structure)
///   • Clear error messages are shown for invalid inputs
///   • On clicking Request OTP, request is sent to the server
///   • User receives confirmation that OTP is sent
///   • User is redirected to OTP verification screen
///     (server returns the sessionId the verify-page route needs)
/// </summary>
[TestFixture]
public class RequestOtpInputValidationTests
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

    // -------- AC: Input validation + clear error messages --------

    [Test]
    public async Task Request_ReturnsBadRequest_WhenDtoIsNull()
    {
        var result = await _controller.Request(null);

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        OtpControllerTestHarness.Get<bool>(bad.Value, "ok").Should().BeFalse();
        OtpControllerTestHarness.Get<string>(bad.Value, "error").Should().Be("Invalid request.");
    }

    [TestCase(null)]
    [TestCase("")]
    [TestCase("   ")]
    public async Task Request_ReturnsBadRequest_WhenTypeIsMissing(string type)
    {
        var result = await _controller.Request(new OtpController.OtpRequestDto { Type = type });

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        OtpControllerTestHarness.Get<string>(bad.Value, "error").Should().Be("Invalid request.");
    }

    [Test]
    public async Task Request_ReturnsBadRequest_WhenTypeIsUnknown()
    {
        var result = await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "telegram",
            Email = "a@b.com"
        });

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        OtpControllerTestHarness.Get<string>(bad.Value, "error").Should().Be("Invalid type.");
    }

    [TestCase(null,           "Invalid email.")]
    [TestCase("",             "Invalid email.")]
    [TestCase("   ",          "Invalid email.")]
    [TestCase("not-an-email", "Invalid email.")] // missing '@'
    public async Task Request_Email_ReturnsBadRequest_WithClearMessage_WhenEmailInvalid(string email, string expectedMsg)
    {
        var result = await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email",
            Email = email
        });

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        OtpControllerTestHarness.Get<bool>(bad.Value, "ok").Should().BeFalse();
        OtpControllerTestHarness.Get<string>(bad.Value, "error").Should().Be(expectedMsg);
    }

    [TestCase(null,  "9876543210")] // missing country code
    [TestCase("",    "9876543210")]
    [TestCase("+91", null)]         // missing mobile
    [TestCase("+91", "")]
    [TestCase("+91", "   ")]
    public async Task Request_Mobile_ReturnsBadRequest_WithClearMessage_WhenInputInvalid(string cc, string mobile)
    {
        var result = await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "mobile",
            CountryCode = cc,
            Mobile = mobile
        });

        var bad = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        OtpControllerTestHarness.Get<bool>(bad.Value, "ok").Should().BeFalse();
        OtpControllerTestHarness.Get<string>(bad.Value, "error").Should().Be("Please enter a valid mobile number.");
    }

    // -------- AC: Confirmation message + verify-screen handoff (sessionId) --------

    [Test]
    public async Task Request_Email_ReturnsOk_WithSessionAndConfirmationMessage_WhenEmailValid()
    {
        var result = await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email",
            Email = "user@example.com"
        });

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        OtpControllerTestHarness.Get<bool>(ok.Value, "ok").Should().BeTrue();

        // Session id is what the client uses to navigate to /otp/verify-page?sid=...
        var sessionId = OtpControllerTestHarness.Get<string>(ok.Value, "sessionId");
        sessionId.Should().NotBeNullOrWhiteSpace();
        sessionId.Length.Should().Be(32, "session id is a Guid.ToString(\"N\")");

        // Confirmation message visible to the user
        var msg = OtpControllerTestHarness.Get<string>(ok.Value, "message");
        msg.Should().StartWith("OTP sent to ").And.Contain("@example.com");

        // The masked destination must NOT leak the full email
        var destination = OtpControllerTestHarness.Get<string>(ok.Value, "destination");
        destination.Should().NotBe("user@example.com").And.Contain("@example.com");
    }

    [Test]
    public async Task Request_Mobile_ReturnsOk_WithSessionAndConfirmationMessage_WhenInputValid()
    {
        var result = await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "mobile",
            CountryCode = "+91",
            Mobile = "9876543210"
        });

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        OtpControllerTestHarness.Get<bool>(ok.Value, "ok").Should().BeTrue();
        OtpControllerTestHarness.Get<string>(ok.Value, "sessionId").Should().NotBeNullOrWhiteSpace();

        var destination = OtpControllerTestHarness.Get<string>(ok.Value, "destination");
        destination.Should().StartWith("+91 ").And.EndWith("3210");
        destination.Should().NotContain("9876543210", "the masked form must not show the full number");
    }

    // -------- AC: "request is sent to the server" — verify the channel was actually invoked --------

    [Test]
    public async Task Request_Email_InvokesEmailSender_OnceWithUserEmail()
    {
        await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "email",
            Email = "alice@corp.io"
        });

        _email.Verify(
            x => x.SendAsync("alice@corp.io", It.IsAny<string>(), It.IsAny<string>()),
            Times.Once);
    }

    [Test]
    public async Task Request_Mobile_InvokesSmsSender_OnceWithE164Number()
    {
        await _controller.Request(new OtpController.OtpRequestDto
        {
            Type = "mobile",
            CountryCode = "+91",
            Mobile = "9876543210"
        });

        _sms.Verify(
            x => x.SendAsync("+919876543210", It.IsAny<string>()),
            Times.Once);
    }
}
