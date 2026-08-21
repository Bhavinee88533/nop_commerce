using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;
using Nop.Web.Framework.Models;
using Nop.Web.Framework.Mvc.ModelBinding;

namespace Nop.Plugin.Widgets.BannerManagement.Models;

public record BannerModel : BaseNopEntityModel
{
    public BannerModel()
    {
        AvailableCategories = new List<SelectListItem>();
    }

    public int BannerId => Id;

    [NopResourceDisplayName("Plugins.Widgets.BannerManagement.Fields.Title")]
    public string Title { get; set; }

    [NopResourceDisplayName("Plugins.Widgets.BannerManagement.Fields.Description")]
    public string Description { get; set; }

    [UIHint("Picture")]
    [NopResourceDisplayName("Plugins.Widgets.BannerManagement.Fields.PictureId")]
    public int PictureId { get; set; }

    [NopResourceDisplayName("Plugins.Widgets.BannerManagement.Fields.ButtonText")]
    public string ButtonText { get; set; }

    [NopResourceDisplayName("Plugins.Widgets.BannerManagement.Fields.RedirectUrl")]
    public string RedirectUrl { get; set; }

    [NopResourceDisplayName("Plugins.Widgets.BannerManagement.Fields.DisplayOrder")]
    public int DisplayOrder { get; set; }

    [NopResourceDisplayName("Plugins.Widgets.BannerManagement.Fields.IsActive")]
    public bool IsActive { get; set; }

    [NopResourceDisplayName("Plugins.Widgets.BannerManagement.Fields.ShowOnHomePage")]
    public bool ShowOnHomePage { get; set; }

    [NopResourceDisplayName("Plugins.Widgets.BannerManagement.Fields.CategoryId")]
    public int CategoryId { get; set; }

    [NopResourceDisplayName("Plugins.Widgets.BannerManagement.Fields.CreatedOnUtc")]
    public DateTime CreatedOnUtc { get; set; }

    [NopResourceDisplayName("Plugins.Widgets.BannerManagement.Fields.UpdatedOnUtc")]
    public DateTime UpdatedOnUtc { get; set; }

    public string PreviewPictureUrl { get; set; }

    public string PreviewRedirectUrl { get; set; }

    public string StatusText { get; set; }

    public string StatusBadgeClass { get; set; }

    public IList<SelectListItem> AvailableCategories { get; set; }
}