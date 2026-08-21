using FluentMigrator;
using Nop.Data.Migrations;

namespace Nop.Plugin.Misc.RiderManagement.Data.Migrations;

/// <summary>
/// Adds per-status timestamp columns to the DeliveryOrder table.
/// Safe for already-installed environments — each column is added only when absent.
/// </summary>
[NopMigration("2026/05/28 00:00:00:0000004", "Nop.Plugin.Misc.RiderManagement - add delivery status timestamps", MigrationProcessType.NoMatter)]
public class AddDeliveryStatusTimestampsMigration : Migration
{
    private const string DeliveryOrderTable = "RiderManagement_DeliveryOrder";

    public override void Up()
    {
        if (!Schema.Table(DeliveryOrderTable).Column("PickedUpOnUtc").Exists())
            Alter.Table(DeliveryOrderTable).AddColumn("PickedUpOnUtc").AsDateTime2().Nullable();

        if (!Schema.Table(DeliveryOrderTable).Column("InTransitOnUtc").Exists())
            Alter.Table(DeliveryOrderTable).AddColumn("InTransitOnUtc").AsDateTime2().Nullable();

        if (!Schema.Table(DeliveryOrderTable).Column("DeliveredOnUtc").Exists())
            Alter.Table(DeliveryOrderTable).AddColumn("DeliveredOnUtc").AsDateTime2().Nullable();
    }

    public override void Down()
    {
        if (Schema.Table(DeliveryOrderTable).Column("DeliveredOnUtc").Exists())
            Delete.Column("DeliveredOnUtc").FromTable(DeliveryOrderTable);

        if (Schema.Table(DeliveryOrderTable).Column("InTransitOnUtc").Exists())
            Delete.Column("InTransitOnUtc").FromTable(DeliveryOrderTable);

        if (Schema.Table(DeliveryOrderTable).Column("PickedUpOnUtc").Exists())
            Delete.Column("PickedUpOnUtc").FromTable(DeliveryOrderTable);
    }
}
