using Nop.Data.Mapping;
using Nop.Plugin.Misc.RiderManagement.Domains;

namespace Nop.Plugin.Misc.RiderManagement.Data.Mapping;

/// <summary>
/// Defines custom table names for rider management plugin entities
/// </summary>
public class RiderNameCompatibility : INameCompatibility
{
    public Dictionary<Type, string> TableNames => new()
    {
        [typeof(Rider)] = "RiderManagement_Rider",
        [typeof(DeliveryOrder)] = "RiderManagement_DeliveryOrder"
    };

    public Dictionary<(Type, string), string> ColumnName => new();
}
