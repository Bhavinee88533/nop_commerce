using FluentMigrator;
using Nop.Data.Extensions;
using Nop.Data.Migrations;
using Nop.Plugin.Misc.RiderManagement.Domains;

namespace Nop.Plugin.Misc.RiderManagement.Data.Migrations;

/// <summary>
/// Creates the DeliveryOrder table and adds unique constraint on OrderId
/// </summary>
[NopMigration("2025/05/21 10:00:00:0000001", "Nop.Plugin.Misc.RiderManagement delivery order schema", MigrationProcessType.NoMatter)]
public class DeliveryOrderSchemaMigration : Migration
{
    public override void Up()
    {
        this.CreateTableIfNotExists<DeliveryOrder>();

        // Unique constraint: one delivery record per order
        if (!Schema.Table("RiderManagement_DeliveryOrder").Index("UX_DeliveryOrder_OrderId").Exists())
        {
            Create.UniqueConstraint("UX_DeliveryOrder_OrderId")
                .OnTable("RiderManagement_DeliveryOrder")
                .Column("OrderId");
        }
    }

    public override void Down()
    {
        this.DeleteTableIfExists<DeliveryOrder>();
    }
}
