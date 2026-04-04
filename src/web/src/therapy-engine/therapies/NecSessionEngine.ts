import type { TherapyCanvas } from '../core/TherapyCanvas';
import type { StimulusShape } from '../types/common';

/**
 * NEC Cancellation Task — faithful replication of CancellationMatrixHelper.cs
 *
 * Stages match original EXACTLY:
 *   Stage 0 (Practice): Target=Diamond(10), Distract=Circle(6)+Cross(5)
 *   Stage 1: Target=Diamond(20), Distract=Circle(12)+Cross(10)
 *   Stage 2: Target=Star(20), Distract=Diamond(11)+Cross(11)
 *   Stage 3: Target=Circle(20), Distract=Diamond(12)+Cross(10)
 *
 * Scoring from CancellationSessionTrialViewModel.cs:
 *   DiamondClick(): Stage 0 or 1 = correct; else incorrect
 *   StarClick(): Stage 2 = correct; else incorrect
 *   CircleClick(): Stage 3 = correct; else incorrect
 *   CrossClick(): ALWAYS incorrect
 *
 * Matrix: Grid-based (like original WPF Grid), centre 2x2 excluded.
 * Session ends when ALL targets clicked.
 */

export interface NecStageConfig {
  stage: number;
  targetShape: StimulusShape;
  distractors: { shape: StimulusShape; count: number }[];
  targetCount: number;
}

// Exact counts from CancellationMatrixHelper.cs
export const NEC_STAGES: NecStageConfig[] = [
  {
    stage: 0, targetShape: 'diamond', targetCount: 10,
    distractors: [{ shape: 'circle', count: 6 }, { shape: 'cross', count: 5 }],
  },
  {
    stage: 1, targetShape: 'diamond', targetCount: 20,
    distractors: [{ shape: 'circle', count: 12 }, { shape: 'cross', count: 10 }],
  },
  {
    stage: 2, targetShape: 'star', targetCount: 20,
    distractors: [{ shape: 'diamond', count: 11 }, { shape: 'cross', count: 11 }],
  },
  {
    stage: 3, targetShape: 'circle', targetCount: 20,
    distractors: [{ shape: 'diamond', count: 12 }, { shape: 'cross', count: 10 }],
  },
];

export interface MatrixItem {
  id: number;
  shape: StimulusShape;
  isTarget: boolean;
  row: number;
  col: number;
  x: number; // rendered CSS pixel position
  y: number;
  size: number;
  clicked: boolean;
  color: string;
}

export interface NecSessionState {
  stage: NecStageConfig;
  level: number;
  items: MatrixItem[];
  correctClicks: number;
  incorrectClicks: number;
  totalTargets: number;
  startTime: number;
  isComplete: boolean;
}

/**
 * NEC Session Engine — cancellation task.
 * Patient clicks target shapes in a matrix. Cross clicks are always wrong.
 */
export class NecSessionEngine {
  private canvas: TherapyCanvas;
  private state: NecSessionState | null = null;
  private boundClickHandler: ((e: MouseEvent) => void) | null = null;

  // Grid layout params
  private readonly gridRows = 8;
  private readonly gridCols = 10;
  // Centre 2x2 excluded (rows 3-4, cols 4-5 in 0-indexed)
  private readonly centreRows = [3, 4];
  private readonly centreCols = [4, 5];

  constructor(canvas: TherapyCanvas) {
    this.canvas = canvas;
  }

  start(level: number, stageIndex: number): NecSessionState {
    const stage = NEC_STAGES[stageIndex % NEC_STAGES.length];

    const items = this.generateGridMatrix(stage);

    this.state = {
      stage,
      level,
      items,
      correctClicks: 0,
      incorrectClicks: 0,
      totalTargets: stage.targetCount,
      startTime: performance.now(),
      isComplete: false,
    };

    return this.state;
  }

  render(backgroundColor: string = '#1e293b'): void {
    if (!this.state) return;

    this.canvas.clear(backgroundColor);
    const ctx = this.canvas.getContext();

    for (const item of this.state.items) {
      if (item.clicked && item.isTarget) continue; // Hide found targets

      ctx.fillStyle = item.clicked ? '#ef4444' : item.color;
      this.drawShape(ctx, item.shape, item.x, item.y, item.size / 2);
    }
  }

