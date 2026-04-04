import type { TherapyCanvas } from './TherapyCanvas';
import type { StimulusShape } from '../types/common';

export interface StimulusConfig {
  degX: number;         // Position in visual degrees
  degY: number;
  diameter: number;     // Size in visual degrees
  shape: StimulusShape;
  color: string;
}

/**
 * Renders therapy stimuli (shapes) on the canvas at precise sizes
 * specified in visual degrees, converted to pixels via calibration.
 */
export class StimulusRenderer {
  private canvas: TherapyCanvas;

  constructor(canvas: TherapyCanvas) {
    this.canvas = canvas;
  }

  /** Draw a single stimulus */
  render(config: StimulusConfig): void {
    const ctx = this.canvas.getContext();
    const pos = this.canvas.degreesToPixels(config.degX, config.degY);
    const radiusPx = this.canvas.degreesToSize(config.diameter) / 2;

    ctx.fillStyle = config.color;

    switch (config.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radiusPx, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'square':
        ctx.fillRect(
          pos.x - radiusPx,
          pos.y - radiusPx,
          radiusPx * 2,
          radiusPx * 2,
        );
        break;

      case 'diamond':
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-radiusPx, -radiusPx, radiusPx * 2, radiusPx * 2);
        ctx.restore();
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - radiusPx);
        ctx.lineTo(pos.x + radiusPx, pos.y + radiusPx);
        ctx.lineTo(pos.x - radiusPx, pos.y + radiusPx);
        ctx.closePath();
        ctx.fill();
        break;

      case 'cross': {
        const thickness = radiusPx * 0.35;
        ctx.fillRect(pos.x - radiusPx, pos.y - thickness, radiusPx * 2, thickness * 2);
        ctx.fillRect(pos.x - thickness, pos.y - radiusPx, thickness * 2, radiusPx * 2);
        break;
      }

      case 'star': {
        const spikes = 5;
        const outerR = radiusPx;
        const innerR = radiusPx * 0.4;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (Math.PI / 2) * -1 + (Math.PI / spikes) * i;
          const px = pos.x + Math.cos(angle) * r;
          const py = pos.y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
    }
  }

  /** Draw multiple stimuli (e.g., NEC visual search field) */
  renderField(configs: StimulusConfig[]): void {
    for (const config of configs) {
      this.render(config);
    }
  }

  /** Erase a stimulus area by redrawing background */
  erase(config: StimulusConfig, backgroundColor: string = '#000000'): void {
    const ctx = this.canvas.getContext();
    const pos = this.canvas.degreesToPixels(config.degX, config.degY);
    const radiusPx = this.canvas.degreesToSize(config.diameter) / 2;
    const margin = 2; // Extra pixels to ensure clean erase

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(
      pos.x - radiusPx - margin,
      pos.y - radiusPx - margin,
      (radiusPx + margin) * 2,
      (radiusPx + margin) * 2,
    );
  }
}
