using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Nop.Core.Domain.Catalog;
using Nop.Core.Domain.Customers;
using Nop.Plugin.Misc.RiderManagement.Domains;
using Nop.Plugin.Misc.RiderManagement.Models;
using Nop.Plugin.Misc.RiderManagement.Models.Admin;
using Nop.Plugin.Misc.RiderManagement.Services;
using Nop.Services.Catalog;
using Nop.Services.Customers;
using Nop.Services.Localization;
using Nop.Services.Messages;
using Nop.Services.Security;
using Nop.Services.Seo;
using Nop.Web.Framework;
using Nop.Web.Framework.Controllers;
using Nop.Web.Framework.Models.Extensions;
using Nop.Web.Framework.Mvc;
using Nop.Web.Framework.Mvc.Filters;

namespace Nop.Plugin.Misc.RiderManagement.Controllers;

[AuthorizeAdmin]
[Area(AreaNames.ADMIN)]
[AutoValidateAntiforgeryToken]
public class RiderManagementController : BasePluginController
{
    private const string RiderRoleSystemName = "Rider";
    private const string ConfigureViewPath = "~/Plugins/Misc.RiderManagement/Views/Configure.cshtml";
    private const string RiderListViewPath = "~/Plugins/Misc.RiderManagement/Views/Admin/RiderList.cshtml";
    private const string CreateOrEditRiderViewPath = "~/Plugins/Misc.RiderManagement/Views/Admin/CreateOrEditRider.cshtml";

    #region Fields

    private readonly ICustomerService _customerService;
    private readonly ILocalizationService _localizationService;
    private readonly INotificationService _notificationService;
    private readonly IPermissionService _permissionService;
    private readonly IProductService _productService;
    private readonly IProductTemplateService _productTemplateService;
    private readonly IRiderService _riderService;
    private readonly IUrlRecordService _urlRecordService;

    #endregion

    #region Ctor

    public RiderManagementController(
        ICustomerService customerService,
        ILocalizationService localizationService,
        INotificationService notificationService,
        IPermissionService permissionService,
        IProductService productService,
        IProductTemplateService productTemplateService,
        IRiderService riderService,
        IUrlRecordService urlRecordService)
    {
        _customerService = customerService;
        _localizationService = localizationService;
        _notificationService = notificationService;
        _permissionService = permissionService;
        _productService = productService;
        _productTemplateService = productTemplateService;
        _riderService = riderService;
        _urlRecordService = urlRecordService;
    }

    #endregion

    #region Utilities

    private static List<SelectListItem> GetStatusSelectList()
    {
        return new List<SelectListItem>
        {
            new() { Value = "-1", Text = "All", Selected = false },
            new() { Value = ((int)RiderStatus.Active).ToString(),   Text = "Active" },
            new() { Value = ((int)RiderStatus.Inactive).ToString(), Text = "Inactive" }
        };
    }

    private static List<SelectListItem> GetStatusSelectListForEdit()
    {
        return new List<SelectListItem>
        {
            new() { Value = ((int)RiderStatus.Active).ToString(),   Text = "Active" },
            new() { Value = ((int)RiderStatus.Inactive).ToString(), Text = "Inactive" }
        };
    }

    private async Task<CustomerRole> GetOrCreateRiderRoleAsync()
    {
        var riderRole = await _customerService.GetCustomerRoleBySystemNameAsync(RiderRoleSystemName);
        if (riderRole != null)
            return riderRole;

        riderRole = new CustomerRole
        {
            Name = RiderRoleSystemName,
            SystemName = RiderRoleSystemName,
            Active = true,
            IsSystemRole = false
        };

        await _customerService.InsertCustomerRoleAsync(riderRole);
        return riderRole;
    }

    private async Task EnsureCustomerHasRiderRoleAsync(Customer customer)
    {
        var riderRole = await GetOrCreateRiderRoleAsync();
        var isInRole = await _customerService.IsInCustomerRoleAsync(customer, riderRole.SystemName, true);

        if (isInRole)
            return;

        await _customerService.AddCustomerRoleMappingAsync(new CustomerCustomerRoleMapping
        {
            CustomerId = customer.Id,
            CustomerRoleId = riderRole.Id
        });
    }

    #endregion

    #region Methods

    // GET: Admin/RiderManagement/Configure
    public async Task<IActionResult> Configure()
    {
        if (!await _permissionService.AuthorizeAsync(StandardPermission.Configuration.MANAGE_PLUGINS))
            return AccessDeniedView();

        var status = await _riderService.GetModuleGreetingAsync();

        var model = new ConfigurationModel
        {
            ModuleStatus = status
        };

        return View(ConfigureViewPath, model);
    }

