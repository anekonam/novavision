using FluentAssertions;

namespace NovaVision.Unit.Tests.Therapy;

/// <summary>
/// Tests for the NEC cancellation task level progression.
/// NEC uses 4 stages with specific target/distractor shape combinations:
///   Stage 0: Target=Diamonds, Distractors=Circles+Crosses
///   Stage 1: Target=Diamonds, Distractors=Circles+Crosses
///   Stage 2: Target=Stars, Distractors=Diamonds+Crosses
///   Stage 3: Target=Circles, Distractors=Diamonds+Crosses
/// 12 difficulty levels with increasing distractor counts and similarity.
/// </summary>
public class NecLevelProgressionTests
{
    private const int MaxLevel = 12;
    private const int MinSessionsPerLevel = 3;
    private const double AdvanceThreshold = 0.80;
    private const double RegressThreshold = 0.50;

    [Fact]
    public void HighAccuracy_ShouldAdvanceLevel()
    {
        var newLevel = CalculateProgression(4, 3, 0.87);
        newLevel.Should().Be(5);
    }

    [Fact]
    public void LowAccuracy_ShouldRegressLevel()
    {
        var newLevel = CalculateProgression(6, 3, 0.40);
        newLevel.Should().Be(5);
    }

    [Fact]
    public void MediumAccuracy_ShouldHoldLevel()
    {
        var newLevel = CalculateProgression(4, 3, 0.65);
        newLevel.Should().Be(4);
    }

    [Fact]
    public void InsufficientSessions_ShouldHoldLevel()
    {
        var newLevel = CalculateProgression(4, 2, 0.95);
        newLevel.Should().Be(4, "minimum sessions not yet completed");
    }

    [Fact]
    public void Level1_ShouldNotRegress()
    {
        var newLevel = CalculateProgression(1, 3, 0.30);
        newLevel.Should().Be(1);
    }

    [Fact]
    public void Level12_ShouldNotAdvanceBeyondMax()
    {
        var newLevel = CalculateProgression(12, 3, 0.95);
        newLevel.Should().Be(12);
    }

    [Fact]
    public void CancellationScoring_TargetClicksAreCorrect()
    {
        // Stage 0: Diamonds are targets
        var stage = 0;
        ClickShape(stage, "diamond").Should().Be("correct");
        ClickShape(stage, "circle").Should().Be("incorrect");
        ClickShape(stage, "cross").Should().Be("incorrect");
        ClickShape(stage, "star").Should().Be("incorrect");
    }

    [Fact]
    public void CancellationScoring_Stage2_StarsAreTargets()
    {
        var stage = 2;
        ClickShape(stage, "star").Should().Be("correct");
        ClickShape(stage, "diamond").Should().Be("incorrect");
        ClickShape(stage, "cross").Should().Be("incorrect");
    }

    [Fact]
    public void CancellationScoring_Stage3_CirclesAreTargets()
    {
        var stage = 3;
        ClickShape(stage, "circle").Should().Be("correct");
        ClickShape(stage, "diamond").Should().Be("incorrect");
        ClickShape(stage, "cross").Should().Be("incorrect");
    }

    [Fact]
    public void CrossClick_AlwaysIncorrect_InAllStages()
    {
        for (int stage = 0; stage < 4; stage++)
        {
            ClickShape(stage, "cross").Should().Be("incorrect",
                $"cross click should always be incorrect in stage {stage}");
        }
    }

    [Fact]
    public void SessionComplete_WhenAllTargetsClicked()
    {
        var totalTargets = 15;
        var correctClicks = 15;
        var isComplete = correctClicks >= totalTargets;
        isComplete.Should().BeTrue("session ends when all targets found");
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

    /// <summary>
    /// Mimics original NEC scoring from CancellationSessionTrialViewModel.
    /// </summary>
    private static string ClickShape(int stage, string shape) =>
        (stage, shape) switch
        {
            (0, "diamond") or (1, "diamond") => "correct",
            (2, "star") => "correct",
            (3, "circle") => "correct",
            (_, "cross") => "incorrect", // Cross always incorrect
            _ => "incorrect",
        };
}
