namespace Nop.Plugin.Misc.SearchBot.Services;

/// <summary>Result item for each matched product.</summary>
public sealed class BotProductResult
{
    public int Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string ImageUrl { get; init; } = string.Empty;

    public string Price { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public string ProductUrl { get; init; } = string.Empty;

    /// <summary>
    /// True when the product has non-readonly attributes (for example, size or colour)
    /// and the shopper must choose options before adding it to the cart.
    /// </summary>
    public bool RequiresSelection { get; init; }

    /// <summary>False when the product is managed-stock with zero available quantity.</summary>
    public bool InStock { get; init; }
}

/// <summary>Overall response from the search bot.</summary>
public sealed class SearchBotResponse
{
    public bool Success { get; init; }

    public string Message { get; init; } = string.Empty;

    public IReadOnlyList<BotProductResult> Products { get; init; } = [];
}

/// <summary>
/// Processes a natural-language prompt, extracts product attributes via OpenAI,
/// and queries the nopCommerce catalog.
/// </summary>
public interface IProductSearchBotService
{
    /// <summary>
    /// Searches the product catalog based on a user's natural-language prompt.
    /// Returns up to 5 matching products, or a fallback message.
    /// </summary>
    Task<SearchBotResponse> SearchAsync(string prompt);
}
