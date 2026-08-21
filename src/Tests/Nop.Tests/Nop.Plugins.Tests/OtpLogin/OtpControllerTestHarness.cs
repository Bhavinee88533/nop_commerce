using System.Collections;
using System.Reflection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Nop.Core;
using Nop.Core.Domain.Customers;
using Nop.Core.Domain.Messages;
using Nop.Plugin.Misc.OtpLogin.Controllers;
using Nop.Plugin.Misc.OtpLogin.Services;
using Nop.Services.Authentication;
using Nop.Services.Customers;
using Nop.Services.Messages;
using Nop.Services.Configuration;

namespace Nop.Tests.Nop.Plugins.Tests.OtpLogin;

/// <summary>
/// Builds an <see cref="OtpController"/> wired to mocks suitable for testing
/// the public <c>Request</c> endpoint without touching SMTP / SMS networks.
///
/// All ambient dependencies that the Request flow doesn't exercise are
/// provided as <see cref="Mock.Of{T}"/> stubs. Email and SMS senders are
/// surfaced so each test can configure success/failure/demo modes.
/// </summary>
internal static class OtpControllerTestHarness
{
    private static ISettingService BuildSettingServiceMock()
    {
        var mock = new Mock<ISettingService>();
        mock.Setup(s => s.LoadSettingAsync<LoginSettings>(It.IsAny<int>()))
            .ReturnsAsync(new LoginSettings());
        return mock.Object;
    }

    public static OtpController Build(
        Mock<IOtpEmailSender> emailSender,
        Mock<IOtpSmsSender> smsSender)
    {
        return new OtpController(
            emailAccountService: Mock.Of<IEmailAccountService>(),
            emailSender: Mock.Of<IEmailSender>(),
            queuedEmailService: Mock.Of<IQueuedEmailService>(),
            emailAccountSettings: new EmailAccountSettings(),
            customerService: Mock.Of<ICustomerService>(),
            customerRegistrationService: Mock.Of<ICustomerRegistrationService>(),
            authenticationService: Mock.Of<IAuthenticationService>(),
            storeContext: Mock.Of<IStoreContext>(),
            customerSettings: new CustomerSettings(),
            otpEmailSender: emailSender.Object,
            otpSmsSender: smsSender.Object,
            logger: NullLogger<OtpController>.Instance,
            settingService: BuildSettingServiceMock());
    }

    /// <summary>
    /// Convenience: builds an email sender mock that reports configured and
    /// returns success on SendAsync.
    /// </summary>
    public static Mock<IOtpEmailSender> WorkingEmailSender()
    {
        var m = new Mock<IOtpEmailSender>();
        m.SetupGet(x => x.IsConfigured).Returns(true);
        m.Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((true, (string)null));
        return m;
    }

    /// <summary>
    /// Convenience: builds an SMS sender mock that reports configured and
    /// returns success on SendAsync.
    /// </summary>
    public static Mock<IOtpSmsSender> WorkingSmsSender()
    {
        var m = new Mock<IOtpSmsSender>();
        m.SetupGet(x => x.IsConfigured).Returns(true);
        m.Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((true, (string)null));
        return m;
    }

    /// <summary>An SMS sender that is NOT configured (triggers demo mode).</summary>
    public static Mock<IOtpSmsSender> DemoModeSmsSender()
    {
        var m = new Mock<IOtpSmsSender>();
        m.SetupGet(x => x.IsConfigured).Returns(false);
        return m;
    }

    /// <summary>Reads a property from the anonymous response object via reflection.</summary>
    public static T Get<T>(object anon, string propertyName)
    {
        var prop = anon.GetType().GetProperty(propertyName)
            ?? throw new InvalidOperationException($"Property '{propertyName}' not found on response.");
        return (T)prop.GetValue(anon);
    }

    /// <summary>
    /// Clears the static in-process OTP store between tests so sessionId/code
    /// uniqueness checks remain deterministic.
    /// </summary>
    public static void ClearStaticOtpStore()
    {
        var field = typeof(OtpController).GetField("_store",
            BindingFlags.NonPublic | BindingFlags.Static)!;
        ((IDictionary)field.GetValue(null)!).Clear();
    }

