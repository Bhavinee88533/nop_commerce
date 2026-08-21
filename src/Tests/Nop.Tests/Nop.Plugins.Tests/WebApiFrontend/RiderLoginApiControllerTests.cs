using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Nop.Core;
using Nop.Core.Domain.Catalog;
using Nop.Core.Domain.Common;
using Nop.Core.Domain.Customers;
using Nop.Core.Domain.Directory;
using Nop.Core.Domain.Orders;
using Nop.Plugin.Misc.RiderManagement.Domains;
using Nop.Plugin.Misc.RiderManagement.Hubs;
using Nop.Plugin.Misc.RiderManagement.Services;
using Nop.Plugin.Misc.WebApi.Frontend.Controllers;
using Nop.Services.Catalog;
using Nop.Services.Common;
using Nop.Services.Customers;
using Nop.Services.Directory;
using Nop.Services.Orders;
using NUnit.Framework;
using System.Collections;

namespace Nop.Tests.Nop.Plugins.Tests.WebApiFrontend;

/// <summary>
/// Unit tests for <see cref="RiderPortalApiController"/>.
/// </summary>
[TestFixture]
public class RiderLoginApiControllerTests
{
    #region Fields

    private Mock<ICustomerService> _customerServiceMock;
    private Mock<IAddressService> _addressServiceMock;
    private Mock<ICountryService> _countryServiceMock;
    private Mock<IDeliveryOrderService> _deliveryOrderServiceMock;
    private Mock<IHubContext<RiderNotificationHub>> _hubContextMock;
    private Mock<IRiderNotificationService> _notificationServiceMock;
    private Mock<IOrderService> _orderServiceMock;
    private Mock<IProductService> _productServiceMock;
    private Mock<IRiderService> _riderServiceMock;
    private Mock<IStateProvinceService> _stateProvinceServiceMock;
    private Mock<IWorkContext> _workContextMock;
    private Mock<ILogger<RiderPortalApiController>> _loggerMock;

    private RiderPortalApiController _controller;

    #endregion

    #region Setup

    [SetUp]
    public void SetUp()
    {
        _customerServiceMock = new Mock<ICustomerService>();
        _addressServiceMock = new Mock<IAddressService>();
        _countryServiceMock = new Mock<ICountryService>();
        _deliveryOrderServiceMock = new Mock<IDeliveryOrderService>();
        _hubContextMock = new Mock<IHubContext<RiderNotificationHub>>();
        _notificationServiceMock = new Mock<IRiderNotificationService>();
        _orderServiceMock = new Mock<IOrderService>();
        _productServiceMock = new Mock<IProductService>();
        _riderServiceMock = new Mock<IRiderService>();
        _stateProvinceServiceMock = new Mock<IStateProvinceService>();
        _workContextMock = new Mock<IWorkContext>();
        _loggerMock = new Mock<ILogger<RiderPortalApiController>>();

        _controller = new RiderPortalApiController(
            _customerServiceMock.Object,
            _addressServiceMock.Object,
            _countryServiceMock.Object,
            _deliveryOrderServiceMock.Object,
            _hubContextMock.Object,
            _notificationServiceMock.Object,
            _orderServiceMock.Object,
            _productServiceMock.Object,
            _riderServiceMock.Object,
            _stateProvinceServiceMock.Object,
            _workContextMock.Object,
            _loggerMock.Object);
    }

    #endregion

    #region Helpers

    private static T GetValue<T>(object anonymousObject, string propertyName)
    {
        var property = anonymousObject.GetType().GetProperty(propertyName)
            ?? throw new InvalidOperationException($"Property '{propertyName}' not found.");
        return (T)property.GetValue(anonymousObject);
    }

    private static List<object> GetObjectList(object anonymousObject, string propertyName)
    {
        var value = GetValue<object>(anonymousObject, propertyName);
        return ((IEnumerable)value).Cast<object>().ToList();
    }

    #endregion

    #region Tests

    [Test]
    public async Task Session_WhenCustomerIsGuest_ShouldReturnUnauthorized()
    {
        var customer = new Customer { Id = 2, Active = true };
        _workContextMock.Setup(x => x.GetCurrentCustomerAsync()).ReturnsAsync(customer);
        _customerServiceMock.Setup(x => x.IsGuestAsync(customer)).ReturnsAsync(true);

        var result = await _controller.Session() as UnauthorizedObjectResult;

        Assert.That(result, Is.Not.Null);
        Assert.That(GetValue<bool>(result!.Value, "authenticated"), Is.False);
    }

    [Test]
    public async Task Exists_WhenRiderProfileExists_ShouldReturnTrue()
    {
        var customer = new Customer { Id = 3, Active = true };
        _workContextMock.Setup(x => x.GetCurrentCustomerAsync()).ReturnsAsync(customer);
        _customerServiceMock.Setup(x => x.IsGuestAsync(customer)).ReturnsAsync(false);
        _riderServiceMock.Setup(x => x.RiderExistsForCustomerAsync(customer.Id)).ReturnsAsync(true);

        var result = await _controller.Exists() as OkObjectResult;

        Assert.That(result, Is.Not.Null);
        Assert.That(GetValue<bool>(result!.Value, "exists"), Is.True);
    }

