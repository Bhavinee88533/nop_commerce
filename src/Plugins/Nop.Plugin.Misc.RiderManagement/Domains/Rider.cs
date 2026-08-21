using Nop.Core;

namespace Nop.Plugin.Misc.RiderManagement.Domains;

/// <summary>
/// Represents a delivery rider
/// </summary>
public class Rider : BaseEntity
{
    /// <summary>
    /// Gets or sets the rider's full name
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// Gets or sets the rider's phone number
    /// </summary>
    public string Phone { get; set; }

    /// <summary>
    /// Gets or sets the rider's email address
    /// </summary>
    public string Email { get; set; }

    /// <summary>
    /// Gets or sets the status identifier (Active=0, Inactive=1)
    /// </summary>
    public int StatusId { get; set; }

    /// <summary>
    /// Gets or sets the rider status enum (mapped to StatusId)
    /// </summary>
    public RiderStatus Status
    {
        get => (RiderStatus)StatusId;
        set => StatusId = (int)value;
    }

    /// <summary>
    /// Gets or sets a value indicating whether the rider is currently online/connected
    /// </summary>
    public bool IsOnline { get; set; }

    /// <summary>
    /// Gets or sets the rider status text used by the portal UI (Online/Offline).
    /// This duplicates IsOnline intentionally so the API can return explicit status labels.
    /// </summary>
    public string RiderStatus { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether the rider is available for new assignments
    /// and to receive new order notifications. Single source of truth — Availability mirrors this.
    /// </summary>
    public bool IsAvailable { get; set; }

    /// <summary>
    /// Availability alias — always mirrors IsAvailable.
    /// Kept for API/ORM compatibility; set via IsAvailable.
    /// </summary>
    public bool Availability { get; set; }

    /// <summary>
    /// Gets or sets the rider's vehicle type (Bike, Scooter, Car, etc).
    /// </summary>
    public string VehicleType { get; set; }

    /// <summary>
    /// Gets or sets the rider's driving license number.
    /// </summary>
    public string LicenseNumber { get; set; }

    /// <summary>
    /// Gets or sets the rider's current location text used for dashboard preview.
    /// </summary>
    public string CurrentLocation { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether the rider profile is approved.
    /// </summary>
    public bool IsApproved { get; set; }

    /// <summary>
    /// Gets or sets the UTC timestamp when the rider profile was created.
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }

    /// <summary>
    /// Gets or sets the UTC timestamp when the rider profile was last updated.
    /// </summary>
    public DateTime UpdatedAtUtc { get; set; }

    /// <summary>
    /// Gets or sets the associated nopCommerce customer identifier
    /// </summary>
    public int CustomerId { get; set; }
}
