using Microsoft.AspNetCore.Mvc;
using Nop.Plugin.Widgets.BannerManagement.Domain;
using Nop.Plugin.Widgets.BannerManagement.Models;
using Nop.Plugin.Widgets.BannerManagement.Services;
using Nop.Services.Media;
using Nop.Web.Models.Catalog;
using Nop.Web.Framework.Components;
using Nop.Web.Framework.Infrastructure;

namespace Nop.Plugin.Widgets.BannerManagement.Components;

public class BannerViewComponent : NopViewComponent
{
    private readonly IBannerService _bannerService;
    private readonly IPictureService _pictureService;

    public BannerViewComponent(IBannerService bannerService,
        IPictureService pictureService)
    {
        _bannerService = bannerService;
        _pictureService = pictureService;
    }

    public async Task<IViewComponentResult> InvokeAsync(string widgetZone, object additionalData)
    {
        IList<Banner> banners;

        if (widgetZone.Equals(PublicWidgetZones.HomepageTop, StringComparison.OrdinalIgnoreCase))
        {
            banners = await _bannerService.GetActiveBannersForHomePageAsync();
        }
        else if (widgetZone.Equals(PublicWidgetZones.CategoryDetailsTop, StringComparison.OrdinalIgnoreCase)
                 && additionalData is CategoryModel categoryModel)
        {
            banners = await _bannerService.GetActiveBannersForCategoryAsync(categoryModel.Id);
        }
        else
        {
            return Content(string.Empty);
        }

        if (!banners.Any())
            return Content(string.Empty);

        var model = new List<PublicBannerModel>();

        foreach (var banner in banners)
        {
            var pictureUrl = banner.PictureId > 0 ? await _pictureService.GetPictureUrlAsync(banner.PictureId, 1600) : string.Empty;
            if (string.IsNullOrEmpty(pictureUrl))
                continue;

            model.Add(new PublicBannerModel
            {
                Title = banner.Title,
                Description = banner.Description,
                ButtonText = banner.ButtonText,
                RedirectUrl = _bannerService.ResolveRedirectUrl(banner),
                PictureUrl = pictureUrl,
                DisplayOrder = banner.DisplayOrder
            });
        }

        if (!model.Any())
            return Content(string.Empty);

        return View("~/Plugins/Widgets.BannerManagement/Views/PublicInfo.cshtml", model.OrderBy(item => item.DisplayOrder).ToList());
    }
}