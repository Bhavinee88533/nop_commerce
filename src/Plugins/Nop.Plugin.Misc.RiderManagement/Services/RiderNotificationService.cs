using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Nop.Plugin.Misc.RiderManagement.Domains;
using Nop.Plugin.Misc.RiderManagement.Hubs;
using Nop.Plugin.Misc.RiderManagement.Services;

namespace Nop.Plugin.Misc.RiderManagement.Services;

/// <summary>
/// Broadcasts real-time push notifications to all available riders via SignalR.
/// Implements exponential-backoff retry (up to 3 attempts) per rider group so
/// transient hub failures do not silently drop notifications.
/// After a notification is sent, a 30-second auto-rejection timer fires:
/// if no rider has accepted the order by then, an <c>OrderNotificationExpired</c>
/// event is pushed to every rider who was originally notified so their UI cards
/// are automatically dismissed.
/// </summary>
public class RiderNotificationService : IRiderNotificationService
{
    #region Fields

    private const int MaxRetries = 3;
    private const int AutoRejectSeconds = 60;

    private static readonly TimeSpan[] RetryDelays =
    [
        TimeSpan.FromSeconds(1),
        TimeSpan.FromSeconds(3),
        TimeSpan.FromSeconds(7)
    ];

    private readonly IDeliveryOrderService _deliveryOrderService;
    private readonly IHubContext<RiderNotificationHub> _hubContext;
    private readonly IRiderService _riderService;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<RiderNotificationService> _logger;

    #endregion

    #region Ctor

    public RiderNotificationService(
        IDeliveryOrderService deliveryOrderService,
        IHubContext<RiderNotificationHub> hubContext,
        IRiderService riderService,
        IServiceScopeFactory serviceScopeFactory,
        ILogger<RiderNotificationService> logger)
    {
        _deliveryOrderService = deliveryOrderService;
        _hubContext = hubContext;
        _riderService = riderService;
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    #endregion

    #region Methods

    /// <inheritdoc/>
    public async Task SendNewOrderToAllAvailableRidersAsync(
        int orderId,
        string orderTotal,
        string shippingAddress,
        string deliveryCity,
        string customerName,
        string customerPhone)
    {
        // Get all active, available riders
        var riders = await _riderService.GetAllRidersAsync(statusId: (int)RiderStatus.Active);
        var availableRiders = riders.Where(r => r.IsAvailable).ToList();

        // Filter by location: notify riders whose CurrentLocation matches the delivery city.
        // Riders with an empty/null CurrentLocation are excluded from city match but used as fallback
        // only when no city-matched riders exist (prevents them from "stealing" notifications from
        // riders who actually have a matching city).
        if (!string.IsNullOrWhiteSpace(deliveryCity))
        {
            var cityMatched = availableRiders
                .Where(r => !string.IsNullOrWhiteSpace(r.CurrentLocation) &&
                            (r.CurrentLocation.Contains(deliveryCity, StringComparison.OrdinalIgnoreCase) ||
                             deliveryCity.Contains(r.CurrentLocation, StringComparison.OrdinalIgnoreCase)))
                .ToList();

            // Use city-matched riders; only fall back to all available if nobody matched.
            if (cityMatched.Count > 0)
                availableRiders = cityMatched;
        }

        if (availableRiders.Count == 0)
        {
            _logger.LogInformation(
                "RiderNotification: no available riders to notify for orderId={OrderId}.", orderId);
            return;
        }

        // Sort by fewest active (Assigned) delivery orders — give priority to less-busy riders.
        var riderActiveOrderCounts = new Dictionary<int, int>();
        foreach (var rider in availableRiders)
        {
            var riderOrders = await _deliveryOrderService.GetDeliveryOrdersByRiderIdAsync(rider.Id);
            riderActiveOrderCounts[rider.Id] = riderOrders.Count(o => o.Status == DeliveryOrderStatus.Assigned);
        }
        availableRiders = availableRiders
            .OrderBy(r => riderActiveOrderCounts[r.Id])
            .ToList();

        _logger.LogInformation(
            "RiderNotification: notifying {Count} rider(s) in city '{City}' for orderId={OrderId}.",
            availableRiders.Count, deliveryCity, orderId);

        var tasks = availableRiders.Select(rider =>
            SendToRiderWithRetryAsync(rider.CustomerId, orderId, orderTotal, shippingAddress, customerName, customerPhone));

        await Task.WhenAll(tasks);

        // Capture the list of notified customer IDs and start the auto-rejection timer.
        // The timer runs entirely in a background thread so it does not block the request.
        var notifiedCustomerIds = availableRiders.Select(r => r.CustomerId).ToList();
        _ = AutoRejectAfterDelayAsync(orderId, notifiedCustomerIds);
    }

    /// <inheritdoc/>
    public async Task BroadcastOrderAcceptedAsync(int orderId, int acceptingRiderCustomerId)
    {
        // Notify every active rider except the one who accepted so they dismiss their cards.
        var riders = await _riderService.GetAllRidersAsync(statusId: (int)RiderStatus.Active);

        var broadcastTasks = riders
            .Where(r => r.CustomerId != acceptingRiderCustomerId)
            .Select(r =>
            {
                var groupName = RiderNotificationHub.GetGroupName(r.CustomerId);
                return _hubContext.Clients.Group(groupName)
                    .SendAsync("OrderAlreadyAccepted", new { orderId });
            });

        await Task.WhenAll(broadcastTasks);

        _logger.LogInformation(
            "RiderNotification: broadcast OrderAlreadyAccepted for orderId={OrderId} (accepted by customerId={CustomerId}).",
            orderId, acceptingRiderCustomerId);
    }

    #endregion

    #region Helpers

    private async Task SendToRiderWithRetryAsync(
        int riderCustomerId,
        int orderId,
        string orderTotal,
        string shippingAddress,
        string customerName,
        string customerPhone)
    {
        var groupName = RiderNotificationHub.GetGroupName(riderCustomerId);
        var payload = new
        {
            notificationId = $"order-{orderId}",
            orderId,
            orderTotal,
            shippingAddress,
            customerName,
            customerPhone,
            sentAtUtc = DateTime.UtcNow,
            expiresInSeconds = AutoRejectSeconds
        };

        for (var attempt = 1; attempt <= MaxRetries; attempt++)
        {
            try
            {
                await _hubContext.Clients
                    .Group(groupName)
                    .SendAsync("NewOrderAvailable", payload);

                _logger.LogInformation(
                    "RiderNotification: notified customerId={CustomerId} for orderId={OrderId} (attempt {Attempt}).",
                    riderCustomerId, orderId, attempt);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "RiderNotification: attempt {Attempt}/{Max} failed for customerId={CustomerId}, orderId={OrderId}.",
                    attempt, MaxRetries, riderCustomerId, orderId);

                if (attempt < MaxRetries)
                    await Task.Delay(RetryDelays[attempt - 1]);
            }
        }

        _logger.LogError(
            "RiderNotification: all {Max} attempts exhausted for customerId={CustomerId}, orderId={OrderId}.",
            MaxRetries, riderCustomerId, orderId);
    }

