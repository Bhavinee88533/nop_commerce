using FluentMigrator;
using Nop.Data;
using Nop.Data.Mapping;
using Nop.Data.Migrations;
using Nop.Plugin.Widgets.BannerManagement.Domain;
using Nop.Web.Framework.Extensions;

namespace Nop.Plugin.Widgets.BannerManagement.Data.Migrations;

[NopMigration("2026-05-24 12:00:00", "Widgets.BannerManagement 1.10. Add banner scheduling and metadata", MigrationProcessType.Update)]
public class BannerManagementUpdateMigration : MigrationBase
{
    public override void Up()
    {
        if (!DataSettingsManager.IsDatabaseInstalled())
            return;

        var bannerTableName = NameCompatibilityManager.GetTableName(typeof(Banner));
        if (!Schema.Table(bannerTableName).Exists())
            return;

        if (!Schema.Table(bannerTableName).Column("StartDateUtc").Exists())
        {
            Alter.Table(bannerTableName)
                .AddColumn("StartDateUtc").AsDateTime().Nullable();
        }

        if (!Schema.Table(bannerTableName).Column("EndDateUtc").Exists())
        {
            Alter.Table(bannerTableName)
                .AddColumn("EndDateUtc").AsDateTime().Nullable();
        }

        if (!Schema.Table(bannerTableName).Column(nameof(Banner.UpdatedOnUtc)).Exists())
        {
            Alter.Table(bannerTableName)
                .AddColumn(nameof(Banner.UpdatedOnUtc)).AsDateTime().NotNullable().SetExistingRowsTo(DateTime.UtcNow);
        }

        this.AddOrUpdateLocaleResource(new Dictionary<string, string>(BannerManagementDefaults.LocaleResources));
    }

    public override void Down()
    {
    }
}