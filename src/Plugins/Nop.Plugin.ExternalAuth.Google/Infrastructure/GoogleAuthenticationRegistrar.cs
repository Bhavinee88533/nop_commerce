using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.Extensions.DependencyInjection;
using Nop.Core.Infrastructure;
using Nop.Services.Authentication.External;

namespace Nop.Plugin.ExternalAuth.Google.Infrastructure;

/// <summary>
/// Registers the Google OAuth 2.0 authentication middleware with ASP.NET Core.
/// Discovered and invoked by the nopCommerce external authentication pipeline at startup.
/// </summary>
public class GoogleAuthenticationRegistrar : IExternalAuthenticationRegistrar
{
    #region Methods

    /// <summary>
    /// Configures the Google authentication middleware.
    /// </summary>
    /// <param name="builder">The ASP.NET Core authentication builder.</param>
    public void Configure(AuthenticationBuilder builder)
    {
        builder.AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
        {
            // Resolve settings at configuration time.
            // EngineContext is required here because DI is not yet fully available at startup.
            var settings = EngineContext.Current.Resolve<GoogleExternalAuthSettings>();

            options.ClientId = string.IsNullOrEmpty(settings?.ClientId)
                ? nameof(options.ClientId)
                : settings.ClientId;

            // SECURITY: ClientSecret is server-side only — never logged or exposed.
            options.ClientSecret = string.IsNullOrEmpty(settings?.ClientSecret)
                ? nameof(options.ClientSecret)
                : settings.ClientSecret;

            // Phase 1 security constraint: do not persist access or refresh tokens.
            options.SaveTokens = false;

            // Handle OAuth remote failures (user cancels consent, or provider error).
            options.Events = new OAuthEvents
            {
                OnRemoteFailure = context =>
                {
                    context.HandleResponse();

                    var errorUrl = context.Properties.GetString(GoogleAuthenticationDefaults.ErrorCallback);
                    context.Response.Redirect(errorUrl);

                    return Task.FromResult(0);
                }
            };
        });
    }

    #endregion
}
