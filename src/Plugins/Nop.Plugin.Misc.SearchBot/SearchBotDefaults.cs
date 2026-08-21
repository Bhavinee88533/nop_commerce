namespace Nop.Plugin.Misc.SearchBot;

public static class SearchBotDefaults
{
    public const string SystemName       = "Misc.SearchBot";
    public const string OpenAiApiKeyPath = "SearchBot:OpenAiApiKey";
    public const string OpenAiModel      = "llama-3.3-70b-versatile";
    public const int    MaxResults       = 5;
    public const string FallbackMessage  = "I couldn't find anything matching that. Try different words!";
}