  startInput(onItemClick: (item: MatrixItem, result: 'correct' | 'incorrect') => void): void {
    this.boundClickHandler = (e: MouseEvent) => {
      if (!this.state || this.state.isComplete) return;

      const rect = this.canvas.getCanvas().getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Find clicked item (nearest within hit radius)
      const hitRadius = 30;
      let closest: MatrixItem | null = null;
      let closestDist = Infinity;

      for (const item of this.state.items) {
        if (item.clicked && item.isTarget) continue;
        const dx = clickX - item.x;
        const dy = clickY - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < hitRadius + item.size / 2 && dist < closestDist) {
          closest = item;
          closestDist = dist;
        }
      }

      if (!closest) return;
      closest.clicked = true;

      // Scoring matches original exactly
      const isCorrect = this.isCorrectClick(closest.shape, this.state.stage.stage);

      if (isCorrect) {
        this.state.correctClicks++;
        onItemClick(closest, 'correct');

        if (this.state.correctClicks >= this.state.totalTargets) {
          this.state.isComplete = true;
        }
      } else {
        this.state.incorrectClicks++;
        onItemClick(closest, 'incorrect');
      }

      this.render();
    };

    this.canvas.getCanvas().addEventListener('click', this.boundClickHandler);
    this.canvas.getCanvas().style.cursor = 'crosshair';
  }

  /** Scoring from CancellationSessionTrialViewModel.cs */
  private isCorrectClick(shape: StimulusShape, stage: number): boolean {
    switch (shape) {
      case 'diamond': return stage === 0 || stage === 1;
      case 'star': return stage === 2;
      case 'circle': return stage === 3;
      case 'cross': return false; // ALWAYS incorrect
      default: return false;
    }
  }

  stopInput(): void {
    if (this.boundClickHandler) {
      this.canvas.getCanvas().removeEventListener('click', this.boundClickHandler);
      this.boundClickHandler = null;
    }
    this.canvas.getCanvas().style.cursor = 'none';
  }

  getState(): NecSessionState | null { return this.state; }

  getElapsedSeconds(): number {
    if (!this.state) return 0;
    return (performance.now() - this.state.startTime) / 1000;
  }

  getResults() {
    if (!this.state) return null;
    return {
      correctClicks: this.state.correctClicks,
      incorrectClicks: this.state.incorrectClicks,
      missedTargets: this.state.totalTargets - this.state.correctClicks,
      totalTargets: this.state.totalTargets,
      elapsedSeconds: this.getElapsedSeconds(),
      accuracy: this.state.totalTargets > 0
        ? this.state.correctClicks / this.state.totalTargets
        : 0,
    };
  }

  /**
   * Generate grid-based matrix matching original MatrixHelper.GenerateMatrixValues.
   * Grid of rows × cols, centre 2x2 excluded, shapes placed randomly.
   */
  private generateGridMatrix(stage: NecStageConfig): MatrixItem[] {
    const { width, height } = this.canvas.getCssSize();
    const cellWidth = (width - 80) / this.gridCols;
    const cellHeight = (height - 80) / this.gridRows;
    const itemSize = Math.min(cellWidth, cellHeight) * 0.6;

    // Build available positions (exclude centre 2x2)
    const positions: { row: number; col: number }[] = [];
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (this.centreRows.includes(r) && this.centreCols.includes(c)) continue;
        positions.push({ row: r, col: c });
      }
    }

    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Build shape list: targets first, then each distractor type
    const shapes: { shape: StimulusShape; isTarget: boolean }[] = [];
    for (let i = 0; i < stage.targetCount; i++) {
      shapes.push({ shape: stage.targetShape, isTarget: true });
    }
    for (const d of stage.distractors) {
      for (let i = 0; i < d.count; i++) {
        shapes.push({ shape: d.shape, isTarget: false });
      }
    }

    // Shuffle shapes
    for (let i = shapes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
    }

    // Place shapes into grid positions
    const items: MatrixItem[] = [];
    const count = Math.min(shapes.length, positions.length);
    for (let i = 0; i < count; i++) {
      const pos = positions[i];
      items.push({
        id: i,
        shape: shapes[i].shape,
        isTarget: shapes[i].isTarget,
        row: pos.row,
        col: pos.col,
        x: 40 + pos.col * cellWidth + cellWidth / 2,
        y: 40 + pos.row * cellHeight + cellHeight / 2,
        size: itemSize,
        clicked: false,
        color: shapes[i].isTarget ? '#ffffff' : '#94a3b8',
      });
    }

    return items;
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: StimulusShape, x: number, y: number, radius: number,
  ): void {
    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        break;
      case 'diamond':
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-radius * 0.7, -radius * 0.7, radius * 1.4, radius * 1.4);
        ctx.restore();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x + radius, y + radius);
        ctx.lineTo(x - radius, y + radius);
        ctx.closePath();
        ctx.fill();
        break;
      case 'cross': {
        const t = radius * 0.3;
        ctx.fillRect(x - radius, y - t, radius * 2, t * 2);
        ctx.fillRect(x - t, y - radius, t * 2, radius * 2);
        break;
      }
      case 'star': {
        const spikes = 5;
        const inner = radius * 0.4;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? radius : inner;
          const angle = -Math.PI / 2 + (Math.PI / spikes) * i;
          const px = x + Math.cos(angle) * r;
          const py = y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
    }
  }
}
