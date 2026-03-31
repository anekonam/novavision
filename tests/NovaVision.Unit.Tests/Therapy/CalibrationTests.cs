using FluentAssertions;

namespace NovaVision.Unit.Tests.Therapy;

public class CalibrationTests
{
    [Theory]
    [InlineData(30.0, 37.8, 19.8)]   // 96 DPI, 30cm
    [InlineData(30.0, 56.7, 29.7)]   // 144 DPI, 30cm
    [InlineData(30.0, 75.6, 39.5)]   // 192 DPI (4K 27"), 30cm
    [InlineData(40.0, 37.8, 26.4)]   // 96 DPI, 40cm
    public void DegreePixels_ShouldCalculateCorrectly(double distanceCm, double pixelsPerCm, double expected)
    {
        var degreePixels = CalculateDegreePixels(distanceCm, pixelsPerCm);

        degreePixels.Should().BeApproximately(expected, 0.5,
            $"at {distanceCm}cm with {pixelsPerCm} px/cm");
    }

    [Theory]
    [InlineData(85.6, 300, 3.505)]  // Credit card width mm, rectangle px, expected px/mm
    [InlineData(85.6, 324, 3.785)]  // Higher res display
    public void PixelsPerCm_FromCreditCard_ShouldCalculateCorrectly(
        double cardWidthMm, int rectangleWidthPx, double expectedPxPerMm)
    {
        var pxPerMm = rectangleWidthPx / cardWidthMm;

        pxPerMm.Should().BeApproximately(expectedPxPerMm, 0.01);

        var pxPerCm = pxPerMm * 10;
        pxPerCm.Should().BeGreaterThan(20, "any reasonable display has > 20 px/cm");
        pxPerCm.Should().BeLessThan(200, "even 8K displays have < 200 px/cm at normal sizes");
    }

    [Fact]
    public void DisplayFingerprint_ShouldDetectChange()
    {
        var original = new DisplayFingerprint(1920, 1080, 1.0);
        var same = new DisplayFingerprint(1920, 1080, 1.0);
        var different = new DisplayFingerprint(2560, 1440, 1.5);

        original.Matches(same).Should().BeTrue();
        original.Matches(different).Should().BeFalse();
    }

    [Fact]
    public void DisplayFingerprint_DifferentDpr_ShouldNotMatch()
    {
        var standard = new DisplayFingerprint(1920, 1080, 1.0);
        var retina = new DisplayFingerprint(1920, 1080, 2.0);

        standard.Matches(retina).Should().BeFalse();
    }

    private static double CalculateDegreePixels(double distanceCm, double pixelsPerCm)
    {
        return distanceCm * Math.Tan(Math.PI / 180.0) * pixelsPerCm;
    }

    private record DisplayFingerprint(int Width, int Height, double DevicePixelRatio)
    {
        public bool Matches(DisplayFingerprint other) =>
            Width == other.Width && Height == other.Height &&
            Math.Abs(DevicePixelRatio - other.DevicePixelRatio) < 0.01;
    }
}
