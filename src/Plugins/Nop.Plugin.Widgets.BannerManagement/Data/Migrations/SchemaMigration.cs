using FluentMigrator;
using Nop.Data.Extensions;
using Nop.Data.Migrations;
using Nop.Plugin.Widgets.BannerManagement.Domain;

namespace Nop.Plugin.Widgets.BannerManagement.Data.Migrations;

[NopMigration("2026-05-22 09:00:00", "Widgets.BannerManagement schema", MigrationProcessType.Installation)]
public class SchemaMigration : Migration
{
    public override void Up()
    {
        this.CreateTableIfNotExists<Banner>();
    }

    public override void Down()
    {
        this.DeleteTableIfExists<Banner>();
    }
}