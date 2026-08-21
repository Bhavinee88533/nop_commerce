using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Nop.Plugin.Misc.SearchBot.Services;

namespace Nop.Plugin.Misc.SearchBot.Controllers;

/// <summary>
/// REST API endpoint for the NLP product search bot.
/// Called by the storefront chat bot widget.
/// POST /api/search-bot/search  { "prompt": "red running shoes under $100" }
/// </summary>
[Route("api/search-bot")]
[IgnoreAntiforgeryToken]
public class SearchBotController : ControllerBase
{
    private readonly IProductSearchBotService _searchBotService;
    private readonly ILogger<SearchBotController> _logger;

    public SearchBotController(
        IProductSearchBotService searchBotService,
        ILogger<SearchBotController> logger)
    {
        _searchBotService = searchBotService;
        _logger           = logger;
    }

    [HttpPost("search")]
    public async Task<IActionResult> Search([FromBody] SearchBotRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Prompt))
            return BadRequest(new { success = false, message = "Prompt is required." });

        if (request.Prompt.Length > 500)
            return BadRequest(new { success = false, message = "Prompt is too long (max 500 characters)." });

        try
        {
            var result = await _searchBotService.SearchAsync(request.Prompt);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SearchBot] Unhandled error for prompt: {Prompt}", request.Prompt);
            return StatusCode(500, new { success = false, message = "An error occurred. Please try again." });
        }
    }
}

public sealed class SearchBotRequest
{
    public string Prompt { get; set; }
}
