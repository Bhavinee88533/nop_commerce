using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;
using Nop.Web.Framework.Models;
using Nop.Web.Framework.Mvc.ModelBinding;

namespace Nop.Plugin.Misc.RiderManagement.Models.Admin;

/// <summary>
/// Represents a model for creating/editing a rider
/// </summary>
public record RiderModel : BaseNopEntityModel
{
    public RiderModel()
    {
        AvailableStatuses = new List<SelectListItem>();
    }

    [Required(ErrorMessage = "Name is required.")]
    [RegularExpression(@"^[a-zA-Z\s\-'\.]+$", ErrorMessage = "Name must contain only letters.")]
    [StringLength(400, ErrorMessage = "Name cannot exceed 400 characters.")]
    [NopResourceDisplayName("Plugins.Misc.RiderManagement.Fields.Name")]
    public string Name { get; set; }

    [Required(ErrorMessage = "Phone is required.")]
    [RegularExpression(@"^[0-9+\-\s()]+$", ErrorMessage = "Phone must contain only digits and valid phone characters (+ - spaces).")]
    [StringLength(50, ErrorMessage = "Phone cannot exceed 50 characters.")]
    [NopResourceDisplayName("Plugins.Misc.RiderManagement.Fields.Phone")]
    public string Phone { get; set; }

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
    [StringLength(1000, ErrorMessage = "Email cannot exceed 1000 characters.")]
    [NopResourceDisplayName("Plugins.Misc.RiderManagement.Fields.Email")]
    public string Email { get; set; }

    [NopResourceDisplayName("Plugins.Misc.RiderManagement.Fields.Status")]
    public int StatusId { get; set; }

    [NopResourceDisplayName("Plugins.Misc.RiderManagement.Fields.IsOnline")]
    public bool IsOnline { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Customer ID must be a valid positive number.")]
    [NopResourceDisplayName("Plugins.Misc.RiderManagement.Fields.CustomerId")]
    public int CustomerId { get; set; }

    public List<SelectListItem> AvailableStatuses { get; set; }
}
