using Microsoft.AspNetCore.Mvc;
using Nop.Core;
using Nop.Services.Customers;
using Nop.Web.Framework.Mvc.Filters;

namespace Nop.Web.Controllers;

public partial class HomeController : BasePublicController
{
    private readonly IWorkContext _workContext;
    private readonly ICustomerService _customerService;

    public HomeController(IWorkContext workContext, ICustomerService customerService)
    {
        _workContext = workContext;
        _customerService = customerService;
    }

    [SaveLastContinueShoppingPage]
    public virtual async Task<IActionResult> Index()
    {
        var customer = await _workContext.GetCurrentCustomerAsync();
        if (!await _customerService.IsRegisteredAsync(customer))
            return Redirect("/login");

        return View();
    }
}