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

    // Grid config (can override therapy-level defaults)
    public int GridSizeX { get; set; } = 19;
    public int GridSizeY { get; set; } = 15;
    public double GridAngle { get; set; } = 43;
    public int Tolerance { get; set; } = 15;

    // Stimulus parameters
    public StimulusShape StimulusShape { get; set; } = StimulusShape.Circle;
    public string StimulusColour { get; set; } = "#ffffff";
    public double StimulusDiameter { get; set; } = 0.15; // visual degrees
    public int StimulusDisplayTimeMs { get; set; } = 200;
    public int StimulusMinResponseTimeMs { get; set; } = 150;
    public int StimulusMaxDelayTimeMs { get; set; } = 1500;
    public int MinIntervalMs { get; set; } = 1000;
    public int MaxIntervalMs { get; set; } = 2000;

    // Dual fixation points (original uses two alternating fixation appearances)
    public StimulusShape FixationShape1 { get; set; } = StimulusShape.Circle;
    public StimulusShape FixationShape2 { get; set; } = StimulusShape.Square;
    public string FixationColour1 { get; set; } = "#ff0000";
    public string FixationColour2 { get; set; } = "#00ff00";
    public double FixationRate { get; set; } = 0.2;
    public double FixationVariance { get; set; } = 0.17;
    public int FixationDisplayTimeMs { get; set; } = 200;
    public int FixationMinResponseTimeMs { get; set; } = 150;
    public int FixationMaxDelayTimeMs { get; set; } = 1500;

    // Session structure
    public int SessionStimuli { get; set; } = 284;
    public int SessionRepeats { get; set; } = 1;

    // Progress block specific: count for progress stimuli (rest are random)
    public int ProgressStimuliCount { get; set; } = 200;

    // Standard block: exclude centre cell
    public bool ExcludeCentre { get; set; } = true;

    public VrtTherapy Therapy { get; set; } = null!;
    public ICollection<VrtBlockResult> Results { get; set; } = [];
}
