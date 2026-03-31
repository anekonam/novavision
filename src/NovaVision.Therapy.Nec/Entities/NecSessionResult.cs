using NovaVision.Core.Entities;
using NovaVision.Core.Enums;

namespace NovaVision.Therapy.Nec.Entities;

/// <summary>
/// Result of a single NEC cancellation session.
/// Patient clicks all target shapes in a matrix of shapes.
/// </summary>
public class NecSessionResult : BaseEntity
{
    public int NecSessionResultId { get; set; }
    public int NecTherapyId { get; set; }
    public int SessionNumber { get; set; }
    public int Level { get; set; }
    public NecStage Stage { get; set; }

    // Counts
    public int TotalTargets { get; set; }    // How many targets were in the matrix
    public int CorrectClicks { get; set; }   // Targets correctly clicked
    public int IncorrectClicks { get; set; } // Distractors incorrectly clicked
    public int MissedTargets { get; set; }   // Targets not clicked (TotalTargets - CorrectClicks)

    // Timing
    public double ElapsedSeconds { get; set; }
    public TimeSpan Duration { get; set; }
    public DateTime SessionDate { get; set; } = DateTime.UtcNow;
    public bool IsComplete { get; set; }

    public NecTherapy Therapy { get; set; } = null!;
}
