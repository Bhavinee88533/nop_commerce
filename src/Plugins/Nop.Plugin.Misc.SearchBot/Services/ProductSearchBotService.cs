using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Nop.Core;
using Nop.Core.Domain.Catalog;
using Nop.Services.Catalog;
using Nop.Services.Media;
using Nop.Services.Seo;

namespace Nop.Plugin.Misc.SearchBot.Services;

/// <summary>Attributes extracted by Groq from the user's natural language prompt.</summary>
internal sealed class ExtractedAttributes
{
    [JsonPropertyName("keywords")]
    public string   Keywords { get; set; }

    [JsonPropertyName("category")]
    public string   Category { get; set; }

    [JsonPropertyName("color")]
    public string   Color    { get; set; }

    [JsonPropertyName("priceMin")]
    public decimal? PriceMin { get; set; }

    [JsonPropertyName("priceMax")]
    public decimal? PriceMax { get; set; }
}

/// <summary>
/// NLP product search service.
/// Flow:
///   1. Send prompt to Groq â†’ extract {category, keywords, color, priceMin, priceMax}
///   2. Smart category resolve (exact / contains / plural / word-overlap)
///   3. DB query by category + price (pool of up to 200)
///   4. Fallback: if DB returns 0, retry across ALL products by keyword
///   5. In-memory filter by keyword (AND then OR) + soft color filter
///   6. Return up to 5 real catalog products
/// </summary>
public class ProductSearchBotService : IProductSearchBotService
{
    private const string GroqEndpoint = "https://api.groq.com/openai/v1/chat/completions";

    private readonly IHttpClientFactory               _httpClientFactory;
    private readonly IProductService                  _productService;
    private readonly ICategoryService                 _categoryService;
    private readonly IProductTagService               _productTagService;
    private readonly IPictureService                  _pictureService;
    private readonly IUrlRecordService                _urlRecordService;
    private readonly IProductAttributeService         _productAttributeService;
    private readonly IStoreContext                    _storeContext;
    private readonly IConfiguration                   _configuration;
    private readonly ILogger<ProductSearchBotService> _logger;

