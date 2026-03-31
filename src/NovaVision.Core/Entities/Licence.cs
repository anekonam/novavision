using NovaVision.Core.Enums;

namespace NovaVision.Core.Entities;

public class Licence : BaseEntity
{
    public int LicenceId { get; set; }
    public required string LicenceKey { get; set; }
    public LicenceType Type { get; set; }
    public LicenceStatus Status { get; set; } = LicenceStatus.Active;
    public bool IncludesVrt { get; set; }
    public bool IncludesNec { get; set; }
    public bool IncludesNet { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int? MaxSeats { get; set; }
    public int? UserId { get; set; }
    public int? OfficeId { get; set; }
}
