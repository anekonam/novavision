using NovaVision.Core.Entities;

namespace NovaVision.Therapy.Vrt.Entities;

/// <summary>
/// Tracks the session schedule for a VRT therapy block.
/// Defines how many sessions are required and how many are completed.
/// </summary>
public class VrtTherapySchedule : BaseEntity
{
    public int VrtTherapyScheduleId { get; set; }
    public int VrtTherapyId { get; set; }
    public int VrtTherapyBlockId { get; set; }
    public int Sessions { get; set; }          // Required session count
    public int SessionsCompleted { get; set; } // How many completed

    public VrtTherapy Therapy { get; set; } = null!;
    public VrtTherapyBlock Block { get; set; } = null!;
}
