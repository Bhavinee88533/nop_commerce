using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Nop.Core.Domain.Catalog;
using Nop.Core.Infrastructure;
using Nop.Data.Migrations;
using Nop.Plugin.Misc.RiderManagement.Services;
using Nop.Services.Catalog;
using Nop.Services.Seo;

namespace Nop.Plugin.Misc.RiderManagement.Infrastructure;

/// <summary>
/// Registers plugin services with the ASP.NET Core dependency injection container.
/// Discovered by nopCommerce startup via INopStartup reflection scan.
/// </summary>
public class NopStartup : INopStartup
{
    /// <summary>
    /// Gets the startup order. Lower values run first.
    /// </summary>
    public int Order => 3000;

    /// <summary>
    /// Registers plugin services into the DI container.
    /// </summary>
    public void ConfigureServices(IServiceCollection services, Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        services.AddSignalR();
        services.AddScoped<IRiderService, RiderService>();
        services.AddScoped<IDeliveryOrderService, DeliveryOrderService>();
        services.AddScoped<IRiderNotificationService, RiderNotificationService>();
    }

    /// <summary>
    /// Configures the HTTP request pipeline.
    /// Applies DB migrations and auto-seeds sample products if the catalogue is empty.
    /// </summary>
    public void Configure(Microsoft.AspNetCore.Builder.IApplicationBuilder application)
    {
        using var scope = application.ApplicationServices.CreateScope();
        var logger = scope.ServiceProvider.GetService<ILogger<NopStartup>>();

        try
        {
            var migrationManager = scope.ServiceProvider.GetRequiredService<IMigrationManager>();
            migrationManager.ApplyUpMigrations(Assembly.GetExecutingAssembly(), MigrationProcessType.NoMatter);
        }
        catch (Exception exception)
        {
            logger?.LogError(exception, "RiderManagementPlugin: Failed to apply startup migrations.");
        }

        // Auto-seed sample products so the store has orderable items right away.
        // Runs asynchronously but we block briefly — this is a one-time startup cost.
        Task.Run(async () =>
        {
            try
            {
                using var seedScope = application.ApplicationServices.CreateScope();
                var productService = seedScope.ServiceProvider.GetService<IProductService>();
                var urlRecordService = seedScope.ServiceProvider.GetService<IUrlRecordService>();
                var productTemplateService = seedScope.ServiceProvider.GetService<IProductTemplateService>();

                if (productService == null || urlRecordService == null || productTemplateService == null)
                    return;

                var templates = await productTemplateService.GetAllProductTemplatesAsync();
                var templateId = templates.FirstOrDefault()?.Id ?? 1;

                var sampleProducts = new[]
                {
                    new { Name = "Fresh Mango (1 kg)",       Sku = "SEED-MANGO-1KG",  Price = 120m, Desc = "Sweet Alphonso mangoes, hand-picked and farm-fresh." },
                    new { Name = "Organic Whole Milk (1 L)", Sku = "SEED-MILK-1L",   Price = 65m,  Desc = "Full-cream pasteurised organic milk in a sealed bottle." },
                    new { Name = "Artisan Sourdough Bread",  Sku = "SEED-BREAD-SOD", Price = 180m, Desc = "Stone-baked sourdough loaf, ready to eat." },
                };

                var now = DateTime.UtcNow;
                var added = 0;

                foreach (var sp in sampleProducts)
                {
                    var existing = await productService.GetProductBySkuAsync(sp.Sku);
                    if (existing != null)
                        continue;

                    var product = new Product
                    {
                        ProductTypeId           = (int)ProductType.SimpleProduct,
                        VisibleIndividually     = true,
                        Name                    = sp.Name,
                        ShortDescription        = sp.Desc,
                        FullDescription         = sp.Desc,
                        Sku                     = sp.Sku,
                        ProductTemplateId       = templateId,
                        Published               = true,
                        ShowOnHomepage          = true,
                        AllowCustomerReviews    = true,
                        Price                   = sp.Price,
                        IsShipEnabled           = true,
                        ManageInventoryMethodId = (int)ManageInventoryMethod.DontManageStock,
                        StockQuantity           = 100,
                        OrderMaximumQuantity    = 10000,
                        OrderMinimumQuantity    = 1,
                        CreatedOnUtc            = now,
                        UpdatedOnUtc            = now,
                    };

                    await productService.InsertProductAsync(product);
                    await urlRecordService.SaveSlugAsync(
                        product,
                        await urlRecordService.ValidateSeNameAsync(product, string.Empty, product.Name, true),
                        0);
                    added++;
                }

                if (added > 0)
                    logger?.LogInformation("RiderManagementPlugin: Seeded {Count} sample product(s) into the catalogue.", added);
            }
            catch (Exception ex)
            {
                // Non-fatal — DB may not be ready on very first run before installation.
                logger?.LogWarning(ex, "RiderManagementPlugin: Sample product seeding skipped (DB may not be ready yet).");
            }
        }).GetAwaiter().GetResult();
    }
}
