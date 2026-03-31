using NovaVision.Core.Entities;

namespace NovaVision.Therapy.Vrt.Entities;

public class VrtBlockResult : BaseEntity
{
    public int VrtBlockResultId { get; set; }
    public int VrtTherapyBlockId { get; set; }
    public int SessionNumber { get; set; }

    // Aggregate metrics
    public int StimuliPresented { get; set; }
    public int StimuliCorrect { get; set; }
    public int FixationChanges { get; set; }
    public int FixationCorrect { get; set; }
    public int FalsePositives { get; set; }

    // Response times (milliseconds)
    public double AverageResponseTimeMs { get; set; }
    public double MinResponseTimeMs { get; set; }
    public double MaxResponseTimeMs { get; set; }
    public double AvgResponseTimeTLMs { get; set; }
    public double AvgResponseTimeTRMs { get; set; }
    public double AvgResponseTimeBLMs { get; set; }
    public double AvgResponseTimeBRMs { get; set; }

    public TimeSpan Duration { get; set; }
    public bool IsComplete { get; set; }
    public DateTime SessionDate { get; set; } = DateTime.UtcNow;

    public VrtTherapyBlock Block { get; set; } = null!;
    public ICollection<VrtStimulusResult> StimulusResults { get; set; } = [];
    public ICollection<VrtFixationResult> FixationResults { get; set; } = [];
}
