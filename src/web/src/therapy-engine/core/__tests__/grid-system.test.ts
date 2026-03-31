import { describe, it, expect } from 'vitest';

const DEFAULT_GRID_X = 19;
const DEFAULT_GRID_Y = 15;
const DEFAULT_GRID_ANGLE = 43;
const VERTICAL_EXTENT = 32;

function cellToDegrees(cellX: number, cellY: number) {
  const centreX = DEFAULT_GRID_X / 2;
  const centreY = DEFAULT_GRID_Y / 2;
  const degreesPerCellX = DEFAULT_GRID_ANGLE / (DEFAULT_GRID_X - 1);
  const degreesPerCellY = VERTICAL_EXTENT / (DEFAULT_GRID_Y - 1);
  return {
    degX: (cellX - centreX) * degreesPerCellX,
    degY: (centreY - cellY) * degreesPerCellY,
  };
}

function getQuadrant(x: number, y: number): string {
  const centreX = DEFAULT_GRID_X / 2;
  const centreY = DEFAULT_GRID_Y / 2;
  const isLeft = x <= centreX;
  const isTop = y <= centreY;
  if (isLeft && isTop) return 'TL';
  if (!isLeft && isTop) return 'TR';
  if (isLeft && !isTop) return 'BL';
  return 'BR';
}

function parseTherapyArea(area: string): [number, number][] {
  if (!area.trim()) return [];
  return area.split(',').map((pair) => {
    const [x, y] = pair.trim().split('-').map(Number);
    return [x, y];
  });
}

describe('Grid System', () => {
  it('should have 285 total cells', () => {
    expect(DEFAULT_GRID_X * DEFAULT_GRID_Y).toBe(285);
  });

  it('should map all cells to unique positions', () => {
    const positions = new Set<string>();
    for (let x = 0; x < DEFAULT_GRID_X; x++) {
      for (let y = 0; y < DEFAULT_GRID_Y; y++) {
        const { degX, degY } = cellToDegrees(x, y);
        positions.add(`${degX.toFixed(4)},${degY.toFixed(4)}`);
      }
    }
    expect(positions.size).toBe(285);
  });

  it('should map top-left cell to negative X, positive Y', () => {
    const { degX, degY } = cellToDegrees(0, 0);
    expect(degX).toBeLessThan(0);
    expect(degY).toBeGreaterThan(0);
  });

  it('should map bottom-right cell to positive X, negative Y', () => {
    const { degX, degY } = cellToDegrees(18, 14);
    expect(degX).toBeGreaterThan(0);
    expect(degY).toBeLessThan(0);
  });

  it('horizontal extent should approximate grid angle', () => {
    const left = cellToDegrees(0, 7);
    const right = cellToDegrees(18, 7);
    const extent = right.degX - left.degX;
    expect(extent).toBeCloseTo(DEFAULT_GRID_ANGLE, 0);
  });
});

describe('Quadrant Classification', () => {
  it.each([
    [0, 0, 'TL'],
    [18, 0, 'TR'],
    [0, 14, 'BL'],
    [18, 14, 'BR'],
  ])('cell (%i, %i) should be quadrant %s', (x, y, expected) => {
    expect(getQuadrant(x, y)).toBe(expected);
  });
});

describe('Therapy Area Parsing', () => {
  it('should parse comma-separated X-Y pairs', () => {
    const cells = parseTherapyArea('5-3,5-4,6-3');
    expect(cells).toEqual([[5, 3], [5, 4], [6, 3]]);
  });

  it('should return empty for empty string', () => {
    expect(parseTherapyArea('')).toEqual([]);
  });
});
