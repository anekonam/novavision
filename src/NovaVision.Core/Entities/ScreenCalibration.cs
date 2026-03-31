namespace NovaVision.Core.Entities;

public class ScreenCalibration : BaseEntity
{
    public int ScreenCalibrationId { get; set; }
    public int UserId { get; set; }
    public double DegreePixels { get; set; }
    public double DistanceCm { get; set; }
    public double PixelsPerCm { get; set; }
    public int ScreenWidth { get; set; }
    public int ScreenHeight { get; set; }
    public double DevicePixelRatio { get; set; }
    public DateTime CalibratedAt { get; set; } = DateTime.UtcNow;
}
