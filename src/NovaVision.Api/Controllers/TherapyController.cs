using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaVision.Infrastructure.Data;

namespace NovaVision.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TherapyController : ControllerBase
{
    private readonly NovaVisionDbContext _db;

    public TherapyController(NovaVisionDbContext db) => _db = db;

    /// <summary>
    /// Get summary of all therapies assigned to the current patient
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var vrt = await _db.VrtTherapies
            .Where(t => t.UserId == userId)
            .Select(t => new
            {
                TherapyType = "VRT",
                t.IsComplete,
                TotalBlocks = t.Blocks.Count,
                CompletedSessions = t.Blocks.SelectMany(b => b.Results).Count(r => r.IsComplete),
                LastSessionDate = t.Blocks.SelectMany(b => b.Results)
                    .OrderByDescending(r => r.SessionDate)
                    .Select(r => (DateTime?)r.SessionDate)
                    .FirstOrDefault(),
            })
            .FirstOrDefaultAsync();

        var nec = await _db.NecTherapies
            .Where(t => t.UserId == userId)
            .Select(t => new
            {
                TherapyType = "NEC",
                t.IsComplete,
                t.CurrentLevel,
                t.MaxLevel,
                t.SessionsCompleted,
                LastSessionDate = t.TrialResults
                    .OrderByDescending(r => r.SessionDate)
                    .Select(r => (DateTime?)r.SessionDate)
                    .FirstOrDefault(),
            })
            .FirstOrDefaultAsync();

        var net = await _db.NetTherapies
            .Where(t => t.UserId == userId)
            .Select(t => new
            {
                TherapyType = "NET",
                t.IsComplete,
                t.NumberOfTargets,
                t.SessionsCompleted,
                LastSessionDate = t.SessionResults
                    .OrderByDescending(r => r.SessionDate)
                    .Select(r => (DateTime?)r.SessionDate)
                    .FirstOrDefault(),
            })
            .FirstOrDefaultAsync();

        return Ok(new { Vrt = vrt, Nec = nec, Net = net });
    }

    /// <summary>
    /// Get VRT therapy detail for current patient
    /// </summary>
    [HttpGet("vrt")]
    public async Task<IActionResult> GetVrt()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var therapy = await _db.VrtTherapies
            .Include(t => t.Blocks)
            .ThenInclude(b => b.Results)
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (therapy == null) return NotFound(new { Message = "No VRT therapy assigned" });

        return Ok(new
        {
            therapy.VrtTherapyId,
            therapy.GridSizeX,
            therapy.GridSizeY,
            therapy.GridAngle,
            DiagnosticType = therapy.DiagnosticType.ToString(),
            therapy.IsComplete,
            Blocks = therapy.Blocks.OrderBy(b => b.BlockNumber).Select(b => new
            {
                b.VrtTherapyBlockId,
                b.BlockNumber,
                BlockType = b.BlockType.ToString(),
                b.TherapyArea,
                StimulusShape = b.StimulusShape.ToString(),
                b.StimulusColour,
                b.StimulusDiameter,
                b.StimulusDisplayTimeMs,
                b.SessionStimuli,
                Sessions = b.Results.Count,
                CompletedSessions = b.Results.Count(r => r.IsComplete),
            }),
        });
    }

    /// <summary>
    /// Get NEC therapy detail for current patient
    /// </summary>
    [HttpGet("nec")]
    public async Task<IActionResult> GetNec()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var therapy = await _db.NecTherapies
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (therapy == null) return NotFound(new { Message = "No NEC therapy assigned" });

        var sessionsByLevel = await _db.NecTrialResults
            .Where(r => r.NecTherapyId == therapy.NecTherapyId)
            .GroupBy(r => r.Level)
            .Select(g => new
            {
                Level = g.Key,
                Sessions = g.Select(r => r.SessionNumber).Distinct().Count(),
                Accuracy = g.Count() == 0 ? 0 : (double)g.Count(r => r.Correct) / g.Count(),
                AvgResponseTimeMs = g.Average(r => r.ResponseTimeMs),
            })
            .OrderBy(l => l.Level)
            .ToListAsync();

        return Ok(new
        {
            therapy.NecTherapyId,
            therapy.CurrentLevel,
            therapy.MaxLevel,
            therapy.SessionsCompleted,
            therapy.IsComplete,
            LevelProgress = sessionsByLevel,
        });
    }

    /// <summary>
    /// Get NET therapy detail for current patient
    /// </summary>
    [HttpGet("net")]
    public async Task<IActionResult> GetNet()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var therapy = await _db.NetTherapies
            .Include(t => t.Targets)
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (therapy == null) return NotFound(new { Message = "No NET therapy assigned" });

        var recentResults = await _db.NetSessionResults
            .Where(r => r.NetTherapyId == therapy.NetTherapyId)
            .OrderByDescending(r => r.SessionDate)
            .Take(10)
            .Include(r => r.TargetResults)
            .ToListAsync();

        return Ok(new
        {
            therapy.NetTherapyId,
            therapy.NumberOfTargets,
            therapy.SessionsCompleted,
            therapy.IsComplete,
            Targets = therapy.Targets.OrderBy(t => t.TargetNumber).Select(t => new
            {
                t.TargetNumber,
                t.X,
                t.Y,
                t.Diameter,
                t.CurrentContrast,
            }),
            RecentSessions = recentResults.Select(r => new
            {
                r.SessionNumber,
                r.SessionDate,
                r.Duration,
                Targets = r.TargetResults.Select(tr => new
                {
                    tr.TargetNumber,
                    tr.Contrast,
                    tr.Presented,
                    tr.Correct,
                }),
            }),
        });
    }
}