    [Test]
    public async Task Onboard_WhenRiderAlreadyExists_ShouldReturnAlreadyExistsResponse()
    {
        var customer = new Customer { Id = 4, Active = true, Email = "rider@example.com", FirstName = "Test", LastName = "Rider" };
        var existingRider = new Rider
        {
            Id = 10,
            CustomerId = customer.Id,
            Name = "Test Rider",
            RiderStatus = "Offline",
            Availability = true,
            IsApproved = true
        };

        _workContextMock.Setup(x => x.GetCurrentCustomerAsync()).ReturnsAsync(customer);
        _customerServiceMock.Setup(x => x.IsGuestAsync(customer)).ReturnsAsync(false);
        _riderServiceMock.Setup(x => x.GetRiderByCustomerIdAsync(customer.Id)).ReturnsAsync(existingRider);

        var dto = new RiderPortalApiController.CreateRiderRequestDto
        {
            VehicleType = "Bike",
            LicenseNumber = "LIC12345",
            CurrentLocation = "Hyderabad",
            Availability = true
        };

        var result = await _controller.Onboard(dto) as OkObjectResult;

        Assert.That(result, Is.Not.Null);
        Assert.That(GetValue<bool>(result!.Value, "ok"), Is.True);
        Assert.That(GetValue<bool>(result.Value, "alreadyExists"), Is.True);
        Assert.That(GetValue<string>(result.Value, "redirectUrl"), Is.EqualTo("/rider/dashboard"));
    }

    [Test]
    public async Task UpdateStatus_WhenUnauthenticated_ShouldReturnUnauthorized()
    {
        _workContextMock.Setup(x => x.GetCurrentCustomerAsync()).ReturnsAsync((Customer)null);

        var result = await _controller.UpdateStatus(new RiderPortalApiController.UpdateRiderStatusRequestDto
        {
            IsOnline = true,
            Availability = true
        }) as UnauthorizedObjectResult;

        Assert.That(result, Is.Not.Null);
        Assert.That(GetValue<bool>(result!.Value, "ok"), Is.False);
    }

    [Test]
    public async Task OrderDetails_WhenUnauthenticated_ShouldReturnUnauthorized()
    {
        _workContextMock.Setup(x => x.GetCurrentCustomerAsync()).ReturnsAsync((Customer)null);

        var result = await _controller.OrderDetails(42) as UnauthorizedObjectResult;

        Assert.That(result, Is.Not.Null);
    }

    [Test]
    public async Task OrderDetails_WhenOrderAssignedToDifferentRider_ShouldReturnForbid()
    {
        var customer = new Customer { Id = 77, Active = true, Email = "rider77@example.com" };
        var rider = new Rider { Id = 1001, CustomerId = customer.Id };

        _workContextMock.Setup(x => x.GetCurrentCustomerAsync()).ReturnsAsync(customer);
        _customerServiceMock.Setup(x => x.IsGuestAsync(customer)).ReturnsAsync(false);
        _riderServiceMock.Setup(x => x.GetRiderByCustomerIdAsync(customer.Id)).ReturnsAsync(rider);
        _deliveryOrderServiceMock.Setup(x => x.GetDeliveryOrderByOrderIdAsync(42)).ReturnsAsync(new DeliveryOrder
        {
            Id = 1,
            OrderId = 42,
            RiderId = 2002,
            Status = DeliveryOrderStatus.Assigned
        });

        var result = await _controller.OrderDetails(42);

        var objectResult = result as ObjectResult;
        Assert.That(objectResult, Is.Not.Null);
        Assert.That(objectResult!.StatusCode, Is.EqualTo(403));
        Assert.That(GetValue<string>(objectResult.Value, "error"), Does.Contain("not assigned to you"));
    }

    [Test]
    public async Task OrderDetails_WhenDeliveryOrderDoesNotExist_ShouldReturnNotFound()
    {
        var customer = new Customer { Id = 88, Active = true, Email = "rider88@example.com" };
        var rider = new Rider { Id = 808, CustomerId = customer.Id };

        _workContextMock.Setup(x => x.GetCurrentCustomerAsync()).ReturnsAsync(customer);
        _customerServiceMock.Setup(x => x.IsGuestAsync(customer)).ReturnsAsync(false);
        _riderServiceMock.Setup(x => x.GetRiderByCustomerIdAsync(customer.Id)).ReturnsAsync(rider);
        _deliveryOrderServiceMock.Setup(x => x.GetDeliveryOrderByOrderIdAsync(500)).ReturnsAsync((DeliveryOrder)null);

        var result = await _controller.OrderDetails(500) as NotFoundObjectResult;

        Assert.That(result, Is.Not.Null);
        Assert.That(GetValue<string>(result!.Value, "error"), Does.Contain("No delivery order found"));
    }