    /// <summary>
    /// Waits <see cref="AutoRejectSeconds"/> seconds, then checks whether the delivery order
    /// is still <see cref="DeliveryOrderStatus.Pending"/> (i.e. no rider accepted it).
    /// If so, broadcasts <c>OrderNotificationExpired</c> to every rider who was originally
    /// notified, causing their dashboard cards to be auto-dismissed.
    /// Uses a fresh DI scope so it is safe to call after the originating HTTP request ends.
    /// </summary>
    private async Task AutoRejectAfterDelayAsync(int orderId, IReadOnlyList<int> notifiedCustomerIds)
    {
        await Task.Delay(TimeSpan.FromSeconds(AutoRejectSeconds));

        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var deliveryOrderService = scope.ServiceProvider.GetRequiredService<IDeliveryOrderService>();

            var deliveryOrder = await deliveryOrderService.GetDeliveryOrderByOrderIdAsync(orderId);

            // If the order was already accepted (or does not exist), do nothing.
            if (deliveryOrder == null || deliveryOrder.Status != DeliveryOrderStatus.Pending)
            {
                _logger.LogInformation(
                    "RiderNotification: auto-reject skipped for orderId={OrderId} — order status is {Status}.",
                    orderId, deliveryOrder?.Status.ToString() ?? "not found");
                return;
            }

            // Broadcast expiry to all riders who received the original notification.
            var expiredPayload = new { orderId };
            var broadcastTasks = notifiedCustomerIds.Select(customerId =>
            {
                var groupName = RiderNotificationHub.GetGroupName(customerId);
                return _hubContext.Clients.Group(groupName)
                    .SendAsync("OrderNotificationExpired", expiredPayload);
            });

            await Task.WhenAll(broadcastTasks);

            _logger.LogInformation(
                "RiderNotification: order {OrderId} auto-rejected after {Seconds}s — notified {Count} rider(s).",
                orderId, AutoRejectSeconds, notifiedCustomerIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "RiderNotification: auto-reject broadcast failed for orderId={OrderId}.", orderId);
        }
    }

    #endregion
}