    public ProductSearchBotService(
        IHttpClientFactory httpClientFactory,
        IProductService productService,
        ICategoryService categoryService,
        IProductTagService productTagService,
        IPictureService pictureService,
        IUrlRecordService urlRecordService,
        IProductAttributeService productAttributeService,
        IStoreContext storeContext,
        IConfiguration configuration,
        ILogger<ProductSearchBotService> logger)
    {
        _httpClientFactory       = httpClientFactory;
        _productService          = productService;
        _categoryService         = categoryService;
        _productTagService       = productTagService;
        _pictureService          = pictureService;
        _urlRecordService        = urlRecordService;
        _productAttributeService = productAttributeService;
        _storeContext            = storeContext;
        _configuration           = configuration;
        _logger                  = logger;
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Public entry point
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public async Task<SearchBotResponse> SearchAsync(string prompt)
    {
        if (string.IsNullOrWhiteSpace(prompt))
            return Fail("Please enter a search query.");

        // Step 1 â€” Extract attributes via Groq
        ExtractedAttributes attrs;
        try
        {
            attrs = await ExtractAttributesAsync(prompt);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[SearchBot] Groq failed â€” using stripped raw prompt.");
            attrs = new ExtractedAttributes { Keywords = StripFillerWords(prompt) };
        }

        _logger.LogInformation(
            "[SearchBot] Extracted â†’ category={C}, keywords={K}, color={Col}, priceMin={Min}, priceMax={Max}",
            attrs.Category, attrs.Keywords, attrs.Color, attrs.PriceMin, attrs.PriceMax);

        if (string.IsNullOrWhiteSpace(attrs.Keywords) &&
            string.IsNullOrWhiteSpace(attrs.Category) &&
            string.IsNullOrWhiteSpace(attrs.Color)    &&
            attrs.PriceMin is null && attrs.PriceMax is null)
        {
            // Groq returned nothing useful — fall back to raw prompt as keyword search
            attrs.Keywords = StripFillerWords(prompt);
            _logger.LogInformation("[SearchBot] Groq returned all-null → using raw prompt as keywords: '{K}'", attrs.Keywords);
            if (string.IsNullOrWhiteSpace(attrs.Keywords))
                return Fail(SearchBotDefaults.FallbackMessage);
        }

        // Prompt expansion: map generic words to specific DB-searchable keywords
        if (!string.IsNullOrWhiteSpace(attrs.Keywords))
        {
            var words = attrs.Keywords.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            foreach (var word in words)
            {
                if (_promptExpansion.TryGetValue(word, out var expanded))
                {
                    _logger.LogInformation("[SearchBot] Prompt expansion: '{Word}' → '{Expanded}'", word, expanded);
                    attrs.Keywords = expanded;
                    break;
                }
            }
        }

        var store = await _storeContext.GetCurrentStoreAsync();

        // Step 2 — Resolve category → IDs
        // Groq sometimes puts product types in "keywords" instead of "category" so try both
        var categoryIds = await ResolveCategoryIdsAsync(attrs.Category);
        if (categoryIds.Count == 0 && !string.IsNullOrWhiteSpace(attrs.Keywords))
        {
            var fromKw = await ResolveCategoryIdsAsync(attrs.Keywords);
            if (fromKw.Count > 0)
            {
                _logger.LogInformation("[SearchBot] Category resolved from keyword '{K}'", attrs.Keywords);
                categoryIds    = fromKw;
                attrs.Keywords = null; // category covers it
            }
        }

        // Step 2b — Resolve product tag → tag ID (covers tag words: apparel, jeans, shoes, book, etc.)
        var tagSearchTerm = attrs.Keywords ?? attrs.Category ?? "";
        var tagId = await ResolveProductTagIdAsync(tagSearchTerm);

        // If a tag was matched, clear keywords so the in-memory filter doesn't
        // incorrectly discard products whose names don't contain the tag word.
        // BUT keep the original term so we can prioritise name-matched results later.
        string tagOriginalTerm = null;
        if (tagId > 0)
        {
            _logger.LogInformation("[SearchBot] Tag matched (Id={Id}) — suppressing keyword filter", tagId);
            tagOriginalTerm = tagSearchTerm; // saved for name-priority step
            attrs.Keywords  = null;
        }

        // Step 3 — DB query: category + tag + price range
        var rawProducts = await _productService.SearchProductsAsync(
            pageIndex: 0, pageSize: 200,
            categoryIds: categoryIds.Count > 0 ? categoryIds : null,
            productTagId: tagId,
            storeId: store.Id,
            visibleIndividuallyOnly: true,
            priceMin: attrs.PriceMin,
            priceMax: attrs.PriceMax,
            showHidden: false);

        _logger.LogInformation("[SearchBot] DB (category+tag pass) → {Count} products", rawProducts.Count);

        // Step 3b — Name-priority: if tag search returned results but some products
        // actually contain the search word in their name (e.g. "Levi's 511 Jeans" for "jeans"),
        // prefer those over products that only matched via tag (e.g. Nike shoe tagged "jeans").
        if (tagId > 0 && rawProducts.Count > 0 && !string.IsNullOrWhiteSpace(tagOriginalTerm))
        {
            var nameMatches = rawProducts
                .Where(p => ContainsWord(p.Name, tagOriginalTerm) ||
                            ContainsWord(p.ShortDescription ?? "", tagOriginalTerm))
                .ToList();
            if (nameMatches.Count > 0)
            {
                _logger.LogInformation("[SearchBot] Name-priority filter: {0} → {1} products", rawProducts.Count, nameMatches.Count);
                rawProducts = new PagedList<Core.Domain.Catalog.Product>(nameMatches, 0, nameMatches.Count);
            }
        }

        // Step 4 — Fallback: category/tag matched nothing
        //   First try DB-level keyword search (handles "computer", "desktop", etc.)
        //   Then fall back to fetching all products + in-memory filter
        if (rawProducts.Count == 0)
        {
            var fallbackKw = !string.IsNullOrWhiteSpace(attrs.Keywords)
                ? attrs.Keywords
                : attrs.Category;

            if (!string.IsNullOrWhiteSpace(fallbackKw))
            {
                // 4a — DB keyword search: searches product name, SKU, description
                _logger.LogInformation("[SearchBot] Trying DB keyword search for '{K}'", fallbackKw);
                rawProducts = await _productService.SearchProductsAsync(
                    pageIndex: 0, pageSize: 50,
                    keywords: fallbackKw,
                    storeId: store.Id,
                    visibleIndividuallyOnly: true,
                    priceMin: attrs.PriceMin,
                    priceMax: attrs.PriceMax,
                    showHidden: false);

                _logger.LogInformation("[SearchBot] DB keyword search → {Count} products", rawProducts.Count);

                if (rawProducts.Count > 0)
                {
                    // DB search already filtered — skip in-memory keyword filter
                    attrs.Keywords = null;
                }
                else
                {
                    // 4b — Last resort: all products + in-memory filter
                    attrs.Keywords = fallbackKw;
                    attrs.Category = null;

                    rawProducts = await _productService.SearchProductsAsync(
                        pageIndex: 0, pageSize: 200,
                        storeId: store.Id,
                        visibleIndividuallyOnly: true,
                        priceMin: attrs.PriceMin,
                        priceMax: attrs.PriceMax,
                        showHidden: false);

                    _logger.LogInformation("[SearchBot] All-products pool → {Count}", rawProducts.Count);
                }
            }
        }

        // Step 5 — In-memory keyword filter
        IEnumerable<Core.Domain.Catalog.Product> filtered = rawProducts;

        if (!string.IsNullOrWhiteSpace(attrs.Keywords))
        {
            var kwWords = attrs.Keywords.Trim()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries);

            // AND: all words must appear as whole words in name/description
            var andPass = rawProducts.Where(p =>
                kwWords.All(w =>
                    ContainsWord(p.Name, w) ||
                    ContainsWord(p.ShortDescription ?? "", w) ||
                    ContainsWord(p.FullDescription  ?? "", w))).ToList();

            if (andPass.Count > 0)
            {
                filtered = andPass;
            }
            else
            {
                // OR fallback: any word matches (whole word)
                var orPass = rawProducts.Where(p =>
                    kwWords.Any(w =>
                        ContainsWord(p.Name, w) ||
                        ContainsWord(p.ShortDescription ?? "", w) ||
                        ContainsWord(p.FullDescription  ?? "", w))).ToList();

                if (orPass.Count > 0)
                {
                    filtered = orPass;
                }
                else
                {
                    // Final fallback: case-insensitive substring match on product name
                    // This catches searches like "smartwatch" matching "Nebula Smartwatch"
                    filtered = rawProducts.Where(p =>
                        kwWords.Any(w =>
                            p.Name.Contains(w, StringComparison.OrdinalIgnoreCase) ||
                            (p.ShortDescription ?? "").Contains(w, StringComparison.OrdinalIgnoreCase) ||
                            (p.FullDescription  ?? "").Contains(w, StringComparison.OrdinalIgnoreCase))).ToList();
                    
                    if (filtered.Count() > 0)
                    {
                        _logger.LogInformation("[SearchBot] Using substring fallback for '{K}' → {Count} products", 
                            attrs.Keywords, filtered.Count());
                    }
                }
            }
        }

        // Step 5b â€” Soft color filter (skip if it eliminates all results)
        if (!string.IsNullOrWhiteSpace(attrs.Color))
        {
            var color        = attrs.Color.Trim();
            var colorMatches = filtered.Where(p =>
                p.Name.Contains(color, StringComparison.OrdinalIgnoreCase) ||
                (p.ShortDescription ?? "").Contains(color, StringComparison.OrdinalIgnoreCase) ||
                (p.FullDescription  ?? "").Contains(color, StringComparison.OrdinalIgnoreCase)).ToList();

            if (colorMatches.Count > 0)
            {
                _logger.LogInformation("[SearchBot] Color '{C}' filter â†’ {N} products", color, colorMatches.Count);
                filtered = colorMatches;
            }
            else
            {
                _logger.LogInformation("[SearchBot] Color '{C}' matched 0 â€” soft filter skipped", color);
            }
        }

        var products = filtered.Take(SearchBotDefaults.MaxResults).ToList();
        _logger.LogInformation("[SearchBot] Final results: {Count}", products.Count);

        if (products.Count == 0)
            return Fail(SearchBotDefaults.FallbackMessage);

        // Step 6 â€” Map to lightweight DTOs (real catalog data only)
        var results = new List<BotProductResult>(products.Count);
        foreach (var p in products)
        {
            var pic = (await _pictureService.GetPicturesByProductIdAsync(p.Id, 1)).FirstOrDefault();
            string imageUrl;
            if (pic is not null)
            {
                var (url, _) = await _pictureService.GetPictureUrlAsync(pic, 120);
                imageUrl = url;
            }
            else
            {
                imageUrl = await _pictureService.GetDefaultPictureUrlAsync(120);
            }

            var seName = await _urlRecordService.GetSeNameAsync(p);
            var attrMappings  = await _productAttributeService.GetProductAttributeMappingsByProductIdAsync(p.Id);
            var requiresSelection = attrMappings.Any(a => a.AttributeControlType != AttributeControlType.ReadonlyCheckboxes);

            var description = p.ShortDescription ?? "";
            if (description.Length > 100)
                description = description.Substring(0, 100) + "...";

            if (string.IsNullOrEmpty(seName))
                seName = GenerateSlug(p.Name);
            var productUrl = $"/{seName}";

            var inStock = p.ManageInventoryMethod != ManageInventoryMethod.ManageStock
                          || p.StockQuantity > 0
                          || p.AllowBackInStockSubscriptions;

            results.Add(new BotProductResult
            {
                Id                = p.Id,
                Name              = p.Name,
                ImageUrl          = imageUrl,
                Price             = p.Price.ToString("C"),
                Description       = description,
                ProductUrl        = productUrl,
                RequiresSelection = requiresSelection,
                InStock           = inStock
            });
        }

        return new SearchBotResponse { Success = true, Products = results };
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Groq API â€” extract structured attributes from prompt
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private async Task<ExtractedAttributes> ExtractAttributesAsync(string prompt)
    {
        var apiKey = _configuration[SearchBotDefaults.OpenAiApiKeyPath];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("[SearchBot] No Groq API key â€” using stripped raw prompt.");
            return new ExtractedAttributes { Keywords = StripFillerWords(prompt) };
        }

        const string systemPrompt = """
            You are a product search assistant for an e-commerce store.
            Analyze the user query and return ONLY valid JSON — no markdown, no explanation.
            JSON fields:
            {
              "keywords": "specific product name, brand, or tag word — null if query is a generic category",
              "category": "generic product type — null if a specific product or tag is named",
              "color":    "exact color word only if the user mentioned one — null otherwise",
              "priceMin": numeric lower price bound — null if not stated,
              "priceMax": numeric upper price bound — null if not stated
            }

            This store has the following product tags — if the query matches, output the tag as "keywords":
              apparel   → clothing, fashion, wearables (shirts, jeans, shoes, jackets)
              book      → books, novels, publications, reading
              camera    → cameras, photography equipment
              cell      → cell phones, mobile phones, smartphones
              compact   → compact cameras, compact devices
              computer  → computers, PCs, desktops
              cool      → trendy/popular products
              digital   → digital cameras, digital products
              game      → video games, board games, gaming
              gift      → gifts, gift cards, gift items
              jeans     → denim, jeans, pants, trousers
              jewelry   → jewelry, necklace, ring, bracelet, earrings
              shirt     → shirts, t-shirts, tops, blouses
              shoes     → shoes, boots, footwear, sneakers, sandals

            Rules:
            - Strip filler words: show, me, find, get, all, some, any, please, i, want, looking, for, give, need, best, top, cheap, good, latest, new, old, available, a, an, the, of, with, under, over, between, and.
            - If query matches a tag above → output that EXACT tag word as "keywords" (e.g. "shoes" → keywords="shoes", "earrings" → keywords="jewelry", "necklace" → keywords="jewelry", "ring" → keywords="jewelry", "bracelet" → keywords="jewelry").
            - Jewelry-related words (earrings, necklace, ring, bracelet, pendant, chain) → ALWAYS output keywords="jewelry".
            - Generic category types → "category": books, phones, laptops, cameras, shoes, clothing, jewelry, computers, tablets, food, grocery, bakery, dairy, fruits, vegetables, beverages, electronics, accessories, furniture, toys, sports, beauty.
            - Named/brand products → "keywords": "Nike running shoes", "Samsung Galaxy", "Harry Potter".
            - "computer", "desktop", "PC", "desktop computer", "gaming PC" → set category="laptops" (computers are listed under laptops in this store).
            - Food/grocery items (bread, milk, eggs, rice, etc.) → set "keywords" to the item name.
            - Fruit queries ("fruit", "fruits", "fresh fruit") → set keywords="mango" (or the specific fruit if named).
            - Both can be set: "red Nike shoes" → keywords="Nike shoes", color="red", category=null.
            - Price: "under $50"→priceMax=50; "between $20 and $100"→priceMin=20,priceMax=100; "over $200"→priceMin=200.
            - If nothing is identifiable, return all fields as null.
            - NEVER invent product names or data not present in the user query.
            """;

        var body = new
        {
            model                 = SearchBotDefaults.OpenAiModel,
            temperature           = 0,
            max_completion_tokens = 250,
            messages              = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user",   content = prompt }
            }
        };

