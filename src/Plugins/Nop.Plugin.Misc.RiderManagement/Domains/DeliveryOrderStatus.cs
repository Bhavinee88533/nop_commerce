namespace Nop.Plugin.Misc.RiderManagement.Domains;

/// <summary>
/// Represents the status of a delivery order
/// </summary>
public enum DeliveryOrderStatus
{
    /// <summary>Created, waiting for rider assignment</summary>
    Pending = 0,

    /// <summary>Rider assigned to the order</summary>
    Assigned = 1,

    /// <summary>Rider has picked up the order</summary>
    PickedUp = 2,

    /// <summary>Order is in transit to customer</summary>
    InTransit = 3,

    /// <summary>Order successfully delivered</summary>
    Delivered = 4,

    /// <summary>Delivery failed or returned</summary>
    Failed = 5
}
