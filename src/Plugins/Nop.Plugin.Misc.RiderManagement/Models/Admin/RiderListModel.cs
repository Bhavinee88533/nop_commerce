using Nop.Web.Framework.Models;

namespace Nop.Plugin.Misc.RiderManagement.Models.Admin;

/// <summary>
/// Represents a paged list model for riders
/// </summary>
public record RiderListModel : BasePagedListModel<RiderModel>;
