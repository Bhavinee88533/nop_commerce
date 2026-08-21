using Nop.Core;
using Nop.Core.Domain.Customers;
using Nop.Plugin.Misc.RiderManagement.Domains;

namespace Nop.Plugin.Misc.RiderManagement.Services;

/// <summary>
/// Defines rider management operations.
/// </summary>
public interface IRiderService
{
    /// <summary>
    /// Gets a greeting message for the rider management module.
    /// </summary>
    Task<string> GetModuleGreetingAsync();

    /// <summary>
    /// Gets a paged list of riders, optionally filtered by name and/or status.
    /// </summary>
    Task<IPagedList<Rider>> GetAllRidersAsync(string name = null, int statusId = -1, int pageIndex = 0, int pageSize = int.MaxValue);

    /// <summary>
    /// Gets a rider by its identifier.
    /// </summary>
    Task<Rider> GetRiderByIdAsync(int id);

    /// <summary>
    /// Gets a rider by nopCommerce customer identifier.
    /// </summary>
    Task<Rider> GetRiderByCustomerIdAsync(int customerId);

    /// <summary>
    /// Returns true when a rider profile already exists for the customer.
    /// </summary>
    Task<bool> RiderExistsForCustomerAsync(int customerId);

    /// <summary>
    /// Creates a rider profile from an existing customer.
    /// </summary>
    Task<Rider> CreateRiderFromCustomerAsync(Customer customer, string vehicleType, string licenseNumber, string currentLocation);

    /// <summary>
    /// Updates rider online status and availability using the customer identifier.
    /// </summary>
    Task<Rider> UpdateRiderStatusByCustomerIdAsync(int customerId, bool isOnline, bool availability);

    /// <summary>
    /// Builds dashboard data for a rider mapped to a customer.
    /// </summary>
    Task<RiderDashboardData> GetDashboardDataByCustomerIdAsync(int customerId);

    /// <summary>
    /// Inserts a new rider.
    /// </summary>
    Task InsertRiderAsync(Rider rider);

    /// <summary>
    /// Updates an existing rider.
    /// </summary>
    Task UpdateRiderAsync(Rider rider);

    /// <summary>
    /// Deletes a rider.
    /// </summary>
    Task DeleteRiderAsync(Rider rider);
}
