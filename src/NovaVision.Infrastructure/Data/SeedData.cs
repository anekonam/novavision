using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using NovaVision.Core.Entities;
using NovaVision.Core.Enums;
using NovaVision.Identity.Entities;
using NovaVision.Therapy.Nec.Entities;
using NovaVision.Therapy.Net.Entities;
using NovaVision.Therapy.Vrt.Entities;

namespace NovaVision.Infrastructure.Data;

public static class SeedData
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var db = services.GetRequiredService<NovaVisionDbContext>();

        // Roles
        foreach (var role in Enum.GetNames<UserRole>())
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<int>(role));
        }

        // Admin
        var admin = await CreateUser(userManager, "admin@novavision.com", "Admin@Nova2024!",
            "System", "Administrator", UserRole.Admin);

        // Clinicians
        var drSmith = await CreateUser(userManager, "dr.smith@novavision.com", "Clinician@2024!",
            "Sarah", "Smith", UserRole.Clinician);
        var drMueller = await CreateUser(userManager, "dr.mueller@novavision.com", "Clinician@2024!",
            "Hans", "Mueller", UserRole.Clinician, "de-DE");

        // Patients
        var patient1 = await CreateUser(userManager, "john.doe@example.com", "Patient@2024!",
            "John", "Doe", UserRole.Patient, clinicianId: drSmith.Id);
        var patient2 = await CreateUser(userManager, "maria.schmidt@example.com", "Patient@2024!",
            "Maria", "Schmidt", UserRole.Patient, "de-DE", drMueller.Id);
        var patient3 = await CreateUser(userManager, "james.wilson@example.com", "Patient@2024!",
            "James", "Wilson", UserRole.Patient, clinicianId: drSmith.Id);

        // Licences
        if (!db.Licences.Any())
        {
            db.Licences.AddRange(
                new Licence
                {
                    LicenceKey = "DEMO-VRT1-NEC1-NET1",
                    Type = LicenceType.Patient,
                    Status = LicenceStatus.Active,
                    IncludesVrt = true, IncludesNec = true, IncludesNet = true,
                    StartDate = DateTime.UtcNow.AddMonths(-1),
                    ExpiryDate = DateTime.UtcNow.AddMonths(6),
                    UserId = patient1.Id,
                },
                new Licence
                {
                    LicenceKey = "DEMO-VRT2-NEC2-NET2",
                    Type = LicenceType.Patient,
                    Status = LicenceStatus.Active,
                    IncludesVrt = true, IncludesNec = true, IncludesNet = true,
                    StartDate = DateTime.UtcNow.AddMonths(-2),
                    ExpiryDate = DateTime.UtcNow.AddMonths(4),
                    UserId = patient2.Id,
                },
                new Licence
                {
                    LicenceKey = "DEMO-NEC3-ONLY-FREE",
                    Type = LicenceType.Trial,
                    Status = LicenceStatus.Active,
                    IncludesVrt = false, IncludesNec = true, IncludesNet = false,
                    StartDate = DateTime.UtcNow,
                    ExpiryDate = DateTime.UtcNow.AddDays(30),
                    UserId = patient3.Id,
                },
                // Unassigned licence for activation testing
                new Licence
                {
                    LicenceKey = "FREE-TEST-ACTV-KEY1",
                    Type = LicenceType.Patient,
                    Status = LicenceStatus.Active,
                    IncludesVrt = true, IncludesNec = true, IncludesNet = true,
                    StartDate = DateTime.UtcNow,
                    ExpiryDate = DateTime.UtcNow.AddMonths(6),
                }
            );
            await db.SaveChangesAsync();
        }

        // VRT therapy for patient 1 (in progress with some results)
        if (!db.VrtTherapies.Any(t => t.UserId == patient1.Id))
        {
            var vrt = new VrtTherapy
            {
                UserId = patient1.Id,
                GridSizeX = 19, GridSizeY = 15, GridAngle = 43,
            };

            // Status block (diagnostic) with completed session
            var statusBlock = new VrtTherapyBlock
            {
                BlockType = VrtBlockType.Status, BlockNumber = 1,
                SessionStimuli = 284, SessionRepeats = 3,
            };
            statusBlock.Results.Add(CreateSampleVrtResult(1, 284, 210, 52, 48, 3));
            statusBlock.Results.Add(CreateSampleVrtResult(2, 284, 218, 52, 49, 2));
            statusBlock.Results.Add(CreateSampleVrtResult(3, 284, 225, 52, 50, 1));
            vrt.Blocks.Add(statusBlock);

            // Progress block (therapy) - partially complete
            var progressBlock = new VrtTherapyBlock
            {
                BlockType = VrtBlockType.Progress, BlockNumber = 2,
                TherapyArea = "7-5,7-6,7-7,8-5,8-6,8-7,9-5,9-6,10-5,10-6,10-7,11-5,11-6,11-7",
                SessionStimuli = 200, SessionRepeats = 10,
            };
            progressBlock.Results.Add(CreateSampleVrtResult(1, 200, 134, 40, 37, 2));
            progressBlock.Results.Add(CreateSampleVrtResult(2, 200, 142, 40, 38, 1));
            progressBlock.Results.Add(CreateSampleVrtResult(3, 200, 148, 40, 39, 2));
            vrt.Blocks.Add(progressBlock);

            db.VrtTherapies.Add(vrt);
        }

        // NEC therapy for patient 1 (level 4, cancellation task)
        if (!db.NecTherapies.Any(t => t.UserId == patient1.Id))
        {
            var nec = new NecTherapy { UserId = patient1.Id, CurrentLevel = 4, SessionsCompleted = 12 };
            var random = new Random(42);
            for (int level = 1; level <= 3; level++)
            {
                var stage = (NecStage)(level % 4);
                for (int session = 1; session <= 4; session++)
                {
                    var totalTargets = 10 + level * 2;
                    var correctClicks = (int)(totalTargets * (0.75 + random.NextDouble() * 0.2));
                    nec.SessionResults.Add(new NecSessionResult
                    {
                        SessionNumber = (level - 1) * 4 + session,
                        Level = level,
                        Stage = stage,
                        TotalTargets = totalTargets,
                        CorrectClicks = correctClicks,
                        IncorrectClicks = random.Next(0, 3),
                        MissedTargets = totalTargets - correctClicks,
                        ElapsedSeconds = 30 + random.Next(60),
                        Duration = TimeSpan.FromSeconds(30 + random.Next(60)),
                        SessionDate = DateTime.UtcNow.AddDays(-(36 - (level - 1) * 4 - session)),
                        IsComplete = true,
                    });
                }
            }
            db.NecTherapies.Add(nec);
        }

        // NET therapy for patient 2 (contrast on 0.0-1.0 scale)
        if (!db.NetTherapies.Any(t => t.UserId == patient2.Id))
        {
            var net = new NetTherapy { UserId = patient2.Id, NumberOfTargets = 5, SessionsCompleted = 8 };
            for (int i = 1; i <= 5; i++)
            {
                net.Targets.Add(new NetTherapyTarget
                {
                    TargetNumber = i,
                    X = (i - 3) * 6.0,
                    Y = (i % 2 == 0) ? 4.0 : -4.0,
                    Diameter = 1.0,
                    StartContrast = 0.9,
                    CurrentContrast = 0.9 - i * 0.08, // Varying: 0.82, 0.74, 0.66, 0.58, 0.50
                });
            }

            // Sample sessions
            var random = new Random(123);
            for (int s = 1; s <= 8; s++)
            {
                var session = new NetSessionResult
                {
                    SessionNumber = s,
                    Duration = TimeSpan.FromMinutes(22 + random.Next(6)),
                    IsComplete = true,
                    SessionDate = DateTime.UtcNow.AddDays(-(16 - s * 2)),
                };
                for (int t = 1; t <= 5; t++)
                {
                    session.TargetResults.Add(new NetSessionResultTarget
                    {
                        TargetNumber = t,
                        Contrast = 0.9 - t * 0.08 - s * 0.02 + random.NextDouble() * 0.05,
                        Presented = 20,
                        Correct = 14 + random.Next(6),
                        X = (t - 3) * 6.0,
                        Y = (t % 2 == 0) ? 4.0 : -4.0,
                        Diameter = 1.0,
                    });
                }
                net.SessionResults.Add(session);
            }
            db.NetTherapies.Add(net);
        }

        // UserDetail for patients
        if (!db.UserDetails.Any(d => d.UserId == patient1.Id))
        {
            db.UserDetails.Add(new UserDetail
            {
                UserId = patient1.Id,
                DateOfBirth = new DateTime(1958, 3, 15),
                Gender = "Male",
                Country = "US",
                InjuryCause = "Stroke",
                InjuryDate = new DateTime(2024, 6, 10),
                BlindnessType = "Hemianopia",
                BlindnessSide = "Left",
                DiagnosticType = DiagnosticType.Binocular,
                DiagnosticComplete = true,
                VrtEnabled = true,
                NecEnabled = true,
                FixationColour1 = "#ff0000",
                FixationColour2 = "#00ff00",
                FixationShape1 = "Circle",
                FixationShape2 = "Square",
            });
        }
        if (!db.UserDetails.Any(d => d.UserId == patient2.Id))
        {
            db.UserDetails.Add(new UserDetail
            {
                UserId = patient2.Id,
                DateOfBirth = new DateTime(1972, 11, 22),
                Gender = "Female",
                Country = "DE",
                InjuryCause = "Traumatic Brain Injury",
                InjuryDate = new DateTime(2023, 9, 5),
                BlindnessType = "Quadrantanopia",
                BlindnessSide = "Right",
                DiagnosticType = DiagnosticType.Binocular,
                NetEnabled = true,
            });
        }

        // Calibration for patient 1
        if (!db.ScreenCalibrations.Any(c => c.UserId == patient1.Id))
        {
            db.ScreenCalibrations.Add(new ScreenCalibration
            {
                UserId = patient1.Id,
                DegreePixels = 50.2,
                DistanceCm = 30,
                PixelsPerCm = 37.8,
                ScreenWidth = 1920, ScreenHeight = 1080,
                DevicePixelRatio = 1.0,
                CalibratedAt = DateTime.UtcNow.AddDays(-5),
            });
        }

        await db.SaveChangesAsync();
    }

    private static VrtBlockResult CreateSampleVrtResult(
        int sessionNumber, int presented, int correct,
        int fixChanges, int fixCorrect, int falsePositives)
    {
        return new VrtBlockResult
        {
            SessionNumber = sessionNumber,
            StimuliPresented = presented,
            StimuliCorrect = correct,
            FixationChanges = fixChanges,
            FixationCorrect = fixCorrect,
            FalsePositives = falsePositives,
            AverageResponseTimeMs = 380 + new Random(sessionNumber).Next(100),
            MinResponseTimeMs = 180 + new Random(sessionNumber).Next(50),
            MaxResponseTimeMs = 1200 + new Random(sessionNumber).Next(300),
            AvgResponseTimeTLMs = 350 + new Random(sessionNumber).Next(80),
            AvgResponseTimeTRMs = 400 + new Random(sessionNumber).Next(80),
            AvgResponseTimeBLMs = 370 + new Random(sessionNumber).Next(80),
            AvgResponseTimeBRMs = 420 + new Random(sessionNumber).Next(80),
            Duration = TimeSpan.FromMinutes(25 + new Random(sessionNumber).Next(10)),
            IsComplete = true,
            SessionDate = DateTime.UtcNow.AddDays(-(30 - sessionNumber * 7)),
        };
    }

    private static async Task<ApplicationUser> CreateUser(
        UserManager<ApplicationUser> userManager,
        string email, string password, string firstName, string lastName,
        UserRole role, string culture = "en-GB", int? clinicianId = null)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null) return existing;

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = firstName,
            LastName = lastName,
            Role = role,
            Culture = culture,
            ClinicianUserId = clinicianId,
            IsEnabled = true,
        };

        await userManager.CreateAsync(user, password);
        await userManager.AddToRoleAsync(user, role.ToString());
        return user;
    }
}
