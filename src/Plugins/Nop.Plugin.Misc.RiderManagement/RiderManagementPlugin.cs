using Microsoft.Extensions.Logging;
using Nop.Services.Localization;
using Nop.Services.Plugins;

namespace Nop.Plugin.Misc.RiderManagement;

/// <summary>
/// Main plugin class for Rider Management.
/// Handles installation, uninstallation, and plugin metadata.
/// </summary>
public class RiderManagementPlugin : BasePlugin
{
    #region Fields

    private readonly ILocalizationService _localizationService;
    private readonly ILogger<RiderManagementPlugin> _logger;

    #endregion

    #region Ctor

    public RiderManagementPlugin(
        ILocalizationService localizationService,
        ILogger<RiderManagementPlugin> logger)
    {
        _localizationService = localizationService;
        _logger = logger;

        _logger.LogInformation("RiderManagementPlugin: Plugin initialized.");
    }

    #endregion

    #region Methods

    /// <summary>
    /// Gets the admin configuration page URL.
    /// </summary>
    public override string GetConfigurationPageUrl()
    {
        return $"/Admin/RiderManagement/Configure";
    }

    /// <summary>
    /// Installs the plugin: registers localization resources and logs success.
    /// </summary>
    public override async Task InstallAsync()
    {
        await _localizationService.AddOrUpdateLocaleResourceAsync(new Dictionary<string, string>
        {
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Configure"] = "Configure",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Menu.Title"] = "Rider Management",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Admin.Title"] = "Rider Management",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Admin.Description"] = "Manage delivery riders for quick commerce operations.",

            // Rider list / CRUD
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Riders"] = "Riders",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Rider.AddNew"] = "Add New Rider",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Rider.Edit"] = "Edit Rider",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Rider.Added"] = "Rider has been added successfully.",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Rider.Updated"] = "Rider has been updated successfully.",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Rider.Deleted"] = "Rider has been deleted successfully.",

            // Field labels
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Fields.Name"] = "Name",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Fields.Phone"] = "Phone",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Fields.Email"] = "Email",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Fields.Status"] = "Status",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Fields.IsOnline"] = "Is Online",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.Fields.CustomerId"] = "Customer ID",

            // Delivery Order fields
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Fields.OrderId"] = "Order",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Fields.RiderId"] = "Rider",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Fields.RiderName"] = "Rider Name",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Fields.RiderPhone"] = "Rider Phone",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Fields.Status"] = "Status",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Fields.AssignedAt"] = "Assigned At",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Fields.CreatedOn"] = "Created On",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Assign.Success"] = "Rider assigned successfully.",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Reassign.Success"] = "Rider reassigned successfully.",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Error.RiderUnavailable"] = "The selected rider is not available.",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Error.InvalidOrder"] = "The specified order does not exist.",
            [$"{RiderManagementDefaults.LocaleResourcePrefix}.DeliveryOrder.Error.InvalidRider"] = "The specified rider does not exist.",
        });

        _logger.LogInformation("RiderManagementPlugin: Plugin installed successfully.");

        await base.InstallAsync();
    }

    /// <summary>
    /// Uninstalls the plugin: removes localization resources and logs success.
    /// </summary>
    public override async Task UninstallAsync()
    {
        await _localizationService.DeleteLocaleResourcesAsync(RiderManagementDefaults.LocaleResourcePrefix);

        _logger.LogInformation("RiderManagementPlugin: Plugin uninstalled successfully.");

        await base.UninstallAsync();
    }

    #endregion
}
