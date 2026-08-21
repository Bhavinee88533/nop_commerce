namespace Nop.Plugin.Misc.WebApi.Frontend;

/// <summary>
/// Represents plugin constants
/// </summary>
public class WebApiFrontendDefaults
{
    /// <summary>
    /// Gets a plugin system name
    /// </summary>
    public static string SystemName => "Misc.WebApi.Frontend";

    /// <summary>
    /// Gets appsettings section path for plugin options.
    /// </summary>
    public static string ConfigurationSectionPath => "WebApiFrontend";

    /// <summary>
    /// Gets appsettings section path for frontend CORS options.
    /// </summary>
    public static string CorsConfigurationSectionPath => $"{ConfigurationSectionPath}:Cors";

    /// <summary>
    /// Gets appsettings key for CORS allowed origins.
    /// </summary>
    public static string CorsAllowedOriginsPath => $"{CorsConfigurationSectionPath}:AllowedOrigins";

    /// <summary>
    /// Gets CORS policy name used by the plugin API endpoints.
    /// </summary>
    public static string CorsPolicyName => "WebApiFrontendCorsPolicy";
}