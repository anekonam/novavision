import type { TherapyCanvas } from './TherapyCanvas';
import type { StimulusShape } from '../types/common';

export interface FixationConfig {
  shape: StimulusShape;
  color: string;
  altColor: string;        // Color during fixation change
  sizeDegrees: number;     // Size in visual degrees (typically small, ~0.3)
}

/**
 * Renders the central fixation point and handles fixation changes
 * for monitoring that the patient is maintaining fixation.
 */
export class FixationRenderer {
  private canvas: TherapyCanvas;
  private config: FixationConfig;
  private isChanged: boolean = false;

  constructor(canvas: TherapyCanvas, config: FixationConfig) {
    this.canvas = canvas;
    this.config = config;
  }

  /** Draw fixation point in normal state */
  renderNormal(): void {
    this.isChanged = false;
    this.draw(this.config.color, this.config.shape);
  }

  /** Draw fixation point in changed state (patient must respond) */
  renderChanged(): void {
    this.isChanged = true;
    // Change to alternate color and/or shape
    const altShape: StimulusShape = this.config.shape === 'circle' ? 'square' : 'circle';
    this.draw(this.config.altColor, altShape);
  }

  /** Erase fixation point area */
  erase(backgroundColor: string = '#000000'): void {
    const ctx = this.canvas.getContext();
    const centre = this.canvas.getCentre();
    const radiusPx = this.canvas.degreesToSize(this.config.sizeDegrees) / 2 + 2;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(
      centre.x - radiusPx,
      centre.y - radiusPx,
      radiusPx * 2,
      radiusPx * 2,
    );
  }

  isFixationChanged(): boolean {
    return this.isChanged;
  }

  private draw(color: string, shape: StimulusShape): void {
    const ctx = this.canvas.getContext();
    const centre = this.canvas.getCentre();
    const radiusPx = this.canvas.degreesToSize(this.config.sizeDegrees) / 2;

    // Clear fixation area first
    this.erase();

    ctx.fillStyle = color;

    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(centre.x, centre.y, radiusPx, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'square':
        ctx.fillRect(
          centre.x - radiusPx,
          centre.y - radiusPx,
          radiusPx * 2,
          radiusPx * 2,
        );
        break;

      case 'diamond':
        ctx.save();
        ctx.translate(centre.x, centre.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-radiusPx, -radiusPx, radiusPx * 2, radiusPx * 2);
        ctx.restore();
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(centre.x, centre.y - radiusPx);
        ctx.lineTo(centre.x + radiusPx, centre.y + radiusPx);
        ctx.lineTo(centre.x - radiusPx, centre.y + radiusPx);
        ctx.closePath();
        ctx.fill();
        break;
    }
  }
}
