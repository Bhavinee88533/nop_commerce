using Microsoft.AspNetCore.Http;
using Nop.Core.Configuration;
using Nop.Core.Domain.Customers;
using Nop.Services.Configuration;

namespace Nop.Services.Customers;

/// <summary>
/// Service to manage login method selection and session persistence
/// </summary>
public partial class LoginMethodService : ILoginMethodService
{
    #region Fields

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ISettingService _settingService;

    #endregion

    #region Ctor

    public LoginMethodService(
        IHttpContextAccessor httpContextAccessor,
        ISettingService settingService)
    {
        _httpContextAccessor = httpContextAccessor;
        _settingService = settingService;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Gets the current login method for the session
    /// Returns the session-stored method if available, otherwise returns the admin-configured default
    /// </summary>
    /// <returns>Login method (OtpEmail or OtpMobile)</returns>
    public virtual async Task<string> GetCurrentLoginMethodAsync()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
            return await GetDefaultLoginMethodAsync();

        // Load settings
        var loginSettings = await _settingService.LoadSettingAsync<LoginSettings>();

        // Check if remember last used method is enabled
        if (loginSettings.RememberLastUsedMethod)
        {
            // Try to get from session
            var sessionMethod = httpContext.Session.GetString(NopCustomerLoginDefaults.SelectedLoginMethodSessionKey);
            if (!string.IsNullOrEmpty(sessionMethod))
                return sessionMethod;
        }

        // Fall back to default
        return await GetDefaultLoginMethodAsync();
    }

    /// <summary>
    /// Sets the login method for the current session
    /// </summary>
    /// <param name="loginMethod">Login method (OtpEmail or OtpMobile)</param>
    public virtual async Task SetCurrentLoginMethodAsync(string loginMethod)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
            return;

        var loginSettings = await _settingService.LoadSettingAsync<LoginSettings>();

        // Only store in session if user is allowed to change and remember is enabled
        if (loginSettings.AllowUserToChangeLoginMethod && loginSettings.RememberLastUsedMethod)
        {
            httpContext.Session.SetString(NopCustomerLoginDefaults.SelectedLoginMethodSessionKey, loginMethod);
        }
    }

    /// <summary>
    /// Gets the admin-configured default login method
    /// </summary>
    /// <returns>Default login method</returns>
    public virtual async Task<string> GetDefaultLoginMethodAsync()
    {
        var loginSettings = await _settingService.LoadSettingAsync<LoginSettings>();
        return loginSettings.DefaultLoginMethod ?? "OtpEmail";
    }

    /// <summary>
    /// Checks if user is allowed to change login method during session
    /// </summary>
    /// <returns>True if allowed, false otherwise</returns>
    public virtual async Task<bool> CanUserChangeLoginMethodAsync()
    {
        var loginSettings = await _settingService.LoadSettingAsync<LoginSettings>();
        return loginSettings.AllowUserToChangeLoginMethod;
    }

    /// <summary>
    /// Clears the login method from session
    /// </summary>
    public virtual void ClearLoginMethod()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext != null)
        {
            httpContext.Session.Remove(NopCustomerLoginDefaults.SelectedLoginMethodSessionKey);
        }
    }

    #endregion
}
