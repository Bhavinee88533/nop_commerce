using Moq;
using Nop.Core;
using Nop.Plugin.ExternalAuth.Google;
using Nop.Plugin.ExternalAuth.Google.Components;
using Nop.Plugin.ExternalAuth.Google.Models;
using Nop.Services.Authentication.External;
using Nop.Services.Configuration;
using Nop.Services.Localization;
using NUnit.Framework;
using System.ComponentModel.DataAnnotations;

namespace Nop.Tests.Nop.Plugins.Tests.ExternalAuth.Google;

/// <summary>
/// Unit tests for <see cref="GoogleAuthenticationMethod"/> (plugin registration),
/// <see cref="GoogleAuthenticationDefaults"/> (constants),
/// <see cref="GoogleExternalAuthSettings"/> (settings model),
/// <see cref="ConfigurationModel"/> (admin view model validation),
/// and <see cref="GoogleAuthenticationViewComponent"/> (login button visibility).
/// </summary>
[TestFixture]
public class GoogleAuthenticationPluginTests
{
    #region GoogleAuthenticationDefaults

    [Test]
    public void SystemName_ReturnsExpectedValue()
    {
        Assert.That(GoogleAuthenticationDefaults.SystemName, Is.EqualTo("ExternalAuth.Google"));
    }

    [Test]
    public void ErrorCallback_ReturnsExpectedValue()
    {
        Assert.That(GoogleAuthenticationDefaults.ErrorCallback, Is.EqualTo("ErrorCallback"));
    }

    [Test]
    public void LoginCallbackRoute_ReturnsExpectedValue()
    {
        Assert.That(GoogleAuthenticationDefaults.LoginCallbackRoute,
            Is.EqualTo("Plugin.ExternalAuth.Google.LoginCallback"));
    }

    #endregion

    #region GoogleExternalAuthSettings

    [Test]
    public void Settings_ImplementsISettings()
    {
        var settings = new GoogleExternalAuthSettings();
        Assert.That(settings, Is.InstanceOf<global::Nop.Core.Configuration.ISettings>());
    }

    [Test]
    public void Settings_DefaultValues_AreNull()
    {
        var settings = new GoogleExternalAuthSettings();

        Assert.Multiple(() =>
        {
            Assert.That(settings.ClientId, Is.Null);
            Assert.That(settings.ClientSecret, Is.Null);
            Assert.That(settings.AdditionalScopes, Is.Null);
            Assert.That(settings.LoginButtonText, Is.Null);
            Assert.That(settings.RegisterButtonText, Is.Null);
            Assert.That(settings.DisplayOrder, Is.EqualTo(0));
        });
    }

    [Test]
    public void Settings_PropertiesCanBeSet()
    {
        var settings = new GoogleExternalAuthSettings
        {
            ClientId = "my-client-id",
            ClientSecret = "my-secret",
            AdditionalScopes = "calendar",
            LoginButtonText = "Sign in",
            RegisterButtonText = "Register",
            DisplayOrder = 5
        };

        Assert.Multiple(() =>
        {
            Assert.That(settings.ClientId, Is.EqualTo("my-client-id"));
            Assert.That(settings.ClientSecret, Is.EqualTo("my-secret"));
            Assert.That(settings.AdditionalScopes, Is.EqualTo("calendar"));
            Assert.That(settings.LoginButtonText, Is.EqualTo("Sign in"));
            Assert.That(settings.RegisterButtonText, Is.EqualTo("Register"));
            Assert.That(settings.DisplayOrder, Is.EqualTo(5));
        });
    }

    #endregion

    #region ConfigurationModel Validation

    [Test]
    public void ConfigurationModel_MissingClientId_FailsValidation()
    {
        var model = new ConfigurationModel
        {
            ClientId = null,
            ClientSecret = "secret"
        };

        var results = ValidateModel(model);
        Assert.That(results.Any(r => r.MemberNames.Contains(nameof(ConfigurationModel.ClientId))), Is.True);
    }

    [Test]
    public void ConfigurationModel_MissingClientSecret_FailsValidation()
    {
        var model = new ConfigurationModel
        {
            ClientId = "client-id",
            ClientSecret = null
        };

        var results = ValidateModel(model);
        Assert.That(results.Any(r => r.MemberNames.Contains(nameof(ConfigurationModel.ClientSecret))), Is.True);
    }

    [Test]
    public void ConfigurationModel_ValidModel_PassesValidation()
    {
        var model = new ConfigurationModel
        {
            ClientId = "valid-client-id",
            ClientSecret = "valid-client-secret",
            LoginButtonText = "Sign in with Google",
            RegisterButtonText = "Register with Google",
            DisplayOrder = 0
        };

        var results = ValidateModel(model);
        Assert.That(results, Is.Empty);
    }

    [Test]
    public void ConfigurationModel_LoginButtonText_ExceedsMaxLength_FailsValidation()
    {
        var model = new ConfigurationModel
        {
            ClientId = "id",
            ClientSecret = "secret",
            LoginButtonText = new string('A', 201) // exceeds 200 char limit
        };

        var results = ValidateModel(model);
        Assert.That(results.Any(r => r.MemberNames.Contains(nameof(ConfigurationModel.LoginButtonText))), Is.True);
    }

    [Test]
    public void ConfigurationModel_RegisterButtonText_ExceedsMaxLength_FailsValidation()
    {
        var model = new ConfigurationModel
        {
            ClientId = "id",
            ClientSecret = "secret",
            RegisterButtonText = new string('B', 201) // exceeds 200 char limit
        };

        var results = ValidateModel(model);
        Assert.That(results.Any(r => r.MemberNames.Contains(nameof(ConfigurationModel.RegisterButtonText))), Is.True);
    }

    #endregion

    #region GoogleAuthenticationMethod

    [Test]
    public void GetPublicViewComponent_ReturnsGoogleAuthenticationViewComponent()
    {
        // Arrange - we can test this without full DI since it only returns a Type
        var method = CreateGoogleAuthenticationMethodWithMocks();

        // Act
        var result = method.GetPublicViewComponent();

        // Assert - verifies "Login with Google" button component is registered
        Assert.That(result, Is.EqualTo(typeof(GoogleAuthenticationViewComponent)));
    }

    #endregion

    #region GoogleAuthenticationRegistrar - Security

    [Test]
    public void Registrar_ImplementsIExternalAuthenticationRegistrar()
    {
        // Verify the registrar can be discovered by nopCommerce's external auth pipeline
        var registrar = new global::Nop.Plugin.ExternalAuth.Google.Infrastructure.GoogleAuthenticationRegistrar();
        Assert.That(registrar, Is.InstanceOf<IExternalAuthenticationRegistrar>());
    }

    #endregion

    #region Helpers

    private static IList<ValidationResult> ValidateModel(object model)
    {
        var results = new List<ValidationResult>();
        var context = new ValidationContext(model);
        Validator.TryValidateObject(model, context, results, validateAllProperties: true);
        return results;
    }

    private static GoogleAuthenticationMethod CreateGoogleAuthenticationMethodWithMocks()
    {
        var localizationServiceMock = new Mock<ILocalizationService>();
        var settingServiceMock = new Mock<ISettingService>();
        var webHelperMock = new Mock<global::Nop.Services.Helpers.IWebHelper>();

        return new GoogleAuthenticationMethod(
            localizationServiceMock.Object,
            settingServiceMock.Object,
            webHelperMock.Object);
    }

    #endregion
}
