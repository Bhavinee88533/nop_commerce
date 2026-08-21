using Microsoft.AspNetCore.SignalR;

namespace Nop.Plugin.Misc.RiderManagement.Hubs;

/// <summary>
/// SignalR hub that manages real-time connections for delivery riders.
/// Each rider joins a group named "rider_{customerId}" so the server can
/// push notifications to a specific rider regardless of how many tabs are open.
/// </summary>
public class RiderNotificationHub : Hub
{
    /// <summary>
    /// Called by the client to register itself in the rider-specific group.
    /// The client passes its nopCommerce customerId.
    /// </summary>
    public async Task RegisterRider(int customerId)
    {
        if (customerId <= 0)
            return;

        await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(customerId));
    }

    /// <summary>
    /// Called when a connection is lost. Cleanup is automatic for groups.
    /// </summary>
    public override Task OnDisconnectedAsync(Exception exception)
    {
        return base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Returns the SignalR group name for a given customerId.
    /// </summary>
    public static string GetGroupName(int customerId) => $"rider_{customerId}";
}
