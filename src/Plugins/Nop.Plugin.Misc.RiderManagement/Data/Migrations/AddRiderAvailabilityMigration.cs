using FluentMigrator;
using Nop.Data.Migrations;

namespace Nop.Plugin.Misc.RiderManagement.Data.Migrations;

/// <summary>
/// Adds IsAvailable column to existing RiderManagement_Rider table.
/// Runs as Update migration so it applies to already-installed instances.
/// </summary>
[NopMigration("2025/05/21 10:00:00:0000002", "Nop.Plugin.Misc.RiderManagement - add IsAvailable to Rider", MigrationProcessType.NoMatter)]
public class AddRiderAvailabilityMigration : Migration
{
    public override void Up()
    {
        if (!Schema.Table("RiderManagement_Rider").Column("IsAvailable").Exists())
        {
            Alter.Table("RiderManagement_Rider")
                .AddColumn("IsAvailable").AsBoolean().NotNullable().WithDefaultValue(true);
        }
    }

    public override void Down()
    {
        if (Schema.Table("RiderManagement_Rider").Column("IsAvailable").Exists())
        {
            Delete.Column("IsAvailable").FromTable("RiderManagement_Rider");
        }
    }
}
