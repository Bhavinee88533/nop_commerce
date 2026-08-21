using System.Security.Claims;
using Nop.Services.Authentication.External;
using Nop.Services.Customers;
using Nop.Services.Events;

namespace Nop.Plugin.ExternalAuth.Google.Infrastructure;

/// <summary>
/// Handles the <see cref="CustomerAutoRegisteredByExternalMethodEvent"/> raised by nopCommerce
/// when a new customer is auto-registered via an external authentication provider.
/// Copies the Google-provided first and last name into the newly created customer record.
/// </summary>
public class GoogleAuthenticationEventConsumer : IConsumer<CustomerAutoRegisteredByExternalMethodEvent>
{
    #region Fields

    private readonly ICustomerService _customerService;

    #endregion

    #region Ctor

    /// <summary>
    /// Initializes a new instance of <see cref="GoogleAuthenticationEventConsumer"/>.
    /// </summary>
    /// <param name="customerService">The nopCommerce customer service.</param>
    public GoogleAuthenticationEventConsumer(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Handles the auto-registration event by populating first and last name from Google claims.
    /// </summary>
    /// <param name="eventMessage">The event message containing the customer and auth parameters.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task HandleEventAsync(CustomerAutoRegisteredByExternalMethodEvent eventMessage)
    {
        // Guard: ignore events with missing data.
        if (eventMessage?.Customer == null || eventMessage.AuthenticationParameters == null)
            return;

        // Guard: only handle events raised by this plugin.
        if (!eventMessage.AuthenticationParameters.ProviderSystemName
                .Equals(GoogleAuthenticationDefaults.SystemName, StringComparison.InvariantCultureIgnoreCase))
            return;

        var customer = eventMessage.Customer;
        var claims = eventMessage.AuthenticationParameters.Claims;

        if (claims == null || !claims.Any())
            return;

        // Populate FirstName from the Google GivenName claim.
        var givenName = claims
            .FirstOrDefault(c => c.Type.Equals(ClaimTypes.GivenName, StringComparison.OrdinalIgnoreCase))
            ?.Value;

        if (!string.IsNullOrWhiteSpace(givenName))
            customer.FirstName = givenName;

        // Populate LastName from the Google Surname claim.
        var surname = claims
            .FirstOrDefault(c => c.Type.Equals(ClaimTypes.Surname, StringComparison.OrdinalIgnoreCase))
            ?.Value;

        if (!string.IsNullOrWhiteSpace(surname))
            customer.LastName = surname;

        await _customerService.UpdateCustomerAsync(customer);
    }

    #endregion
}
