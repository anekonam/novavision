using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaVision.Core.Enums;
using NovaVision.Identity.Entities;
using NovaVision.Infrastructure.Data;
using NovaVision.Therapy.Nec.Entities;
using NovaVision.Therapy.Net.Entities;
using NovaVision.Therapy.Vrt.Entities;

namespace NovaVision.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Clinician,Admin")]
public class PatientController : ControllerBase
{
    private readonly NovaVisionDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public PatientController(NovaVisionDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? search)
    {
        var clinicianId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = User.FindFirstValue(ClaimTypes.Role);

        var query = _db.Users
            .Where(u => u.Role == UserRole.Patient && u.IsEnabled);

        // Clinicians only see their own patients
        if (role == "Clinician")
            query = query.Where(u => u.ClinicianUserId == clinicianId);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(u =>
                u.FirstName.Contains(search) ||
                u.LastName.Contains(search) ||
                u.Email!.Contains(search));

        var patients = await query
            .OrderBy(u => u.LastName)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.LastLoginAt,
                HasVrt = _db.VrtTherapies.Any(t => t.UserId == u.Id),
                HasNec = _db.NecTherapies.Any(t => t.UserId == u.Id),
                HasNet = _db.NetTherapies.Any(t => t.UserId == u.Id),
            })
            .ToListAsync();

        return Ok(patients);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var patient = await _userManager.FindByIdAsync(id.ToString());
        if (patient == null || patient.Role != UserRole.Patient)
            return NotFound();

        return Ok(new
        {
            patient.Id,
            patient.FirstName,
            patient.LastName,
            patient.Email,
            patient.Culture,
            patient.LastLoginAt,
            patient.CreatedAt,
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePatientRequest request)
    {
        var clinicianId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var patient = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = UserRole.Patient,
            Culture = request.Culture ?? "en-GB",
            ClinicianUserId = clinicianId,
            IsEnabled = true,
        };

        var result = await _userManager.CreateAsync(patient, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { Errors = result.Errors.Select(e => e.Description) });

        await _userManager.AddToRoleAsync(patient, "Patient");

        return Ok(new { patient.Id, patient.Email });
    }

    [HttpPost("{id}/assign-therapy")]
    public async Task<IActionResult> AssignTherapy(int id, [FromBody] AssignTherapyRequest request)
    {
        var patient = await _userManager.FindByIdAsync(id.ToString());
        if (patient == null || patient.Role != UserRole.Patient)
            return NotFound();

        switch (request.TherapyType.ToUpperInvariant())
        {
            case "VRT":
                if (await _db.VrtTherapies.AnyAsync(t => t.UserId == id))
                    return BadRequest(new { Message = "VRT already assigned" });

                var vrt = new VrtTherapy
                {
                    UserId = id,
                    GridSizeX = 19,
                    GridSizeY = 15,
                    GridAngle = 43,
                    CreatedBy = User.FindFirstValue(ClaimTypes.Email),
                };
                // Create default Status block
                vrt.Blocks.Add(new VrtTherapyBlock
                {
                    BlockType = VrtBlockType.Status,
                    BlockNumber = 1,
                    SessionStimuli = 284,
                    CreatedBy = User.FindFirstValue(ClaimTypes.Email),
                });
                _db.VrtTherapies.Add(vrt);
                break;

            case "NEC":
                if (await _db.NecTherapies.AnyAsync(t => t.UserId == id))
                    return BadRequest(new { Message = "NEC already assigned" });

                _db.NecTherapies.Add(new NecTherapy
                {
                    UserId = id,
                    CreatedBy = User.FindFirstValue(ClaimTypes.Email),
                });
                break;

            case "NET":
                if (await _db.NetTherapies.AnyAsync(t => t.UserId == id))
                    return BadRequest(new { Message = "NET already assigned" });

                var net = new NetTherapy
                {
                    UserId = id,
                    NumberOfTargets = 5,
                    CreatedBy = User.FindFirstValue(ClaimTypes.Email),
                };
                // Create default 5 targets
                for (int i = 1; i <= 5; i++)
                {
                    net.Targets.Add(new NetTherapyTarget
                    {
                        TargetNumber = i,
                        X = (i - 3) * 5.0, // Spread targets horizontally
                        Y = (i % 2 == 0) ? 3.0 : -3.0,
                        Diameter = 1.0,
                        StartContrast = 100,
                        CurrentContrast = 100,
                        CreatedBy = User.FindFirstValue(ClaimTypes.Email),
                    });
                }
                _db.NetTherapies.Add(net);
                break;

            default:
                return BadRequest(new { Message = "Invalid therapy type. Use VRT, NEC, or NET." });
        }

        await _db.SaveChangesAsync();
        return Ok(new { Message = $"{request.TherapyType.ToUpperInvariant()} assigned to patient" });
    }
}

public record CreatePatientRequest(string Email, string Password, string FirstName, string LastName, string? Culture);
public record AssignTherapyRequest(string TherapyType);
