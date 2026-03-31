using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaVision.Core.Entities;
using NovaVision.Core.Enums;
using NovaVision.Infrastructure.Data;

namespace NovaVision.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LicenceController : ControllerBase
{
    private readonly NovaVisionDbContext _db;

    public LicenceController(NovaVisionDbContext db)
    {
        _db = db;
    }

    // Admin: create a licence
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateLicenceRequest request)
    {
        var licence = new Licence
        {
            LicenceKey = GenerateLicenceKey(),
            Type = request.Type,
            IncludesVrt = request.IncludesVrt,
            IncludesNec = request.IncludesNec,
            IncludesNet = request.IncludesNet,
            StartDate = request.StartDate ?? DateTime.UtcNow,
            ExpiryDate = request.ExpiryDate,
            MaxSeats = request.MaxSeats,
            UserId = request.UserId,
            OfficeId = request.OfficeId,
            Status = LicenceStatus.Active,
            CreatedBy = User.FindFirstValue(ClaimTypes.Email),
        };

        _db.Licences.Add(licence);
        await _db.SaveChangesAsync();

        return Ok(new { licence.LicenceId, licence.LicenceKey });
    }

    // Admin: list licences
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> List()
    {
        var licences = await _db.Licences
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                l.LicenceId,
                LicenceKey = l.LicenceKey.Substring(0, 8) + "...",
                Type = l.Type.ToString(),
                Status = l.Status.ToString(),
                l.IncludesVrt,
                l.IncludesNec,
                l.IncludesNet,
                l.StartDate,
                l.ExpiryDate,
                l.MaxSeats,
                l.UserId,
                l.OfficeId,
            })
            .ToListAsync();

        return Ok(licences);
    }

    // Admin: revoke a licence
    [HttpPost("{id}/revoke")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Revoke(int id)
    {
        var licence = await _db.Licences.FindAsync(id);
        if (licence == null) return NotFound();

        licence.Status = LicenceStatus.Revoked;
        await _db.SaveChangesAsync();

        return Ok(new { Message = "Licence revoked" });
    }

    // Patient: activate a licence key
    [HttpPost("activate")]
    [Authorize]
    public async Task<IActionResult> Activate([FromBody] ActivateLicenceRequest request)
    {
        var licence = await _db.Licences.FirstOrDefaultAsync(l => l.LicenceKey == request.LicenceKey);

        if (licence == null)
            return BadRequest(new { Message = "Invalid licence key" });

        if (licence.Status != LicenceStatus.Active)
            return BadRequest(new { Message = $"Licence is {licence.Status}" });

        if (licence.ExpiryDate < DateTime.UtcNow)
            return BadRequest(new { Message = "Licence has expired" });

        if (licence.UserId != null)
            return BadRequest(new { Message = "Licence already assigned" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        licence.UserId = userId;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            Message = "Licence activated",
            licence.IncludesVrt,
            licence.IncludesNec,
            licence.IncludesNet,
            licence.ExpiryDate,
        });
    }

    // Patient: check my licence status
    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> Status()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var licences = await _db.Licences
            .Where(l => l.UserId == userId && l.Status == LicenceStatus.Active)
            .ToListAsync();

        var active = licences.Where(l => l.ExpiryDate > DateTime.UtcNow).ToList();

        return Ok(new
        {
            HasActiveLicence = active.Count != 0,
            Vrt = active.Any(l => l.IncludesVrt),
            Nec = active.Any(l => l.IncludesNec),
            Net = active.Any(l => l.IncludesNet),
            EarliestExpiry = active.Min(l => (DateTime?)l.ExpiryDate),
        });
    }

    // Validate access to a specific therapy (called before session start)
    [HttpGet("validate/{therapyType}")]
    [Authorize]
    public async Task<IActionResult> Validate(string therapyType)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var hasAccess = await _db.Licences.AnyAsync(l =>
            l.UserId == userId &&
            l.Status == LicenceStatus.Active &&
            l.ExpiryDate > DateTime.UtcNow &&
            (therapyType.ToLowerInvariant() == "vrt" ? l.IncludesVrt :
             therapyType.ToLowerInvariant() == "nec" ? l.IncludesNec :
             therapyType.ToLowerInvariant() == "net" && l.IncludesNet));

        if (!hasAccess)
            return StatusCode(402, new { Message = "Valid licence required for this therapy" });

        return Ok(new { Valid = true });
    }

    private static string GenerateLicenceKey()
    {
        var bytes = new byte[16];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        var key = Convert.ToBase64String(bytes).Replace("+", "").Replace("/", "").Replace("=", "");
        // Format as XXXX-XXXX-XXXX-XXXX
        return string.Join("-", Enumerable.Range(0, 4).Select(i => key.Substring(i * 4, 4))).ToUpperInvariant();
    }
}

public record CreateLicenceRequest(
    LicenceType Type,
    bool IncludesVrt,
    bool IncludesNec,
    bool IncludesNet,
    DateTime ExpiryDate,
    DateTime? StartDate = null,
    int? MaxSeats = null,
    int? UserId = null,
    int? OfficeId = null
);

public record ActivateLicenceRequest(string LicenceKey);
