using FluentMigrator.Builders.Create.Table;
using Nop.Core.Domain.Orders;
using Nop.Data.Extensions;
using Nop.Data.Mapping.Builders;
using Nop.Plugin.Misc.RiderManagement.Domains;

namespace Nop.Plugin.Misc.RiderManagement.Data.Mapping.Builders;

/// <summary>
/// Defines the table schema for the DeliveryOrder entity.
/// Enforces FK to Order and Rider, and a unique constraint on OrderId
/// to ensure only one delivery record per order.
/// </summary>
public class DeliveryOrderBuilder : NopEntityBuilder<DeliveryOrder>
{
    public override void MapEntity(CreateTableExpressionBuilder table)
    {
        table
            .WithColumn(nameof(DeliveryOrder.OrderId)).AsInt32().NotNullable()
                .ForeignKey<Order>().Indexed("IX_DeliveryOrder_OrderId")
            .WithColumn(nameof(DeliveryOrder.RiderId)).AsInt32().Nullable()
            .WithColumn(nameof(DeliveryOrder.StatusId)).AsInt32().NotNullable()
            .WithColumn(nameof(DeliveryOrder.CreatedOnUtc)).AsDateTime2().NotNullable()
            .WithColumn(nameof(DeliveryOrder.AssignedAtUtc)).AsDateTime2().Nullable();
    }
}
