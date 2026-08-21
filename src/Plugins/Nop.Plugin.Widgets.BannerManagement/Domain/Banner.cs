using Nop.Core;

namespace Nop.Plugin.Widgets.BannerManagement.Domain;

public class Banner : BaseEntity
{
    public string Title { get; set; }

    public string Description { get; set; }

    public int PictureId { get; set; }

    public string ButtonText { get; set; }

    public string RedirectUrl { get; set; }

    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; }

    public bool ShowOnHomePage { get; set; }

    public int? CategoryId { get; set; }

    public DateTime CreatedOnUtc { get; set; }

    public DateTime UpdatedOnUtc { get; set; }
}