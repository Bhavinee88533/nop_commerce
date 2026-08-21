using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Nop.Core;
using Nop.Core.Domain.Customers;
using Nop.Core.Domain.Orders;
using Nop.Plugin.Misc.RiderManagement.Domains;
using Nop.Plugin.Misc.RiderManagement.Hubs;
using Nop.Plugin.Misc.RiderManagement.Services;
using Nop.Services.Catalog;
using Nop.Services.Common;
using Nop.Services.Customers;
using Nop.Services.Directory;
using Nop.Services.Orders;

namespace Nop.Plugin.Misc.WebApi.Frontend.Controllers;

/// <summary>
/// Rider portal API.
///
/// This controller intentionally does not implement separate rider authentication.
/// It reuses the existing nopCommerce customer session and only adds rider conversion + rider operations.
/// </summary>
public class RiderPortalApiController : ControllerBase
{
    private const string RiderRoleSystemName = "Rider";

    private readonly ICustomerService _customerService;
    private readonly IAddressService _addressService;
    private readonly ICountryService _countryService;
    private readonly IDeliveryOrderService _deliveryOrderService;
    private readonly IHubContext<RiderNotificationHub> _hubContext;
    private readonly IRiderNotificationService _notificationService;
    private readonly IOrderService _orderService;
    private readonly IProductService _productService;
    private readonly IRiderService _riderService;
    private readonly IStateProvinceService _stateProvinceService;
    private readonly IWorkContext _workContext;
    private readonly ILogger<RiderPortalApiController> _logger;

    public RiderPortalApiController(
        ICustomerService customerService,
        IAddressService addressService,
        ICountryService countryService,
        IDeliveryOrderService deliveryOrderService,
        IHubContext<RiderNotificationHub> hubContext,
        IRiderNotificationService notificationService,
        IOrderService orderService,
        IProductService productService,
        IRiderService riderService,
        IStateProvinceService stateProvinceService,
        IWorkContext workContext,
        ILogger<RiderPortalApiController> logger)
    {
        _customerService = customerService;
        _addressService = addressService;
        _countryService = countryService;
        _deliveryOrderService = deliveryOrderService;
        _hubContext = hubContext;
        _notificationService = notificationService;
        _orderService = orderService;
        _productService = productService;
        _riderService = riderService;
        _stateProvinceService = stateProvinceService;
        _workContext = workContext;
        _logger = logger;
    }

