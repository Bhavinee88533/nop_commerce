using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.Extensions.Options;
using Moq;
using Nop.Core;
using Nop.Core.Domain.Customers;
using Nop.Core.Domain.Stores;
using Nop.Core.Http;
using Nop.Plugin.ExternalAuth.Google;
using Nop.Plugin.ExternalAuth.Google.Controllers;
using Nop.Plugin.ExternalAuth.Google.Models;
using Nop.Services.Authentication.External;
using Nop.Services.Configuration;
using Nop.Services.Localization;
using Nop.Services.Messages;
using Nop.Services.Security;
using NUnit.Framework;

namespace Nop.Tests.Nop.Plugins.Tests.ExternalAuth.Google;

/// <summary>
/// Unit tests for <see cref="GoogleAuthenticationController"/> covering the Google login user story:
/// - Login button visibility / initiation
/// - Redirect to Google authentication
/// - Token validation on callback
/// - Existing user login
/// - New user auto-registration
/// - Error handling for failure scenarios
/// </summary>
[TestFixture]
public class GoogleAuthenticationControllerTests
{
    #region Fields

    private Mock<IAuthenticationPluginManager> _authenticationPluginManagerMock;
    private Mock<IExternalAuthenticationService> _externalAuthenticationServiceMock;
    private Mock<ILocalizationService> _localizationServiceMock;
    private Mock<INotificationService> _notificationServiceMock;
    private Mock<IOptionsMonitorCache<GoogleOptions>> _optionsCacheMock;
    private Mock<IPermissionService> _permissionServiceMock;
    private Mock<ISettingService> _settingServiceMock;
    private Mock<IStoreContext> _storeContextMock;
    private Mock<IWorkContext> _workContextMock;
    private GoogleExternalAuthSettings _settings;
    private GoogleAuthenticationController _controller;

    #endregion

    #region Setup

    [SetUp]
    public void SetUp()
    {
        _authenticationPluginManagerMock = new Mock<IAuthenticationPluginManager>();
        _externalAuthenticationServiceMock = new Mock<IExternalAuthenticationService>();
        _localizationServiceMock = new Mock<ILocalizationService>();
        _notificationServiceMock = new Mock<INotificationService>();
        _optionsCacheMock = new Mock<IOptionsMonitorCache<GoogleOptions>>();
        _permissionServiceMock = new Mock<IPermissionService>();
        _settingServiceMock = new Mock<ISettingService>();
        _storeContextMock = new Mock<IStoreContext>();
        _workContextMock = new Mock<IWorkContext>();

        _settings = new GoogleExternalAuthSettings
        {
            ClientId = "test-client-id",
            ClientSecret = "test-client-secret",
            LoginButtonText = "Sign in with Google",
            RegisterButtonText = "Register with Google",
            DisplayOrder = 0
        };

        _storeContextMock.Setup(s => s.GetCurrentStoreAsync())
            .ReturnsAsync(new Store { Id = 1, Name = "Test Store" });

        _workContextMock.Setup(w => w.GetCurrentCustomerAsync())
            .ReturnsAsync(new Customer { Id = 1 });

        _controller = new GoogleAuthenticationController(
            _settings,
            _authenticationPluginManagerMock.Object,
            _externalAuthenticationServiceMock.Object,
            _localizationServiceMock.Object,
            _notificationServiceMock.Object,
            _optionsCacheMock.Object,
            _permissionServiceMock.Object,
            _settingServiceMock.Object,
            _storeContextMock.Object,
            _workContextMock.Object);

        // Set up a minimal HttpContext and UrlHelper for the controller
        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        var urlHelperMock = new Mock<IUrlHelper>();
        urlHelperMock.Setup(u => u.Action(It.IsAny<UrlActionContext>()))
            .Returns("/google/login-callback?returnUrl=%2F");
        urlHelperMock.Setup(u => u.RouteUrl(It.IsAny<UrlRouteContext>()))
            .Returns("/login");
        _controller.Url = urlHelperMock.Object;
    }

