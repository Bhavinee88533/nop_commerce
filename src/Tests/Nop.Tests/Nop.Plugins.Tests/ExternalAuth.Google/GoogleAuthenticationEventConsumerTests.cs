using System.Security.Claims;
using Moq;
using Nop.Core.Domain.Customers;
using Nop.Plugin.ExternalAuth.Google;
using Nop.Plugin.ExternalAuth.Google.Infrastructure;
using Nop.Services.Authentication.External;
using Nop.Services.Customers;
using NUnit.Framework;

namespace Nop.Tests.Nop.Plugins.Tests.ExternalAuth.Google;

/// <summary>
/// Unit tests for <see cref="GoogleAuthenticationEventConsumer"/> covering auto-registration:
/// - New users get FirstName/LastName populated from Google claims
/// - Default fields assigned during auto-registration
/// - Guard clauses for missing data
/// </summary>
[TestFixture]
public class GoogleAuthenticationEventConsumerTests
{
    #region Fields

    private Mock<ICustomerService> _customerServiceMock;
    private GoogleAuthenticationEventConsumer _consumer;

    #endregion

    #region Setup

    [SetUp]
    public void SetUp()
    {
        _customerServiceMock = new Mock<ICustomerService>();
        _consumer = new GoogleAuthenticationEventConsumer(_customerServiceMock.Object);
    }

    #endregion

    #region New User Auto-Registration - Name Population

    [Test]
    public async Task HandleEvent_NewUser_PopulatesFirstNameFromGoogleGivenNameClaim()
    {
        // Arrange
        var customer = new Customer { Id = 1 };
        var authParams = new ExternalAuthenticationParameters
        {
            ProviderSystemName = GoogleAuthenticationDefaults.SystemName,
            Email = "newuser@example.com",
            Claims = new List<ExternalAuthenticationClaim>
            {
                new ExternalAuthenticationClaim(ClaimTypes.GivenName, "John"),
                new ExternalAuthenticationClaim(ClaimTypes.Surname, "Doe")
            }
        };

        var eventMessage = new CustomerAutoRegisteredByExternalMethodEvent(customer, authParams);

        // Act
        await _consumer.HandleEventAsync(eventMessage);

        // Assert
        Assert.That(customer.FirstName, Is.EqualTo("John"));
    }

    [Test]
    public async Task HandleEvent_NewUser_PopulatesLastNameFromGoogleSurnameClaim()
    {
        // Arrange
        var customer = new Customer { Id = 2 };
        var authParams = new ExternalAuthenticationParameters
        {
            ProviderSystemName = GoogleAuthenticationDefaults.SystemName,
            Email = "jane@example.com",
            Claims = new List<ExternalAuthenticationClaim>
            {
                new ExternalAuthenticationClaim(ClaimTypes.GivenName, "Jane"),
                new ExternalAuthenticationClaim(ClaimTypes.Surname, "Smith")
            }
        };

        var eventMessage = new CustomerAutoRegisteredByExternalMethodEvent(customer, authParams);

        // Act
        await _consumer.HandleEventAsync(eventMessage);

        // Assert
        Assert.That(customer.LastName, Is.EqualTo("Smith"));
    }

    [Test]
    public async Task HandleEvent_NewUser_CallsUpdateCustomerAsync()
    {
        // Arrange
        var customer = new Customer { Id = 3 };
        var authParams = new ExternalAuthenticationParameters
        {
            ProviderSystemName = GoogleAuthenticationDefaults.SystemName,
            Email = "update@example.com",
            Claims = new List<ExternalAuthenticationClaim>
            {
                new ExternalAuthenticationClaim(ClaimTypes.GivenName, "Update"),
                new ExternalAuthenticationClaim(ClaimTypes.Surname, "Test")
            }
        };

        var eventMessage = new CustomerAutoRegisteredByExternalMethodEvent(customer, authParams);

        // Act
        await _consumer.HandleEventAsync(eventMessage);

        // Assert - customer should be persisted
        _customerServiceMock.Verify(s => s.UpdateCustomerAsync(customer), Times.Once);
    }

