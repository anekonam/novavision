using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaVision.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "en-GB"),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    ClinicianUserId = table.Column<int>(type: "int", nullable: true),
                    OfficeId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Licences",
                columns: table => new
                {
                    LicenceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LicenceKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IncludesVrt = table.Column<bool>(type: "bit", nullable: false),
                    IncludesNec = table.Column<bool>(type: "bit", nullable: false),
                    IncludesNet = table.Column<bool>(type: "bit", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MaxSeats = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    OfficeId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Licences", x => x.LicenceId);
                });

            migrationBuilder.CreateTable(
                name: "NecTherapies",
                columns: table => new
                {
                    NecTherapyId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CurrentLevel = table.Column<int>(type: "int", nullable: false),
                    MaxLevel = table.Column<int>(type: "int", nullable: false),
                    SessionsCompleted = table.Column<int>(type: "int", nullable: false),
                    IsComplete = table.Column<bool>(type: "bit", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NecTherapies", x => x.NecTherapyId);
                });

            migrationBuilder.CreateTable(
                name: "NetTherapies",
                columns: table => new
                {
                    NetTherapyId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    NumberOfTargets = table.Column<int>(type: "int", nullable: false),
                    Presentations = table.Column<int>(type: "int", nullable: false),
                    UpperLimit = table.Column<int>(type: "int", nullable: false),
                    LowerLimit = table.Column<int>(type: "int", nullable: false),
                    PracticeContrast = table.Column<double>(type: "float", nullable: false),
                    PracticeX = table.Column<double>(type: "float", nullable: false),
                    PracticeY = table.Column<double>(type: "float", nullable: false),
                    PracticeDiameter = table.Column<double>(type: "float", nullable: false),
                    PracticePresentations = table.Column<int>(type: "int", nullable: false),
                    PracticeComplete = table.Column<bool>(type: "bit", nullable: false),
                    SessionsCompleted = table.Column<int>(type: "int", nullable: false),
                    IsComplete = table.Column<bool>(type: "bit", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NetTherapies", x => x.NetTherapyId);
                });

            migrationBuilder.CreateTable(
                name: "Offices",
                columns: table => new
                {
                    OfficeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    State = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Zip = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Country = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Offices", x => x.OfficeId);
                });

            migrationBuilder.CreateTable(
                name: "ScreenCalibrations",
                columns: table => new
                {
                    ScreenCalibrationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    DegreePixels = table.Column<double>(type: "float", nullable: false),
                    DistanceCm = table.Column<double>(type: "float", nullable: false),
                    PixelsPerCm = table.Column<double>(type: "float", nullable: false),
                    ScreenWidth = table.Column<int>(type: "int", nullable: false),
                    ScreenHeight = table.Column<int>(type: "int", nullable: false),
                    DevicePixelRatio = table.Column<double>(type: "float", nullable: false),
                    CalibratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScreenCalibrations", x => x.ScreenCalibrationId);
                });

            migrationBuilder.CreateTable(
                name: "UserDetails",
                columns: table => new
                {
                    UserDetailId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    State = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Zip = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Country = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InjuryCause = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InjuryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BlindnessType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BlindnessSide = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ScreenWidth = table.Column<double>(type: "float", nullable: true),
                    ScreenHeight = table.Column<double>(type: "float", nullable: true),
                    ScreenDistance = table.Column<double>(type: "float", nullable: true),
                    DegreePixels = table.Column<double>(type: "float", nullable: true),
                    DiagnosticType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DiagnosticComplete = table.Column<bool>(type: "bit", nullable: false),
                    DiagnosticFailed = table.Column<bool>(type: "bit", nullable: false),
                    Size = table.Column<double>(type: "float", nullable: true),
                    FixationColour1 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FixationColour2 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FixationShape1 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FixationShape2 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TestEye = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TherapyStage = table.Column<int>(type: "int", nullable: false),
                    TherapyPart = table.Column<int>(type: "int", nullable: false),
                    TherapyLevel = table.Column<int>(type: "int", nullable: false),
                    TherapyBlock = table.Column<int>(type: "int", nullable: false),
                    TherapyRepeat = table.Column<int>(type: "int", nullable: false),
                    VrtComplete = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NecComplete = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NetComplete = table.Column<DateTime>(type: "datetime2", nullable: true),
                    VrtEnabled = table.Column<bool>(type: "bit", nullable: false),
                    NecEnabled = table.Column<bool>(type: "bit", nullable: false),
                    NetEnabled = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDetails", x => x.UserDetailId);
                });

            migrationBuilder.CreateTable(
                name: "VrtTherapies",
                columns: table => new
                {
                    VrtTherapyId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    GridSizeX = table.Column<int>(type: "int", nullable: false),
                    GridSizeY = table.Column<int>(type: "int", nullable: false),
                    GridAngle = table.Column<double>(type: "float", nullable: false),
                    DiagnosticType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsComplete = table.Column<bool>(type: "bit", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Instruction = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VrtTherapies", x => x.VrtTherapyId);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NecSessionResults",
                columns: table => new
                {
                    NecSessionResultId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NecTherapyId = table.Column<int>(type: "int", nullable: false),
                    SessionNumber = table.Column<int>(type: "int", nullable: false),
                    Level = table.Column<int>(type: "int", nullable: false),
                    Stage = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TotalTargets = table.Column<int>(type: "int", nullable: false),
                    CorrectClicks = table.Column<int>(type: "int", nullable: false),
                    IncorrectClicks = table.Column<int>(type: "int", nullable: false),
                    MissedTargets = table.Column<int>(type: "int", nullable: false),
                    ElapsedSeconds = table.Column<double>(type: "float", nullable: false),
                    Duration = table.Column<TimeSpan>(type: "time", nullable: false),
                    SessionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsComplete = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NecSessionResults", x => x.NecSessionResultId);
                    table.ForeignKey(
                        name: "FK_NecSessionResults_NecTherapies_NecTherapyId",
                        column: x => x.NecTherapyId,
                        principalTable: "NecTherapies",
                        principalColumn: "NecTherapyId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NetSessionResults",
                columns: table => new
                {
                    NetSessionResultId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NetTherapyId = table.Column<int>(type: "int", nullable: false),
                    SessionNumber = table.Column<int>(type: "int", nullable: false),
                    Duration = table.Column<TimeSpan>(type: "time", nullable: false),
                    SessionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsComplete = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NetSessionResults", x => x.NetSessionResultId);
                    table.ForeignKey(
                        name: "FK_NetSessionResults_NetTherapies_NetTherapyId",
                        column: x => x.NetTherapyId,
                        principalTable: "NetTherapies",
                        principalColumn: "NetTherapyId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NetTherapyTargets",
                columns: table => new
                {
                    NetTherapyTargetId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NetTherapyId = table.Column<int>(type: "int", nullable: false),
                    TargetNumber = table.Column<int>(type: "int", nullable: false),
                    X = table.Column<double>(type: "float", nullable: false),
                    Y = table.Column<double>(type: "float", nullable: false),
                    Diameter = table.Column<double>(type: "float", nullable: false),
                    StartContrast = table.Column<double>(type: "float", nullable: false),
                    CurrentContrast = table.Column<double>(type: "float", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NetTherapyTargets", x => x.NetTherapyTargetId);
                    table.ForeignKey(
                        name: "FK_NetTherapyTargets_NetTherapies_NetTherapyId",
                        column: x => x.NetTherapyId,
                        principalTable: "NetTherapies",
                        principalColumn: "NetTherapyId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VrtTherapyBlocks",
                columns: table => new
                {
                    VrtTherapyBlockId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VrtTherapyId = table.Column<int>(type: "int", nullable: false),
                    BlockType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    BlockNumber = table.Column<int>(type: "int", nullable: false),
                    TherapyArea = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GridSizeX = table.Column<int>(type: "int", nullable: false),
                    GridSizeY = table.Column<int>(type: "int", nullable: false),
                    GridAngle = table.Column<double>(type: "float", nullable: false),
                    Tolerance = table.Column<int>(type: "int", nullable: false),
                    StimulusShape = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    StimulusColour = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    StimulusDiameter = table.Column<double>(type: "float", nullable: false),
                    StimulusDisplayTimeMs = table.Column<int>(type: "int", nullable: false),
                    StimulusMinResponseTimeMs = table.Column<int>(type: "int", nullable: false),
                    StimulusMaxDelayTimeMs = table.Column<int>(type: "int", nullable: false),
                    MinIntervalMs = table.Column<int>(type: "int", nullable: false),
                    MaxIntervalMs = table.Column<int>(type: "int", nullable: false),
                    FixationShape1 = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FixationShape2 = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FixationColour1 = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FixationColour2 = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FixationRate = table.Column<double>(type: "float", nullable: false),
                    FixationVariance = table.Column<double>(type: "float", nullable: false),
                    FixationDisplayTimeMs = table.Column<int>(type: "int", nullable: false),
                    FixationMinResponseTimeMs = table.Column<int>(type: "int", nullable: false),
                    FixationMaxDelayTimeMs = table.Column<int>(type: "int", nullable: false),
                    SessionStimuli = table.Column<int>(type: "int", nullable: false),
                    SessionRepeats = table.Column<int>(type: "int", nullable: false),
                    ProgressStimuliCount = table.Column<int>(type: "int", nullable: false),
                    ExcludeCentre = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VrtTherapyBlocks", x => x.VrtTherapyBlockId);
                    table.ForeignKey(
                        name: "FK_VrtTherapyBlocks_VrtTherapies_VrtTherapyId",
                        column: x => x.VrtTherapyId,
                        principalTable: "VrtTherapies",
                        principalColumn: "VrtTherapyId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NetSessionResultTargets",
                columns: table => new
                {
                    NetSessionResultTargetId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NetSessionResultId = table.Column<int>(type: "int", nullable: false),
                    TargetNumber = table.Column<int>(type: "int", nullable: false),
                    Contrast = table.Column<double>(type: "float", nullable: false),
                    Presented = table.Column<int>(type: "int", nullable: false),
                    Correct = table.Column<int>(type: "int", nullable: false),
                    X = table.Column<double>(type: "float", nullable: false),
                    Y = table.Column<double>(type: "float", nullable: false),
                    Diameter = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NetSessionResultTargets", x => x.NetSessionResultTargetId);
                    table.ForeignKey(
                        name: "FK_NetSessionResultTargets_NetSessionResults_NetSessionResultId",
                        column: x => x.NetSessionResultId,
                        principalTable: "NetSessionResults",
                        principalColumn: "NetSessionResultId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VrtBlockResults",
                columns: table => new
                {
                    VrtBlockResultId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VrtTherapyBlockId = table.Column<int>(type: "int", nullable: false),
                    SessionNumber = table.Column<int>(type: "int", nullable: false),
                    StimuliPresented = table.Column<int>(type: "int", nullable: false),
                    StimuliCorrect = table.Column<int>(type: "int", nullable: false),
                    FixationChanges = table.Column<int>(type: "int", nullable: false),
                    FixationCorrect = table.Column<int>(type: "int", nullable: false),
                    FalsePositives = table.Column<int>(type: "int", nullable: false),
                    AverageResponseTimeMs = table.Column<double>(type: "float", nullable: false),
                    MinResponseTimeMs = table.Column<double>(type: "float", nullable: false),
                    MaxResponseTimeMs = table.Column<double>(type: "float", nullable: false),
                    AvgResponseTimeTLMs = table.Column<double>(type: "float", nullable: false),
                    AvgResponseTimeTRMs = table.Column<double>(type: "float", nullable: false),
                    AvgResponseTimeBLMs = table.Column<double>(type: "float", nullable: false),
                    AvgResponseTimeBRMs = table.Column<double>(type: "float", nullable: false),
                    Duration = table.Column<TimeSpan>(type: "time", nullable: false),
                    IsComplete = table.Column<bool>(type: "bit", nullable: false),
                    SessionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VrtBlockResults", x => x.VrtBlockResultId);
                    table.ForeignKey(
                        name: "FK_VrtBlockResults_VrtTherapyBlocks_VrtTherapyBlockId",
                        column: x => x.VrtTherapyBlockId,
                        principalTable: "VrtTherapyBlocks",
                        principalColumn: "VrtTherapyBlockId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VrtTherapySchedules",
                columns: table => new
                {
                    VrtTherapyScheduleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VrtTherapyId = table.Column<int>(type: "int", nullable: false),
                    VrtTherapyBlockId = table.Column<int>(type: "int", nullable: false),
                    Sessions = table.Column<int>(type: "int", nullable: false),
                    SessionsCompleted = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VrtTherapySchedules", x => x.VrtTherapyScheduleId);
                    table.ForeignKey(
                        name: "FK_VrtTherapySchedules_VrtTherapies_VrtTherapyId",
                        column: x => x.VrtTherapyId,
                        principalTable: "VrtTherapies",
                        principalColumn: "VrtTherapyId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VrtTherapySchedules_VrtTherapyBlocks_VrtTherapyBlockId",
                        column: x => x.VrtTherapyBlockId,
                        principalTable: "VrtTherapyBlocks",
                        principalColumn: "VrtTherapyBlockId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VrtFixationResults",
                columns: table => new
                {
                    VrtFixationResultId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VrtBlockResultId = table.Column<int>(type: "int", nullable: false),
                    Index = table.Column<int>(type: "int", nullable: false),
                    Correct = table.Column<bool>(type: "bit", nullable: false),
                    Presented = table.Column<bool>(type: "bit", nullable: false),
                    ResponseTimeMs = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VrtFixationResults", x => x.VrtFixationResultId);
                    table.ForeignKey(
                        name: "FK_VrtFixationResults_VrtBlockResults_VrtBlockResultId",
                        column: x => x.VrtBlockResultId,
                        principalTable: "VrtBlockResults",
                        principalColumn: "VrtBlockResultId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VrtStimulusResults",
                columns: table => new
                {
                    VrtStimulusResultId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VrtBlockResultId = table.Column<int>(type: "int", nullable: false),
                    GridX = table.Column<int>(type: "int", nullable: false),
                    GridY = table.Column<int>(type: "int", nullable: false),
                    Correct = table.Column<bool>(type: "bit", nullable: false),
                    Presented = table.Column<bool>(type: "bit", nullable: false),
                    ResponseTimeMs = table.Column<double>(type: "float", nullable: false),
                    Quadrant = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VrtStimulusResults", x => x.VrtStimulusResultId);
                    table.ForeignKey(
                        name: "FK_VrtStimulusResults_VrtBlockResults_VrtBlockResultId",
                        column: x => x.VrtBlockResultId,
                        principalTable: "VrtBlockResults",
                        principalColumn: "VrtBlockResultId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Licences_LicenceKey",
                table: "Licences",
                column: "LicenceKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NecSessionResults_NecTherapyId",
                table: "NecSessionResults",
                column: "NecTherapyId");

            migrationBuilder.CreateIndex(
                name: "IX_NecTherapies_UserId",
                table: "NecTherapies",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_NetSessionResults_NetTherapyId",
                table: "NetSessionResults",
                column: "NetTherapyId");

            migrationBuilder.CreateIndex(
                name: "IX_NetSessionResultTargets_NetSessionResultId",
                table: "NetSessionResultTargets",
                column: "NetSessionResultId");

            migrationBuilder.CreateIndex(
                name: "IX_NetTherapies_UserId",
                table: "NetTherapies",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_NetTherapyTargets_NetTherapyId",
                table: "NetTherapyTargets",
                column: "NetTherapyId");

            migrationBuilder.CreateIndex(
                name: "IX_ScreenCalibrations_UserId",
                table: "ScreenCalibrations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDetails_UserId",
                table: "UserDetails",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VrtBlockResults_VrtTherapyBlockId",
                table: "VrtBlockResults",
                column: "VrtTherapyBlockId");

            migrationBuilder.CreateIndex(
                name: "IX_VrtFixationResults_VrtBlockResultId",
                table: "VrtFixationResults",
                column: "VrtBlockResultId");

            migrationBuilder.CreateIndex(
                name: "IX_VrtStimulusResults_VrtBlockResultId",
                table: "VrtStimulusResults",
                column: "VrtBlockResultId");

            migrationBuilder.CreateIndex(
                name: "IX_VrtTherapies_UserId",
                table: "VrtTherapies",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_VrtTherapyBlocks_VrtTherapyId",
                table: "VrtTherapyBlocks",
                column: "VrtTherapyId");

            migrationBuilder.CreateIndex(
                name: "IX_VrtTherapySchedules_VrtTherapyBlockId",
                table: "VrtTherapySchedules",
                column: "VrtTherapyBlockId");

            migrationBuilder.CreateIndex(
                name: "IX_VrtTherapySchedules_VrtTherapyId",
                table: "VrtTherapySchedules",
                column: "VrtTherapyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "Licences");

            migrationBuilder.DropTable(
                name: "NecSessionResults");

            migrationBuilder.DropTable(
                name: "NetSessionResultTargets");

            migrationBuilder.DropTable(
                name: "NetTherapyTargets");

            migrationBuilder.DropTable(
                name: "Offices");

            migrationBuilder.DropTable(
                name: "ScreenCalibrations");

            migrationBuilder.DropTable(
                name: "UserDetails");

            migrationBuilder.DropTable(
                name: "VrtFixationResults");

            migrationBuilder.DropTable(
                name: "VrtStimulusResults");

            migrationBuilder.DropTable(
                name: "VrtTherapySchedules");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "NecTherapies");

            migrationBuilder.DropTable(
                name: "NetSessionResults");

            migrationBuilder.DropTable(
                name: "VrtBlockResults");

            migrationBuilder.DropTable(
                name: "NetTherapies");

            migrationBuilder.DropTable(
                name: "VrtTherapyBlocks");

            migrationBuilder.DropTable(
                name: "VrtTherapies");
        }
    }
}
