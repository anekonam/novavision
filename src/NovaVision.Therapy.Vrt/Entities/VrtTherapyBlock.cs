using NovaVision.Core.Entities;
using NovaVision.Core.Enums;

namespace NovaVision.Therapy.Vrt.Entities;

public class VrtTherapyBlock : BaseEntity
{
    public int VrtTherapyBlockId { get; set; }
    public int VrtTherapyId { get; set; }
    public VrtBlockType BlockType { get; set; }
    public int BlockNumber { get; set; }

    // Therapy area: comma-separated "X-Y" pairs e.g. "5-3,5-4,6-3"
    public string? TherapyArea { get; set; }

    // Stimulus parameters
    public StimulusShape StimulusShape { get; set; } = StimulusShape.Circle;
    public string StimulusColour { get; set; } = "#ffffff";
    public double StimulusDiameter { get; set; } = 0.15; // visual degrees
    public int StimulusDisplayTimeMs { get; set; } = 200;
    public int StimulusMinResponseTimeMs { get; set; } = 150;
    public int StimulusMaxDelayTimeMs { get; set; } = 1500;
    public int MinIntervalMs { get; set; } = 1000;
    public int MaxIntervalMs { get; set; } = 2000;

    // Fixation parameters
    public StimulusShape FixationShape { get; set; } = StimulusShape.Circle;
    public string FixationColour { get; set; } = "#ff0000";
    public double FixationRate { get; set; } = 0.2;
    public double FixationVariance { get; set; } = 0.17;
    public int FixationDisplayTimeMs { get; set; } = 200;
    public int FixationMinResponseTimeMs { get; set; } = 150;
    public int FixationMaxDelayTimeMs { get; set; } = 1500;

    // Session structure
    public int SessionStimuli { get; set; } = 284;
    public int SessionRepeats { get; set; } = 1;

    public VrtTherapy Therapy { get; set; } = null!;
    public ICollection<VrtBlockResult> Results { get; set; } = [];
}
