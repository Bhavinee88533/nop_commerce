using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Nop.Plugin.Misc.SearchBot.Controllers;
using Nop.Plugin.Misc.SearchBot.Services;
using NUnit.Framework;

namespace Nop.Tests.Nop.Plugins.Tests.SearchBot;

[TestFixture]
public class SearchBotControllerTests
{
    private Mock<IProductSearchBotService> _searchBotService;
    private Mock<ILogger<SearchBotController>> _logger;
    private SearchBotController _controller;

    [SetUp]
    public void SetUp()
    {
        _searchBotService = new Mock<IProductSearchBotService>();
        _logger = new Mock<ILogger<SearchBotController>>();
        _controller = new SearchBotController(_searchBotService.Object, _logger.Object);
    }

    [Test]
    public async Task Search_ShouldReturnBadRequest_WhenPromptIsMissing()
    {
        var result = await _controller.Search(new SearchBotRequest { Prompt = "   " }) as BadRequestObjectResult;

        Assert.That(result, Is.Not.Null);
        Assert.That(GetAnonymousProperty<bool>(result!.Value, "success"), Is.False);
        Assert.That(GetAnonymousProperty<string>(result.Value, "message"), Is.EqualTo("Prompt is required."));
        _searchBotService.Verify(x => x.SearchAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task Search_ShouldReturnBadRequest_WhenPromptIsTooLong()
    {
        var prompt = new string('a', 501);

        var result = await _controller.Search(new SearchBotRequest { Prompt = prompt }) as BadRequestObjectResult;

        Assert.That(result, Is.Not.Null);
        Assert.That(GetAnonymousProperty<bool>(result!.Value, "success"), Is.False);
        Assert.That(GetAnonymousProperty<string>(result.Value, "message"), Is.EqualTo("Prompt is too long (max 500 characters)."));
        _searchBotService.Verify(x => x.SearchAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task Search_ShouldReturnOk_WhenServiceReturnsResults()
    {
        var response = new SearchBotResponse
        {
            Success = true,
            Message = "ok",
            Products =
            [
                new BotProductResult
                {
                    Id = 1,
                    Name = "Test Product",
                    ImageUrl = "/image.jpg",
                    Price = "$10",
                    ProductUrl = "/test-product"
                }
            ]
        };

        _searchBotService
            .Setup(x => x.SearchAsync("soap"))
            .ReturnsAsync(response);

        var result = await _controller.Search(new SearchBotRequest { Prompt = "soap" }) as OkObjectResult;

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Value, Is.TypeOf<SearchBotResponse>());
        var payload = (SearchBotResponse)result.Value!;
        Assert.That(payload.Success, Is.True);
        Assert.That(payload.Products.Count, Is.EqualTo(1));
    }

    [Test]
    public async Task Search_ShouldReturn500_WhenServiceThrowsException()
    {
        _searchBotService
            .Setup(x => x.SearchAsync("soap"))
            .ThrowsAsync(new InvalidOperationException("boom"));

        var result = await _controller.Search(new SearchBotRequest { Prompt = "soap" }) as ObjectResult;

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.StatusCode, Is.EqualTo(500));
        Assert.That(GetAnonymousProperty<bool>(result.Value, "success"), Is.False);
        Assert.That(GetAnonymousProperty<string>(result.Value, "message"), Is.EqualTo("An error occurred. Please try again."));
    }

    private static T GetAnonymousProperty<T>(object value, string propertyName)
    {
        var property = value.GetType().GetProperty(propertyName)
            ?? throw new InvalidOperationException($"Property '{propertyName}' not found.");

        return (T)property.GetValue(value)!;
    }
}
