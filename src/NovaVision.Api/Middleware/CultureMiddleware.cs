using System.Globalization;

namespace NovaVision.Api.Middleware;

public class CultureMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly string[] SupportedCultures =
        ["en-GB", "de-DE", "fr", "it", "pt", "es", "ms-MY", "fi-FI", "th-TH", "ru-RU", "cs-CZ", "pl-PL", "zh-CN"];

    public CultureMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var culture = ResolveCulture(context);
        CultureInfo.CurrentCulture = new CultureInfo(culture);
        CultureInfo.CurrentUICulture = new CultureInfo(culture);
        context.Items["Culture"] = culture;

        await _next(context);
    }

    private static string ResolveCulture(HttpContext context)
    {
        // 1. JWT claim (authenticated user's preference)
        var cultureClaim = context.User?.FindFirst("culture")?.Value;
        if (!string.IsNullOrEmpty(cultureClaim) && SupportedCultures.Contains(cultureClaim))
            return cultureClaim;

        // 2. Query parameter (explicit override)
        if (context.Request.Query.TryGetValue("culture", out var queryCulture))
        {
            var qc = queryCulture.ToString();
            if (SupportedCultures.Contains(qc)) return qc;
        }

        // 3. Accept-Language header
        var acceptLanguage = context.Request.Headers.AcceptLanguage.ToString();
        if (!string.IsNullOrEmpty(acceptLanguage))
        {
            var preferred = acceptLanguage.Split(',')
                .Select(l => l.Split(';')[0].Trim())
                .FirstOrDefault(l => SupportedCultures.Any(s =>
                    s.Equals(l, StringComparison.OrdinalIgnoreCase) ||
                    s.StartsWith(l, StringComparison.OrdinalIgnoreCase)));
            if (preferred != null)
            {
                return SupportedCultures.First(s =>
                    s.Equals(preferred, StringComparison.OrdinalIgnoreCase) ||
                    s.StartsWith(preferred, StringComparison.OrdinalIgnoreCase));
            }
        }

        // 4. Default
        return "en-GB";
    }
}
