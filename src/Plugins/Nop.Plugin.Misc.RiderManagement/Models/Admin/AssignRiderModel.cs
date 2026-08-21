using System.ComponentModel.DataAnnotations;
using Nop.Web.Framework.Models;
using Nop.Web.Framework.Mvc.ModelBinding;

namespace Nop.Plugin.Misc.RiderManagement.Models.Admin;

/// <summary>
/// Model for assigning or reassigning a rider to an order
/// </summary>
public record AssignRiderModel : BaseNopModel
{
    [Required(ErrorMessage = "Order ID is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "Order ID must be a valid positive number.")]
    [NopResourceDisplayName("Plugins.Misc.RiderManagement.DeliveryOrder.Fields.OrderId")]
    public int OrderId { get; set; }

    [Required(ErrorMessage = "Rider ID is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "Rider ID must be a valid positive number.")]
    [NopResourceDisplayName("Plugins.Misc.RiderManagement.DeliveryOrder.Fields.RiderId")]
    public int RiderId { get; set; }
}
