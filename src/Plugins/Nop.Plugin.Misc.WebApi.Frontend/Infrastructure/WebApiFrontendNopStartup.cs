using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Nop.Core.Infrastructure;

namespace Nop.Plugin.Misc.WebApi.Frontend.Infrastructure;

/// <summary>
/// Registers middleware required for Angular frontend integration with plugin API endpoints.
/// </summary>
public class WebApiFrontendNopStartup : INopStartup
{
    /// <summary>
    /// Add CORS policy so local Angular development hosts can call backend APIs when needed.
    /// </summary>
    public void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration
            .GetSection(WebApiFrontendDefaults.CorsAllowedOriginsPath)
            .Get<string[]>()?
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .ToArray()
            ?? ["http://localhost:4200"];

        services.AddCors(options =>
        {
            options.AddPolicy(WebApiFrontendDefaults.CorsPolicyName, policy =>
            {
                policy
                    .WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });
    }

    /// <summary>
    /// Apply CORS between routing and endpoint mapping.
    /// </summary>
    public void Configure(IApplicationBuilder application)
    {
        application.UseCors(WebApiFrontendDefaults.CorsPolicyName);
    }

    /// <summary>
    /// Runs after routing and before authentication/endpoints.
    /// </summary>
    public int Order => 450;
}
