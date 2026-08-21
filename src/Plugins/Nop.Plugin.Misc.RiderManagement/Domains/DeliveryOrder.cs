using Nop.Core;

namespace Nop.Plugin.Misc.RiderManagement.Domains;

/// <summary>
/// Represents the mapping between an nopCommerce Order and a Rider.
/// One order maps to exactly one delivery record. RiderId is updated on reassignment.
/// </summary>
public class DeliveryOrder : BaseEntity
{
    /// <summary>
    /// Gets or sets the nopCommerce Order identifier (FK → Order.Id).
    /// Unique — one delivery record per order.
    /// </summary>
    public int OrderId { get; set; }

    /// <summary>
    /// Gets or sets the assigned Rider identifier (FK → RiderManagement_Rider.Id).
    /// Null when pending, set on assignment/reassignment.
    /// </summary>
    public int? RiderId { get; set; }

    /// <summary>
    /// Gets or sets the delivery status identifier
    /// </summary>
    public int StatusId { get; set; }

    /// <summary>
    /// Gets or sets the delivery status enum (mapped from StatusId)
    /// </summary>
    public DeliveryOrderStatus Status
    {
        get => (DeliveryOrderStatus)StatusId;
        set => StatusId = (int)value;
    }

    /// <summary>
    /// Gets or sets the UTC date/time when this record was created
    /// </summary>
    public DateTime CreatedOnUtc { get; set; }

    /// <summary>
    /// Gets or sets the UTC date/time when a rider was last assigned
    /// </summary>
    public DateTime? AssignedAtUtc { get; set; }

    /// <summary>
    /// Gets or sets the UTC date/time when the rider confirmed pick-up
    /// </summary>
    public DateTime? PickedUpOnUtc { get; set; }

    /// <summary>
    /// Gets or sets the UTC date/time when the order entered in-transit state
    /// </summary>
    public DateTime? InTransitOnUtc { get; set; }

    /// <summary>
    /// Gets or sets the UTC date/time when the order was delivered to the customer
    /// </summary>
    public DateTime? DeliveredOnUtc { get; set; }
}
