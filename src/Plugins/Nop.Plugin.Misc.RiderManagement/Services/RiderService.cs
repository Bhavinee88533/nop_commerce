using Microsoft.Extensions.Logging;
using Nop.Core.Domain.Customers;
using Nop.Core;
using Nop.Data;
using Nop.Plugin.Misc.RiderManagement.Domains;

namespace Nop.Plugin.Misc.RiderManagement.Services;

/// <summary>
/// Implements rider management business logic.
/// </summary>
public class RiderService : IRiderService
{
    #region Fields

    private readonly ILogger<RiderService> _logger;
    private readonly IRepository<DeliveryOrder> _deliveryOrderRepository;
    private readonly IRepository<Rider> _riderRepository;

    #endregion

    #region Ctor

    public RiderService(
        ILogger<RiderService> logger,
        IRepository<DeliveryOrder> deliveryOrderRepository,
        IRepository<Rider> riderRepository)
    {
        _logger = logger;
        _deliveryOrderRepository = deliveryOrderRepository;
        _riderRepository = riderRepository;
    }

    #endregion

    #region Methods

    /// <inheritdoc/>
    public Task<string> GetModuleGreetingAsync()
    {
        _logger.LogInformation("RiderManagementPlugin: RiderService.GetModuleGreetingAsync called.");
        return Task.FromResult("Rider Management module is active.");
    }

    /// <inheritdoc/>
    public async Task<IPagedList<Rider>> GetAllRidersAsync(
        string name = null,
        int statusId = -1,
        int pageIndex = 0,
        int pageSize = int.MaxValue)
    {
        try
        {
            return await _riderRepository.GetAllPagedAsync(query =>
            {
                if (!string.IsNullOrWhiteSpace(name))
                    query = query.Where(r => r.Name.Contains(name));

                if (statusId >= 0)
                    query = query.Where(r => r.StatusId == statusId);

                return query.OrderBy(r => r.Name);
            }, pageIndex, pageSize);
        }
        catch (Exception exception) when (IsMissingRiderTableException(exception))
        {
            _logger.LogError(exception,
                "RiderManagement table is missing. Rider list will be empty until plugin schema migrations are applied.");

            return new PagedList<Rider>(new List<Rider>(), pageIndex, pageSize);
        }
    }

