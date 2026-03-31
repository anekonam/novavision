using NovaVision.Core.Entities;

namespace NovaVision.Therapy.Nec.Entities;

public class NecTherapy : BaseEntity
{
    public int NecTherapyId { get; set; }
    public int UserId { get; set; }
    public int CurrentLevel { get; set; } = 1;
    public int MaxLevel { get; set; } = 12;
    public int SessionsCompleted { get; set; }
    public bool IsComplete { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<NecTrialResult> TrialResults { get; set; } = [];
}
