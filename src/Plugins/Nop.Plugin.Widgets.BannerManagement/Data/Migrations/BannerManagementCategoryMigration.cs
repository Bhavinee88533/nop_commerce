using FluentMigrator;
using Nop.Data;
using Nop.Data.Mapping;
using Nop.Data.Migrations;
using Nop.Plugin.Widgets.BannerManagement.Domain;

namespace Nop.Plugin.Widgets.BannerManagement.Data.Migrations;

[NopMigration("2026-05-26 10:00:00", "Widgets.BannerManagement 1.12. Add ShowOnHomePage and CategoryId columns", MigrationProcessType.Update)]
public class BannerManagementCategoryMigration : MigrationBase
{
    public override void Up()
    {
        if (!DataSettingsManager.IsDatabaseInstalled())
            return;

        var bannerTableName = NameCompatibilityManager.GetTableName(typeof(Banner));
        if (!Schema.Table(bannerTableName).Exists())
            return;

        if (!Schema.Table(bannerTableName).Column(nameof(Banner.ShowOnHomePage)).Exists())
        {
            Alter.Table(bannerTableName)
                .AddColumn(nameof(Banner.ShowOnHomePage)).AsBoolean().NotNullable().SetExistingRowsTo(false);
        }

        if (!Schema.Table(bannerTableName).Column(nameof(Banner.CategoryId)).Exists())
        {
            Alter.Table(bannerTableName)
                .AddColumn(nameof(Banner.CategoryId)).AsInt32().Nullable();
        }
    }

    public override void Down()
    {
    }
}
