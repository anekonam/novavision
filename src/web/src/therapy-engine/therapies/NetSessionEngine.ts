import type { TherapyCanvas } from '../core/TherapyCanvas';
import { StimulusRenderer } from '../core/StimulusRenderer';
import { FixationRenderer } from '../core/FixationRenderer';
import { TimingEngine } from '../core/TimingEngine';
import { InputHandler } from '../core/InputHandler';
import { SessionRecorder } from '../session/SessionRecorder';
import type { ResponseClassification } from '../types/common';

/**
 * NET contrast staircase constants from original NovaVisionApp.
 * UserNetTherapyResultData.cs:
 *   if correct >= UpperLimit AND contrast >= 0.15 → contrast -= 0.1
 *   if correct <= LowerLimit AND contrast <= 0.9  → contrast += 0.05
 */
const CONTRAST_MIN = 0.15;
const CONTRAST_MAX = 0.9;
const STEP_DOWN = 0.1;  // Asymmetric: bigger step down (harder)
const STEP_UP = 0.05;   // Asymmetric: smaller step up (easier)

export interface NetTargetConfig {
  targetNumber: number;
  x: number;  // visual degrees
  y: number;
  diameter: number;  // visual degrees
  contrast: number;  // 0.0-1.0
}

export interface NetSessionConfig {
  targets: NetTargetConfig[];
  upperLimit: number;  // Correct count threshold for contrast decrease
  lowerLimit: number;  // Correct count threshold for contrast increase
  presentations: number;
  practicePresentations: number;
  practiceContrast: number;
  practiceX: number;
  practiceY: number;
  practiceDiameter: number;
}

interface TargetState {
  config: NetTargetConfig;
  presented: number;
  correct: number;
  currentContrast: number;
}

type NetPhase = 'idle' | 'practice' | 'main' | 'presenting' | 'waiting' | 'interval' | 'complete' | 'paused';

/**
 * NeuroEyeTherapy Session Engine.
 * Presents contrast targets at fixed positions, adjusting contrast
 * per-target using an asymmetric staircase algorithm.
 */
export class NetSessionEngine {
  private canvas: TherapyCanvas;
  private stimulusRenderer: StimulusRenderer;
  private fixationRenderer: FixationRenderer;
  private timing: TimingEngine;
  private input: InputHandler;
  private recorder: SessionRecorder;

  private config: NetSessionConfig;
  private targetStates: TargetState[] = [];
  private phase: NetPhase = 'idle';
  private currentTargetIndex: number = 0;
  private presentationCount: number = 0;
  private stimulusPresentedAt: number = 0;
  private nextPresentAt: number = 0;
  private isPractice: boolean = false;
  private practiceCount: number = 0;

  private onPhaseChange: ((phase: NetPhase) => void) | null = null;
  private onProgress: ((presented: number, total: number) => void) | null = null;

  constructor(canvas: TherapyCanvas, config: NetSessionConfig) {
    this.canvas = canvas;
    this.config = config;

    this.stimulusRenderer = new StimulusRenderer(canvas);
    this.fixationRenderer = new FixationRenderer(canvas, {
      shape: 'circle', color: '#ff0000', altColor: '#00ff00', sizeDegrees: 0.3,
    });
    this.timing = new TimingEngine();
    this.input = new InputHandler();
    this.recorder = new SessionRecorder();

    this.targetStates = config.targets.map(t => ({
      config: t,
      presented: 0,
      correct: 0,
      currentContrast: t.contrast,
    }));
  }

  /** Start with practice phase */
  start(
    onPhaseChange?: (phase: NetPhase) => void,
    onProgress?: (presented: number, total: number) => void,
  ): void {
    this.onPhaseChange = onPhaseChange ?? null;
    this.onProgress = onProgress ?? null;
    this.isPractice = true;
    this.practiceCount = 0;
    this.presentationCount = 0;
    this.currentTargetIndex = 0;

    this.recorder.start();
    this.canvas.clear('#000000');
    this.fixationRenderer.renderNormal();

    this.input.start(
      (timestamp, classification) => this.handleResponse(timestamp, classification),
      () => this.pause(),
    );

    this.nextPresentAt = this.timing.now() + this.timing.randomInterval();
    this.timing.start((timestamp) => this.tick(timestamp));
    this.setPhase('practice');
  }

  /** Skip to main phase (after practice or when resuming) */
  startMain(): void {
    this.isPractice = false;
    this.presentationCount = 0;
    this.currentTargetIndex = 0;
    this.nextPresentAt = this.timing.now() + this.timing.randomInterval();
    this.setPhase('main');
  }

  pause(): void {
    this.timing.pause();
    this.setPhase('paused');
  }

