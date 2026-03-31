import type { CalibrationData, Point } from '../types/common';

/**
 * TherapyCanvas manages the HTML5 Canvas element for therapy rendering.
 * Handles DPI scaling, coordinate system (visual degrees), and lifecycle.
 */
export class TherapyCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private calibration: CalibrationData;
  private cssWidth: number;
  private cssHeight: number;

  constructor(container: HTMLElement, calibration: CalibrationData) {
    this.calibration = calibration;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.cursor = 'none';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d', { alpha: false })!;

    // Size to container
    this.cssWidth = container.clientWidth;
    this.cssHeight = container.clientHeight;
    this.resize();

    // Listen for resize
    const observer = new ResizeObserver(() => {
      this.cssWidth = container.clientWidth;
      this.cssHeight = container.clientHeight;
      this.resize();
    });
    observer.observe(container);
  }

  private resize() {
    const dpr = this.calibration.devicePixelRatio;
    this.canvas.width = this.cssWidth * dpr;
    this.canvas.height = this.cssHeight * dpr;
    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;
    this.ctx.scale(dpr, dpr);
  }

  /** Convert visual degrees from fixation to CSS pixel position on canvas */
  degreesToPixels(degX: number, degY: number): Point {
    const centreX = this.cssWidth / 2;
    const centreY = this.cssHeight / 2;
    const px = this.calibration.degreePixels;
    return {
      x: centreX + degX * px,
      y: centreY - degY * px, // Y inverted: positive degrees = up = lower pixel Y
    };
  }

  /** Convert CSS pixel position to visual degrees from fixation */
  pixelsToDegrees(pixelX: number, pixelY: number): Point {
    const centreX = this.cssWidth / 2;
    const centreY = this.cssHeight / 2;
    const px = this.calibration.degreePixels;
    return {
      x: (pixelX - centreX) / px,
      y: (centreY - pixelY) / px,
    };
  }

  /** Convert size in visual degrees to CSS pixels */
  degreesToSize(degrees: number): number {
    return degrees * this.calibration.degreePixels;
  }

  /** Clear entire canvas */
  clear(color: string = '#000000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getCalibration(): CalibrationData {
    return this.calibration;
  }

  getCentre(): Point {
    return { x: this.cssWidth / 2, y: this.cssHeight / 2 };
  }

  getCssSize(): { width: number; height: number } {
    return { width: this.cssWidth, height: this.cssHeight };
  }

  /** Enter browser fullscreen */
  async enterFullscreen(): Promise<void> {
    await this.canvas.parentElement?.requestFullscreen();
  }

  /** Exit browser fullscreen */
  async exitFullscreen(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }

  destroy() {
    this.canvas.remove();
  }
}
