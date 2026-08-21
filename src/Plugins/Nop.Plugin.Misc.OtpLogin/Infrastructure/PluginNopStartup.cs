using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Nop.Core.Infrastructure;
using Nop.Plugin.Misc.OtpLogin.Services;

namespace Nop.Plugin.Misc.OtpLogin.Infrastructure;

/// <summary>
/// Registers OTP services on application startup.
/// </summary>
public class PluginNopStartup : INopStartup
{
    public void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        var emailOptions = configuration.GetSection("OtpEmail").Get<OtpEmailOptions>() ?? new OtpEmailOptions();
        services.AddSingleton(emailOptions);
        services.AddSingleton<IOtpEmailSender, OtpEmailSender>();

        var smsOptions = configuration.GetSection("OtpSms").Get<OtpSmsOptions>() ?? new OtpSmsOptions();
        services.AddSingleton(smsOptions);
        services.AddHttpClient();
        services.AddSingleton<IOtpSmsSender, OtpSmsSender>();
    }

    public void Configure(IApplicationBuilder application)
    {
    }

    public int Order => 3000;
}