    // POST: Admin/RiderManagement/SeedTestProducts
    [HttpPost]
    public async Task<IActionResult> SeedTestProducts()
    {
        if (!await _permissionService.AuthorizeAsync(StandardPermission.Configuration.MANAGE_PLUGINS))
            return AccessDeniedView();

        // Fetch the first available product template (e.g. "Product details - simple")
        var templates = await _productTemplateService.GetAllProductTemplatesAsync();
        var templateId = templates.FirstOrDefault()?.Id ?? 1;

        var sampleProducts = new[]
        {
            new { Name = "Fresh Mango (1 kg)",      Sku = "SEED-MANGO-1KG",  Price = 120m,  Desc = "Sweet Alphonso mangoes, hand-picked and farm-fresh." },
            new { Name = "Organic Whole Milk (1 L)", Sku = "SEED-MILK-1L",   Price = 65m,   Desc = "Full-cream pasteurised organic milk in a sealed bottle." },
            new { Name = "Artisan Sourdough Bread",  Sku = "SEED-BREAD-SOD", Price = 180m,  Desc = "Stone-baked sourdough loaf, ready to eat." },
        };

        var now = DateTime.UtcNow;
        var added = 0;

        foreach (var sp in sampleProducts)
        {
            // Skip if a product with this SKU already exists
            var existing = await _productService.GetProductBySkuAsync(sp.Sku);
            if (existing != null)
                continue;

            var product = new Product
            {
                ProductTypeId      = (int)ProductType.SimpleProduct,
                VisibleIndividually = true,
                Name               = sp.Name,
                ShortDescription   = sp.Desc,
                FullDescription    = sp.Desc,
                Sku                = sp.Sku,
                ProductTemplateId  = templateId,
                Published          = true,
                ShowOnHomepage     = true,
                AllowCustomerReviews = true,
                Price              = sp.Price,
                IsShipEnabled      = true,
                IsFreeShipping     = false,
                ManageInventoryMethodId = (int)ManageInventoryMethod.DontManageStock,
                StockQuantity      = 100,
                OrderMaximumQuantity = 10000,
                OrderMinimumQuantity = 1,
                CreatedOnUtc       = now,
                UpdatedOnUtc       = now,
            };

            await _productService.InsertProductAsync(product);
            await _urlRecordService.SaveSlugAsync(product, await _urlRecordService.ValidateSeNameAsync(product, string.Empty, product.Name, true), 0);
            added++;
        }

        if (added == 0)
            _notificationService.SuccessNotification("Sample products already exist — no duplicates created.");
        else
            _notificationService.SuccessNotification($"{added} sample product(s) seeded successfully. You can now place orders from the store front.");

        return RedirectToAction("Configure");
    }

    // GET: Admin/RiderManagement/List
    public async Task<IActionResult> List()
    {
        if (!await _permissionService.AuthorizeAsync(StandardPermission.Configuration.MANAGE_PLUGINS))
            return AccessDeniedView();

        var searchModel = new RiderSearchModel
        {
            AvailableStatuses = GetStatusSelectList()
        };
        searchModel.SetGridPageSize();

        return View(RiderListViewPath, searchModel);
    }

    // POST: Admin/RiderManagement/RiderList (Ajax grid data)
    [HttpPost]
    public async Task<IActionResult> RiderList(RiderSearchModel searchModel)
    {
        if (!await _permissionService.AuthorizeAsync(StandardPermission.Configuration.MANAGE_PLUGINS))
            return await AccessDeniedJsonAsync();

        var riders = await _riderService.GetAllRidersAsync(
            name: searchModel.SearchName,
            statusId: searchModel.SearchStatusId,
            pageIndex: searchModel.Page - 1,
            pageSize: searchModel.PageSize);

        var model = new RiderListModel().PrepareToGrid(searchModel, riders, () =>
        {
            return riders.Select(r => new RiderModel
            {
                Id = r.Id,
                Name = r.Name,
                Phone = r.Phone,
                Email = r.Email,
                StatusId = r.StatusId,
                IsOnline = r.IsOnline,
                CustomerId = r.CustomerId
            });
        });

        return Json(model);
    }

    // GET: Admin/RiderManagement/Create
    public async Task<IActionResult> Create()
    {
        if (!await _permissionService.AuthorizeAsync(StandardPermission.Configuration.MANAGE_PLUGINS))
            return AccessDeniedView();

        var model = new RiderModel
        {
            AvailableStatuses = GetStatusSelectListForEdit()
        };

        return View(CreateOrEditRiderViewPath, model);
    }

