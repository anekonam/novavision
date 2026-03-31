using NovaVision.Core.Entities;

namespace NovaVision.Therapy.Net.Entities;

public class NetTherapyTarget : BaseEntity
{
    public int NetTherapyTargetId { get; set; }
    public int NetTherapyId { get; set; }
    public int TargetNumber { get; set; } // 1-5
    public double X { get; set; }
    public double Y { get; set; }
    public double Diameter { get; set; } = 1.0; // visual degrees
    public double StartContrast { get; set; } = 100;
    public double CurrentContrast { get; set; } = 100;
    public double UpperLimit { get; set; } = 43;
    public double LowerLimit { get; set; } = 32;

    public NetTherapy Therapy { get; set; } = null!;
}
