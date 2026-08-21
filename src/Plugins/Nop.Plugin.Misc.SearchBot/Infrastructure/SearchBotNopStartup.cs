using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Nop.Core.Infrastructure;
using Nop.Plugin.Misc.SearchBot.Services;

namespace Nop.Plugin.Misc.SearchBot.Infrastructure;

public class SearchBotNopStartup : INopStartup
{
    public void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        // Named HttpClient for OpenAI calls
        services.AddHttpClient("SearchBot.OpenAI");

        // Register the NLP search service
        services.AddScoped<IProductSearchBotService, ProductSearchBotService>();
    }

    public void Configure(IApplicationBuilder application) { }

    public int Order => 500;
}
