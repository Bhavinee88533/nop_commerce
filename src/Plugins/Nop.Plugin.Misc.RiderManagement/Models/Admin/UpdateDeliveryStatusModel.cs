using System.ComponentModel.DataAnnotations;
using Nop.Plugin.Misc.RiderManagement.Domains;
using Nop.Web.Framework.Models;

namespace Nop.Plugin.Misc.RiderManagement.Models.Admin;

/// <summary>
/// Request model for updating delivery status.
/// Used by rider dashboard (PickedUp, InTransit) and admin (Delivered, Failed).
/// </summary>
public record UpdateDeliveryStatusModel : BaseNopModel
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Order ID must be a valid positive number.")]
    public int OrderId { get; set; }

    [Required]
    public DeliveryOrderStatus Status { get; set; }
}
