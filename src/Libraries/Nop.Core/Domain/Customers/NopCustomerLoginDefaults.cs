namespace Nop.Core.Domain.Customers;

/// <summary>
/// Represents default values related to customer login
/// </summary>
public static partial class NopCustomerLoginDefaults
{
    /// <summary>
    /// Gets the key for storing selected login method in session
    /// </summary>
    public static string SelectedLoginMethodSessionKey => "Nop.SelectedLoginMethod";
}
