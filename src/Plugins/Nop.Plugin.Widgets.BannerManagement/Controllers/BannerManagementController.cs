using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Nop.Core;
using Nop.Plugin.Widgets.BannerManagement.Domain;
using Nop.Plugin.Widgets.BannerManagement.Models;
using Nop.Plugin.Widgets.BannerManagement.Services;
using Nop.Services.Catalog;
using Nop.Services.Localization;
using Nop.Services.Media;
using Nop.Services.Messages;
using Nop.Services.Security;
using Nop.Web.Framework;
using Nop.Web.Framework.Controllers;
using Nop.Web.Framework.Mvc.Filters;

namespace Nop.Plugin.Widgets.BannerManagement.Controllers;

[AuthorizeAdmin]
[Area(AreaNames.ADMIN)]
[AutoValidateAntiforgeryToken]
public class BannerManagementController : BasePluginController
{
    private readonly IBannerService _bannerService;
    private readonly ICategoryService _categoryService;
    private readonly ILocalizationService _localizationService;
    private readonly INotificationService _notificationService;
    private readonly IPictureService _pictureService;

    public BannerManagementController(IBannerService bannerService,
        ICategoryService categoryService,
        ILocalizationService localizationService,
        INotificationService notificationService,
        IPictureService pictureService)
    {
        _bannerService = bannerService;
        _categoryService = categoryService;
        _localizationService = localizationService;
        _notificationService = notificationService;
        _pictureService = pictureService;
    }

    [CheckPermission(StandardPermission.Configuration.MANAGE_WIDGETS)]
    public IActionResult Index()
    {
        return RedirectToAction(nameof(List));
    }

    [CheckPermission(StandardPermission.Configuration.MANAGE_WIDGETS)]
    public async Task<IActionResult> List()
    {
        var banners = await _bannerService.GetAllBannersAsync();
        var model = new BannerListModel();

        foreach (var banner in banners)
            model.Banners.Add(await PrepareBannerModelAsync(banner));

        return View("~/Plugins/Widgets.BannerManagement/Views/List.cshtml", model);
    }

    [CheckPermission(StandardPermission.Configuration.MANAGE_WIDGETS)]
    public async Task<IActionResult> Create()
    {
        var model = new BannerModel
        {
            IsActive = true,
            DisplayOrder = 1,
            CreatedOnUtc = DateTime.UtcNow,
            UpdatedOnUtc = DateTime.UtcNow
        };

        await PrepareSelectionsAsync(model);
        return View("~/Plugins/Widgets.BannerManagement/Views/Create.cshtml", model);
    }

    [HttpPost]
    [CheckPermission(StandardPermission.Configuration.MANAGE_WIDGETS)]
    public async Task<IActionResult> Create(BannerModel model)
    {
        if (!ModelState.IsValid)
        {
            await PrepareSelectionsAsync(model);
            model.PreviewPictureUrl = await GetPictureUrlAsync(model.PictureId);
            model.PreviewRedirectUrl = ResolveRedirectUrl(model);
            return View("~/Plugins/Widgets.BannerManagement/Views/Create.cshtml", model);
        }

        var banner = new Banner
        {
            Title = model.Title,
            Description = model.Description,
            PictureId = model.PictureId,
            ButtonText = model.ButtonText,
            RedirectUrl = model.RedirectUrl,
            ShowOnHomePage = model.ShowOnHomePage,
            CategoryId = model.CategoryId == 0 ? null : model.CategoryId,
            DisplayOrder = model.DisplayOrder,
            IsActive = model.IsActive
        };

        await _bannerService.InsertBannerAsync(banner);
        _notificationService.SuccessNotification(await _localizationService.GetResourceAsync("Plugins.Widgets.BannerManagement.Messages.Created"));

        return RedirectToAction(nameof(List));
    }

    [CheckPermission(StandardPermission.Configuration.MANAGE_WIDGETS)]
    public async Task<IActionResult> Edit(int id)
    {
        var banner = await _bannerService.GetBannerByIdAsync(id);
        if (banner == null)
            return RedirectToAction(nameof(List));

        var model = await PrepareBannerModelAsync(banner);
        await PrepareSelectionsAsync(model);

        return View("~/Plugins/Widgets.BannerManagement/Views/Edit.cshtml", model);
    }

