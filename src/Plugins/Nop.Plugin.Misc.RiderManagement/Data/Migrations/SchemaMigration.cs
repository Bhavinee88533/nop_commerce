using FluentMigrator;
using Nop.Data.Extensions;
using Nop.Data.Migrations;
using Nop.Plugin.Misc.RiderManagement.Domains;

namespace Nop.Plugin.Misc.RiderManagement.Data.Migrations;

[NopMigration("2025/05/20 12:00:00:0000001", "Nop.Plugin.Misc.RiderManagement schema", MigrationProcessType.Installation)]
public class SchemaMigration : Migration
{
    /// <summary>
    /// Collect the UP migration expressions
    /// </summary>
    public override void Up()
    {
        this.CreateTableIfNotExists<Rider>();
    }

    /// <summary>
    /// Collects the DOWN migration expressions
    /// </summary>
    public override void Down()
    {
        this.DeleteTableIfExists<Rider>();
    }
}
