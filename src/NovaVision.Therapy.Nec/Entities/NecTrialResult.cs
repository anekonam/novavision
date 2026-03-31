using NovaVision.Core.Entities;

namespace NovaVision.Therapy.Nec.Entities;

public class NecTrialResult : BaseEntity
{
    public long NecTrialResultId { get; set; }
    public int NecTherapyId { get; set; }
    public int SessionNumber { get; set; }
    public int Level { get; set; }
    public int TrialNumber { get; set; }
    public bool TargetPresent { get; set; }
    public bool Correct { get; set; }
    public double ResponseTimeMs { get; set; }
    public double TargetX { get; set; }
    public double TargetY { get; set; }
    public int DistractorCount { get; set; }
    public DateTime SessionDate { get; set; } = DateTime.UtcNow;

    public NecTherapy Therapy { get; set; } = null!;
}
