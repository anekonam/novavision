using NovaVision.Core.Entities;

namespace NovaVision.Therapy.Nec.Entities;

/// <summary>
/// NeuroEyeCoach therapy: a cancellation task paradigm.
/// Patient clicks target shapes among distractors on screen.
/// 4 stages with different target/distractor shape combinations.
/// 12 difficulty levels with increasing distractor counts and similarity.
/// </summary>
public class NecTherapy : BaseEntity
{
    public int NecTherapyId { get; set; }
    public int UserId { get; set; }
    public int CurrentLevel { get; set; } = 1;
    public int MaxLevel { get; set; } = 12;
    public int SessionsCompleted { get; set; }
    public bool IsComplete { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<NecSessionResult> SessionResults { get; set; } = [];
}