    /// <summary>
    /// Session snapshot used by the Angular app to decide whether to show "Become a Rider"
    /// or redirect directly to dashboard.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Session()
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { authenticated = false, error = "Customer login is required." });

        var rider = await _riderService.GetRiderByCustomerIdAsync(customer.Id);
        var fullName = $"{customer.FirstName} {customer.LastName}".Trim();

        return Ok(new
        {
            authenticated = true,
            customerId = customer.Id,
            name = string.IsNullOrWhiteSpace(fullName) ? customer.Username ?? customer.Email : fullName,
            email = customer.Email,
            isRider = rider != null,
            riderId = rider?.Id
        });
    }

    /// <summary>
    /// POST api/rider/test-notification
    /// Sends a test SignalR notification to the current rider.
    /// Use this to verify the SignalR pipeline end-to-end.
    /// </summary>
    [HttpPost]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> TestNotification()
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { ok = false, error = "Customer login is required." });

        var groupName = RiderNotificationHub.GetGroupName(customer.Id);
        var payload = new
        {
            notificationId = $"test-{DateTime.UtcNow.Ticks}",
            orderId = 0,
            orderTotal = "₹TEST",
            shippingAddress = "Test Address, Test City",
            customerName = "Test Customer",
            customerPhone = "9999999999",
            sentAtUtc = DateTime.UtcNow
        };

        await _hubContext.Clients.Group(groupName).SendAsync("NewOrderAvailable", payload);
        _logger.LogInformation("TestNotification: sent to group {Group} for customerId={CustomerId}", groupName, customer.Id);

        return Ok(new { ok = true, group = groupName, customerId = customer.Id });
    }

    /// <summary>
    /// POST api/rider/simulate-order?orderId=X
    /// Re-fires the full OrderEventConsumer notification pipeline using a real order's data.
    /// Use this to prove end-to-end: real order data → city filter → SignalR → dashboard.
    /// </summary>
    [HttpPost]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> SimulateOrder([FromQuery] int orderId = 0)
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { ok = false, error = "Customer login required." });

        // If no orderId, pick the most recent order in the system
        Order order = null;
        if (orderId > 0)
        {
            order = await _orderService.GetOrderByIdAsync(orderId);
        }
        else
        {
            var recentOrders = await _orderService.SearchOrdersAsync(pageSize: 1);
            order = recentOrders.FirstOrDefault();
        }

        if (order == null)
            return NotFound(new { ok = false, error = "No orders found. Place at least one order first." });

        // Build same payload as OrderEventConsumer
        var orderTotal = "₹" + (order.OrderTotal * 83m).ToString("N2");
        var address = order.ShippingAddressId.HasValue
            ? await _addressService.GetAddressByIdAsync(order.ShippingAddressId.Value)
            : null;
        var shippingAddress = address != null ? $"{address.Address1}, {address.City}" : string.Empty;
        var deliveryCity = address?.City ?? string.Empty;

        var orderCustomer = await _customerService.GetCustomerByIdAsync(order.CustomerId);
        var customerName = orderCustomer != null
            ? $"{orderCustomer.FirstName} {orderCustomer.LastName}".Trim()
            : string.Empty;
        if (string.IsNullOrWhiteSpace(customerName))
            customerName = orderCustomer?.Username ?? orderCustomer?.Email ?? string.Empty;
        var customerPhone = address?.PhoneNumber ?? orderCustomer?.Phone ?? string.Empty;

        // Fire the real notification service (city filter + available riders)
        await _notificationService.SendNewOrderToAllAvailableRidersAsync(
            order.Id, orderTotal, shippingAddress, deliveryCity, customerName, customerPhone);

        _logger.LogInformation(
            "SimulateOrder: fired notification for orderId={OrderId}, city='{City}', total={Total}",
            order.Id, deliveryCity, orderTotal);

        return Ok(new
        {
            ok = true,
            orderId = order.Id,
            orderTotal,
            shippingAddress,
            deliveryCity,
            customerName,
            customerPhone
        });
    }

    /// <summary>
    /// Checks whether rider profile already exists for current customer.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Exists()
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { exists = false, error = "Customer login is required." });

        var exists = await _riderService.RiderExistsForCustomerAsync(customer.Id);
        return Ok(new { exists });
    }

    /// <summary>
    /// Creates rider profile from existing customer account.
    /// This endpoint powers the "Become a Rider" onboarding flow.
    /// </summary>
    [HttpPost]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> Onboard([FromBody] CreateRiderRequestDto dto)
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { ok = false, error = "Customer login is required before onboarding." });

        if (!ModelState.IsValid)
            return BadRequest(new { ok = false, error = "Please provide valid rider details.", details = ModelState });

        var existingRider = await _riderService.GetRiderByCustomerIdAsync(customer.Id);
        if (existingRider != null)
        {
            return Ok(new
            {
                ok = true,
                alreadyExists = true,
                rider = MapRider(existingRider),
                redirectUrl = "/rider/dashboard"
            });
        }

        var rider = await _riderService.CreateRiderFromCustomerAsync(
            customer,
            dto.VehicleType,
            dto.LicenseNumber,
            dto.CurrentLocation);

        await EnsureCustomerHasRiderRoleAsync(customer);

        // Allow onboarding payload to override availability preference after profile creation.
        if (dto.Availability.HasValue)
            rider = await _riderService.UpdateRiderStatusByCustomerIdAsync(customer.Id, rider.IsOnline, dto.Availability.Value);

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Customer {CustomerId} converted to rider {RiderId}.", customer.Id, rider.Id);

        return Ok(new
        {
            ok = true,
            alreadyExists = false,
            rider = MapRider(rider),
            redirectUrl = "/rider/dashboard"
        });
    }

    /// <summary>
    /// Gets rider profile for current customer.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Profile()
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { error = "Customer login is required." });

        var rider = await _riderService.GetRiderByCustomerIdAsync(customer.Id);
        if (rider == null)
            return NotFound(new { error = "Rider profile not found for current customer." });

        return Ok(MapRider(rider));
    }

    /// <summary>
    /// Gets rider by customer id. Restricted to self lookup or administrator accounts.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetByCustomerId(int customerId)
    {
        var currentCustomer = await GetAuthenticatedCustomerAsync();
        if (currentCustomer == null)
            return Unauthorized(new { error = "Customer login is required." });

        var isAdmin = await _customerService.IsInCustomerRoleAsync(currentCustomer, NopCustomerDefaults.AdministratorsRoleName, true);
        if (!isAdmin && currentCustomer.Id != customerId)
            return Forbid();

        var rider = await _riderService.GetRiderByCustomerIdAsync(customerId);
        if (rider == null)
            return NotFound(new { error = $"No rider profile exists for customer {customerId}." });

        return Ok(MapRider(rider));
    }

    /// <summary>
    /// Updates rider online/offline status and availability.
    /// </summary>
    [HttpPatch]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateRiderStatusRequestDto dto)
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { ok = false, error = "Customer login is required." });

        if (!ModelState.IsValid)
            return BadRequest(new { ok = false, error = "Invalid status payload.", details = ModelState });

        var rider = await _riderService.UpdateRiderStatusByCustomerIdAsync(customer.Id, dto.IsOnline, dto.Availability);

        return Ok(new
        {
            ok = true,
            rider = MapRider(rider)
        });
    }

    /// <summary>
    /// Returns dashboard-ready aggregate metrics and profile data.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Dashboard()
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { error = "Customer login is required." });

        try
        {
            var dashboard = await _riderService.GetDashboardDataByCustomerIdAsync(customer.Id);
            return Ok(dashboard);
        }
        catch (InvalidOperationException exception)
        {
            return NotFound(new { error = exception.Message });
        }
    }

    /// <summary>
    /// Rider accepts a pending delivery order. Assigns the current rider to it.
    /// </summary>
    [HttpPost]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> AcceptOrder(int orderId)
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { ok = false, error = "Customer login is required." });

        var rider = await _riderService.GetRiderByCustomerIdAsync(customer.Id);
        if (rider == null)
            return NotFound(new { ok = false, error = "Rider profile not found." });

        var order = await _orderService.GetOrderByIdAsync(orderId);
        if (order == null)
            return NotFound(new { ok = false, error = $"Order {orderId} not found." });

        DeliveryOrder deliveryOrder;
        try
        {
            deliveryOrder = await _deliveryOrderService.AssignRiderAsync(orderId, rider.Id);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(
                "Rider {RiderId} tried to accept order {OrderId} but it was already taken: {Message}",
                rider.Id, orderId, ex.Message);
            return Conflict(new { ok = false, error = "Order already accepted by another rider." });
        }

        _logger.LogInformation(
            "Rider {RiderId} accepted order {OrderId} - DeliveryOrder {DeliveryOrderId} assigned.",
            rider.Id, orderId, deliveryOrder.Id);

        return Ok(new { ok = true, orderId, riderId = rider.Id, deliveryOrderId = deliveryOrder.Id });
    }

    /// <summary>
    /// Rider rejects a pending delivery order. Order remains available for others.
    /// </summary>
    [HttpPost]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> RejectOrder(int orderId)
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { ok = false, error = "Customer login is required." });

        var rider = await _riderService.GetRiderByCustomerIdAsync(customer.Id);
        if (rider == null)
            return NotFound(new { ok = false, error = "Rider profile not found." });

        _logger.LogInformation("Rider {RiderId} rejected order {OrderId}.", rider.Id, orderId);
        return Ok(new { ok = true, orderId, riderId = rider.Id });
    }

    /// <summary>
    /// Returns rider-facing details for one assigned order.
    /// This endpoint is intentionally scoped to the currently authenticated rider.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> OrderDetails(int orderId)
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { error = "Customer login is required." });

        var rider = await _riderService.GetRiderByCustomerIdAsync(customer.Id);
        if (rider == null)
            return StatusCode(403, new { error = "Rider profile not found. Please complete onboarding." });

        var deliveryOrder = await _deliveryOrderService.GetDeliveryOrderByOrderIdAsync(orderId);
        if (deliveryOrder == null)
            return NotFound(new { error = $"No delivery order found for order id {orderId}." });

        if (!deliveryOrder.RiderId.HasValue || deliveryOrder.RiderId.Value != rider.Id)
            return StatusCode(403, new { error = "This order is not assigned to you." });

        var order = await _orderService.GetOrderByIdAsync(orderId);
        if (order == null)
            return NotFound(new { error = $"Order {orderId} not found." });

        var addressId = (order.PickupInStore ? order.PickupAddressId : order.ShippingAddressId) ?? order.BillingAddressId;
        var deliveryAddress = await _addressService.GetAddressByIdAsync(addressId);

        var country = deliveryAddress != null
            ? await _countryService.GetCountryByAddressAsync(deliveryAddress)
            : null;

        var stateProvince = deliveryAddress?.StateProvinceId > 0
            ? await _stateProvinceService.GetStateProvinceByIdAsync(deliveryAddress.StateProvinceId.Value)
            : null;

        var orderItems = await _orderService.GetOrderItemsAsync(order.Id);

        var items = new List<object>(orderItems.Count);
        foreach (var orderItem in orderItems)
        {
            var product = await _productService.GetProductByIdAsync(orderItem.ProductId);

            // Convert USD → INR at 1 USD = 83 INR.
            items.Add(new
            {
                productId = orderItem.ProductId,
                itemName = product?.Name ?? $"Product #{orderItem.ProductId}",
                quantity = orderItem.Quantity,
                unitPrice = orderItem.UnitPriceInclTax * 83m,
                totalPrice = orderItem.PriceInclTax * 83m
            });
        }

        // TODO: Add dedicated DeliveryInstructions column/table and stop overloading checkout attribute text.
        var deliveryInstructions = string.IsNullOrWhiteSpace(order.CheckoutAttributeDescription)
            ? null
            : order.CheckoutAttributeDescription;

        var customerName = string.Join(" ", new[] { deliveryAddress?.FirstName, deliveryAddress?.LastName }
            .Where(namePart => !string.IsNullOrWhiteSpace(namePart)));

        if (string.IsNullOrWhiteSpace(customerName))
            customerName = customer.Email;

        return Ok(new
        {
            orderId = order.Id,
            deliveryOrderId = deliveryOrder.Id,
            customOrderNumber = order.CustomOrderNumber,
            orderTotal = order.OrderTotal * 83m, // Convert USD → INR at 1 USD = 83 INR
            currencyCode = "INR",
            deliveryStatus = MapDeliveryStatus(deliveryOrder.Status),
            deliveryStatusId = (int)deliveryOrder.Status,
            assignedAtUtc = deliveryOrder.AssignedAtUtc,
            createdOnUtc = deliveryOrder.CreatedOnUtc,
            customer = new
            {
                customerId = customer.Id,
                customerName,
                email = deliveryAddress?.Email ?? customer.Email
            },
            deliveryAddress = new
            {
                firstName = deliveryAddress?.FirstName,
                lastName = deliveryAddress?.LastName,
                company = deliveryAddress?.Company,
                address1 = deliveryAddress?.Address1,
                address2 = deliveryAddress?.Address2,
                city = deliveryAddress?.City,
                stateProvince = stateProvince?.Name,
                country = country?.Name,
                zipPostalCode = deliveryAddress?.ZipPostalCode,
                phoneNumber = deliveryAddress?.PhoneNumber,
                // TODO: Introduce latitude/longitude persistence for precise rider map navigation.
                latitude = (decimal?)null,
                longitude = (decimal?)null
            },
            deliveryInstructions,
            items
        });
    }

    /// <summary>
    /// Returns a summary list of active delivery orders (Assigned, PickedUp, InTransit) for the current rider.
    /// Used by the Accepted Orders page to show per-order status badges and action buttons.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ActiveDeliveries()
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { error = "Customer login is required." });

        var rider = await _riderService.GetRiderByCustomerIdAsync(customer.Id);
        if (rider == null)
            return NotFound(new { error = "Rider profile not found." });

        var deliveryOrders = await _deliveryOrderService.GetDeliveryOrdersByRiderIdAsync(rider.Id);
        var activeStatuses = new HashSet<DeliveryOrderStatus>
        {
            DeliveryOrderStatus.Assigned,
            DeliveryOrderStatus.PickedUp,
            DeliveryOrderStatus.InTransit
        };

        var results = new List<object>();
        foreach (var deliveryOrder in deliveryOrders.Where(d => activeStatuses.Contains(d.Status)))
        {
            var order = await _orderService.GetOrderByIdAsync(deliveryOrder.OrderId);
            if (order == null)
                continue;

            var addressId = (order.PickupInStore ? order.PickupAddressId : order.ShippingAddressId) ?? order.BillingAddressId;
            var deliveryAddress = await _addressService.GetAddressByIdAsync(addressId);

            var customerName = string.Join(" ", new[] { deliveryAddress?.FirstName, deliveryAddress?.LastName }
                .Where(part => !string.IsNullOrWhiteSpace(part)));

            if (string.IsNullOrWhiteSpace(customerName))
                customerName = order.BillingAddressId > 0
                    ? (await _addressService.GetAddressByIdAsync(order.BillingAddressId))?.Email ?? string.Empty
                    : string.Empty;

            results.Add(new
            {
                orderId = deliveryOrder.OrderId,
                deliveryStatusId = (int)deliveryOrder.Status,
                deliveryStatus = MapDeliveryStatus(deliveryOrder.Status),
                customerName
            });
        }

        return Ok(results);
    }

    /// <summary>
    /// PATCH api/rider/delivery-status
    /// Advances a delivery order along the allowed progression:
    /// Assigned → PickedUp → InTransit → Delivered.
    /// When Delivered, the nopCommerce order is also marked as Complete.
    /// </summary>
    [HttpPatch]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> UpdateDeliveryStatus([FromBody] UpdateDeliveryStatusRequestDto dto)
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { success = false, message = "Customer login is required." });

        if (!ModelState.IsValid)
            return BadRequest(new { success = false, message = "Invalid request payload." });

        var rider = await _riderService.GetRiderByCustomerIdAsync(customer.Id);
        if (rider == null)
            return NotFound(new { success = false, message = "Rider profile not found." });

        if (!Enum.IsDefined(typeof(DeliveryOrderStatus), dto.Status))
            return BadRequest(new { success = false, message = "Invalid delivery status value." });

        var newStatus = (DeliveryOrderStatus)dto.Status;
        var updated = await _deliveryOrderService.UpdateDeliveryStatusAsync(dto.OrderId, rider.Id, newStatus);

        if (!updated)
            return BadRequest(new { success = false, message = "Invalid status transition. The requested change is not allowed for this order." });

        // When the order is delivered, close the corresponding nopCommerce order
        // and auto-restore the rider's availability so they can receive new orders.
        if (newStatus == DeliveryOrderStatus.Delivered)
        {
            try
            {
                var order = await _orderService.GetOrderByIdAsync(dto.OrderId);
                if (order != null && order.OrderStatusId != (int)OrderStatus.Complete)
                {
                    order.OrderStatusId = (int)OrderStatus.Complete;
                    await _orderService.UpdateOrderAsync(order);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to mark nopCommerce order {OrderId} as Complete after delivery.", dto.OrderId);
            }

            // Auto-restore availability — rider is free to accept new orders
            try
            {
                await _riderService.UpdateRiderStatusByCustomerIdAsync(customer.Id, rider.IsOnline, availability: true);
                _logger.LogInformation("Rider {RiderId} availability restored after delivering order {OrderId}.", rider.Id, dto.OrderId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to restore availability for rider {RiderId} after delivery.", rider.Id);
            }
        }

        var statusLabel = newStatus switch
        {
            DeliveryOrderStatus.PickedUp => "Picked Up",
            DeliveryOrderStatus.InTransit => "Out for Delivery",
            DeliveryOrderStatus.Delivered => "Delivered",
            _ => newStatus.ToString()
        };

        return Ok(new { success = true, message = $"Order marked as {statusLabel}" });
    }

    /// <summary>
    /// GET api/rider/past-deliveries
    /// Returns paginated past deliveries (Delivered/Failed) for the current rider.
    /// Query params: pageIndex (0-based), pageSize (max 50), dateFrom (yyyy-MM-dd), dateTo (yyyy-MM-dd), statusId
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> PastDeliveries(
        int pageIndex = 0,
        int pageSize = 10,
        string dateFrom = null,
        string dateTo = null,
        int? statusId = null)
    {
        var customer = await GetAuthenticatedCustomerAsync();
        if (customer == null)
            return Unauthorized(new { error = "Customer login is required." });

        var rider = await _riderService.GetRiderByCustomerIdAsync(customer.Id);
        if (rider == null)
            return NotFound(new { error = "Rider profile not found." });

        pageSize = Math.Clamp(pageSize, 1, 50);
        pageIndex = Math.Max(0, pageIndex);

        DateTime? parsedDateFrom = null;
        DateTime? parsedDateTo = null;

        if (!string.IsNullOrWhiteSpace(dateFrom) && DateTime.TryParse(dateFrom, out var df))
            parsedDateFrom = DateTime.SpecifyKind(df.Date, DateTimeKind.Utc);

        if (!string.IsNullOrWhiteSpace(dateTo) && DateTime.TryParse(dateTo, out var dt))
            parsedDateTo = DateTime.SpecifyKind(dt.Date.AddDays(1).AddSeconds(-1), DateTimeKind.Utc);

        var (deliveryOrders, totalCount) = await _deliveryOrderService.GetPastDeliveriesAsync(
            rider.Id, parsedDateFrom, parsedDateTo, statusId, pageIndex, pageSize);

        var items = new List<object>(deliveryOrders.Count);
        foreach (var deliveryOrder in deliveryOrders)
        {
            var order = await _orderService.GetOrderByIdAsync(deliveryOrder.OrderId);
            if (order == null)
                continue;

            var addressId = (order.PickupInStore ? order.PickupAddressId : order.ShippingAddressId) ?? order.BillingAddressId;
            var deliveryAddress = await _addressService.GetAddressByIdAsync(addressId);

            var customerName = string.Join(" ", new[] { deliveryAddress?.FirstName, deliveryAddress?.LastName }
                .Where(p => !string.IsNullOrWhiteSpace(p)));

            if (string.IsNullOrWhiteSpace(customerName))
                customerName = deliveryAddress?.Email ?? string.Empty;

            var addressLine = string.Join(", ", new[] { deliveryAddress?.Address1, deliveryAddress?.City }
                .Where(p => !string.IsNullOrWhiteSpace(p)));

            items.Add(new
            {
                orderId = deliveryOrder.OrderId,
                deliveryOrderId = deliveryOrder.Id,
                customOrderNumber = order.CustomOrderNumber,
                orderTotal = order.OrderTotal * 83m,
                currencyCode = "INR",
                deliveryStatus = MapDeliveryStatus(deliveryOrder.Status),
                deliveryStatusId = (int)deliveryOrder.Status,
                customerName,
                deliveryAddress = addressLine,
                assignedAtUtc = deliveryOrder.AssignedAtUtc,
                pickedUpOnUtc = deliveryOrder.PickedUpOnUtc,
                inTransitOnUtc = deliveryOrder.InTransitOnUtc,
                deliveredOnUtc = deliveryOrder.DeliveredOnUtc,
                createdOnUtc = deliveryOrder.CreatedOnUtc
            });
        }

        return Ok(new
        {
            items,
            totalCount,
            pageIndex,
            pageSize,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    private static string MapDeliveryStatus(DeliveryOrderStatus status)
    {        return status switch
        {
            DeliveryOrderStatus.Pending => "Pending",
            DeliveryOrderStatus.Assigned => "Assigned",
            DeliveryOrderStatus.PickedUp => "Picked Up",
            DeliveryOrderStatus.InTransit => "Out for Delivery",
            DeliveryOrderStatus.Delivered => "Delivered",
            _ => status.ToString()
        };
    }

    private async Task<Customer> GetAuthenticatedCustomerAsync()
    {
        var customer = await _workContext.GetCurrentCustomerAsync();
        if (customer == null)
            return null;

        if (customer.Deleted || !customer.Active || await _customerService.IsGuestAsync(customer))
            return null;

        return customer;
    }

    private async Task EnsureCustomerHasRiderRoleAsync(Customer customer)
    {
        var riderRole = await _customerService.GetCustomerRoleBySystemNameAsync(RiderRoleSystemName);
        // Handle environments where role was manually created without system name.
        if (riderRole == null)
        {
            var currentRoles = await _customerService.GetAllCustomerRolesAsync(showHidden: true);
            riderRole = currentRoles.FirstOrDefault(role =>
                RiderRoleSystemName.Equals(role.Name, StringComparison.OrdinalIgnoreCase));
        }

        if (riderRole == null)
        {
            riderRole = new CustomerRole
            {
                Name = RiderRoleSystemName,
                SystemName = RiderRoleSystemName,
                Active = true,
                IsSystemRole = false
            };

            await _customerService.InsertCustomerRoleAsync(riderRole);
        }

        var isMapped = await _customerService.IsInCustomerRoleAsync(customer, RiderRoleSystemName, true);
        if (isMapped)
            return;

        await _customerService.AddCustomerRoleMappingAsync(new CustomerCustomerRoleMapping
        {
            CustomerId = customer.Id,
            CustomerRoleId = riderRole.Id
        });
    }

    private static object MapRider(Rider rider)
    {
        return new
        {
            rider.Id,
            rider.CustomerId,
            rider.Name,
            rider.Email,
            rider.Phone,
            rider.RiderStatus,
            availability = rider.Availability,
            rider.VehicleType,
            rider.LicenseNumber,
            rider.CurrentLocation,
            rider.IsApproved,
            createdAtUtc = rider.CreatedAtUtc,
            updatedAtUtc = rider.UpdatedAtUtc
        };
    }

    /// <summary>
    /// DTO used by rider onboarding endpoint.
    /// </summary>
    public class CreateRiderRequestDto
    {
        [Required]
        [StringLength(100)]
        public string VehicleType { get; set; }

        [Required]
        [StringLength(100)]
        public string LicenseNumber { get; set; }

        [StringLength(400)]
        public string CurrentLocation { get; set; }

        public bool? Availability { get; set; }
    }

    /// <summary>
    /// DTO used to update rider online and availability flags.
    /// </summary>
    public class UpdateRiderStatusRequestDto
    {
        public bool IsOnline { get; set; }

        public bool Availability { get; set; }
    }

    /// <summary>
    /// DTO for the PATCH api/rider/delivery-status endpoint.
    /// </summary>
    public class UpdateDeliveryStatusRequestDto
    {
        /// <summary>The nopCommerce Order ID to update.</summary>
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "OrderId must be a positive integer.")]
        public int OrderId { get; set; }

        /// <summary>
        /// The target DeliveryOrderStatus value (numeric).
        /// Allowed: PickedUp=2, InTransit=3, Delivered=4.
        /// </summary>
        [Required]
        [Range(1, 5, ErrorMessage = "Status must be a valid DeliveryOrderStatus value.")]
        public int Status { get; set; }
    }
}
