using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaVision.Core.Entities;
using NovaVision.Infrastructure.Data;

namespace NovaVision.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalibrationController : ControllerBase
{
    private readonly NovaVisionDbContext _db;

    public CalibrationController(NovaVisionDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var cal = await _db.ScreenCalibrations
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CalibratedAt)
            .FirstOrDefaultAsync();

        if (cal == null) return NotFound(new { Message = "No calibration found" });

        return Ok(new
        {
            cal.ScreenCalibrationId,
            cal.DegreePixels,
            cal.DistanceCm,
            cal.PixelsPerCm,
            cal.ScreenWidth,
            cal.ScreenHeight,
            cal.DevicePixelRatio,
            cal.CalibratedAt,
        });
    }

    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveCalibrationRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var cal = new ScreenCalibration
        {
            UserId = userId,
            DegreePixels = request.DegreePixels,
            DistanceCm = request.DistanceCm,
            PixelsPerCm = request.PixelsPerCm,
            ScreenWidth = request.ScreenWidth,
            ScreenHeight = request.ScreenHeight,
            DevicePixelRatio = request.DevicePixelRatio,
            CalibratedAt = DateTime.UtcNow,
            CreatedBy = User.FindFirstValue(ClaimTypes.Email),
        };

        _db.ScreenCalibrations.Add(cal);
        await _db.SaveChangesAsync();

        return Ok(new { cal.ScreenCalibrationId, cal.DegreePixels });
    }
}

public record SaveCalibrationRequest(
    double DegreePixels,
    double DistanceCm,
    double PixelsPerCm,
    int ScreenWidth,
    int ScreenHeight,
    double DevicePixelRatio
);
