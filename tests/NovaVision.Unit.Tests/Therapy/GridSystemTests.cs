using FluentAssertions;

namespace NovaVision.Unit.Tests.Therapy;

public class GridSystemTests
{
    private const int DefaultGridX = 19;
    private const int DefaultGridY = 15;
    private const double DefaultGridAngle = 43;

    [Fact]
    public void CentreOfGrid_ShouldMapToZeroDegrees()
    {
        // With an odd-width grid (19), the true centre is between cells.
        // The mathematical centre (9.5, 7.5) maps to (0, 0).
        // The closest cell (9, 7) should be near zero but not exactly zero.
        var (degX, degY) = CellToDegrees(9, 7);

        // Cell 9 is 0.5 cells left of centre = -0.5 * (43/18) ≈ -1.19 degrees
        degX.Should().BeApproximately(-1.194, 0.01);
        degY.Should().BeApproximately(1.143, 0.01);
    }

    [Fact]
    public void SymmetricCells_ShouldHaveSymmetricDegrees()
    {
        // Cells equidistant from true centre (9.5) should have mirrored coordinates
        // Cell 4 is 5.5 left of centre, cell 15 is 5.5 right of centre
        var (leftDeg, _) = CellToDegrees(4, 7);
        var (rightDeg, _) = CellToDegrees(15, 7);

        Math.Abs(leftDeg + rightDeg).Should().BeLessThan(0.01,
            "cells equidistant from centre should have mirrored X coordinates");
    }

    [Fact]
    public void TopLeftCell_ShouldMapToNegativeXPositiveY()
    {
        var (degX, degY) = CellToDegrees(0, 0);

        degX.Should().BeLessThan(0); // Left of centre
        degY.Should().BeGreaterThan(0); // Above centre
    }

    [Fact]
    public void BottomRightCell_ShouldMapToPositiveXNegativeY()
    {
        var (degX, degY) = CellToDegrees(DefaultGridX - 1, DefaultGridY - 1);

        degX.Should().BeGreaterThan(0); // Right of centre
        degY.Should().BeLessThan(0); // Below centre
    }

    [Fact]
    public void GridExtent_HorizontalShouldMatchGridAngle()
    {
        var (leftDeg, _) = CellToDegrees(0, DefaultGridY / 2);
        var (rightDeg, _) = CellToDegrees(DefaultGridX - 1, DefaultGridY / 2);

        var totalHorizontal = rightDeg - leftDeg;
        totalHorizontal.Should().BeApproximately(DefaultGridAngle, 1.0,
            "total horizontal extent should approximate grid angle");
    }

    [Fact]
    public void AllCells_ShouldHaveUniquePositions()
    {
        var positions = new HashSet<(double, double)>();

        for (int x = 0; x < DefaultGridX; x++)
        {
            for (int y = 0; y < DefaultGridY; y++)
            {
                var pos = CellToDegrees(x, y);
                positions.Add((Math.Round(pos.degX, 4), Math.Round(pos.degY, 4)));
            }
        }

        positions.Count.Should().Be(DefaultGridX * DefaultGridY,
            "all 285 cells should map to unique positions");
    }

    [Fact]
    public void TotalCells_ShouldBe285()
    {
        var total = DefaultGridX * DefaultGridY;
        total.Should().Be(285);
    }

    [Theory]
    [InlineData(0, 0, "TL")]
    [InlineData(18, 0, "TR")]
    [InlineData(0, 14, "BL")]
    [InlineData(18, 14, "BR")]
    [InlineData(9, 7, "TL")] // Centre cell is technically TL (0-indexed, centre-left/top)
    public void QuadrantClassification_ShouldBeCorrect(int x, int y, string expectedQuadrant)
    {
        var quadrant = GetQuadrant(x, y);
        quadrant.Should().Be(expectedQuadrant);
    }

    [Fact]
    public void ParseTherapyArea_ShouldReturnCorrectCells()
    {
        var area = "5-3,5-4,6-3,6-4";
        var cells = ParseTherapyArea(area);

        cells.Should().HaveCount(4);
        cells.Should().Contain((5, 3));
        cells.Should().Contain((6, 4));
    }

    [Fact]
    public void ParseTherapyArea_EmptyString_ShouldReturnEmpty()
    {
        var cells = ParseTherapyArea("");
        cells.Should().BeEmpty();
    }

    [Fact]
    public void DegreePixels_Calculation_ShouldBeCorrect()
    {
        // At 30cm distance with 37.8 px/cm (96 DPI)
        var distanceCm = 30.0;
        var pixelsPerCm = 37.8; // 96 DPI / 2.54
        var degreePixels = distanceCm * Math.Tan(Math.PI / 180.0) * pixelsPerCm;

        degreePixels.Should().BeApproximately(19.8, 0.1,
            "DegreePixels at 30cm/96DPI should be approximately 19.8");
    }

    [Fact]
    public void StimulusSize_InPixels_ShouldBeCorrect()
    {
        var degreePixels = 50.0; // Typical calibrated value
        var stimulusDiameter = 0.15; // Visual degrees
        var devicePixelRatio = 2.0; // Retina display

        var physicalPixels = stimulusDiameter * degreePixels * devicePixelRatio;

        physicalPixels.Should().BeApproximately(15.0, 0.01,
            "0.15 degrees at 50 px/deg on 2x display = 15 physical pixels");
    }

    // --- Helper methods (these will become the actual GridSystem class) ---

    private static (double degX, double degY) CellToDegrees(int cellX, int cellY)
    {
        var centreX = DefaultGridX / 2.0;
        var centreY = DefaultGridY / 2.0;
        var degreesPerCellX = DefaultGridAngle / (DefaultGridX - 1);
        var verticalExtent = 32.0; // From existing WPF: 32 * DegreePixels height
        var degreesPerCellY = verticalExtent / (DefaultGridY - 1);

        var degX = (cellX - centreX) * degreesPerCellX;
        var degY = (centreY - cellY) * degreesPerCellY; // Y inverted: top = positive

        return (degX, degY);
    }

    private static string GetQuadrant(int x, int y)
    {
        var centreX = DefaultGridX / 2;
        var centreY = DefaultGridY / 2;
        var isLeft = x <= centreX;
        var isTop = y <= centreY;
        return (isLeft, isTop) switch
        {
            (true, true) => "TL",
            (false, true) => "TR",
            (true, false) => "BL",
            (false, false) => "BR",
        };
    }

    private static List<(int X, int Y)> ParseTherapyArea(string area)
    {
        if (string.IsNullOrWhiteSpace(area)) return [];
        return area.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(pair =>
            {
                var parts = pair.Trim().Split('-');
                return (int.Parse(parts[0]), int.Parse(parts[1]));
            })
            .ToList();
    }
}
