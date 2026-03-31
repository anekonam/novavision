using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using NovaVision.Core.Enums;
using NovaVision.Identity.DTOs;
using NovaVision.Identity.Entities;
using NovaVision.Identity.Services;

namespace NovaVision.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly TokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    // In-memory MFA token store (replace with Redis/DB in production)
    private static readonly Dictionary<string, int> MfaTokens = new();

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        TokenService tokenService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = UserRole.Patient,
            Culture = request.Culture ?? "en-GB",
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { Errors = result.Errors.Select(e => e.Description) });
        }

        await _userManager.AddToRoleAsync(user, UserRole.Patient.ToString());
        _logger.LogInformation("User {Email} registered as Patient", request.Email);

        return Ok(new { Message = "Registration successful" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !user.IsEnabled)
        {
            return Unauthorized(new { Message = "Invalid credentials" });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (result.IsLockedOut)
        {
            return StatusCode(429, new { Message = "Account locked. Try again in 15 minutes." });
        }
        if (!result.Succeeded)
        {
            return Unauthorized(new { Message = "Invalid credentials" });
        }

        // Check if MFA is enabled
        if (await _userManager.GetTwoFactorEnabledAsync(user))
        {
            var mfaToken = _tokenService.GenerateMfaToken();
            MfaTokens[mfaToken] = user.Id;
            return Ok(new MfaChallengeResponse(mfaToken, MfaRequired: true));
        }

        // Check if MFA is required for this role but not set up yet
        if (user.Role is UserRole.Admin or UserRole.Clinician)
        {
            var mfaToken = _tokenService.GenerateMfaToken();
            MfaTokens[mfaToken] = user.Id;
            return Ok(new { MfaSetupRequired = true, MfaToken = mfaToken });
        }

        return await IssueTokens(user);
    }

    [HttpPost("mfa/challenge")]
    public async Task<IActionResult> MfaChallenge([FromBody] MfaVerifyRequest request)
    {
        if (!MfaTokens.TryGetValue(request.MfaToken, out var userId))
        {
            return Unauthorized(new { Message = "Invalid or expired MFA token" });
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return Unauthorized(new { Message = "User not found" });
        }

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(
            user, _userManager.Options.Tokens.AuthenticatorTokenProvider, request.Code);

        if (!isValid)
        {
            return Unauthorized(new { Message = "Invalid verification code" });
        }

        MfaTokens.Remove(request.MfaToken);
        return await IssueTokens(user);
    }

    [HttpPost("mfa/setup")]
    [Authorize]
    public async Task<IActionResult> MfaSetup()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(unformattedKey))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        }

        var email = await _userManager.GetEmailAsync(user);
        var authenticatorUri = $"otpauth://totp/NovaVision:{UrlEncoder.Default.Encode(email!)}?secret={unformattedKey}&issuer=NovaVision&digits=6";

        return Ok(new MfaSetupResponse(
            SharedKey: FormatKey(unformattedKey!),
            AuthenticatorUri: authenticatorUri,
            QrCodeBase64: "" // Client generates QR from URI
        ));
    }

    [HttpPost("mfa/verify-setup")]
    [Authorize]
    public async Task<IActionResult> MfaVerifySetup([FromBody] MfaSetupVerifyRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(
            user, _userManager.Options.Tokens.AuthenticatorTokenProvider, request.Code);

        if (!isValid)
        {
            return BadRequest(new { Message = "Invalid verification code. Please try again." });
        }

        await _userManager.SetTwoFactorEnabledAsync(user, true);

        // Generate recovery codes
        var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);

        _logger.LogInformation("User {Email} enabled MFA", user.Email);
        return Ok(new { RecoveryCodes = recoveryCodes });
    }

    [HttpPost("mfa/recover")]
    public async Task<IActionResult> MfaRecover([FromBody] MfaRecoveryRequest request)
    {
        if (!MfaTokens.TryGetValue(request.MfaToken, out var userId))
        {
            return Unauthorized(new { Message = "Invalid or expired MFA token" });
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return Unauthorized();

        var result = await _userManager.RedeemTwoFactorRecoveryCodeAsync(user, request.RecoveryCode);
        if (!result.Succeeded)
        {
            return Unauthorized(new { Message = "Invalid recovery code" });
        }

        MfaTokens.Remove(request.MfaToken);
        return await IssueTokens(user);
    }

    [HttpPost("refresh")]
    public IActionResult Refresh()
    {
        // Refresh token implementation -- reads HttpOnly cookie
        // For PoC, simplified: client re-authenticates
        return StatusCode(501, new { Message = "Token refresh not yet implemented" });
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        // Invalidate refresh token (when implemented)
        return Ok(new { Message = "Logged out" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            Role = user.Role.ToString(),
            user.Culture,
            MfaEnabled = await _userManager.GetTwoFactorEnabledAsync(user),
        });
    }

    private async Task<IActionResult> IssueTokens(ApplicationUser user)
    {
        var (token, expiresAt) = _tokenService.GenerateAccessToken(user);

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return Ok(new AuthResponse(
            AccessToken: token,
            ExpiresAt: expiresAt,
            Role: user.Role.ToString(),
            FirstName: user.FirstName,
            LastName: user.LastName
        ));
    }

    private static string FormatKey(string unformattedKey)
    {
        var result = new StringBuilder();
        var currentPosition = 0;
        while (currentPosition + 4 < unformattedKey.Length)
        {
            result.Append(unformattedKey.AsSpan(currentPosition, 4)).Append(' ');
            currentPosition += 4;
        }
        if (currentPosition < unformattedKey.Length)
        {
            result.Append(unformattedKey.AsSpan(currentPosition));
        }
        return result.ToString().ToLowerInvariant();
    }
}
