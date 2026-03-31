export type TimingCallback = (timestamp: number, deltaMs: number) => void;

export interface TimingConfig {
  stimulusDisplayTimeMs: number;
  stimulusMinResponseTimeMs: number;
  stimulusMaxDelayTimeMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
}

export const DEFAULT_TIMING: TimingConfig = {
  stimulusDisplayTimeMs: 200,
  stimulusMinResponseTimeMs: 150,
  stimulusMaxDelayTimeMs: 1500,
  minIntervalMs: 1000,
  maxIntervalMs: 2000,
};

/**
 * Drives the therapy rendering loop with sub-millisecond precision.
 * Uses requestAnimationFrame for vsync-aligned rendering and
 * performance.now() for all timing measurements.
 */
export class TimingEngine {
  private config: TimingConfig;
  private running: boolean = false;
  private paused: boolean = false;
  private rafId: number = 0;
  private lastTimestamp: number = 0;
  private onTick: TimingCallback | null = null;
  private frameCount: number = 0;
  private droppedFrames: number = 0;

  constructor(config: TimingConfig = DEFAULT_TIMING) {
    this.config = config;
  }

  /** Start the render loop */
  start(onTick: TimingCallback): void {
    this.running = true;
    this.paused = false;
    this.onTick = onTick;
    this.lastTimestamp = performance.now();
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.loop(this.lastTimestamp);
  }

  /** Stop the render loop */
  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  /** Pause (loop keeps running but callback reports paused state) */
  pause(): void {
    this.paused = true;
  }

  /** Resume from pause */
  resume(): void {
    this.paused = false;
    this.lastTimestamp = performance.now();
  }

  isPaused(): boolean {
    return this.paused;
  }

  isRunning(): boolean {
    return this.running;
  }

  /** Generate a random interval within configured range */
  randomInterval(): number {
    const { minIntervalMs, maxIntervalMs } = this.config;
    return minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs);
  }

  /** Check if a stimulus has been displayed long enough (frame-counted) */
  isStimulusExpired(presentedAt: number, now: number): boolean {
    return (now - presentedAt) >= this.config.stimulusDisplayTimeMs;
  }

  /** Check if response is within valid window */
  isValidResponseTime(responseTimeMs: number): boolean {
    return responseTimeMs >= this.config.stimulusMinResponseTimeMs &&
           responseTimeMs <= this.config.stimulusMaxDelayTimeMs;
  }

  /** Check if response is too early */
  isTooEarly(responseTimeMs: number): boolean {
    return responseTimeMs < this.config.stimulusMinResponseTimeMs;
  }

  /** Check if stimulus has timed out (no response) */
  isTimedOut(presentedAt: number, now: number): boolean {
    return (now - presentedAt) > this.config.stimulusMaxDelayTimeMs;
  }

  getConfig(): TimingConfig {
    return this.config;
  }

  getStats(): { frameCount: number; droppedFrames: number } {
    return { frameCount: this.frameCount, droppedFrames: this.droppedFrames };
  }

  /** Get current high-resolution timestamp */
  now(): number {
    return performance.now();
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return;

    const deltaMs = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.frameCount++;

    // Detect frame drops (>20ms at 60Hz)
    if (deltaMs > 20 && this.frameCount > 1) {
      this.droppedFrames++;
    }

    if (!this.paused && this.onTick) {
      this.onTick(timestamp, deltaMs);
    }

    this.rafId = requestAnimationFrame(this.loop);
  };
}
