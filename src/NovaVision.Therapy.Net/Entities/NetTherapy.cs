using NovaVision.Core.Entities;

namespace NovaVision.Therapy.Net.Entities;

public class NetTherapy : BaseEntity
{
    public int NetTherapyId { get; set; }
    public int UserId { get; set; }
    public int NumberOfTargets { get; set; } = 5;
    public int Presentations { get; set; } = 100; // Main session presentation count

    // Staircase thresholds: count-based, NOT contrast-based
    // UpperLimit = advance (reduce contrast) when correct count >= this
    // LowerLimit = regress (increase contrast) when correct count <= this
    public int UpperLimit { get; set; } = 43;
    public int LowerLimit { get; set; } = 32;

    // Practice phase
    public double PracticeContrast { get; set; } = 0.9;
    public double PracticeX { get; set; }
    public double PracticeY { get; set; }
    public double PracticeDiameter { get; set; } = 1.0;
    public int PracticePresentations { get; set; } = 10;
    public bool PracticeComplete { get; set; }

    public int SessionsCompleted { get; set; }
    public bool IsComplete { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<NetTherapyTarget> Targets { get; set; } = [];
    public ICollection<NetSessionResult> SessionResults { get; set; } = [];
}
