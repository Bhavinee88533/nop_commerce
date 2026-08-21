using Nop.Plugin.Misc.RiderManagement.Domains;

namespace Nop.Plugin.Misc.RiderManagement.Services;

/// <summary>
/// Defines delivery order operations: assignment, reassignment, and retrieval.
/// Business rules enforced:
///   - Only one active rider per order at any time
///   - Rider must have IsAvailable = true to be assigned
///   - OrderId and RiderId must be valid (FK-backed)
///   - Assignment creates the mapping; reassignment updates it
/// </summary>
public interface IDeliveryOrderService
{
    /// <summary>
    /// Creates a pending DeliveryOrder record when an order is placed.
    /// Called automatically by OrderEventConsumer.
    /// </summary>
    Task CreatePendingDeliveryOrderAsync(int orderId);

    /// <summary>
    /// Assigns an available rider to an order.
    /// Creates the mapping if not yet assigned, updates it if already assigned (reassignment).
    /// Throws if rider is not available or orderId/riderId are invalid.
    /// </summary>
    Task<DeliveryOrder> AssignRiderAsync(int orderId, int riderId);

    /// <summary>
    /// Gets the delivery order (with rider info) for a given orderId.
    /// Returns null if no delivery record exists for that order.
    /// </summary>
    Task<DeliveryOrder> GetDeliveryOrderByOrderIdAsync(int orderId);

    /// <summary>
    /// Gets all delivery orders assigned to a specific rider.
    /// </summary>
    Task<IList<DeliveryOrder>> GetDeliveryOrdersByRiderIdAsync(int riderId);

    /// <summary>
    /// Gets a delivery order by its own Id.
    /// </summary>
    Task<DeliveryOrder> GetDeliveryOrderByIdAsync(int id);

    /// <summary>
    /// Advances the delivery status of an order along the allowed progression:
    /// Assigned → PickedUp → InTransit → Delivered.
    /// Validates rider ownership, prevents skipping or reversing states, and records timestamps.
    /// </summary>
    /// <returns>True when the transition was applied; false for any invalid input or transition.</returns>
    Task<bool> UpdateDeliveryStatusAsync(int orderId, int riderId, DeliveryOrderStatus newStatus);

    /// <summary>
    /// Returns a paginated list of terminal-state (Delivered/Failed) delivery orders for a rider.
    /// Optionally filtered by creation date range and/or a specific statusId.
    /// </summary>
    Task<(IList<DeliveryOrder> Items, int TotalCount)> GetPastDeliveriesAsync(
        int riderId,
        DateTime? dateFrom,
        DateTime? dateTo,
        int? statusId,
        int pageIndex,
        int pageSize);
}
