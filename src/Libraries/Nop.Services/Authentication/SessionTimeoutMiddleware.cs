using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;

namespace Nop.Services.Authentication;

/// <summary>
/// Middleware that detects an expired authentication session and signs the user out,
/// then redirects to the login page with a sessionExpired flag.
/// </summary>
public partial class SessionTimeoutMiddleware
{
    #region Fields

    private readonly RequestDelegate _next;

    #endregion

    #region Ctor

    public SessionTimeoutMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Invoke middleware actions
    /// </summary>
    /// <param name="context">HTTP context</param>
    /// <returns>A task that represents the asynchronous operation</returns>
    public virtual async Task InvokeAsync(HttpContext context)
    {
        // Only process authenticated users on non-login/logout paths
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var sessionKey = "nop.session.active";

            // On first authenticated request, mark the session as active
            if (context.Session.GetString(sessionKey) == null)
                context.Session.SetString(sessionKey, "1");
        }
        else
        {
            // User is not authenticated — check if they had a session (i.e., session expired)
            var sessionKey = "nop.session.active";
            var hadActiveSession = context.Session.GetString(sessionKey) != null;

            if (hadActiveSession)
            {
                // Clear the session and auth cookie
                context.Session.Remove(sessionKey);
                await context.SignOutAsync(NopAuthenticationDefaults.AuthenticationScheme);

                var isApiRequest = context.Request.Headers["Accept"].ToString().Contains("application/json")
                    || context.Request.Headers["X-Requested-With"] == "XMLHttpRequest";

                if (!isApiRequest
                    && !context.Request.Path.StartsWithSegments("/login")
                    && !context.Request.Path.StartsWithSegments("/logout"))
                {
                    context.Response.Redirect("/login?sessionExpired=true");
                    return;
                }
            }
        }

        await _next(context);
    }

    #endregion
}