    /// <summary>
    /// Reads the internal OtpRecord stored for a given sessionId via reflection
    /// and returns the value of one of its private/internal fields.
    /// </summary>
    public static T ReadStoredField<T>(string sessionId, string fieldName)
    {
        var storeField = typeof(OtpController).GetField("_store",
            BindingFlags.NonPublic | BindingFlags.Static)!;
        var dict = (IDictionary)storeField.GetValue(null)!;
        var record = dict[sessionId]
            ?? throw new InvalidOperationException($"No OTP record stored for session '{sessionId}'.");
        var prop = record.GetType().GetProperty(fieldName,
            BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
            ?? throw new InvalidOperationException($"Field '{fieldName}' not found on OtpRecord.");
        return (T)prop.GetValue(record);
    }

    /// <summary>Writes a property value onto the stored OtpRecord for a given sessionId.</summary>
    public static void SetStoredField<T>(string sessionId, string fieldName, T value)
    {
        var storeField = typeof(OtpController).GetField("_store",
            BindingFlags.NonPublic | BindingFlags.Static)!;
        var dict = (IDictionary)storeField.GetValue(null)!;
        var record = dict[sessionId]
            ?? throw new InvalidOperationException($"No OTP record for session '{sessionId}'.");
        var prop = record.GetType().GetProperty(fieldName,
            BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
            ?? throw new InvalidOperationException($"Property '{fieldName}' not found on OtpRecord.");
        prop.SetValue(record, value);
    }

    /// <summary>Returns whether an OTP session exists in the in-process store.</summary>
    public static bool SessionExists(string sessionId)
    {
        var storeField = typeof(OtpController).GetField("_store",
            BindingFlags.NonPublic | BindingFlags.Static)!;
        return ((IDictionary)storeField.GetValue(null)!).Contains(sessionId);
    }

    /// <summary>
    /// Email sender that IS configured but reports send failure.
    /// This causes the controller to surface <c>demoCode</c> in the response,
    /// allowing tests to obtain the plaintext OTP without real SMTP.
    /// </summary>
    public static Mock<IOtpEmailSender> FailingEmailSender()
    {
        var m = new Mock<IOtpEmailSender>();
        m.SetupGet(x => x.IsConfigured).Returns(true);
        m.Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((false, "smtp-test-error"));
        return m;
    }

    /// <summary>
    /// Builds a controller with injectable <see cref="ICustomerService"/> and
    /// <see cref="IAuthenticationService"/> mocks for Verify / sign-in tests.
    /// </summary>
    public static OtpController BuildFull(
        Mock<IOtpEmailSender> emailSender,
        Mock<IOtpSmsSender> smsSender,
        Mock<ICustomerService> customerService = null,
        Mock<IAuthenticationService> authService = null)
    {
        return new OtpController(
            emailAccountService: Mock.Of<IEmailAccountService>(),
            emailSender: Mock.Of<IEmailSender>(),
            queuedEmailService: Mock.Of<IQueuedEmailService>(),
            emailAccountSettings: new EmailAccountSettings(),
            customerService: (customerService ?? new Mock<ICustomerService>()).Object,
            customerRegistrationService: Mock.Of<ICustomerRegistrationService>(),
            authenticationService: (authService ?? new Mock<IAuthenticationService>()).Object,
            storeContext: Mock.Of<IStoreContext>(),
            customerSettings: new CustomerSettings(),
            otpEmailSender: emailSender.Object,
            otpSmsSender: smsSender.Object,
            logger: NullLogger<OtpController>.Instance,
            settingService: BuildSettingServiceMock());
    }
    public static void ClearPendingRegistrations()
    {
        var field = typeof(OtpController).GetField("_pendingRegistrations",
            BindingFlags.NonPublic | BindingFlags.Static)!;
        ((IDictionary)field.GetValue(null)!).Clear();
    }
}
