using Microsoft.Extensions.Logging;
using Nop.Core.Domain.Cms;
using Nop.Plugin.Widgets.BannerManagement.Components;
using Nop.Plugin.Widgets.BannerManagement.Services;
using Nop.Services.Cms;
using Nop.Services.Configuration;
using Nop.Services.Helpers;
using Nop.Services.Localization;
using Nop.Services.Plugins;
using Nop.Web.Framework.Infrastructure;

namespace Nop.Plugin.Widgets.BannerManagement;

public class BannerManagementPlugin : BasePlugin, IWidgetPlugin
{
    private readonly IBannerService _bannerService;
    private readonly ILocalizationService _localizationService;
    private readonly ILogger<BannerManagementPlugin> _logger;
    private readonly ISettingService _settingService;
    private readonly IWebHelper _webHelper;
    private readonly WidgetSettings _widgetSettings;

    public BannerManagementPlugin(IBannerService bannerService,
        ILocalizationService localizationService,
        ILogger<BannerManagementPlugin> logger,
        ISettingService settingService,
        IWebHelper webHelper,
        WidgetSettings widgetSettings)
    {
        _bannerService = bannerService;
        _localizationService = localizationService;
        _logger = logger;
        _settingService = settingService;
        _webHelper = webHelper;
        _widgetSettings = widgetSettings;
    }

    public override string GetConfigurationPageUrl()
    {
        return $"{_webHelper.GetStoreLocation()}Admin/BannerManagement/List";
    }

    public Task<IList<string>> GetWidgetZonesAsync()
    {
        return Task.FromResult(BannerManagementDefaults.SupportedWidgetZones);
    }

    public Type GetWidgetViewComponent(string widgetZone)
    {
        return typeof(BannerViewComponent);
    }

    public override async Task InstallAsync()
    {
        if (!_widgetSettings.ActiveWidgetSystemNames.Contains(BannerManagementDefaults.SystemName))
        {
            _widgetSettings.ActiveWidgetSystemNames.Add(BannerManagementDefaults.SystemName);
            await _settingService.SaveSettingAsync(_widgetSettings);
        }

        await _localizationService.AddOrUpdateLocaleResourceAsync(BannerManagementDefaults.LocaleResources);

        _logger.LogInformation("BannerManagementPlugin: Plugin installed successfully.");
        await base.InstallAsync();
    }

    public override async Task UninstallAsync()
    {
        var banners = await _bannerService.GetAllBannersForCleanupAsync();
        foreach (var banner in banners)
            await _bannerService.DeleteBannerAsync(banner);

        if (_widgetSettings.ActiveWidgetSystemNames.Contains(BannerManagementDefaults.SystemName))
        {
            _widgetSettings.ActiveWidgetSystemNames.Remove(BannerManagementDefaults.SystemName);
            await _settingService.SaveSettingAsync(_widgetSettings);
        }

        await _localizationService.DeleteLocaleResourcesAsync(BannerManagementDefaults.LocalePrefix);

        _logger.LogInformation("BannerManagementPlugin: Plugin uninstalled successfully.");
        await base.UninstallAsync();
    }

    public bool HideInWidgetList => false;
}