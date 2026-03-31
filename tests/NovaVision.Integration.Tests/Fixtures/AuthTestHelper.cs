using System.Net.Http.Headers;
using System.Net.Http.Json;
using NovaVision.Identity.DTOs;

namespace NovaVision.Integration.Tests.Fixtures;

public static class AuthTestHelper
{
    public static async Task<string> LoginAsAdmin(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "admin@novavision.com", "Admin@Nova2024!"));
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        return auth!.AccessToken;
    }

    public static async Task<string> RegisterAndLogin(HttpClient client, string email, string password = "TestUser@2024!")
    {
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            email, password, "Test", "User", "en-GB"));

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        return auth!.AccessToken;
    }

    public static void SetBearerToken(HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
}
