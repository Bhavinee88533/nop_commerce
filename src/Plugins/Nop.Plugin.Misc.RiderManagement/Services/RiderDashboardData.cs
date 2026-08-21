namespace Nop.Plugin.Misc.RiderManagement.Services;

/// <summary>
/// Aggregated dashboard payload built by the service layer for rider portal APIs.
/// </summary>
public class RiderDashboardData
{
    public int RiderId { get; set; }

    public string RiderName { get; set; }

    public string RiderStatus { get; set; }

    public bool Availability { get; set; }

    public bool IsApproved { get; set; }

    public string VehicleType { get; set; }

    public string CurrentLocation { get; set; }

    public int ActiveDeliveries { get; set; }

    public int? ActiveOrderId { get; set; }

    public List<int> ActiveOrderIds { get; set; } = [];

    public int AvailableOrders { get; set; }

    public int DeliveredCount { get; set; }

    public decimal Earnings { get; set; }
}
