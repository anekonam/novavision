import type { TherapyCanvas } from '../core/TherapyCanvas';
import { StimulusRenderer } from '../core/StimulusRenderer';
import { FixationRenderer } from '../core/FixationRenderer';
import { TimingEngine } from '../core/TimingEngine';
import { InputHandler } from '../core/InputHandler';
import { SessionRecorder } from '../session/SessionRecorder';
import type { ResponseClassification } from '../types/common';

/**
 * NET contrast staircase constants from original UserNetTherapyResultData.cs:
 *   if correct >= UpperLimit AND contrast >= 0.15 → contrast -= 0.1
 *   if correct <= LowerLimit AND contrast <= 0.9  → contrast += 0.05
 *
 * Key differences from simplified version:
 * - Target cycling is RANDOM (not sequential 0,1,2,3,4)
 * - Staircase applied ONCE at session end (server-side), not per-cycle
 * - Practice requires 8/10 correct to pass
 * - Per-target presentation count tracked independently
 */

const CONTRAST_MIN = 0.15;
const CONTRAST_MAX = 0.9;
const STEP_DOWN = 0.1;
const STEP_UP = 0.05;
const PRACTICE_PASS_THRESHOLD = 8; // Must get 8/10 correct in practice

export interface NetTargetConfig {
  targetNumber: number;
  x: number;  // visual degrees
  y: number;
  diameter: number;
  contrast: number; // 0.0-1.0
}

export interface NetSessionConfig {
  targets: NetTargetConfig[];
  upperLimit: number;  // Correct count threshold for decrease (default 43)
  lowerLimit: number;  // Correct count threshold for increase (default 32)
  presentations: number; // Per-target presentations
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

type NetPhase = 'idle' | 'practice' | 'main' | 'presenting' | 'waiting' | 'interval' | 'complete' | 'paused' | 'practiceFailed';

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
  private currentTargetIndex: number = -1;
  private stimulusPresentedAt: number = 0;
  private nextPresentAt: number = 0;
  private isPractice: boolean = false;
  private practiceCorrect: number = 0;
  private practicePresented: number = 0;
  private totalPresented: number = 0;

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

  start(
    onPhaseChange?: (phase: NetPhase) => void,
    onProgress?: (presented: number, total: number) => void,
  ): void {
    this.onPhaseChange = onPhaseChange ?? null;
    this.onProgress = onProgress ?? null;
    this.isPractice = true;
    this.practiceCorrect = 0;
    this.practicePresented = 0;
    this.totalPresented = 0;

    this.recorder.start();
    this.canvas.clear('#000000');
    this.fixationRenderer.renderNormal();

    this.input.start(
      (ts, cls) => this.handleResponse(ts, cls),
      () => this.pause(),
    );

    this.nextPresentAt = this.timing.now() + this.timing.randomInterval();
    this.timing.start((ts) => this.tick(ts));
    this.setPhase('practice');
  }

  startMain(): void {
    this.isPractice = false;
    this.totalPresented = 0;
    // Reset per-target counts for main session
    for (const ts of this.targetStates) {
      ts.presented = 0;
      ts.correct = 0;
    }
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
    // Apply staircase ONCE at session end (matches original server-side logic)
    if (!this.isPractice) {
      this.applyStaircase();
    }
    this.setPhase('complete');
  }

  getRecorder(): SessionRecorder { return this.recorder; }
  getTargetStates(): TargetState[] { return [...this.targetStates]; }
  isPracticePhase(): boolean { return this.isPractice; }
  getPracticeResult(): { correct: number; presented: number; passed: boolean } {
    return {
      correct: this.practiceCorrect,
      presented: this.practicePresented,
      passed: this.practiceCorrect >= PRACTICE_PASS_THRESHOLD,
    };
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
    let contrast: number, x: number, y: number, diameter: number;

    if (this.isPractice) {
      contrast = this.config.practiceContrast;
      x = this.config.practiceX;
      y = this.config.practiceY;
      diameter = this.config.practiceDiameter;
    } else {
      // RANDOM target selection (matches original ShowTarget method)
      // Pick random target that hasn't reached max presentations
      const maxPerTarget = this.config.presentations;
      const available = this.targetStates
        .map((ts, idx) => ({ ts, idx }))
        .filter(({ ts }) => ts.presented < maxPerTarget);

      if (available.length === 0) {
        this.stop();
        return;
      }

      const pick = available[Math.floor(Math.random() * available.length)];
      this.currentTargetIndex = pick.idx;

      const target = pick.ts;
      contrast = target.currentContrast;
      x = target.config.x;
      y = target.config.y;
      diameter = target.config.diameter;
      target.presented++;
    }

    const color = `rgba(255, 255, 255, ${contrast})`;

    this.canvas.clear('#000000');
    this.fixationRenderer.renderNormal();
    this.stimulusRenderer.render({
      degX: x, degY: y, diameter, shape: 'circle', color,
    });

    this.stimulusPresentedAt = timestamp;
    this.input.setStimulusActive(true, timestamp);
    this.phase = 'presenting';
    this.recorder.recordStimulus(Math.round(x), Math.round(y), timestamp);
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

      if (this.isPractice) {
        this.practiceCorrect++;
      } else {
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
      this.practicePresented++;
      if (this.practicePresented >= this.config.practicePresentations) {
        // Check practice pass threshold (8/10 in original)
        if (this.practiceCorrect >= PRACTICE_PASS_THRESHOLD) {
          this.startMain();
        } else {
          this.setPhase('practiceFailed');
        }
        return;
      }
    } else {
      this.totalPresented++;
      const totalRequired = this.config.presentations * this.targetStates.length;
      this.onProgress?.(this.totalPresented, totalRequired);

      // Check if all targets have reached their presentation count
      const allDone = this.targetStates.every(
        ts => ts.presented >= this.config.presentations
      );
      if (allDone) {
        this.stop();
        return;
      }
    }

    this.nextPresentAt = timestamp + this.timing.randomInterval();
    this.phase = this.isPractice ? 'practice' : 'main';
  }

  /**
   * Apply asymmetric staircase ONCE at session end.
   * Matches original UserNetTherapyResultData.cs UpdateTherapy method.
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
