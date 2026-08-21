using Nop.Data;
using Nop.Plugin.Misc.RiderManagement.Domains;

namespace Nop.Plugin.Misc.RiderManagement.Services;

/// <summary>
/// Implements delivery order business logic.
/// Enforces: one active rider per order, IsAvailable check, no duplicate mappings.
/// </summary>
public class DeliveryOrderService : IDeliveryOrderService
{
    #region Fields

    private readonly IRepository<DeliveryOrder> _deliveryOrderRepository;
    private readonly IRepository<Rider> _riderRepository;

    #endregion

    #region Ctor

    public DeliveryOrderService(
        IRepository<DeliveryOrder> deliveryOrderRepository,
        IRepository<Rider> riderRepository)
    {
        _deliveryOrderRepository = deliveryOrderRepository;
        _riderRepository = riderRepository;
    }

    #endregion

    #region Methods

    /// <inheritdoc/>
    public async Task CreatePendingDeliveryOrderAsync(int orderId)
    {
        // Prevent duplicate — one delivery record per order
        var existing = await GetDeliveryOrderByOrderIdAsync(orderId);
        if (existing != null)
            return;

        await _deliveryOrderRepository.InsertAsync(new DeliveryOrder
        {
            OrderId = orderId,
            RiderId = null,
            Status = DeliveryOrderStatus.Pending,
            CreatedOnUtc = DateTime.UtcNow
        });
    }

    /// <inheritdoc/>
    public async Task<DeliveryOrder> AssignRiderAsync(int orderId, int riderId)
    {
        // Validate rider exists and is available
        var rider = await _riderRepository.GetByIdAsync(riderId)
            ?? throw new ArgumentException($"Rider with ID {riderId} does not exist.");

        if (!rider.IsAvailable)
            throw new InvalidOperationException($"Rider '{rider.Name}' (ID: {riderId}) is not available for assignment.");

        // Get or create delivery order record
        var deliveryOrder = await GetDeliveryOrderByOrderIdAsync(orderId);

        // Race-condition guard: if another rider already accepted this order, reject.
        if (deliveryOrder != null &&
            deliveryOrder.Status == DeliveryOrderStatus.Assigned &&
            deliveryOrder.RiderId.HasValue)
        {
            throw new InvalidOperationException(
                $"Order {orderId} has already been accepted by rider {deliveryOrder.RiderId}.");
        }

        if (deliveryOrder == null)
        {
            // First assignment — create the record
            deliveryOrder = new DeliveryOrder
            {
                OrderId = orderId,
                RiderId = riderId,
                Status = DeliveryOrderStatus.Assigned,
                CreatedOnUtc = DateTime.UtcNow,
                AssignedAtUtc = DateTime.UtcNow
            };
            await _deliveryOrderRepository.InsertAsync(deliveryOrder);
        }
        else
        {
            // Pending → Assigned
            deliveryOrder.RiderId = riderId;
            deliveryOrder.Status = DeliveryOrderStatus.Assigned;
            deliveryOrder.AssignedAtUtc = DateTime.UtcNow;
            await _deliveryOrderRepository.UpdateAsync(deliveryOrder);
        }

        // Mark rider as unavailable so they don't receive new orders while on a delivery
        rider.IsAvailable = false;
        rider.Availability = false;
        await _riderRepository.UpdateAsync(rider);

        return deliveryOrder;
    }

    /// <inheritdoc/>
    public async Task<DeliveryOrder> GetDeliveryOrderByOrderIdAsync(int orderId)
    {
        var results = await _deliveryOrderRepository.GetAllAsync(
            query => query.Where(d => d.OrderId == orderId));
        return results.FirstOrDefault();
    }

    /// <inheritdoc/>
    public async Task<IList<DeliveryOrder>> GetDeliveryOrdersByRiderIdAsync(int riderId)
    {
        return await _deliveryOrderRepository.GetAllAsync(
            query => query.Where(d => d.RiderId == riderId)
                          .OrderByDescending(d => d.CreatedOnUtc));
    }

    /// <inheritdoc/>
    public async Task<DeliveryOrder> GetDeliveryOrderByIdAsync(int id)
    {
        return await _deliveryOrderRepository.GetByIdAsync(id);
    }

    /// <inheritdoc/>
    public async Task<bool> UpdateDeliveryStatusAsync(int orderId, int riderId, DeliveryOrderStatus newStatus)
    {
        // Allowed forward-only transitions
        var allowedTransitions = new Dictionary<DeliveryOrderStatus, DeliveryOrderStatus>
        {
            { DeliveryOrderStatus.Assigned, DeliveryOrderStatus.PickedUp },
            { DeliveryOrderStatus.PickedUp, DeliveryOrderStatus.InTransit },
            { DeliveryOrderStatus.InTransit, DeliveryOrderStatus.Delivered }
        };

        var deliveryOrder = await GetDeliveryOrderByOrderIdAsync(orderId);
        if (deliveryOrder == null)
            return false;

        // Validate rider ownership
        if (!deliveryOrder.RiderId.HasValue || deliveryOrder.RiderId.Value != riderId)
            return false;

        // Prevent updating already-delivered orders
        if (deliveryOrder.Status == DeliveryOrderStatus.Delivered)
            return false;

        // Validate the requested transition is the one allowed next
        if (!allowedTransitions.TryGetValue(deliveryOrder.Status, out var expectedNext))
            return false;

        if (newStatus != expectedNext)
            return false;

        // Prevent duplicate transitions (idempotency guard)
        if (deliveryOrder.Status == newStatus)
            return false;

        var now = DateTime.UtcNow;
        deliveryOrder.Status = newStatus;

        switch (newStatus)
        {
            case DeliveryOrderStatus.PickedUp:
                deliveryOrder.PickedUpOnUtc = now;
                break;
            case DeliveryOrderStatus.InTransit:
                deliveryOrder.InTransitOnUtc = now;
                break;
            case DeliveryOrderStatus.Delivered:
                deliveryOrder.DeliveredOnUtc = now;
                break;
        }

        await _deliveryOrderRepository.UpdateAsync(deliveryOrder);
        return true;
    }

    /// <inheritdoc/>
    public async Task<(IList<DeliveryOrder> Items, int TotalCount)> GetPastDeliveriesAsync(
        int riderId,
        DateTime? dateFrom,
        DateTime? dateTo,
        int? statusId,
        int pageIndex,
        int pageSize)
    {
        var deliveredId = (int)DeliveryOrderStatus.Delivered;
        var failedId = (int)DeliveryOrderStatus.Failed;

        var all = await _deliveryOrderRepository.GetAllAsync(query =>
        {
            query = query.Where(d => d.RiderId == riderId);

            if (statusId.HasValue)
                query = query.Where(d => d.StatusId == statusId.Value);
            else
                query = query.Where(d => d.StatusId == deliveredId || d.StatusId == failedId);

            if (dateFrom.HasValue)
                query = query.Where(d => d.CreatedOnUtc >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(d => d.CreatedOnUtc <= dateTo.Value);

            return query.OrderByDescending(d => d.CreatedOnUtc);
        });

        var totalCount = all.Count;
        var items = all.Skip(pageIndex * pageSize).Take(pageSize).ToList();
        return (items, totalCount);
    }

    #endregion
}
