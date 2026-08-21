using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Nop.Core.Infrastructure;
using Nop.Plugin.Widgets.BannerManagement.Services;

namespace Nop.Plugin.Widgets.BannerManagement.Infrastructure;

public class PluginNopStartup : INopStartup
{
    public void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IBannerService, BannerService>();

        var logger = services.BuildServiceProvider().GetService<ILogger<PluginNopStartup>>();
        logger?.LogInformation("BannerManagementPlugin: Plugin services registered.");
    }

    public void Configure(IApplicationBuilder application)
    {
    }

    public int Order => 3000;
}