    [Test]
    public async Task HandleEvent_NewUser_BothFirstAndLastNamePopulated()
    {
        // Arrange
        var customer = new Customer { Id = 4 };
        var authParams = new ExternalAuthenticationParameters
        {
            ProviderSystemName = GoogleAuthenticationDefaults.SystemName,
            Email = "fullname@example.com",
            Claims = new List<ExternalAuthenticationClaim>
            {
                new ExternalAuthenticationClaim(ClaimTypes.GivenName, "Alice"),
                new ExternalAuthenticationClaim(ClaimTypes.Surname, "Wonderland"),
                new ExternalAuthenticationClaim(ClaimTypes.Email, "fullname@example.com")
            }
        };

        var eventMessage = new CustomerAutoRegisteredByExternalMethodEvent(customer, authParams);

        // Act
        await _consumer.HandleEventAsync(eventMessage);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(customer.FirstName, Is.EqualTo("Alice"));
            Assert.That(customer.LastName, Is.EqualTo("Wonderland"));
        });
    }

    #endregion

    #region Guard Clauses

    [Test]
    public async Task HandleEvent_NullCustomer_DoesNotThrow()
    {
        // Arrange
        var eventMessage = new CustomerAutoRegisteredByExternalMethodEvent(null,
            new ExternalAuthenticationParameters
            {
                ProviderSystemName = GoogleAuthenticationDefaults.SystemName
            });

        // Act & Assert - should silently return
        Assert.DoesNotThrowAsync(async () => await _consumer.HandleEventAsync(eventMessage));
        _customerServiceMock.Verify(s => s.UpdateCustomerAsync(It.IsAny<Customer>()), Times.Never);
    }

    [Test]
    public async Task HandleEvent_NullAuthenticationParameters_DoesNotThrow()
    {
        // Arrange
        var customer = new Customer { Id = 5 };
        var eventMessage = new CustomerAutoRegisteredByExternalMethodEvent(customer, null);

        // Act & Assert
        Assert.DoesNotThrowAsync(async () => await _consumer.HandleEventAsync(eventMessage));
        _customerServiceMock.Verify(s => s.UpdateCustomerAsync(It.IsAny<Customer>()), Times.Never);
    }

    [Test]
    public async Task HandleEvent_DifferentProvider_IgnoresEvent()
    {
        // Arrange - event from a different auth provider
        var customer = new Customer { Id = 6 };
        var authParams = new ExternalAuthenticationParameters
        {
            ProviderSystemName = "ExternalAuth.Facebook",
            Email = "fb@example.com",
            Claims = new List<ExternalAuthenticationClaim>
            {
                new ExternalAuthenticationClaim(ClaimTypes.GivenName, "Facebook"),
                new ExternalAuthenticationClaim(ClaimTypes.Surname, "User")
            }
        };

        var eventMessage = new CustomerAutoRegisteredByExternalMethodEvent(customer, authParams);

        // Act
        await _consumer.HandleEventAsync(eventMessage);

        // Assert - should not update customer for non-Google providers
        _customerServiceMock.Verify(s => s.UpdateCustomerAsync(It.IsAny<Customer>()), Times.Never);
    }

    [Test]
    public async Task HandleEvent_NoClaims_DoesNotUpdateCustomer()
    {
        // Arrange
        var customer = new Customer { Id = 7 };
        var authParams = new ExternalAuthenticationParameters
        {
            ProviderSystemName = GoogleAuthenticationDefaults.SystemName,
            Email = "noclaims@example.com",
            Claims = new List<ExternalAuthenticationClaim>()
        };

        var eventMessage = new CustomerAutoRegisteredByExternalMethodEvent(customer, authParams);

        // Act
        await _consumer.HandleEventAsync(eventMessage);

        // Assert
        _customerServiceMock.Verify(s => s.UpdateCustomerAsync(It.IsAny<Customer>()), Times.Never);
    }

    [Test]
    public async Task HandleEvent_NullClaims_DoesNotUpdateCustomer()
    {
        // Arrange
        var customer = new Customer { Id = 8 };
        var authParams = new ExternalAuthenticationParameters
        {
            ProviderSystemName = GoogleAuthenticationDefaults.SystemName,
            Email = "nullclaims@example.com",
            Claims = null
        };

        var eventMessage = new CustomerAutoRegisteredByExternalMethodEvent(customer, authParams);

        // Act
        await _consumer.HandleEventAsync(eventMessage);

        // Assert
        _customerServiceMock.Verify(s => s.UpdateCustomerAsync(It.IsAny<Customer>()), Times.Never);
    }

    [Test]
    public async Task HandleEvent_MissingGivenNameClaim_DoesNotSetFirstName()
    {
        // Arrange - only surname claim present
        var customer = new Customer { Id = 9, FirstName = null };
        var authParams = new ExternalAuthenticationParameters
        {
            ProviderSystemName = GoogleAuthenticationDefaults.SystemName,
            Email = "nofirst@example.com",
            Claims = new List<ExternalAuthenticationClaim>
            {
                new ExternalAuthenticationClaim(ClaimTypes.Surname, "OnlyLast")
            }
        };

        var eventMessage = new CustomerAutoRegisteredByExternalMethodEvent(customer, authParams);

        // Act
        await _consumer.HandleEventAsync(eventMessage);

        // Assert
        Assert.That(customer.FirstName, Is.Null);
        Assert.That(customer.LastName, Is.EqualTo("OnlyLast"));
    }

    [Test]
    public async Task HandleEvent_MissingSurnameClaim_DoesNotSetLastName()
    {
        // Arrange - only given name claim present
        var customer = new Customer { Id = 10, LastName = null };
        var authParams = new ExternalAuthenticationParameters
        {
            ProviderSystemName = GoogleAuthenticationDefaults.SystemName,
            Email = "nolast@example.com",
            Claims = new List<ExternalAuthenticationClaim>
            {
                new ExternalAuthenticationClaim(ClaimTypes.GivenName, "OnlyFirst")
            }
        };

        var eventMessage = new CustomerAutoRegisteredByExternalMethodEvent(customer, authParams);

        // Act
        await _consumer.HandleEventAsync(eventMessage);

        // Assert
        Assert.That(customer.FirstName, Is.EqualTo("OnlyFirst"));
        Assert.That(customer.LastName, Is.Null);
    }

    #endregion
}
