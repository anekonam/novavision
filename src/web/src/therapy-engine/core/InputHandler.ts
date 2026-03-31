import type { ResponseClassification } from '../types/common';

export type InputCallback = (timestamp: number, classification: ResponseClassification) => void;

export interface InputState {
  stimulusActive: boolean;
  stimulusPresentedAt: number;
  fixationChangeActive: boolean;
  minResponseTimeMs: number;
  maxDelayTimeMs: number;
}

/**
 * Captures patient responses (key press, mouse click) with high-resolution
 * timestamps for reaction time measurement.
 */
export class InputHandler {
  private onResponse: InputCallback | null = null;
  private state: InputState;
  private enabled: boolean = false;
  private lastResponseTime: number = 0;
  private debounceMs: number = 100;
  private boundKeyHandler: (e: KeyboardEvent) => void;
  private boundClickHandler: (e: MouseEvent) => void;
  private boundVisibilityHandler: () => void;
  private boundBlurHandler: () => void;
  private onPause: (() => void) | null = null;

  constructor() {
    this.state = {
      stimulusActive: false,
      stimulusPresentedAt: 0,
      fixationChangeActive: false,
      minResponseTimeMs: 150,
      maxDelayTimeMs: 1500,
    };

    this.boundKeyHandler = this.handleKeyDown.bind(this);
    this.boundClickHandler = this.handleClick.bind(this);
    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    this.boundBlurHandler = this.handleBlur.bind(this);
  }

  /** Start listening for input */
  start(onResponse: InputCallback, onPause?: () => void): void {
    this.onResponse = onResponse;
    this.onPause = onPause ?? null;
    this.enabled = true;

    document.addEventListener('keydown', this.boundKeyHandler);
    document.addEventListener('click', this.boundClickHandler);
    document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    window.addEventListener('blur', this.boundBlurHandler);

    // Prevent accidental navigation
    window.onbeforeunload = () => 'Therapy session in progress. Are you sure you want to leave?';
  }

  /** Stop listening for input */
  stop(): void {
    this.enabled = false;
    this.onResponse = null;
    this.onPause = null;

    document.removeEventListener('keydown', this.boundKeyHandler);
    document.removeEventListener('click', this.boundClickHandler);
    document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    window.removeEventListener('blur', this.boundBlurHandler);
    window.onbeforeunload = null;
  }

  /** Update stimulus state (called by therapy engine) */
  setStimulusActive(active: boolean, presentedAt: number = 0): void {
    this.state.stimulusActive = active;
    this.state.stimulusPresentedAt = presentedAt;
  }

  setFixationChangeActive(active: boolean): void {
    this.state.fixationChangeActive = active;
  }

  updateTimingConfig(minMs: number, maxMs: number): void {
    this.state.minResponseTimeMs = minMs;
    this.state.maxDelayTimeMs = maxMs;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // Escape = pause
    if (e.code === 'Escape') {
      this.onPause?.();
      return;
    }

    // Space = response
    if (e.code === 'Space') {
      e.preventDefault();
      this.processResponse(e.timeStamp);
    }
  }

  private handleClick(_e: MouseEvent): void {
    if (!this.enabled) return;
    this.processResponse(performance.now());
  }

  private processResponse(timestamp: number): void {
    // Debounce rapid inputs
    if (timestamp - this.lastResponseTime < this.debounceMs) return;
    this.lastResponseTime = timestamp;

    const classification = this.classify(timestamp);
    this.onResponse?.(timestamp, classification);
  }

  private classify(timestamp: number): ResponseClassification {
    if (this.state.fixationChangeActive) return 'fixationResponse';
    if (!this.state.stimulusActive) return 'falsePositive';

    const reactionTime = timestamp - this.state.stimulusPresentedAt;
    if (reactionTime < this.state.minResponseTimeMs) return 'tooEarly';

    return 'hit';
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.onPause?.();
    }
  }

  private handleBlur(): void {
    this.onPause?.();
  }
}
