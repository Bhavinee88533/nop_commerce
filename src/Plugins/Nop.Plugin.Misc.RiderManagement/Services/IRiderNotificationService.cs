namespace Nop.Plugin.Misc.RiderManagement.Services;

/// <summary>
/// Defines the contract for sending push notifications to riders.
/// </summary>
public interface IRiderNotificationService
{
    /// <summary>
    /// Broadcasts a new-order notification to available riders in the same delivery city,
    /// sorted by fewest active deliveries first. Called as soon as an order reaches Processing status.
    /// Automatically schedules a 30-second auto-rejection: if no rider accepts within that window,
    /// an <c>OrderNotificationExpired</c> event is pushed to all notified riders.
    /// </summary>
    /// <param name="orderId">The nopCommerce Order identifier.</param>
    /// <param name="orderTotal">The formatted order total string (e.g. "$25.00").</param>
    /// <param name="shippingAddress">A short delivery address string.</param>
    /// <param name="deliveryCity">City extracted from the shipping address for location matching.</param>
    /// <param name="customerName">The name of the customer who placed the order.</param>
    /// <param name="customerPhone">The phone number of the customer who placed the order.</param>
    Task SendNewOrderToAllAvailableRidersAsync(int orderId, string orderTotal, string shippingAddress, string deliveryCity, string customerName, string customerPhone);

    /// <summary>
    /// Broadcasts <c>OrderAlreadyAccepted</c> to every active rider except the one who accepted,
    /// so their notification cards are automatically dismissed.
    /// </summary>
    /// <param name="orderId">The order that was just accepted.</param>
    /// <param name="acceptingRiderCustomerId">The nopCommerce customerId of the rider who accepted.</param>
    Task BroadcastOrderAcceptedAsync(int orderId, int acceptingRiderCustomerId);
}