    [Test]
    public async Task OrderDetails_WhenAssignedToCurrentRider_ShouldReturnMappedOrderDetails()
    {
        var customer = new Customer { Id = 11, Active = true, Email = "customer11@example.com" };
        var rider = new Rider { Id = 501, CustomerId = customer.Id, Name = "Rider 501" };

        _workContextMock.Setup(x => x.GetCurrentCustomerAsync()).ReturnsAsync(customer);
        _customerServiceMock.Setup(x => x.IsGuestAsync(customer)).ReturnsAsync(false);
        _riderServiceMock.Setup(x => x.GetRiderByCustomerIdAsync(customer.Id)).ReturnsAsync(rider);

        _deliveryOrderServiceMock.Setup(x => x.GetDeliveryOrderByOrderIdAsync(55)).ReturnsAsync(new DeliveryOrder
        {
            Id = 901,
            OrderId = 55,
            RiderId = rider.Id,
            Status = DeliveryOrderStatus.InTransit,
            AssignedAtUtc = new DateTime(2026, 5, 25, 10, 0, 0, DateTimeKind.Utc),
            CreatedOnUtc = new DateTime(2026, 5, 25, 9, 30, 0, DateTimeKind.Utc)
        });

        _orderServiceMock.Setup(x => x.GetOrderByIdAsync(55)).ReturnsAsync(new Order
        {
            Id = 55,
            BillingAddressId = 10,
            ShippingAddressId = 20,
            PickupInStore = false,
            CustomOrderNumber = "ORD-00055",
            OrderTotal = 799.5m,
            CustomerCurrencyCode = "INR",
            CheckoutAttributeDescription = "Ring bell once at gate."
        });

        _addressServiceMock.Setup(x => x.GetAddressByIdAsync(20)).ReturnsAsync(new Address
        {
            FirstName = "Anika",
            LastName = "Sharma",
            Email = "anika@example.com",
            Address1 = "221B MG Road",
            Address2 = "Near Metro",
            City = "Bangalore",
            StateProvinceId = 3,
            ZipPostalCode = "560001",
            PhoneNumber = "9876543210"
        });

        _countryServiceMock.Setup(x => x.GetCountryByAddressAsync(It.IsAny<Address>())).ReturnsAsync(new Country
        {
            Name = "India"
        });

        _stateProvinceServiceMock.Setup(x => x.GetStateProvinceByIdAsync(3)).ReturnsAsync(new StateProvince
        {
            Name = "Karnataka"
        });

        _orderServiceMock.Setup(x => x.GetOrderItemsAsync(55, null, null, 0)).ReturnsAsync(new List<OrderItem>
        {
            new()
            {
                ProductId = 7001,
                Quantity = 2,
                UnitPriceInclTax = 199.75m,
                PriceInclTax = 399.50m
            }
        });

        _productServiceMock.Setup(x => x.GetProductByIdAsync(7001)).ReturnsAsync(new Product
        {
            Id = 7001,
            Name = "Quick Bites Combo"
        });

        var result = await _controller.OrderDetails(55) as OkObjectResult;

        Assert.That(result, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(GetValue<int>(result!.Value, "orderId"), Is.EqualTo(55));
            Assert.That(GetValue<int>(result.Value, "deliveryOrderId"), Is.EqualTo(901));
            Assert.That(GetValue<string>(result.Value, "deliveryStatus"), Is.EqualTo("Out for Delivery"));
            Assert.That(GetValue<string>(result.Value, "customOrderNumber"), Is.EqualTo("ORD-00055"));
            Assert.That(GetValue<decimal>(result.Value, "orderTotal"), Is.EqualTo(799.5m * 83m));
            Assert.That(GetValue<string>(result.Value, "deliveryInstructions"), Is.EqualTo("Ring bell once at gate."));
        });

        var customerPayload = GetValue<object>(result.Value, "customer");
        Assert.That(GetValue<string>(customerPayload, "customerName"), Is.EqualTo("Anika Sharma"));

        var addressPayload = GetValue<object>(result.Value, "deliveryAddress");
        Assert.That(GetValue<string>(addressPayload, "city"), Is.EqualTo("Bangalore"));
        Assert.That(GetValue<string>(addressPayload, "stateProvince"), Is.EqualTo("Karnataka"));
        Assert.That(GetValue<string>(addressPayload, "country"), Is.EqualTo("India"));

        var items = GetObjectList(result.Value, "items");
        Assert.That(items, Has.Count.EqualTo(1));
        Assert.That(GetValue<string>(items[0], "itemName"), Is.EqualTo("Quick Bites Combo"));
        Assert.That(GetValue<int>(items[0], "quantity"), Is.EqualTo(2));
    }

    #endregion
}