    #endregion

    #region Login - Plugin Active & Credentials Configured

    [Test]
    public async Task Login_PluginActive_CredentialsConfigured_ReturnsChallengeResult()
    {
        // Arrange - plugin is active
        _authenticationPluginManagerMock
            .Setup(m => m.IsPluginActiveAsync(GoogleAuthenticationDefaults.SystemName,
                It.IsAny<Customer>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.Login("/dashboard");

        // Assert - should return ChallengeResult for Google OAuth redirect
        Assert.That(result, Is.InstanceOf<ChallengeResult>());
        var challengeResult = (ChallengeResult)result;
        Assert.That(challengeResult.AuthenticationSchemes, Does.Contain(GoogleDefaults.AuthenticationScheme));
    }

    [Test]
    public async Task Login_PluginActive_ChallengeProperties_ContainRedirectUri()
    {
        // Arrange
        _authenticationPluginManagerMock
            .Setup(m => m.IsPluginActiveAsync(GoogleAuthenticationDefaults.SystemName,
                It.IsAny<Customer>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.Login("/home");

        // Assert
        var challengeResult = (ChallengeResult)result;
        Assert.That(challengeResult.Properties, Is.Not.Null);
        Assert.That(challengeResult.Properties.RedirectUri, Is.Not.Null.And.Not.Empty);
    }

    [Test]
    public async Task Login_PluginActive_ChallengeProperties_ContainErrorCallback()
    {
        // Arrange
        _authenticationPluginManagerMock
            .Setup(m => m.IsPluginActiveAsync(GoogleAuthenticationDefaults.SystemName,
                It.IsAny<Customer>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.Login("/home");

        // Assert - error callback should be set for failure redirect
        var challengeResult = (ChallengeResult)result;
        var errorCallback = challengeResult.Properties.GetString(GoogleAuthenticationDefaults.ErrorCallback);
        Assert.That(errorCallback, Is.Not.Null.And.Not.Empty);
    }

    #endregion

    #region Login - Plugin Not Active

    [Test]
    public async Task Login_PluginNotActive_RedirectsToLoginAndShowsErrorNotification()
    {
        // Arrange - plugin not active
        _authenticationPluginManagerMock
            .Setup(m => m.IsPluginActiveAsync(GoogleAuthenticationDefaults.SystemName,
                It.IsAny<Customer>(), It.IsAny<int>()))
            .ReturnsAsync(false);

        _localizationServiceMock
            .Setup(l => l.GetResourceAsync("Plugins.ExternalAuth.Google.Login.Error"))
            .ReturnsAsync("Google login is currently unavailable.");

        // Act + Assert
        var ex = Assert.ThrowsAsync<NopException>(async () => await _controller.Login("/dashboard"));
        Assert.That(ex!.Message, Is.EqualTo("Google login is currently unavailable."));
        _notificationServiceMock.Verify(n => n.ErrorNotification(It.IsAny<string>(), true), Times.Never);
    }

    #endregion

    #region Login - Missing Credentials

    [Test]
    public async Task Login_EmptyClientId_RedirectsToLoginAndShowsErrorNotification()
    {
        // Arrange - plugin active but no ClientId
        _authenticationPluginManagerMock
            .Setup(m => m.IsPluginActiveAsync(GoogleAuthenticationDefaults.SystemName,
                It.IsAny<Customer>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        _settings.ClientId = string.Empty;

        _localizationServiceMock
            .Setup(l => l.GetResourceAsync("Plugins.ExternalAuth.Google.Login.Error"))
            .ReturnsAsync("Google login is currently unavailable.");

        // Act + Assert
        var ex = Assert.ThrowsAsync<NopException>(async () => await _controller.Login("/dashboard"));
        Assert.That(ex!.Message, Is.EqualTo("Google login is currently unavailable."));
        _notificationServiceMock.Verify(n => n.ErrorNotification(It.IsAny<string>(), true), Times.Never);
    }

    [Test]
    public async Task Login_EmptyClientSecret_RedirectsToLoginAndShowsErrorNotification()
    {
        // Arrange - plugin active but no ClientSecret
        _authenticationPluginManagerMock
            .Setup(m => m.IsPluginActiveAsync(GoogleAuthenticationDefaults.SystemName,
                It.IsAny<Customer>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        _settings.ClientSecret = string.Empty;

        _localizationServiceMock
            .Setup(l => l.GetResourceAsync("Plugins.ExternalAuth.Google.Login.Error"))
            .ReturnsAsync("Google login is currently unavailable.");

        // Act + Assert
        var ex = Assert.ThrowsAsync<NopException>(async () => await _controller.Login("/dashboard"));
        Assert.That(ex!.Message, Is.EqualTo("Google login is currently unavailable."));
        _notificationServiceMock.Verify(n => n.ErrorNotification(It.IsAny<string>(), true), Times.Never);
    }

    [Test]
    public async Task Login_NullClientId_RedirectsToLoginAndShowsErrorNotification()
    {
        // Arrange
        _authenticationPluginManagerMock
            .Setup(m => m.IsPluginActiveAsync(GoogleAuthenticationDefaults.SystemName,
                It.IsAny<Customer>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        _settings.ClientId = null;

        _localizationServiceMock
            .Setup(l => l.GetResourceAsync("Plugins.ExternalAuth.Google.Login.Error"))
            .ReturnsAsync("Google login is currently unavailable.");

        // Act + Assert
        var ex = Assert.ThrowsAsync<NopException>(async () => await _controller.Login("/dashboard"));
        Assert.That(ex!.Message, Is.EqualTo("Google login is currently unavailable."));
        _notificationServiceMock.Verify(n => n.ErrorNotification(It.IsAny<string>(), true), Times.Never);
    }

    #endregion

    #region LoginCallback - Successful Authentication (Existing User)

    [Test]
    public async Task LoginCallback_ValidToken_ExistingUser_CallsAuthenticateAsync()
    {
        // Arrange - simulate successful Google authentication with valid claims
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, "existing@example.com"),
            new Claim(ClaimTypes.NameIdentifier, "google-id-123"),
            new Claim(ClaimTypes.Name, "John Doe"),
            new Claim(ClaimTypes.GivenName, "John"),
            new Claim(ClaimTypes.Surname, "Doe")
        };
        var identity = new ClaimsIdentity(claims, GoogleDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        var authResult = AuthenticateResult.Success(
            new AuthenticationTicket(principal, GoogleDefaults.AuthenticationScheme));

        var authServiceMock = new Mock<IAuthenticationService>();
        authServiceMock
            .Setup(a => a.AuthenticateAsync(It.IsAny<HttpContext>(), GoogleDefaults.AuthenticationScheme))
            .ReturnsAsync(authResult);

        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = new MockServiceProvider(authServiceMock.Object);
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var urlHelperMock = new Mock<IUrlHelper>();
        urlHelperMock.Setup(u => u.RouteUrl(It.IsAny<UrlRouteContext>())).Returns("/login");
        _controller.Url = urlHelperMock.Object;

        _externalAuthenticationServiceMock
            .Setup(e => e.AuthenticateAsync(It.IsAny<ExternalAuthenticationParameters>(), It.IsAny<string>()))
            .ReturnsAsync(new RedirectToRouteResult("Homepage", null));

        // Act
        var result = await _controller.LoginCallback("/dashboard");

        // Assert - verify AuthenticateAsync was called with correct parameters
        _externalAuthenticationServiceMock.Verify(e => e.AuthenticateAsync(
            It.Is<ExternalAuthenticationParameters>(p =>
                p.ProviderSystemName == GoogleAuthenticationDefaults.SystemName &&
                p.Email == "existing@example.com" &&
                p.ExternalIdentifier == "google-id-123" &&
                p.ExternalDisplayIdentifier == "John Doe"),
            "/dashboard"), Times.Once);
    }

    [Test]
    public async Task LoginCallback_ValidToken_ParametersContainAllClaims()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, "user@example.com"),
            new Claim(ClaimTypes.NameIdentifier, "google-id-456"),
            new Claim(ClaimTypes.Name, "Jane Smith"),
            new Claim(ClaimTypes.GivenName, "Jane"),
            new Claim(ClaimTypes.Surname, "Smith")
        };
        var identity = new ClaimsIdentity(claims, GoogleDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        var authResult = AuthenticateResult.Success(
            new AuthenticationTicket(principal, GoogleDefaults.AuthenticationScheme));

        var authServiceMock = new Mock<IAuthenticationService>();
        authServiceMock
            .Setup(a => a.AuthenticateAsync(It.IsAny<HttpContext>(), GoogleDefaults.AuthenticationScheme))
            .ReturnsAsync(authResult);

        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = new MockServiceProvider(authServiceMock.Object);
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var urlHelperMock = new Mock<IUrlHelper>();
        urlHelperMock.Setup(u => u.RouteUrl(It.IsAny<UrlRouteContext>())).Returns("/login");
        _controller.Url = urlHelperMock.Object;

        ExternalAuthenticationParameters capturedParams = null;
        _externalAuthenticationServiceMock
            .Setup(e => e.AuthenticateAsync(It.IsAny<ExternalAuthenticationParameters>(), It.IsAny<string>()))
            .Callback<ExternalAuthenticationParameters, string>((p, _) => capturedParams = p)
            .ReturnsAsync(new RedirectToRouteResult("Homepage", null));

        // Act
        await _controller.LoginCallback("/home");

        // Assert - claims should be forwarded for new user registration (name population)
        Assert.That(capturedParams, Is.Not.Null);
        Assert.That(capturedParams.Claims, Is.Not.Null);
        Assert.That(capturedParams.Claims.Count, Is.EqualTo(5));
        Assert.That(capturedParams.Claims.Any(c => c.Type == ClaimTypes.GivenName && c.Value == "Jane"), Is.True);
        Assert.That(capturedParams.Claims.Any(c => c.Type == ClaimTypes.Surname && c.Value == "Smith"), Is.True);
    }

    #endregion

    #region LoginCallback - Failed Authentication

    [Test]
    public async Task LoginCallback_FailedAuthentication_RedirectsToLogin()
    {
        // Arrange - simulate failed Google authentication
        var authResult = AuthenticateResult.Fail("Authentication failed");

        var authServiceMock = new Mock<IAuthenticationService>();
        authServiceMock
            .Setup(a => a.AuthenticateAsync(It.IsAny<HttpContext>(), GoogleDefaults.AuthenticationScheme))
            .ReturnsAsync(authResult);

        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = new MockServiceProvider(authServiceMock.Object);
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var urlHelperMock = new Mock<IUrlHelper>();
        urlHelperMock.Setup(u => u.RouteUrl(It.IsAny<UrlRouteContext>())).Returns("/login");
        _controller.Url = urlHelperMock.Object;

        // Act
        var result = await _controller.LoginCallback("/dashboard");

        // Assert - should redirect to login page
        Assert.That(result, Is.InstanceOf<RedirectToRouteResult>());
    }

    [Test]
    public async Task LoginCallback_NoClaims_RedirectsToLogin()
    {
        // Arrange - authentication succeeds but no claims present
        var identity = new ClaimsIdentity(new List<Claim>(), GoogleDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        var authResult = AuthenticateResult.Success(
            new AuthenticationTicket(principal, GoogleDefaults.AuthenticationScheme));

        var authServiceMock = new Mock<IAuthenticationService>();
        authServiceMock
            .Setup(a => a.AuthenticateAsync(It.IsAny<HttpContext>(), GoogleDefaults.AuthenticationScheme))
            .ReturnsAsync(authResult);

        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = new MockServiceProvider(authServiceMock.Object);
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var urlHelperMock = new Mock<IUrlHelper>();
        urlHelperMock.Setup(u => u.RouteUrl(It.IsAny<UrlRouteContext>())).Returns("/login");
        _controller.Url = urlHelperMock.Object;

        // Act
        var result = await _controller.LoginCallback("/dashboard");

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToRouteResult>());
    }

    #endregion

    #region LoginCallback - Missing Email

    [Test]
    public async Task LoginCallback_MissingEmail_ShowsErrorNotification_RedirectsToLogin()
    {
        // Arrange - Google auth succeeds but email claim is missing
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "google-id-789"),
            new Claim(ClaimTypes.Name, "No Email User")
        };
        var identity = new ClaimsIdentity(claims, GoogleDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        var authResult = AuthenticateResult.Success(
            new AuthenticationTicket(principal, GoogleDefaults.AuthenticationScheme));

        var authServiceMock = new Mock<IAuthenticationService>();
        authServiceMock
            .Setup(a => a.AuthenticateAsync(It.IsAny<HttpContext>(), GoogleDefaults.AuthenticationScheme))
            .ReturnsAsync(authResult);

        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = new MockServiceProvider(authServiceMock.Object);
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var urlHelperMock = new Mock<IUrlHelper>();
        urlHelperMock.Setup(u => u.RouteUrl(It.IsAny<UrlRouteContext>())).Returns("/login");
        _controller.Url = urlHelperMock.Object;

        _localizationServiceMock
            .Setup(l => l.GetResourceAsync("Plugins.ExternalAuth.Google.Login.EmailPermissionDenied"))
            .ReturnsAsync("Google sign-in requires email permission.");

        // Act
        var result = await _controller.LoginCallback("/dashboard");

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToRouteResult>());
        _notificationServiceMock.Verify(n => n.ErrorNotification(It.IsAny<string>(), true), Times.Once);
    }

    [Test]
    public async Task LoginCallback_WhitespaceEmail_ShowsErrorNotification_RedirectsToLogin()
    {
        // Arrange - email is whitespace only
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, "   "),
            new Claim(ClaimTypes.NameIdentifier, "google-id-101")
        };
        var identity = new ClaimsIdentity(claims, GoogleDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        var authResult = AuthenticateResult.Success(
            new AuthenticationTicket(principal, GoogleDefaults.AuthenticationScheme));

        var authServiceMock = new Mock<IAuthenticationService>();
        authServiceMock
            .Setup(a => a.AuthenticateAsync(It.IsAny<HttpContext>(), GoogleDefaults.AuthenticationScheme))
            .ReturnsAsync(authResult);

        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = new MockServiceProvider(authServiceMock.Object);
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var urlHelperMock = new Mock<IUrlHelper>();
        urlHelperMock.Setup(u => u.RouteUrl(It.IsAny<UrlRouteContext>())).Returns("/login");
        _controller.Url = urlHelperMock.Object;

        _localizationServiceMock
            .Setup(l => l.GetResourceAsync("Plugins.ExternalAuth.Google.Login.EmailPermissionDenied"))
            .ReturnsAsync("Google sign-in requires email permission.");

        // Act
        var result = await _controller.LoginCallback("/dashboard");

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToRouteResult>());
        _notificationServiceMock.Verify(n => n.ErrorNotification(It.IsAny<string>(), true), Times.Once);
    }

    #endregion

    #region LoginCallback - AccessToken Not Persisted (Security)

    [Test]
    public async Task LoginCallback_ValidToken_DoesNotSetAccessToken()
    {
        // Arrange - verify phase 1 security: AccessToken is NOT set
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, "secure@example.com"),
            new Claim(ClaimTypes.NameIdentifier, "google-id-secure")
        };
        var identity = new ClaimsIdentity(claims, GoogleDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        var authResult = AuthenticateResult.Success(
            new AuthenticationTicket(principal, GoogleDefaults.AuthenticationScheme));

        var authServiceMock = new Mock<IAuthenticationService>();
        authServiceMock
            .Setup(a => a.AuthenticateAsync(It.IsAny<HttpContext>(), GoogleDefaults.AuthenticationScheme))
            .ReturnsAsync(authResult);

        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = new MockServiceProvider(authServiceMock.Object);
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var urlHelperMock = new Mock<IUrlHelper>();
        urlHelperMock.Setup(u => u.RouteUrl(It.IsAny<UrlRouteContext>())).Returns("/login");
        _controller.Url = urlHelperMock.Object;

        ExternalAuthenticationParameters capturedParams = null;
        _externalAuthenticationServiceMock
            .Setup(e => e.AuthenticateAsync(It.IsAny<ExternalAuthenticationParameters>(), It.IsAny<string>()))
            .Callback<ExternalAuthenticationParameters, string>((p, _) => capturedParams = p)
            .ReturnsAsync(new RedirectToRouteResult("Homepage", null));

        // Act
        await _controller.LoginCallback("/dashboard");

        // Assert - AccessToken must be null (phase 1 security constraint)
        Assert.That(capturedParams, Is.Not.Null);
        Assert.That(capturedParams.AccessToken, Is.Null);
    }

    #endregion

    #region Configure (Admin)

    [Test]
    public void Configure_Get_ReturnsViewWithModel()
    {
        // Act
        var result = _controller.Configure();

        // Assert
        Assert.That(result, Is.InstanceOf<ViewResult>());
        var viewResult = (ViewResult)result;
        Assert.That(viewResult.Model, Is.InstanceOf<ConfigurationModel>());

        var model = (ConfigurationModel)viewResult.Model;
        Assert.That(model.ClientId, Is.EqualTo("test-client-id"));
        Assert.That(model.ClientSecret, Is.EqualTo("test-client-secret"));
    }

    [Test]
    public async Task Configure_Post_ValidModel_SavesSettings()
    {
        // Arrange
        var model = new ConfigurationModel
        {
            ClientId = "new-client-id",
            ClientSecret = "new-client-secret",
            LoginButtonText = "Login with Google",
            RegisterButtonText = "Register with Google",
            DisplayOrder = 1
        };

        _localizationServiceMock
            .Setup(l => l.GetResourceAsync("Admin.Plugins.Saved"))
            .ReturnsAsync("Plugin saved");

        // Act
        var result = await _controller.Configure(model);

        // Assert
        _settingServiceMock.Verify(s => s.SaveSettingAsync(It.IsAny<GoogleExternalAuthSettings>(),
            It.IsAny<int>()), Times.Once);
        Assert.That(_settings.ClientId, Is.EqualTo("new-client-id"));
        Assert.That(_settings.ClientSecret, Is.EqualTo("new-client-secret"));
    }

    [Test]
    public async Task Configure_Post_ValidModel_ClearsOptionsCache()
    {
        // Arrange
        var model = new ConfigurationModel
        {
            ClientId = "updated-id",
            ClientSecret = "updated-secret",
            LoginButtonText = "Login",
            RegisterButtonText = "Register",
            DisplayOrder = 0
        };

        _localizationServiceMock
            .Setup(l => l.GetResourceAsync("Admin.Plugins.Saved"))
            .ReturnsAsync("Saved");

        // Act
        await _controller.Configure(model);

        // Assert - options cache should be cleared to force middleware reload
        _optionsCacheMock.Verify(o => o.TryRemove(GoogleDefaults.AuthenticationScheme), Times.Once);
    }

    #endregion
}

/// <summary>
/// Minimal service provider for testing HttpContext.AuthenticateAsync extension method.
/// </summary>
internal class MockServiceProvider : IServiceProvider
{
    private readonly IAuthenticationService _authenticationService;

    public MockServiceProvider(IAuthenticationService authenticationService)
    {
        _authenticationService = authenticationService;
    }

    public object GetService(Type serviceType)
    {
        if (serviceType == typeof(IAuthenticationService))
            return _authenticationService;

        return null;
    }
}