    private static bool IsMissingRiderTableException(Exception exception)
    {
        for (var current = exception; current != null; current = current.InnerException)
        {
            if (current.Message.Contains("RiderManagement_Rider", StringComparison.OrdinalIgnoreCase) &&
                (current.Message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase) ||
                 current.Message.Contains("doesn't exist", StringComparison.OrdinalIgnoreCase) ||
                 current.Message.Contains("does not exist", StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }
        }

        return false;
    }

    /// <inheritdoc/>
    public async Task<Rider> GetRiderByIdAsync(int id)
    {
        return await _riderRepository.GetByIdAsync(id);
    }

    /// <inheritdoc/>
    public async Task<Rider> GetRiderByCustomerIdAsync(int customerId)
    {
        var riders = await _riderRepository.GetAllAsync(query => query.Where(r => r.CustomerId == customerId));
        return riders.FirstOrDefault();
    }

    /// <inheritdoc/>
    public async Task<bool> RiderExistsForCustomerAsync(int customerId)
    {
        return await GetRiderByCustomerIdAsync(customerId) != null;
    }

    /// <inheritdoc/>
    public async Task<Rider> CreateRiderFromCustomerAsync(Customer customer, string vehicleType, string licenseNumber, string currentLocation)
    {
        ArgumentNullException.ThrowIfNull(customer);

        var existingRider = await GetRiderByCustomerIdAsync(customer.Id);
        if (existingRider != null)
            return existingRider;

        var fullName = $"{customer.FirstName} {customer.LastName}".Trim();
        if (string.IsNullOrWhiteSpace(fullName))
            fullName = !string.IsNullOrWhiteSpace(customer.Username) ? customer.Username : customer.Email;

        var nowUtc = DateTime.UtcNow;

        var rider = new Rider
        {
            Name = fullName,
            Phone = customer.Phone,
            Email = customer.Email,
            StatusId = (int)RiderStatus.Active,
            IsOnline = false,
            RiderStatus = "Offline",
            IsAvailable = true,
            Availability = true,
            VehicleType = string.IsNullOrWhiteSpace(vehicleType) ? null : vehicleType.Trim(),
            LicenseNumber = string.IsNullOrWhiteSpace(licenseNumber) ? null : licenseNumber.Trim(),
            CurrentLocation = string.IsNullOrWhiteSpace(currentLocation) ? null : currentLocation.Trim(),
            IsApproved = true,
            CreatedAtUtc = nowUtc,
            UpdatedAtUtc = nowUtc,
            CustomerId = customer.Id
        };

        await _riderRepository.InsertAsync(rider);
        return rider;
    }

    /// <inheritdoc/>
    public async Task<Rider> UpdateRiderStatusByCustomerIdAsync(int customerId, bool isOnline, bool availability)
    {
        var rider = await GetRiderByCustomerIdAsync(customerId)
                    ?? throw new InvalidOperationException($"No rider profile exists for customer id {customerId}.");

        rider.IsOnline = isOnline;
        rider.RiderStatus = isOnline ? "Online" : "Offline";
        rider.IsAvailable = availability;
        rider.Availability = availability;
        rider.UpdatedAtUtc = DateTime.UtcNow;

        await _riderRepository.UpdateAsync(rider);
        return rider;
    }

    /// <inheritdoc/>
    public async Task<RiderDashboardData> GetDashboardDataByCustomerIdAsync(int customerId)
    {
        var rider = await GetRiderByCustomerIdAsync(customerId)
                    ?? throw new InvalidOperationException($"No rider profile exists for customer id {customerId}.");

        var deliveries = await _deliveryOrderRepository.GetAllAsync(query => query.Where(order => order.RiderId == rider.Id));

        var activeDeliveryCount = deliveries.Count(order =>
            order.StatusId == (int)DeliveryOrderStatus.Assigned ||
            order.StatusId == (int)DeliveryOrderStatus.PickedUp ||
            order.StatusId == (int)DeliveryOrderStatus.InTransit);

        var activeOrders = deliveries
            .Where(order =>
                order.StatusId == (int)DeliveryOrderStatus.Assigned ||
                order.StatusId == (int)DeliveryOrderStatus.PickedUp ||
                order.StatusId == (int)DeliveryOrderStatus.InTransit)
            .OrderByDescending(order => order.AssignedAtUtc ?? order.CreatedOnUtc)
            .ToList();

        var activeOrderId = activeOrders.Select(order => (int?)order.OrderId).FirstOrDefault();
        var activeOrderIds = activeOrders.Select(order => order.OrderId).ToList();

        var deliveredCount = deliveries.Count(order => order.StatusId == (int)DeliveryOrderStatus.Delivered);

        return new RiderDashboardData
        {
            RiderId = rider.Id,
            RiderName = rider.Name,
            RiderStatus = rider.RiderStatus,
            Availability = rider.Availability,
            IsApproved = rider.IsApproved,
            VehicleType = rider.VehicleType,
            CurrentLocation = rider.CurrentLocation,
            ActiveDeliveries = activeDeliveryCount,
            ActiveOrderId = activeOrderId,
            ActiveOrderIds = activeOrderIds,
            // Placeholder for unassigned order feed integration; currently tied to availability.
            AvailableOrders = rider.Availability ? 5 : 0,
            DeliveredCount = deliveredCount,
            // Placeholder: replace with settlement data when payouts are integrated.
            Earnings = deliveredCount * 100m
        };
    }

    /// <inheritdoc/>
    public async Task InsertRiderAsync(Rider rider)
    {
        ArgumentNullException.ThrowIfNull(rider);

        if (string.IsNullOrWhiteSpace(rider.RiderStatus))
            rider.RiderStatus = rider.IsOnline ? "Online" : "Offline";

        if (rider.CreatedAtUtc == default)
            rider.CreatedAtUtc = DateTime.UtcNow;

        rider.UpdatedAtUtc = DateTime.UtcNow;

        await _riderRepository.InsertAsync(rider);
    }

    /// <inheritdoc/>
    public async Task UpdateRiderAsync(Rider rider)
    {
        ArgumentNullException.ThrowIfNull(rider);

        rider.RiderStatus = rider.IsOnline ? "Online" : "Offline";
        rider.UpdatedAtUtc = DateTime.UtcNow;

        await _riderRepository.UpdateAsync(rider);
    }

    /// <inheritdoc/>
    public async Task DeleteRiderAsync(Rider rider)
    {
        ArgumentNullException.ThrowIfNull(rider);
        await _riderRepository.DeleteAsync(rider);
    }

    #endregion
}