    // POST: Admin/RiderManagement/Create
    [HttpPost, ParameterBasedOnFormName("save-continue", "continueEditing")]
    public async Task<IActionResult> Create(RiderModel model, bool continueEditing)
    {
        if (!await _permissionService.AuthorizeAsync(StandardPermission.Configuration.MANAGE_PLUGINS))
            return AccessDeniedView();

        if (ModelState.IsValid)
        {
            // Validate that Customer ID exists
            var customer = await _customerService.GetCustomerByIdAsync(model.CustomerId);
            if (customer == null)
            {
                ModelState.AddModelError(nameof(model.CustomerId), "Customer with this ID does not exist.");
                model.AvailableStatuses = GetStatusSelectListForEdit();
                return View(CreateOrEditRiderViewPath, model);
            }

            var rider = new Rider
            {
                Name = model.Name,
                Phone = model.Phone,
                Email = model.Email,
                StatusId = model.StatusId,
                IsOnline = model.IsOnline,
                CustomerId = model.CustomerId
            };

            await _riderService.InsertRiderAsync(rider);
            await EnsureCustomerHasRiderRoleAsync(customer);

            _notificationService.SuccessNotification(
                await _localizationService.GetResourceAsync("Plugins.Misc.RiderManagement.Rider.Added"));

            return continueEditing
                ? RedirectToAction("Edit", new { id = rider.Id })
                : RedirectToAction("List");
        }

        model.AvailableStatuses = GetStatusSelectListForEdit();
        return View(CreateOrEditRiderViewPath, model);
    }

    // GET: Admin/RiderManagement/Edit/{id}
    public async Task<IActionResult> Edit(int id)
    {
        if (!await _permissionService.AuthorizeAsync(StandardPermission.Configuration.MANAGE_PLUGINS))
            return AccessDeniedView();

        var rider = await _riderService.GetRiderByIdAsync(id);
        if (rider == null)
            return RedirectToAction("List");

        var model = new RiderModel
        {
            Id = rider.Id,
            Name = rider.Name,
            Phone = rider.Phone,
            Email = rider.Email,
            StatusId = rider.StatusId,
            IsOnline = rider.IsOnline,
            CustomerId = rider.CustomerId,
            AvailableStatuses = GetStatusSelectListForEdit()
        };

        return View(CreateOrEditRiderViewPath, model);
    }

    // POST: Admin/RiderManagement/Edit/{id}
    [HttpPost, ParameterBasedOnFormName("save-continue", "continueEditing")]
    public async Task<IActionResult> Edit(RiderModel model, bool continueEditing)
    {
        if (!await _permissionService.AuthorizeAsync(StandardPermission.Configuration.MANAGE_PLUGINS))
            return AccessDeniedView();

        var rider = await _riderService.GetRiderByIdAsync(model.Id);
        if (rider == null)
            return RedirectToAction("List");

        if (ModelState.IsValid)
        {
            // Validate that Customer ID exists
            var customer = await _customerService.GetCustomerByIdAsync(model.CustomerId);
            if (customer == null)
            {
                ModelState.AddModelError(nameof(model.CustomerId), "Customer with this ID does not exist.");
                model.AvailableStatuses = GetStatusSelectListForEdit();
                return View(CreateOrEditRiderViewPath, model);
            }

            rider.Name = model.Name;
            rider.Phone = model.Phone;
            rider.Email = model.Email;
            rider.StatusId = model.StatusId;
            rider.IsOnline = model.IsOnline;
            rider.CustomerId = model.CustomerId;

            await _riderService.UpdateRiderAsync(rider);
            await EnsureCustomerHasRiderRoleAsync(customer);

            _notificationService.SuccessNotification(
                await _localizationService.GetResourceAsync("Plugins.Misc.RiderManagement.Rider.Updated"));

            return continueEditing
                ? RedirectToAction("Edit", new { id = rider.Id })
                : RedirectToAction("List");
        }

        model.AvailableStatuses = GetStatusSelectListForEdit();
        return View(CreateOrEditRiderViewPath, model);
    }

    // POST: Admin/RiderManagement/Delete/{id}
    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await _permissionService.AuthorizeAsync(StandardPermission.Configuration.MANAGE_PLUGINS))
            return AccessDeniedView();

        var rider = await _riderService.GetRiderByIdAsync(id);
        if (rider == null)
            return RedirectToAction("List");

        await _riderService.DeleteRiderAsync(rider);

        _notificationService.SuccessNotification(
            await _localizationService.GetResourceAsync("Plugins.Misc.RiderManagement.Rider.Deleted"));

        return RedirectToAction("List");
    }

    #endregion
}
