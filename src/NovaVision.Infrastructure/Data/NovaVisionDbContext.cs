using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using NovaVision.Core.Entities;
using NovaVision.Identity.Entities;
using NovaVision.Therapy.Nec.Entities;
using NovaVision.Therapy.Net.Entities;
using NovaVision.Therapy.Vrt.Entities;

namespace NovaVision.Infrastructure.Data;

public class NovaVisionDbContext : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>
{
    public NovaVisionDbContext(DbContextOptions<NovaVisionDbContext> options) : base(options)
    {
    }

    // Core
    public DbSet<Office> Offices => Set<Office>();
    public DbSet<ScreenCalibration> ScreenCalibrations => Set<ScreenCalibration>();
    public DbSet<Licence> Licences => Set<Licence>();

    // VRT
    public DbSet<VrtTherapy> VrtTherapies => Set<VrtTherapy>();
    public DbSet<VrtTherapyBlock> VrtTherapyBlocks => Set<VrtTherapyBlock>();
    public DbSet<VrtBlockResult> VrtBlockResults => Set<VrtBlockResult>();
    public DbSet<VrtStimulusResult> VrtStimulusResults => Set<VrtStimulusResult>();
    public DbSet<VrtFixationResult> VrtFixationResults => Set<VrtFixationResult>();

    // NEC
    public DbSet<NecTherapy> NecTherapies => Set<NecTherapy>();
    public DbSet<NecTrialResult> NecTrialResults => Set<NecTrialResult>();

    // NET
    public DbSet<NetTherapy> NetTherapies => Set<NetTherapy>();
    public DbSet<NetTherapyTarget> NetTherapyTargets => Set<NetTherapyTarget>();
    public DbSet<NetSessionResult> NetSessionResults => Set<NetSessionResult>();
    public DbSet<NetSessionResultTarget> NetSessionResultTargets => Set<NetSessionResultTarget>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Identity
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(u => u.FirstName).HasMaxLength(200).IsRequired();
            entity.Property(u => u.LastName).HasMaxLength(200).IsRequired();
            entity.Property(u => u.Culture).HasMaxLength(10).HasDefaultValue("en-GB");
            entity.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
        });

        // Office
        builder.Entity<Office>(entity =>
        {
            entity.HasKey(e => e.OfficeId);
            entity.Property(e => e.Name).HasMaxLength(300).IsRequired();
        });

        // Screen Calibration
        builder.Entity<ScreenCalibration>(entity =>
        {
            entity.HasKey(e => e.ScreenCalibrationId);
            entity.HasIndex(e => e.UserId);
        });

        // Licence
        builder.Entity<Licence>(entity =>
        {
            entity.HasKey(e => e.LicenceId);
            entity.HasIndex(e => e.LicenceKey).IsUnique();
            entity.Property(e => e.LicenceKey).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Type).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
        });

        // VRT Therapy
        builder.Entity<VrtTherapy>(entity =>
        {
            entity.HasKey(e => e.VrtTherapyId);
            entity.HasIndex(e => e.UserId);
            entity.Property(e => e.DiagnosticType).HasConversion<string>().HasMaxLength(20);
        });

        builder.Entity<VrtTherapyBlock>(entity =>
        {
            entity.HasKey(e => e.VrtTherapyBlockId);
            entity.Property(e => e.BlockType).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.StimulusShape).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.FixationShape).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.StimulusColour).HasMaxLength(20);
            entity.Property(e => e.FixationColour).HasMaxLength(20);
            entity.HasOne(e => e.Therapy).WithMany(t => t.Blocks).HasForeignKey(e => e.VrtTherapyId);
        });

        builder.Entity<VrtBlockResult>(entity =>
        {
            entity.HasKey(e => e.VrtBlockResultId);
            entity.HasOne(e => e.Block).WithMany(b => b.Results).HasForeignKey(e => e.VrtTherapyBlockId);
        });

        builder.Entity<VrtStimulusResult>(entity =>
        {
            entity.HasKey(e => e.VrtStimulusResultId);
            entity.Property(e => e.Quadrant).HasMaxLength(2);
            entity.HasOne(e => e.BlockResult).WithMany(r => r.StimulusResults).HasForeignKey(e => e.VrtBlockResultId);
            entity.HasIndex(e => e.VrtBlockResultId);
        });

        builder.Entity<VrtFixationResult>(entity =>
        {
            entity.HasKey(e => e.VrtFixationResultId);
            entity.HasOne(e => e.BlockResult).WithMany(r => r.FixationResults).HasForeignKey(e => e.VrtBlockResultId);
            entity.HasIndex(e => e.VrtBlockResultId);
        });

        // NEC Therapy
        builder.Entity<NecTherapy>(entity =>
        {
            entity.HasKey(e => e.NecTherapyId);
            entity.HasIndex(e => e.UserId);
        });

        builder.Entity<NecTrialResult>(entity =>
        {
            entity.HasKey(e => e.NecTrialResultId);
            entity.HasOne(e => e.Therapy).WithMany(t => t.TrialResults).HasForeignKey(e => e.NecTherapyId);
            entity.HasIndex(e => e.NecTherapyId);
        });

        // NET Therapy
        builder.Entity<NetTherapy>(entity =>
        {
            entity.HasKey(e => e.NetTherapyId);
            entity.HasIndex(e => e.UserId);
        });

        builder.Entity<NetTherapyTarget>(entity =>
        {
            entity.HasKey(e => e.NetTherapyTargetId);
            entity.HasOne(e => e.Therapy).WithMany(t => t.Targets).HasForeignKey(e => e.NetTherapyId);
        });

        builder.Entity<NetSessionResult>(entity =>
        {
            entity.HasKey(e => e.NetSessionResultId);
            entity.HasOne(e => e.Therapy).WithMany(t => t.SessionResults).HasForeignKey(e => e.NetTherapyId);
        });

        builder.Entity<NetSessionResultTarget>(entity =>
        {
            entity.HasKey(e => e.NetSessionResultTargetId);
            entity.HasOne(e => e.SessionResult).WithMany(r => r.TargetResults).HasForeignKey(e => e.NetSessionResultId);
            entity.HasIndex(e => e.NetSessionResultId);
        });
    }

    public override int SaveChanges()
    {
        SetAuditFields();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void SetAuditFields()
    {
        var entries = ChangeTracker.Entries<BaseEntity>();
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.ModifiedAt = DateTime.UtcNow;
            }
        }
    }
}