  resume(): void {
    this.timing.resume();
    this.nextPresentAt = this.timing.now() + this.timing.randomInterval();
    this.setPhase(this.isPractice ? 'practice' : 'main');
    this.canvas.clear('#000000');
    this.fixationRenderer.renderNormal();
  }

  stop(): void {
    this.timing.stop();
    this.input.stop();
    this.setPhase('complete');
  }

  getRecorder(): SessionRecorder {
    return this.recorder;
  }

  getTargetStates(): TargetState[] {
    return [...this.targetStates];
  }

  private tick(timestamp: number): void {
    if (this.phase === 'practice' || this.phase === 'main') {
      if (timestamp >= this.nextPresentAt) {
        this.presentTarget(timestamp);
      }
    } else if (this.phase === 'presenting') {
      if (this.timing.isStimulusExpired(this.stimulusPresentedAt, timestamp)) {
        this.canvas.clear('#000000');
        this.fixationRenderer.renderNormal();
        this.phase = 'waiting';
      }
    } else if (this.phase === 'waiting') {
      if (this.timing.isTimedOut(this.stimulusPresentedAt, timestamp)) {
        this.recorder.recordResponse('miss', 0, timestamp);
        this.advanceTarget(timestamp);
      }
    }
  }

  private presentTarget(timestamp: number): void {
    let contrast: number;
    let x: number, y: number, diameter: number;

    if (this.isPractice) {
      contrast = this.config.practiceContrast;
      x = this.config.practiceX;
      y = this.config.practiceY;
      diameter = this.config.practiceDiameter;
    } else {
      const target = this.targetStates[this.currentTargetIndex];
      contrast = target.currentContrast;
      x = target.config.x;
      y = target.config.y;
      diameter = target.config.diameter;
      target.presented++;
    }

    // Render target at current contrast (alpha-based)
    const color = `rgba(255, 255, 255, ${contrast})`;

    this.canvas.clear('#000000');
    this.fixationRenderer.renderNormal();
    this.stimulusRenderer.render({
      degX: x, degY: y, diameter, shape: 'circle', color,
    });

    this.stimulusPresentedAt = timestamp;
    this.input.setStimulusActive(true, timestamp);
    this.phase = 'presenting';

    this.recorder.recordStimulus(
      Math.round(x), Math.round(y), timestamp,
    );
  }

  private handleResponse(timestamp: number, classification: ResponseClassification): void {
    if (this.phase === 'paused') return;

    if (classification === 'falsePositive') {
      this.recorder.recordResponse('falsePositive', 0, timestamp);
      return;
    }

    if (classification === 'tooEarly') return;

    if (classification === 'hit' && (this.phase === 'presenting' || this.phase === 'waiting')) {
      const rt = timestamp - this.stimulusPresentedAt;
      this.recorder.recordResponse('hit', rt, timestamp);

      if (!this.isPractice) {
        this.targetStates[this.currentTargetIndex].correct++;
      }

      this.canvas.clear('#000000');
      this.fixationRenderer.renderNormal();
      this.input.setStimulusActive(false);
      this.advanceTarget(timestamp);
    }
  }

  private advanceTarget(timestamp: number): void {
    this.input.setStimulusActive(false);

    if (this.isPractice) {
      this.practiceCount++;
      if (this.practiceCount >= this.config.practicePresentations) {
        this.startMain();
        return;
      }
    } else {
      this.presentationCount++;
      this.onProgress?.(this.presentationCount, this.config.presentations);

      // Apply staircase after each complete cycle through all targets
      this.currentTargetIndex = (this.currentTargetIndex + 1) % this.targetStates.length;
      if (this.currentTargetIndex === 0) {
        this.applyStaircase();
      }

      if (this.presentationCount >= this.config.presentations) {
        this.applyStaircase(); // Final adjustment
        this.stop();
        return;
      }
    }

    this.nextPresentAt = timestamp + this.timing.randomInterval();
    this.phase = this.isPractice ? 'practice' : 'main';
  }

  /**
   * Apply asymmetric staircase from original NovaVisionApp.
   * Per-target, based on correct count vs upper/lower thresholds.
   */
  private applyStaircase(): void {
    for (const target of this.targetStates) {
      if (target.correct >= this.config.upperLimit && target.currentContrast >= CONTRAST_MIN) {
        target.currentContrast = Math.max(target.currentContrast - STEP_DOWN, CONTRAST_MIN);
      } else if (target.correct <= this.config.lowerLimit && target.currentContrast <= CONTRAST_MAX) {
        target.currentContrast = Math.min(target.currentContrast + STEP_UP, CONTRAST_MAX);
      }
    }
  }

  private setPhase(phase: NetPhase): void {
    this.phase = phase;
    this.onPhaseChange?.(phase);
  }
}
