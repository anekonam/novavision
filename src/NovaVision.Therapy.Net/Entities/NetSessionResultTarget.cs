namespace NovaVision.Therapy.Net.Entities;

public class NetSessionResultTarget
{
    public long NetSessionResultTargetId { get; set; }
    public int NetSessionResultId { get; set; }
    public int TargetNumber { get; set; }
    public double Contrast { get; set; } // 0.0-1.0 scale
    public int Presented { get; set; }
    public int Correct { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public double Diameter { get; set; }

    public NetSessionResult SessionResult { get; set; } = null!;
}
