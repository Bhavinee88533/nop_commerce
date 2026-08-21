namespace Nop.Plugin.Widgets.BannerManagement;

public static class BannerManagementDefaults
{
    public const string SystemName = "Widgets.BannerManagement";
    public const string LocalePrefix = "Plugins.Widgets.BannerManagement";
    public const string ListRouteName = "Plugin.Widgets.BannerManagement.List";
    public const string CreateRouteName = "Plugin.Widgets.BannerManagement.Create";
    public const string EditRouteName = "Plugin.Widgets.BannerManagement.Edit";
    public const string DeleteRouteName = "Plugin.Widgets.BannerManagement.Delete";
    public const string AdminMenuSystemName = "Widgets.BannerManagement";

    public static IList<string> SupportedWidgetZones => new List<string>
    {
        Nop.Web.Framework.Infrastructure.PublicWidgetZones.HomepageTop,
        Nop.Web.Framework.Infrastructure.PublicWidgetZones.CategoryDetailsTop,
        Nop.Web.Framework.Infrastructure.PublicWidgetZones.ProductDetailsTop,
        Nop.Web.Framework.Infrastructure.PublicWidgetZones.OrderSummaryContentBefore
    };

    public static IDictionary<string, string> LocaleResources => new Dictionary<string, string>
    {
        ["Plugins.Widgets.BannerManagement.Menu.Title"] = "Banner Management",
        ["Plugins.Widgets.BannerManagement.Title"] = "Banner Management",
        ["Plugins.Widgets.BannerManagement.List"] = "Banners",
        ["Plugins.Widgets.BannerManagement.Create"] = "Create banner",
        ["Plugins.Widgets.BannerManagement.Edit"] = "Edit banner",
        ["Plugins.Widgets.BannerManagement.Preview"] = "Preview",
        ["Plugins.Widgets.BannerManagement.NoResults"] = "No banners found.",
        ["Plugins.Widgets.BannerManagement.Status.Active"] = "Active",
        ["Plugins.Widgets.BannerManagement.Status.Scheduled"] = "Scheduled",
        ["Plugins.Widgets.BannerManagement.Status.Inactive"] = "Inactive",
        ["Plugins.Widgets.BannerManagement.Fields.Title"] = "Title",
        ["Plugins.Widgets.BannerManagement.Fields.Title.Required"] = "Title is required.",
        ["Plugins.Widgets.BannerManagement.Fields.Description"] = "Description",
        ["Plugins.Widgets.BannerManagement.Fields.PictureId"] = "Banner image",
        ["Plugins.Widgets.BannerManagement.Fields.PictureId.Required"] = "Banner image is required.",
        ["Plugins.Widgets.BannerManagement.Fields.ButtonText"] = "CTA button text",
        ["Plugins.Widgets.BannerManagement.Fields.ButtonText.Required"] = "CTA button text is required.",
        ["Plugins.Widgets.BannerManagement.Fields.RedirectUrl"] = "Redirect target",
        ["Plugins.Widgets.BannerManagement.Fields.RedirectUrl.Required"] = "Redirect target is required.",
        ["Plugins.Widgets.BannerManagement.Fields.LinkType"] = "Link type",
        ["Plugins.Widgets.BannerManagement.Fields.PageName"] = "Page",
        ["Plugins.Widgets.BannerManagement.Fields.DisplayOrder"] = "Display order",
        ["Plugins.Widgets.BannerManagement.Fields.DisplayOrder.Range"] = "Display order must be 0 or greater.",
        ["Plugins.Widgets.BannerManagement.Fields.IsActive"] = "Active",
        ["Plugins.Widgets.BannerManagement.Fields.ShowOnHomePage"] = "Display on home page",
        ["Plugins.Widgets.BannerManagement.Fields.CategoryId"] = "Category",
        ["Plugins.Widgets.BannerManagement.Fields.CreatedOnUtc"] = "Created on UTC",
        ["Plugins.Widgets.BannerManagement.Fields.UpdatedOnUtc"] = "Updated on UTC",
        ["Plugins.Widgets.BannerManagement.Fields.StartDateUtc"] = "Start date UTC",
        ["Plugins.Widgets.BannerManagement.Fields.EndDateUtc"] = "End date UTC",
        ["Plugins.Widgets.BannerManagement.Fields.DateRange.Invalid"] = "End date must be later than or equal to the start date.",
        ["Plugins.Widgets.BannerManagement.Messages.Created"] = "Banner created successfully.",
        ["Plugins.Widgets.BannerManagement.Messages.Updated"] = "Banner updated successfully.",
        ["Plugins.Widgets.BannerManagement.Messages.Deleted"] = "Banner deleted successfully.",
        ["Plugins.Widgets.BannerManagement.Hints.RedirectUrl"] = "For Product or Category links, enter a relative URL or SEO name. For Custom URL, enter a full or relative URL.",
        ["Plugins.Widgets.BannerManagement.Hints.StartDateUtc"] = "Leave empty to show the banner immediately.",
        ["Plugins.Widgets.BannerManagement.Hints.EndDateUtc"] = "Leave empty to keep the banner active without an end date.",
        ["Plugins.Widgets.BannerManagement.LinkType.CustomUrl"] = "Custom URL",
        ["Plugins.Widgets.BannerManagement.LinkType.Product"] = "Product",
        ["Plugins.Widgets.BannerManagement.LinkType.Category"] = "Category",
        ["Plugins.Widgets.BannerManagement.PageType.Home"] = "Home page",
        ["Plugins.Widgets.BannerManagement.PageType.Category"] = "Category page",
        ["Plugins.Widgets.BannerManagement.PageType.Product"] = "Product page",
        ["Plugins.Widgets.BannerManagement.PageType.Cart"] = "Cart page"
    };
}