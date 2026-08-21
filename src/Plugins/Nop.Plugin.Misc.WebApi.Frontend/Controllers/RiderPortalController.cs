using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Nop.Plugin.Misc.WebApi.Frontend.Controllers;

public class RiderPortalController : Controller
{
    [AllowAnonymous]
    public IActionResult Index()
    {
        return File("~/rider/browser/index.html", "text/html");
    }
}
