using Microsoft.AspNetCore.Identity;
using NovaVision.Core.Enums;

namespace NovaVision.Identity.Entities;

public class ApplicationUser : IdentityUser<int>
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public UserRole Role { get; set; }
    public string Culture { get; set; } = "en-GB";
    public bool IsEnabled { get; set; } = true;
    public int? ClinicianUserId { get; set; }
    public int? OfficeId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
}
