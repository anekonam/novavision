namespace NovaVision.Therapy.Vrt.Entities;

public class VrtFixationResult
{
    public long VrtFixationResultId { get; set; }
    public int VrtBlockResultId { get; set; }
    public int Index { get; set; }
    public bool Correct { get; set; }
    public bool Presented { get; set; }
    public double ResponseTimeMs { get; set; }

    public VrtBlockResult BlockResult { get; set; } = null!;
}
