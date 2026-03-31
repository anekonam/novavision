import type { TherapyCanvas } from '../core/TherapyCanvas';
import type { StimulusShape, Point } from '../types/common';

/**
 * NEC Stage definitions from original CancellationSessionTrialViewModel:
 * Stage 0/1: Target=Diamond, Distractors=Circle+Cross
 * Stage 2: Target=Star, Distractors=Diamond+Cross
 * Stage 3: Target=Circle, Distractors=Diamond+Cross
 */

export interface NecStageConfig {
  stage: number;
  targetShape: StimulusShape;
  distractorShapes: StimulusShape[];
  targetCount: number;
  distractorCount: number;
}

export const NEC_STAGES: NecStageConfig[] = [
  { stage: 0, targetShape: 'diamond', distractorShapes: ['circle', 'triangle'], targetCount: 12, distractorCount: 8 },
  { stage: 1, targetShape: 'diamond', distractorShapes: ['circle', 'triangle'], targetCount: 14, distractorCount: 12 },
  { stage: 2, targetShape: 'square', distractorShapes: ['diamond', 'triangle'], targetCount: 16, distractorCount: 16 },
  { stage: 3, targetShape: 'circle', distractorShapes: ['diamond', 'triangle'], targetCount: 18, distractorCount: 20 },
];

export interface MatrixItem {
  id: number;
  shape: StimulusShape;
  isTarget: boolean;
  x: number; // CSS pixels
  y: number;
  size: number; // CSS pixels
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
 * NeuroEyeCoach Session Engine.
 * Cancellation task: patient clicks all target shapes in a matrix.
 * Session ends when all targets are found.
 */
export class NecSessionEngine {
  private canvas: TherapyCanvas;
  private state: NecSessionState | null = null;
  private onClick: ((item: MatrixItem) => void) | null = null;
  private boundClickHandler: ((e: MouseEvent) => void) | null = null;

  constructor(canvas: TherapyCanvas) {
    this.canvas = canvas;
  }

  /** Start a new NEC session */
  start(level: number, stageIndex: number): NecSessionState {
    const stage = NEC_STAGES[stageIndex % NEC_STAGES.length];

    // Scale difficulty by level (1-12)
    const scaledTargets = stage.targetCount + Math.floor(level * 0.5);
    const scaledDistractors = stage.distractorCount + level * 2;

    const items = this.generateMatrix(stage, scaledTargets, scaledDistractors);

    this.state = {
      stage,
      level,
      items,
      correctClicks: 0,
      incorrectClicks: 0,
      totalTargets: scaledTargets,
      startTime: performance.now(),
      isComplete: false,
    };

    return this.state;
  }

  /** Render the current matrix on the canvas */
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

  /** Start listening for clicks on shapes */
  startInput(onItemClick: (item: MatrixItem, result: 'correct' | 'incorrect') => void): void {
    this.boundClickHandler = (e: MouseEvent) => {
      if (!this.state || this.state.isComplete) return;

      const rect = this.canvas.getCanvas().getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Find clicked item (nearest within hit radius)
      const hitRadius = 30; // Generous hit area for accessibility
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

      if (closest.isTarget) {
        this.state.correctClicks++;
        onItemClick(closest, 'correct');

        // Check completion
        if (this.state.correctClicks >= this.state.totalTargets) {
          this.state.isComplete = true;
        }
      } else {
        this.state.incorrectClicks++;
        onItemClick(closest, 'incorrect');
      }

      this.render(); // Redraw
    };

    this.canvas.getCanvas().addEventListener('click', this.boundClickHandler);
    this.canvas.getCanvas().style.cursor = 'crosshair';
  }

  stopInput(): void {
    if (this.boundClickHandler) {
      this.canvas.getCanvas().removeEventListener('click', this.boundClickHandler);
      this.boundClickHandler = null;
    }
    this.canvas.getCanvas().style.cursor = 'none';
  }

  getState(): NecSessionState | null {
    return this.state;
  }

  getElapsedSeconds(): number {
    if (!this.state) return 0;
    return (performance.now() - this.state.startTime) / 1000;
  }

  getResults(): {
    correctClicks: number;
    incorrectClicks: number;
    missedTargets: number;
    totalTargets: number;
    elapsedSeconds: number;
    accuracy: number;
  } | null {
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

  /** Generate a random matrix of targets and distractors */
  private generateMatrix(
    stage: NecStageConfig,
    targetCount: number,
    distractorCount: number,
  ): MatrixItem[] {
    const { width, height } = this.canvas.getCssSize();
    const margin = 60;
    const itemSize = 28;
    const items: MatrixItem[] = [];
    let id = 0;

    const positions = this.generateRandomPositions(
      targetCount + distractorCount,
      margin, margin,
      width - margin, height - margin,
      itemSize * 1.5,
    );

    // Place targets
    for (let i = 0; i < targetCount && i < positions.length; i++) {
      items.push({
        id: id++,
        shape: stage.targetShape,
        isTarget: true,
        x: positions[i].x,
        y: positions[i].y,
        size: itemSize,
        clicked: false,
        color: '#ffffff',
      });
    }

    // Place distractors
    for (let i = targetCount; i < targetCount + distractorCount && i < positions.length; i++) {
      const distShape = stage.distractorShapes[
        Math.floor(Math.random() * stage.distractorShapes.length)
      ];
      items.push({
        id: id++,
        shape: distShape,
        isTarget: false,
        x: positions[i].x,
        y: positions[i].y,
        size: itemSize,
        clicked: false,
        color: '#94a3b8',
      });
    }

    return items;
  }

  /** Generate non-overlapping random positions */
  private generateRandomPositions(
    count: number,
    minX: number, minY: number,
    maxX: number, maxY: number,
    minDistance: number,
  ): Point[] {
    const positions: Point[] = [];
    let attempts = 0;
    const maxAttempts = count * 100;

    while (positions.length < count && attempts < maxAttempts) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);

      const tooClose = positions.some((p) => {
        const dx = p.x - x;
        const dy = p.y - y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });

      if (!tooClose) {
        positions.push({ x, y });
      }
      attempts++;
    }

    return positions;
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: StimulusShape,
    x: number, y: number, radius: number,
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
    }
  }
}
