using System.ComponentModel.DataAnnotations;

namespace Nop.Plugin.Misc.RiderManagement.Models;

/// <summary>
/// Request body for the rider Accept / Reject API endpoints.
/// </summary>
public class RiderOrderActionModel
{
    /// <summary>
    /// The nopCommerce Order identifier the rider is responding to.
    /// </summary>
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "A valid OrderId is required.")]
    public int OrderId { get; set; }
}
