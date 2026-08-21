using Nop.Web.Framework.Models;
using Nop.Web.Framework.Mvc.ModelBinding;

namespace Nop.Plugin.Misc.RiderManagement.Models.Admin;

/// <summary>
/// Represents the delivery order response model returned by the API
/// </summary>
public record DeliveryOrderModel : BaseNopEntityModel
{
    [NopResourceDisplayName("Plugins.Misc.RiderManagement.DeliveryOrder.Fields.OrderId")]
    public int OrderId { get; set; }

    [NopResourceDisplayName("Plugins.Misc.RiderManagement.DeliveryOrder.Fields.RiderId")]
    public int? RiderId { get; set; }

    [NopResourceDisplayName("Plugins.Misc.RiderManagement.DeliveryOrder.Fields.RiderName")]
    public string RiderName { get; set; }

    [NopResourceDisplayName("Plugins.Misc.RiderManagement.DeliveryOrder.Fields.RiderPhone")]
    public string RiderPhone { get; set; }

    [NopResourceDisplayName("Plugins.Misc.RiderManagement.DeliveryOrder.Fields.Status")]
    public string Status { get; set; }

    [NopResourceDisplayName("Plugins.Misc.RiderManagement.DeliveryOrder.Fields.AssignedAt")]
    public DateTime? AssignedAtUtc { get; set; }

    [NopResourceDisplayName("Plugins.Misc.RiderManagement.DeliveryOrder.Fields.CreatedOn")]
    public DateTime CreatedOnUtc { get; set; }
}
