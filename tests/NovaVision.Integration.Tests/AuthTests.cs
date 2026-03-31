using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using NovaVision.Identity.DTOs;
using NovaVision.Integration.Tests.Fixtures;

namespace NovaVision.Integration.Tests;

public class AuthTests : IClassFixture<ApiTestFixture>
{
    private readonly HttpClient _client;

    public AuthTests(ApiTestFixture fixture)
    {
        _client = fixture.CreateClient();
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsOk()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            "patient@test.com", "Patient@Test2024!", "Jane", "Doe", "en-GB"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Register_WithWeakPassword_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            "weak@test.com", "short", "Jane", "Doe", "en-GB"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsBadRequest()
    {
        await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            "dupe@test.com", "Patient@Test2024!", "Jane", "Doe", "en-GB"));

        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            "dupe@test.com", "Patient@Test2024!", "John", "Doe", "en-GB"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokenOrMfaChallenge()
    {
        // Admin user is seeded, and admin requires MFA setup
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "admin@novavision.com", "Admin@Nova2024!"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        // Admin gets MfaSetupRequired since MFA isn't set up yet
        content.Should().Contain("MfaSetupRequired");
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "admin@novavision.com", "WrongPassword!"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_PatientWithoutMfa_ReturnsToken()
    {
        // Register a patient (MFA not required)
        await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            "patient-nomfa@test.com", "Patient@Test2024!", "Pat", "Ient", "en-GB"));

        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "patient-nomfa@test.com", "Patient@Test2024!"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        auth.Should().NotBeNull();
        auth!.AccessToken.Should().NotBeNullOrEmpty();
        auth.Role.Should().Be("Patient");
    }

    [Fact]
    public async Task Me_WithValidToken_ReturnsUserInfo()
    {
        var token = await AuthTestHelper.RegisterAndLogin(_client, "me-test@test.com");
        AuthTestHelper.SetBearerToken(_client, token);

        var response = await _client.GetAsync("/api/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("me-test@test.com");
        content.Should().Contain("Patient");
    }

    [Fact]
    public async Task Me_WithoutToken_ReturnsUnauthorized()
    {
        var client = new HttpClient { BaseAddress = _client.BaseAddress };
        var response = await client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task HealthCheck_ReturnsHealthy()
    {
        var response = await _client.GetAsync("/health");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Status_ReturnsRunning()
    {
        var response = await _client.GetAsync("/api/status");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Running");
    }
}