    [HttpPost]
    [CheckPermission(StandardPermission.Configuration.MANAGE_WIDGETS)]
    public async Task<IActionResult> Edit(BannerModel model)
    {
        var banner = await _bannerService.GetBannerByIdAsync(model.Id);
        if (banner == null)
            return RedirectToAction(nameof(List));

        if (!ModelState.IsValid)
        {
            await PrepareSelectionsAsync(model);
            model.PreviewPictureUrl = await GetPictureUrlAsync(model.PictureId);
            model.PreviewRedirectUrl = ResolveRedirectUrl(model);
            return View("~/Plugins/Widgets.BannerManagement/Views/Edit.cshtml", model);
        }

        banner.Title = model.Title;
        banner.Description = model.Description;
        banner.PictureId = model.PictureId;
        banner.ButtonText = model.ButtonText;
        banner.RedirectUrl = model.RedirectUrl;
        banner.ShowOnHomePage = model.ShowOnHomePage;
        banner.CategoryId = model.CategoryId == 0 ? null : model.CategoryId;
        banner.DisplayOrder = model.DisplayOrder;
        banner.IsActive = model.IsActive;
        banner.UpdatedOnUtc = DateTime.UtcNow;

        await _bannerService.UpdateBannerAsync(banner);
        _notificationService.SuccessNotification(await _localizationService.GetResourceAsync("Plugins.Widgets.BannerManagement.Messages.Updated"));

        return RedirectToAction(nameof(List));
    }

    [HttpPost]
    [CheckPermission(StandardPermission.Configuration.MANAGE_WIDGETS)]
    public async Task<IActionResult> Delete(int id)
    {
        var banner = await _bannerService.GetBannerByIdAsync(id);
        if (banner == null)
            return RedirectToAction(nameof(List));

        await _bannerService.DeleteBannerAsync(banner);
        _notificationService.SuccessNotification(await _localizationService.GetResourceAsync("Plugins.Widgets.BannerManagement.Messages.Deleted"));

        return RedirectToAction(nameof(List));
    }

    private async Task PrepareSelectionsAsync(BannerModel model)
    {
        var categories = await _categoryService.GetAllCategoriesAsync(showHidden: false);
        model.AvailableCategories = new List<SelectListItem>
        {
            new SelectListItem { Value = "0", Text = "--- None ---", Selected = model.CategoryId == 0 }
        };
        foreach (var category in categories)
        {
            model.AvailableCategories.Add(new SelectListItem
            {
                Value = category.Id.ToString(),
                Text = category.Name,
                Selected = category.Id == model.CategoryId
            });
        }

        model.PreviewPictureUrl = await GetPictureUrlAsync(model.PictureId);
        model.PreviewRedirectUrl = ResolveRedirectUrl(model);
    }

    private async Task<BannerModel> PrepareBannerModelAsync(Banner banner)
    {
        var isPublished = _bannerService.IsBannerCurrentlyPublished(banner);

        return new BannerModel
        {
            Id = banner.Id,
            Title = banner.Title,
            Description = banner.Description,
            PictureId = banner.PictureId,
            ButtonText = banner.ButtonText,
            RedirectUrl = banner.RedirectUrl,
            ShowOnHomePage = banner.ShowOnHomePage,
            CategoryId = banner.CategoryId ?? 0,
            DisplayOrder = banner.DisplayOrder,
            IsActive = banner.IsActive,
            CreatedOnUtc = banner.CreatedOnUtc,
            UpdatedOnUtc = banner.UpdatedOnUtc,
            PreviewPictureUrl = await GetPictureUrlAsync(banner.PictureId),
            PreviewRedirectUrl = _bannerService.ResolveRedirectUrl(banner),
            StatusText = await _localizationService.GetResourceAsync(isPublished
                ? "Plugins.Widgets.BannerManagement.Status.Active"
                : banner.IsActive
                    ? "Plugins.Widgets.BannerManagement.Status.Scheduled"
                    : "Plugins.Widgets.BannerManagement.Status.Inactive"),
            StatusBadgeClass = isPublished ? "badge-success" : banner.IsActive ? "badge-warning" : "badge-secondary"
        };
    }

    private async Task<string> GetPictureUrlAsync(int pictureId)
    {
        if (pictureId <= 0)
            return string.Empty;

        return await _pictureService.GetPictureUrlAsync(pictureId, 600);
    }

    private string ResolveRedirectUrl(BannerModel model)
    {
        return _bannerService.ResolveRedirectUrl(new Banner
        {
            RedirectUrl = model.RedirectUrl
        });
    }

}