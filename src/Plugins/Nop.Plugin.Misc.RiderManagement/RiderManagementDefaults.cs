namespace Nop.Plugin.Misc.RiderManagement;

/// <summary>
/// Contains constant values used throughout the Rider Management plugin.
/// </summary>
public static class RiderManagementDefaults
{
    /// <summary>The system name of this plugin.</summary>
    public const string SystemName = "Misc.RiderManagement";

    /// <summary>Prefix for all locale resource keys registered by this plugin.</summary>
    public const string LocaleResourcePrefix = "Plugins.Misc.RiderManagement";

    /// <summary>Admin configure route name.</summary>
    public const string ConfigureRouteName = "Plugin.Misc.RiderManagement.Configure";

    /// <summary>Admin rider list route name.</summary>
    public const string RiderListRouteName = "Plugin.Misc.RiderManagement.List";

    /// <summary>Admin rider create route name.</summary>
    public const string RiderCreateRouteName = "Plugin.Misc.RiderManagement.Create";

    /// <summary>Admin rider edit route name.</summary>
    public const string RiderEditRouteName = "Plugin.Misc.RiderManagement.Edit";

    /// <summary>Admin rider delete route name.</summary>
    public const string RiderDeleteRouteName = "Plugin.Misc.RiderManagement.Delete";

    // Delivery Order routes
    /// <summary>API: assign or reassign rider to order.</summary>
    public const string DeliveryAssignRouteName = "Plugin.Misc.RiderManagement.Delivery.Assign";

    /// <summary>API: get delivery order details by orderId.</summary>
    public const string DeliveryByOrderRouteName = "Plugin.Misc.RiderManagement.Delivery.ByOrder";

    /// <summary>API: get all delivery orders for a riderId.</summary>
    public const string DeliveryByRiderRouteName = "Plugin.Misc.RiderManagement.Delivery.ByRider";

    // Rider dashboard
    /// <summary>Rider-facing dashboard route name.</summary>
    public const string RiderDashboardRouteName = "Plugin.Misc.RiderManagement.RiderDashboard";

    // Rider order actions (accept / reject)
    /// <summary>Rider API: accept an order notification.</summary>
    public const string RiderOrderAcceptRouteName = "Plugin.Misc.RiderManagement.RiderOrder.Accept";

    /// <summary>Rider API: reject an order notification.</summary>
    public const string RiderOrderRejectRouteName = "Plugin.Misc.RiderManagement.RiderOrder.Reject";

    // SignalR
    /// <summary>URL path where the SignalR notification hub is mounted.</summary>
    public const string RiderNotificationHubPath = "/hubs/rider-notifications";
}
