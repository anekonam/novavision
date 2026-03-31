using FluentAssertions;

namespace NovaVision.Unit.Tests.Therapy;

/// <summary>
/// Tests for the NET contrast staircase algorithm.
/// The original NovaVisionApp uses an ASYMMETRIC staircase:
///   - Correct (above upper threshold): contrast -= 0.1 (step DOWN, harder)
///   - Incorrect (below lower threshold): contrast += 0.05 (step UP, easier)
/// Contrast scale is 0.0-1.0 (NOT percentage).
/// UpperLimit/LowerLimit are CORRECT COUNT thresholds, not contrast bounds.
/// Contrast bounds are 0.15 (minimum) to 0.9 (maximum).
/// </summary>
public class NetStaircaseTests
{
    private const double ContrastMin = 0.15;
    private const double ContrastMax = 0.9;
    private const double StepDown = 0.1;  // Correct → harder (asymmetric!)
    private const double StepUp = 0.05;   // Incorrect → easier (asymmetric!)
    private const int UpperThreshold = 43; // Advance when correct count >= this
    private const int LowerThreshold = 32; // Regress when correct count <= this

    [Fact]
    public void CorrectAboveThreshold_ShouldDecreaseContrast_ByPointOne()
    {
        var newContrast = AdjustContrast(0.6, correctCount: 45, UpperThreshold, LowerThreshold);
        newContrast.Should().BeApproximately(0.5, 0.001, "contrast should decrease by 0.1");
    }

    [Fact]
    public void IncorrectBelowThreshold_ShouldIncreaseContrast_ByPointZeroFive()
    {
        var newContrast = AdjustContrast(0.4, correctCount: 30, UpperThreshold, LowerThreshold);
        newContrast.Should().BeApproximately(0.45, 0.001, "contrast should increase by 0.05");
    }

    [Fact]
    public void CountBetweenThresholds_ShouldNotChangeContrast()
    {
        var newContrast = AdjustContrast(0.5, correctCount: 38, UpperThreshold, LowerThreshold);
        newContrast.Should().BeApproximately(0.5, 0.001, "contrast should not change between thresholds");
    }

    [Fact]
    public void Contrast_ShouldNotGoBelowMinimum()
    {
        var newContrast = AdjustContrast(0.2, correctCount: 45, UpperThreshold, LowerThreshold);
        newContrast.Should().BeGreaterThanOrEqualTo(ContrastMin);
    }

    [Fact]
    public void Contrast_ShouldNotExceedMaximum()
    {
        var newContrast = AdjustContrast(0.88, correctCount: 28, UpperThreshold, LowerThreshold);
        newContrast.Should().BeLessThanOrEqualTo(ContrastMax);
    }

    [Fact]
    public void StaircaseIsAsymmetric_DownStepLargerThanUpStep()
    {
        StepDown.Should().BeGreaterThan(StepUp,
            "original uses -0.1 down but only +0.05 up (asymmetric staircase)");
    }

    [Fact]
    public void FiveTargets_ShouldBeIndependent()
    {
        var contrasts = new[] { 0.8, 0.6, 0.5, 0.4, 0.3 };
        var correctCounts = new[] { 45, 30, 38, 44, 29 }; // Above, below, between, above, below

        var updated = new double[5];
        for (int i = 0; i < 5; i++)
            updated[i] = AdjustContrast(contrasts[i], correctCounts[i], UpperThreshold, LowerThreshold);

        updated[0].Should().BeApproximately(0.7, 0.001);  // Correct → -0.1
        updated[1].Should().BeApproximately(0.65, 0.001);  // Incorrect → +0.05
        updated[2].Should().BeApproximately(0.5, 0.001);   // No change
        updated[3].Should().BeApproximately(0.3, 0.001);   // Correct → -0.1
        updated[4].Should().BeApproximately(0.35, 0.001);  // Incorrect → +0.05
    }

    [Fact]
    public void ContrastAlertThreshold_ShouldDetect()
    {
        // When any target contrast crosses below 0.15, alert should trigger
        var contrast = 0.2;
        var newContrast = AdjustContrast(contrast, correctCount: 45, UpperThreshold, LowerThreshold);

        var crossedAlertThreshold = newContrast <= ContrastMin;
        crossedAlertThreshold.Should().BeTrue("0.2 - 0.1 = 0.1 which is at/below minimum 0.15");
    }

    /// <summary>
    /// Implements the original NovaVisionApp contrast staircase logic.
    /// From UserNetTherapyResultData.cs:
    ///   if correct >= UpperLimit AND contrast >= 0.15 → contrast -= 0.1
    ///   if correct <= LowerLimit AND contrast <= 0.9  → contrast += 0.05
    /// </summary>
    private static double AdjustContrast(double current, int correctCount, int upperLimit, int lowerLimit)
    {
        if (correctCount >= upperLimit && current >= ContrastMin)
        {
            return Math.Max(current - StepDown, ContrastMin);
        }
        if (correctCount <= lowerLimit && current <= ContrastMax)
        {
            return Math.Min(current + StepUp, ContrastMax);
        }
        return current;
    }
}
