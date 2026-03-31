using NovaVision.Core.Entities;

namespace NovaVision.Therapy.Net.Entities;

public class NetTherapy : BaseEntity
{
    public int NetTherapyId { get; set; }
    public int UserId { get; set; }
    public int NumberOfTargets { get; set; } = 5;
    public double PracticeContrast { get; set; } = 100;
    public double PracticeX { get; set; }
    public double PracticeY { get; set; }
    public double PracticeDiameter { get; set; } = 1.0;
    public int SessionsCompleted { get; set; }
    public bool IsComplete { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<NetTherapyTarget> Targets { get; set; } = [];
    public ICollection<NetSessionResult> SessionResults { get; set; } = [];
}
