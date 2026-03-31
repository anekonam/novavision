using NovaVision.Core.Entities;
using NovaVision.Core.Enums;

namespace NovaVision.Therapy.Vrt.Entities;

public class VrtTherapy : BaseEntity
{
    public int VrtTherapyId { get; set; }
    public int UserId { get; set; }
    public int GridSizeX { get; set; } = 19;
    public int GridSizeY { get; set; } = 15;
    public double GridAngle { get; set; } = 43;
    public DiagnosticType DiagnosticType { get; set; } = DiagnosticType.Binocular;
    public bool IsActive { get; set; } = true;
    public bool IsComplete { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Name { get; set; }
    public string? Instruction { get; set; }

    public ICollection<VrtTherapyBlock> Blocks { get; set; } = [];
    public ICollection<VrtTherapySchedule> Schedules { get; set; } = [];
}
