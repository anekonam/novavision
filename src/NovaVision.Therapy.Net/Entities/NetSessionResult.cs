using NovaVision.Core.Entities;

namespace NovaVision.Therapy.Net.Entities;

public class NetSessionResult : BaseEntity
{
    public int NetSessionResultId { get; set; }
    public int NetTherapyId { get; set; }
    public int SessionNumber { get; set; }
    public TimeSpan Duration { get; set; }
    public DateTime SessionDate { get; set; } = DateTime.UtcNow;
    public bool IsComplete { get; set; }

    public NetTherapy Therapy { get; set; } = null!;
    public ICollection<NetSessionResultTarget> TargetResults { get; set; } = [];
}