        using var client = _httpClientFactory.CreateClient("SearchBot.OpenAI");
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        using var cts      = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var httpResponse   = await client.PostAsJsonAsync(GroqEndpoint, body, cts.Token);
        httpResponse.EnsureSuccessStatusCode();

        using var doc = await JsonDocument.ParseAsync(
            await httpResponse.Content.ReadAsStreamAsync(cts.Token), cancellationToken: cts.Token);

        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "{}";

        _logger.LogDebug("[SearchBot] Groq raw: {Content}", content);

        return JsonSerializer.Deserialize<ExtractedAttributes>(
            content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new ExtractedAttributes { Keywords = StripFillerWords(prompt) };
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Smart category resolver â€” no hardcoded synonym maps
    // Strategy (in priority order):
    //   1. Exact name match
    //   2. Contains either way  ("phone" â†” "Cell Phones")
    //   3. Singular/plural      ("laptop" â†” "Laptops")
    //   4. Word-level overlap   ("cell" overlaps "Cell Phones")
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private async Task<List<int>> ResolveCategoryIdsAsync(string searchTerm)
    {
        var ids = new List<int>();
        if (string.IsNullOrWhiteSpace(searchTerm)) return ids;

        var term = searchTerm.Trim();
        var cats = await _categoryService.GetAllCategoriesAsync();

        // 1. Exact
        var match = cats.FirstOrDefault(c =>
            string.Equals(c.Name, term, StringComparison.OrdinalIgnoreCase));

        // 2. Contains either way
        match ??= cats.FirstOrDefault(c =>
            c.Name.Contains(term, StringComparison.OrdinalIgnoreCase) ||
            term.Contains(c.Name, StringComparison.OrdinalIgnoreCase));

        // 3. Singular â†” plural
        if (match is null)
        {
            var variants = new List<string> { term + "s" };
            if (term.EndsWith("s", StringComparison.OrdinalIgnoreCase) && term.Length > 2)
                variants.Add(term[..^1]);

            match = cats.FirstOrDefault(c =>
                variants.Any(v =>
                    c.Name.Contains(v, StringComparison.OrdinalIgnoreCase) ||
                    v.Contains(c.Name, StringComparison.OrdinalIgnoreCase)));
        }

        // 4. Word-level overlap
        if (match is null)
        {
            var sw = term.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            match = cats.FirstOrDefault(c =>
            {
                var cw = c.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                return sw.Any(s => cw.Any(w =>
                    w.StartsWith(s, StringComparison.OrdinalIgnoreCase) ||
                    s.StartsWith(w, StringComparison.OrdinalIgnoreCase)));
            });
        }

        if (match is not null)
        {
            _logger.LogInformation("[SearchBot] '{Term}' → category '{Name}' (Id={Id})", term, match.Name, match.Id);
            ids.Add(match.Id);
        }
        else
        {
            _logger.LogInformation("[SearchBot] '{Term}' → no category match", term);
        }

        return ids;
    }

    // ─────────────────────────────────────────────────────────────────
    // Product tag resolver — matches query words against store tags
    // Tags: apparel, book, camera, cell, compact, computer, digital,
    //       game, gift, jeans, jewelry, shirt, shoes, etc.
    // ─────────────────────────────────────────────────────────────────

    // Prompt expansion: generic/conceptual words → specific product keywords
    private static readonly Dictionary<string, string> _promptExpansion =
        new(StringComparer.OrdinalIgnoreCase)
        {
            { "fruit",       "mango"    }, { "fruits",      "mango"    },
            { "vegetable",   "spinach"  }, { "vegetables",  "spinach"  },
            { "dairy",       "milk"     },
            { "bakery",      "bread"    }, { "baked",       "bread"    },
            { "grocery",     "milk"     }, { "groceries",   "milk"     },
            { "beverage",    "juice"    }, { "beverages",   "juice"    }, { "drink", "juice" },
        };

    // Synonym map: words that should resolve to a specific tag
    private static readonly Dictionary<string, string> _tagSynonyms =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // Jewelry synonyms → "jewelry" tag
            { "earrings",  "jewelry" }, { "earring",   "jewelry" },
            { "necklace",  "jewelry" }, { "necklaces", "jewelry" },
            { "bracelet",  "jewelry" }, { "bracelets", "jewelry" },
            { "ring",      "jewelry" }, { "rings",     "jewelry" },
            { "pendant",   "jewelry" }, { "chain",     "jewelry" },
            // Shirt synonyms → "shirt" tag
            { "t-shirt",   "shirt"   }, { "tshirt",    "shirt"   }, { "top",     "shirt" },
            // Shoes synonyms → "shoes" tag
            { "sneakers",  "shoes"   }, { "boots",     "shoes"   }, { "footwear","shoes" }, { "sandals", "shoes" },
            // Jeans synonyms → "jeans" tag
            { "denim",     "jeans"   }, { "trousers",  "jeans"   }, { "pants",   "jeans" },
            // Phone synonyms → "cell" tag
            { "mobile",    "cell"    }, { "smartphone","cell"    }, { "iphone",  "cell"  },
            // Apparel synonyms → "apparel" tag
            { "clothing",  "apparel" }, { "fashion",   "apparel" }, { "wearable","apparel" },
        };

