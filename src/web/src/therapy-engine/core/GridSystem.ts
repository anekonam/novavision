import type { GridConfig, Point, Quadrant } from '../types/common';

export const DEFAULT_GRID: GridConfig = {
  sizeX: 19,
  sizeY: 15,
  gridAngle: 43,
  verticalExtent: 32,
};

/**
 * Maps the 19x15 visual field grid to visual degree coordinates.
 * Each grid cell corresponds to a position in the patient's visual field.
 */
export class GridSystem {
  private config: GridConfig;
  private degreesPerCellX: number;
  private degreesPerCellY: number;
  private centreX: number;
  private centreY: number;

  constructor(config: GridConfig = DEFAULT_GRID) {
    this.config = config;
    this.centreX = config.sizeX / 2;
    this.centreY = config.sizeY / 2;
    this.degreesPerCellX = config.gridAngle / (config.sizeX - 1);
    this.degreesPerCellY = config.verticalExtent / (config.sizeY - 1);
  }

  /** Convert grid cell to visual degree coordinates */
  cellToDegrees(cellX: number, cellY: number): Point {
    return {
      x: (cellX - this.centreX) * this.degreesPerCellX,
      y: (this.centreY - cellY) * this.degreesPerCellY, // Y inverted
    };
  }

  /** Convert visual degrees to nearest grid cell */
  degreesToCell(degX: number, degY: number): { x: number; y: number } {
    return {
      x: Math.round(degX / this.degreesPerCellX + this.centreX),
      y: Math.round(this.centreY - degY / this.degreesPerCellY),
    };
  }

  /** Get quadrant for a grid cell */
  getQuadrant(cellX: number, cellY: number): Quadrant {
    const isLeft = cellX <= Math.floor(this.centreX);
    const isTop = cellY <= Math.floor(this.centreY);
    if (isLeft && isTop) return 'TL';
    if (!isLeft && isTop) return 'TR';
    if (isLeft) return 'BL';
    return 'BR';
  }

  /** Parse therapy area from comma-separated "X-Y" format */
  parseTherapyArea(area: string): { x: number; y: number }[] {
    if (!area.trim()) return [];
    return area.split(',').map((pair) => {
      const [x, y] = pair.trim().split('-').map(Number);
      return { x, y };
    });
  }

  /** Get all cells in the grid */
  getAllCells(): { x: number; y: number }[] {
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < this.config.sizeY; y++) {
      for (let x = 0; x < this.config.sizeX; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  }

  /** Identify transition zone cells (30-70% detection rate) */
  getTransitionZone(hitRates: Map<string, number>): { x: number; y: number }[] {
    const zone: { x: number; y: number }[] = [];
    for (const [key, rate] of hitRates) {
      if (rate >= 0.3 && rate <= 0.7) {
        const [x, y] = key.split('-').map(Number);
        zone.push({ x, y });
      }
    }
    return zone;
  }

  getConfig(): GridConfig {
    return this.config;
  }

  getTotalCells(): number {
    return this.config.sizeX * this.config.sizeY;
  }
}
