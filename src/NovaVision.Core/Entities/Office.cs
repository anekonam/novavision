namespace NovaVision.Core.Entities;

public class Office : BaseEntity
{
    public int OfficeId { get; set; }
    public required string Name { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Zip { get; set; }
    public string? Country { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool IsEnabled { get; set; } = true;
}
