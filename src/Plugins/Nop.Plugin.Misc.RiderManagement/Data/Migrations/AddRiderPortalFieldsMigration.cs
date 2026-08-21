using FluentMigrator;
using Nop.Data.Migrations;

namespace Nop.Plugin.Misc.RiderManagement.Data.Migrations;

/// <summary>
/// Adds rider-portal fields required by the customer-to-rider onboarding flow.
/// This migration is idempotent and safe for already-installed environments.
/// </summary>
[NopMigration("2026/05/25 00:00:00:0000003", "Nop.Plugin.Misc.RiderManagement - add rider portal fields", MigrationProcessType.NoMatter)]
public class AddRiderPortalFieldsMigration : Migration
{
    private const string RiderTable = "RiderManagement_Rider";
    private const string RiderStatusColumn = "RiderStatus";
    private const string AvailabilityColumn = "Availability";
    private const string VehicleTypeColumn = "VehicleType";
    private const string LicenseNumberColumn = "LicenseNumber";
    private const string CurrentLocationColumn = "CurrentLocation";
    private const string IsApprovedColumn = "IsApproved";
    private const string CreatedAtUtcColumn = "CreatedAtUtc";
    private const string UpdatedAtUtcColumn = "UpdatedAtUtc";

    public override void Up()
    {
        if (!Schema.Table(RiderTable).Column(RiderStatusColumn).Exists())
        {
            Alter.Table(RiderTable)
                .AddColumn(RiderStatusColumn).AsString(50).NotNullable().WithDefaultValue("Offline");
        }

        if (!Schema.Table(RiderTable).Column(AvailabilityColumn).Exists())
        {
            Alter.Table(RiderTable)
                .AddColumn(AvailabilityColumn).AsBoolean().NotNullable().WithDefaultValue(true);
        }

        if (!Schema.Table(RiderTable).Column(VehicleTypeColumn).Exists())
        {
            Alter.Table(RiderTable)
                .AddColumn(VehicleTypeColumn).AsString(100).Nullable();
        }

        if (!Schema.Table(RiderTable).Column(LicenseNumberColumn).Exists())
        {
            Alter.Table(RiderTable)
                .AddColumn(LicenseNumberColumn).AsString(100).Nullable();
        }

        if (!Schema.Table(RiderTable).Column(CurrentLocationColumn).Exists())
        {
            Alter.Table(RiderTable)
                .AddColumn(CurrentLocationColumn).AsString(400).Nullable();
        }

        if (!Schema.Table(RiderTable).Column(IsApprovedColumn).Exists())
        {
            Alter.Table(RiderTable)
                .AddColumn(IsApprovedColumn).AsBoolean().NotNullable().WithDefaultValue(false);
        }

        if (!Schema.Table(RiderTable).Column(CreatedAtUtcColumn).Exists())
        {
            Alter.Table(RiderTable)
                .AddColumn(CreatedAtUtcColumn).AsDateTime2().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);
        }

        if (!Schema.Table(RiderTable).Column(UpdatedAtUtcColumn).Exists())
        {
            Alter.Table(RiderTable)
                .AddColumn(UpdatedAtUtcColumn).AsDateTime2().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);
        }
    }

    public override void Down()
    {
        if (Schema.Table(RiderTable).Column(UpdatedAtUtcColumn).Exists())
            Delete.Column(UpdatedAtUtcColumn).FromTable(RiderTable);

        if (Schema.Table(RiderTable).Column(CreatedAtUtcColumn).Exists())
            Delete.Column(CreatedAtUtcColumn).FromTable(RiderTable);

        if (Schema.Table(RiderTable).Column(IsApprovedColumn).Exists())
            Delete.Column(IsApprovedColumn).FromTable(RiderTable);

        if (Schema.Table(RiderTable).Column(CurrentLocationColumn).Exists())
            Delete.Column(CurrentLocationColumn).FromTable(RiderTable);

        if (Schema.Table(RiderTable).Column(LicenseNumberColumn).Exists())
            Delete.Column(LicenseNumberColumn).FromTable(RiderTable);

        if (Schema.Table(RiderTable).Column(VehicleTypeColumn).Exists())
            Delete.Column(VehicleTypeColumn).FromTable(RiderTable);

        if (Schema.Table(RiderTable).Column(AvailabilityColumn).Exists())
            Delete.Column(AvailabilityColumn).FromTable(RiderTable);

        if (Schema.Table(RiderTable).Column(RiderStatusColumn).Exists())
            Delete.Column(RiderStatusColumn).FromTable(RiderTable);
    }
}
