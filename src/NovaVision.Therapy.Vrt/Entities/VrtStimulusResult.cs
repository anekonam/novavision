namespace NovaVision.Therapy.Vrt.Entities;

public class VrtStimulusResult
{
    public long VrtStimulusResultId { get; set; }
    public int VrtBlockResultId { get; set; }
    public int GridX { get; set; }
    public int GridY { get; set; }
    public bool Correct { get; set; }
    public bool Presented { get; set; }
    public double ResponseTimeMs { get; set; }
    public string Quadrant { get; set; } = string.Empty; // TL, TR, BL, BR

    public VrtBlockResult BlockResult { get; set; } = null!;
}
