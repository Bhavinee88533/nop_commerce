using Nop.Services.Cms;
using Nop.Services.Events;
using Nop.Services.Localization;
using Nop.Services.Security;
using Nop.Web.Framework.Events;
using Nop.Web.Framework.Menu;
using Nop.Web.Framework.Mvc.Routing;

namespace Nop.Plugin.Widgets.BannerManagement.Services;

public class EventConsumer : IConsumer<AdminMenuCreatedEvent>
{
    private readonly ILocalizationService _localizationService;
    private readonly INopUrlHelper _nopUrlHelper;
    private readonly IWidgetPluginManager _pluginManager;

    public EventConsumer(ILocalizationService localizationService,
        INopUrlHelper nopUrlHelper,
        IWidgetPluginManager pluginManager)
    {
        _localizationService = localizationService;
        _nopUrlHelper = nopUrlHelper;
        _pluginManager = pluginManager;
    }

    public async Task HandleEventAsync(AdminMenuCreatedEvent eventMessage)
    {
        var plugin = await _pluginManager.LoadPluginBySystemNameAsync(BannerManagementDefaults.SystemName);
        if (plugin == null || !_pluginManager.IsPluginActive(plugin))
            return;

        var promotionsMenu = eventMessage.RootMenuItem.GetItemBySystemName("Promotions");
        if (promotionsMenu == null || promotionsMenu.ContainsSystemName(BannerManagementDefaults.AdminMenuSystemName))
            return;

        promotionsMenu.InsertAfter("Campaigns", new AdminMenuItem
        {
            SystemName = BannerManagementDefaults.AdminMenuSystemName,
            Title = await _localizationService.GetResourceAsync("Plugins.Widgets.BannerManagement.Menu.Title"),
            Url = _nopUrlHelper.RouteUrl(BannerManagementDefaults.ListRouteName),
            IconClass = "far fa-images",
            PermissionNames = new List<string> { StandardPermission.Configuration.MANAGE_WIDGETS }
        });
    }
}