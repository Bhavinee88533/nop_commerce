using Nop.Web.Framework.Models;

namespace Nop.Plugin.Widgets.BannerManagement.Models;

public record PublicBannerModel : BaseNopModel
{
    public string Title { get; set; }

    public string Description { get; set; }

    public string ButtonText { get; set; }

    public string RedirectUrl { get; set; }

    public string PictureUrl { get; set; }

    public int DisplayOrder { get; set; }
}