    private async Task<int> ResolveProductTagIdAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm)) return 0;

        var tags = await _productTagService.GetAllProductTagsAsync();
        if (tags.Count == 0) return 0;

        var words = searchTerm.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);

        // 0. Synonym map — resolve known alternate words to their canonical tag
        foreach (var word in words)
        {
            if (_tagSynonyms.TryGetValue(word, out var canonical))
            {
                var synTag = tags.FirstOrDefault(t =>
                    string.Equals(t.Name, canonical, StringComparison.OrdinalIgnoreCase));
                if (synTag is not null)
                {
                    _logger.LogInformation("[SearchBot] '{Word}' synonym → tag '{Tag}' (Id={Id})", word, synTag.Name, synTag.Id);
                    return synTag.Id;
                }
            }
        }

        // 1. Exact word match against any tag name
        foreach (var word in words)
        {
            var tag = tags.FirstOrDefault(t =>
                string.Equals(t.Name, word, StringComparison.OrdinalIgnoreCase));
            if (tag is not null)
            {
                _logger.LogInformation("[SearchBot] '{Word}' → tag '{Tag}' (Id={Id})", word, tag.Name, tag.Id);
                return tag.Id;
            }
        }

        // 2. Contains match (e.g. "apparel" contains "apparel", "cameras" contains "camera")
        foreach (var word in words)
        {
            var tag = tags.FirstOrDefault(t =>
                t.Name.Contains(word, StringComparison.OrdinalIgnoreCase) ||
                word.Contains(t.Name, StringComparison.OrdinalIgnoreCase));
            if (tag is not null)
            {
                _logger.LogInformation("[SearchBot] '{Word}' → tag '{Tag}' (Id={Id})", word, tag.Name, tag.Id);
                return tag.Id;
            }
        }

        return 0;
    }

    // ─────────────────────────────────────────────────────────────────
    // Utilities
    // ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// Whole-word case-insensitive match — prevents "book" matching "MacBook".
    /// A word boundary is a non-letter/digit character or the start/end of string.
    /// </summary>
    private static bool ContainsWord(string text, string word)
    {
        if (string.IsNullOrEmpty(text) || string.IsNullOrEmpty(word)) return false;
        var idx = 0;
        while (true)
        {
            idx = text.IndexOf(word, idx, StringComparison.OrdinalIgnoreCase);
            if (idx < 0) return false;
            var before = idx == 0              || !char.IsLetterOrDigit(text[idx - 1]);
            var after  = idx + word.Length >= text.Length || !char.IsLetterOrDigit(text[idx + word.Length]);
            if (before && after) return true;
            idx += word.Length;
        }
    }

    private static SearchBotResponse Fail(string message) =>
        new() { Success = false, Message = message, Products = [] };

    /// <summary>Strips English stop/filler words â€” used as Groq fallback.</summary>
    private static string StripFillerWords(string input)
    {
        var fillers = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "all","types","type","of","the","a","an","available","show","me",
            "find","get","search","list","give","i","want","need","looking","for",
            "some","any","please","best","top","cheap","good","latest","new","old",
            "products","product","items","item","things","thing","related","with",
            "under","over","between","and","dollars","dollar","usd"
        };
        var words = input.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                         .Where(w => !fillers.Contains(w)).ToArray();
        return words.Length > 0 ? string.Join(" ", words) : input;
    }

    private static string GenerateSlug(string text)
    {
        if (string.IsNullOrEmpty(text))
            return "product";
        
        // Convert to lowercase and replace spaces with hyphens
        text = text.ToLowerInvariant().Trim();
        text = System.Text.RegularExpressions.Regex.Replace(text, @"[^a-z0-9\s-]", "");
        text = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", "-");
        text = System.Text.RegularExpressions.Regex.Replace(text, @"-+", "-");
        return text.Trim('-');
    }
}
