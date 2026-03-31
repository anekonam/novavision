using FluentAssertions;

namespace NovaVision.Unit.Tests.Therapy;

public class NetStaircaseTests
{
    [Fact]
    public void CorrectResponse_ShouldDecreaseContrast()
    {
        var contrast = 80.0;
        var stepSize = 2.0;
        var lowerLimit = 32.0;

        var newContrast = AdjustContrast(contrast, correct: true, stepSize, lowerLimit, upperLimit: 100);

        newContrast.Should().Be(78.0);
    }

    [Fact]
    public void MissedResponse_ShouldIncreaseContrast()
    {
        var contrast = 50.0;
        var stepSize = 2.0;

        var newContrast = AdjustContrast(contrast, correct: false, stepSize, lowerLimit: 32, upperLimit: 100);

        newContrast.Should().Be(52.0);
    }

    [Fact]
    public void Contrast_ShouldNotExceedUpperLimit()
    {
        var contrast = 99.0;
        var newContrast = AdjustContrast(contrast, correct: false, stepSize: 2.0, lowerLimit: 32, upperLimit: 100);

        newContrast.Should().Be(100.0);
    }

    [Fact]
    public void Contrast_ShouldNotGoBelowLowerLimit()
    {
        var contrast = 33.0;
        var newContrast = AdjustContrast(contrast, correct: true, stepSize: 2.0, lowerLimit: 32, upperLimit: 100);

        newContrast.Should().Be(32.0);
    }

    [Fact]
    public void MultipleTargets_ShouldBeIndependent()
    {
        var targets = new[] { 80.0, 60.0, 70.0, 55.0, 45.0 };
        var responses = new[] { true, false, true, false, true };
        var stepSize = 2.0;

        var updated = new double[5];
        for (int i = 0; i < 5; i++)
        {
            updated[i] = AdjustContrast(targets[i], responses[i], stepSize, 32, 100);
        }

        updated[0].Should().Be(78.0); // Correct → decrease
        updated[1].Should().Be(62.0); // Missed → increase
        updated[2].Should().Be(68.0); // Correct → decrease
        updated[3].Should().Be(57.0); // Missed → increase
        updated[4].Should().Be(43.0); // Correct → decrease
    }

    [Fact]
    public void StaircaseConvergence_ShouldApproachThreshold()
    {
        // Simulate a patient with 60% contrast threshold
        var contrast = 100.0;
        var threshold = 60.0;
        var stepSize = 4.0;
        var reversals = 0;
        var lastDirection = 0; // 1 = up, -1 = down

        for (int trial = 0; trial < 50; trial++)
        {
            var detected = contrast > threshold;
            var direction = detected ? -1 : 1;

            if (lastDirection != 0 && direction != lastDirection)
                reversals++;
            lastDirection = direction;

            contrast = AdjustContrast(contrast, detected, stepSize, 32, 100);

            // Reduce step size after reversals for convergence
            if (reversals >= 4) stepSize = 2.0;
            if (reversals >= 8) stepSize = 1.0;
        }

        contrast.Should().BeInRange(threshold - 5, threshold + 5,
            "staircase should converge near the threshold");
    }

    private static double AdjustContrast(double current, bool correct, double stepSize, double lowerLimit, double upperLimit)
    {
        var adjusted = correct ? current - stepSize : current + stepSize;
        return Math.Clamp(adjusted, lowerLimit, upperLimit);
    }
}
