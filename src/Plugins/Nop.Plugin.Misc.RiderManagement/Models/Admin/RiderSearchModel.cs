using Microsoft.AspNetCore.Mvc.Rendering;
using Nop.Web.Framework.Models;
using Nop.Web.Framework.Mvc.ModelBinding;

namespace Nop.Plugin.Misc.RiderManagement.Models.Admin;

/// <summary>
/// Represents a rider search model
/// </summary>
public record RiderSearchModel : BaseSearchModel
{
    public RiderSearchModel()
    {
        AvailableStatuses = new List<SelectListItem>();
    }

    [NopResourceDisplayName("Plugins.Misc.RiderManagement.Fields.Name")]
    public string SearchName { get; set; }

    [NopResourceDisplayName("Plugins.Misc.RiderManagement.Fields.Status")]
    public int SearchStatusId { get; set; }

    public List<SelectListItem> AvailableStatuses { get; set; }
}
