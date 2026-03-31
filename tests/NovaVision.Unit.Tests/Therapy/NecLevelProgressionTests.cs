using FluentAssertions;

namespace NovaVision.Unit.Tests.Therapy;

public class NecLevelProgressionTests
{
    private const int MaxLevel = 12;
    private const int MinSessionsPerLevel = 3;
    private const double AdvanceThreshold = 0.80;
    private const double RegressThreshold = 0.50;

    [Fact]
    public void HighAccuracy_ShouldAdvanceLevel()
    {
        var currentLevel = 4;
        var sessionsAtLevel = 3;
        var accuracy = 0.87;

        var newLevel = CalculateProgression(currentLevel, sessionsAtLevel, accuracy);

        newLevel.Should().Be(5);
    }

    [Fact]
    public void LowAccuracy_ShouldRegressLevel()
    {
        var currentLevel = 6;
        var sessionsAtLevel = 3;
        var accuracy = 0.40;

        var newLevel = CalculateProgression(currentLevel, sessionsAtLevel, accuracy);

        newLevel.Should().Be(5);
    }

    [Fact]
    public void MediumAccuracy_ShouldHoldLevel()
    {
        var currentLevel = 4;
        var sessionsAtLevel = 3;
        var accuracy = 0.65; // Between regress and advance thresholds

        var newLevel = CalculateProgression(currentLevel, sessionsAtLevel, accuracy);

        newLevel.Should().Be(4);
    }

    [Fact]
    public void InsufficientSessions_ShouldHoldLevel()
    {
        var currentLevel = 4;
        var sessionsAtLevel = 2; // Less than minimum
        var accuracy = 0.95;

        var newLevel = CalculateProgression(currentLevel, sessionsAtLevel, accuracy);

        newLevel.Should().Be(4, "minimum sessions not yet completed");
    }

    [Fact]
    public void Level1_ShouldNotRegress()
    {
        var newLevel = CalculateProgression(currentLevel: 1, sessionsAtLevel: 3, accuracy: 0.30);

        newLevel.Should().Be(1, "cannot regress below level 1");
    }

    [Fact]
    public void Level12_ShouldNotAdvanceBeyondMax()
    {
        var newLevel = CalculateProgression(currentLevel: 12, sessionsAtLevel: 3, accuracy: 0.95);

        newLevel.Should().Be(12, "cannot advance beyond max level");
    }

    [Fact]
    public void FullProgression_ShouldReach12()
    {
        var level = 1;
        for (int i = 0; i < MaxLevel * MinSessionsPerLevel; i++)
        {
            level = CalculateProgression(level, MinSessionsPerLevel, 0.90);
        }

        level.Should().Be(MaxLevel);
    }

    private static int CalculateProgression(int currentLevel, int sessionsAtLevel, double accuracy)
    {
        if (sessionsAtLevel < MinSessionsPerLevel)
            return currentLevel;

        if (accuracy >= AdvanceThreshold)
            return Math.Min(currentLevel + 1, MaxLevel);

        if (accuracy < RegressThreshold)
            return Math.Max(currentLevel - 1, 1);

        return currentLevel;
    }
}
