using NovaVision.Core.Enums;

namespace NovaVision.Core.Entities;

/// <summary>
/// Extended patient profile: demographics, therapy settings, diagnostic state.
/// Mirrors the original UserDetail table from NovaVisionApp.
/// </summary>
public class UserDetail : BaseEntity
{
    public int UserDetailId { get; set; }
    public int UserId { get; set; }

    // Demographics
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Zip { get; set; }
    public string? Country { get; set; }
    public string? Phone { get; set; }

    // Injury/condition info
    public string? InjuryCause { get; set; }
    public DateTime? InjuryDate { get; set; }
    public string? BlindnessType { get; set; }
    public string? BlindnessSide { get; set; }

    // Screen calibration (stored here AND in ScreenCalibration table for history)
    public double? ScreenWidth { get; set; }
    public double? ScreenHeight { get; set; }
    public double? ScreenDistance { get; set; }
    public double? DegreePixels { get; set; }

    // Diagnostic state
    public DiagnosticType DiagnosticType { get; set; } = DiagnosticType.Binocular;
    public bool DiagnosticComplete { get; set; }
    public bool DiagnosticFailed { get; set; }

    // Fixation/stimuli size preference
    public double? Size { get; set; }
    public string? FixationColour1 { get; set; }
    public string? FixationColour2 { get; set; }
    public string? FixationShape1 { get; set; }
    public string? FixationShape2 { get; set; }
    public string? TestEye { get; set; }

    // Therapy stage tracking
    public int TherapyStage { get; set; }
    public int TherapyPart { get; set; }
    public int TherapyLevel { get; set; }
    public int TherapyBlock { get; set; }
    public int TherapyRepeat { get; set; }

    // Completion timestamps (null = not complete, DateTime = when completed)
    public DateTime? VrtComplete { get; set; }
    public DateTime? NecComplete { get; set; }
    public DateTime? NetComplete { get; set; }

    // Enable flags
    public bool VrtEnabled { get; set; }
    public bool NecEnabled { get; set; }
    public bool NetEnabled { get; set; }
}
