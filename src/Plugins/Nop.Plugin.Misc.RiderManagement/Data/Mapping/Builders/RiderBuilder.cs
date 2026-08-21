using FluentMigrator;
using FluentMigrator.Builders.Create.Table;
using Nop.Core.Domain.Customers;
using Nop.Data.Extensions;
using Nop.Data.Mapping.Builders;
using Nop.Plugin.Misc.RiderManagement.Domains;

namespace Nop.Plugin.Misc.RiderManagement.Data.Mapping.Builders;

/// <summary>
/// Defines the table schema for the Rider entity using FluentMigrator
/// </summary>
public class RiderBuilder : NopEntityBuilder<Rider>
{
    /// <summary>
    /// Apply entity configuration
    /// </summary>
    /// <param name="table">Create table expression builder</param>
    public override void MapEntity(CreateTableExpressionBuilder table)
    {
        table
            .WithColumn(nameof(Rider.Name)).AsString(400).NotNullable()
            .WithColumn(nameof(Rider.Phone)).AsString(50).Nullable()
            .WithColumn(nameof(Rider.Email)).AsString(1000).Nullable()
            .WithColumn(nameof(Rider.StatusId)).AsInt32().NotNullable()
            .WithColumn(nameof(Rider.IsOnline)).AsBoolean().NotNullable()
            .WithColumn(nameof(Rider.RiderStatus)).AsString(50).NotNullable().WithDefaultValue("Offline")
            .WithColumn(nameof(Rider.IsAvailable)).AsBoolean().NotNullable().WithDefaultValue(true)
            .WithColumn(nameof(Rider.Availability)).AsBoolean().NotNullable().WithDefaultValue(true)
            .WithColumn(nameof(Rider.VehicleType)).AsString(100).Nullable()
            .WithColumn(nameof(Rider.LicenseNumber)).AsString(100).Nullable()
            .WithColumn(nameof(Rider.CurrentLocation)).AsString(400).Nullable()
            .WithColumn(nameof(Rider.IsApproved)).AsBoolean().NotNullable().WithDefaultValue(false)
            .WithColumn(nameof(Rider.CreatedAtUtc)).AsDateTime2().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime)
            .WithColumn(nameof(Rider.UpdatedAtUtc)).AsDateTime2().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime)
            .WithColumn(nameof(Rider.CustomerId)).AsInt32().ForeignKey<Customer>().Indexed("IX_Rider_CustomerId");
    }
}
