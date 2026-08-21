using Nop.Web.Framework.Models;

namespace Nop.Plugin.Widgets.BannerManagement.Models;

public record BannerListModel : BaseNopModel
{
    public BannerListModel()
    {
        Banners = new List<BannerModel>();
    }

    public IList<BannerModel> Banners { get; set; }
}