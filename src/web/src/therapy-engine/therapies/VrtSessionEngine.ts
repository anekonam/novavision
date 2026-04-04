import type { TherapyCanvas } from '../core/TherapyCanvas';
import { StimulusRenderer, type StimulusConfig } from '../core/StimulusRenderer';
import { FixationRenderer } from '../core/FixationRenderer';
import { GridSystem } from '../core/GridSystem';
import { TimingEngine } from '../core/TimingEngine';
import { InputHandler } from '../core/InputHandler';
import { SessionRecorder } from '../session/SessionRecorder';
import type { StimulusShape, ResponseClassification } from '../types/common';

export type VrtBlockType = 'Status' | 'Progress' | 'Rapid' | 'Standard';
export type RapidDirection = 'Left' | 'Right' | 'Up' | 'Down';
type VrtSessionPhase = 'idle' | 'presenting' | 'waitingResponse' | 'interval' | 'complete' | 'paused';

export interface VrtBlockConfig {
  blockType: VrtBlockType;
  therapyArea?: string;
  gridSizeX: number;
  gridSizeY: number;
  gridAngle: number;
  // Fixation position (0-1 ratio, default 0.5 = centre)
  fixationX: number;
  fixationY: number;
  // Stimulus
  stimulusShape: StimulusShape;
  stimulusColour: string;
  stimulusDiameter: number;
  stimulusDisplayTimeMs: number;
  stimulusMinResponseTimeMs: number;
  stimulusMaxDelayTimeMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  // Dual fixation (original uses two alternating appearances)
  fixationShape1: StimulusShape;
  fixationShape2: StimulusShape;
  fixationColour1: string;
  fixationColour2: string;
  fixationRate: number;
  fixationVariance: number;
  fixationDisplayTimeMs: number;
  fixationMinResponseTimeMs: number;
  fixationMaxDelayTimeMs: number;
  // Session
  sessionStimuli: number;
  progressStimuliCount: number;
  excludeCentre: boolean;
  // Rapid block
  rapidDirection: RapidDirection;
  rapidDurationMinutes: number; // 0 = unlimited (count-based)
}

export const DEFAULT_VRT_BLOCK: VrtBlockConfig = {
  blockType: 'Status',
  gridSizeX: 19, gridSizeY: 15, gridAngle: 43,
  fixationX: 0.5, fixationY: 0.5,
  stimulusShape: 'circle', stimulusColour: '#ffffff', stimulusDiameter: 0.15,
  stimulusDisplayTimeMs: 200, stimulusMinResponseTimeMs: 150, stimulusMaxDelayTimeMs: 1500,
  minIntervalMs: 1000, maxIntervalMs: 2000,
  fixationShape1: 'circle', fixationShape2: 'square',
  fixationColour1: '#ff0000', fixationColour2: '#00ff00',
  fixationRate: 0.2, fixationVariance: 0.17,
  fixationDisplayTimeMs: 200, fixationMinResponseTimeMs: 150, fixationMaxDelayTimeMs: 1500,
  sessionStimuli: 284, progressStimuliCount: 200, excludeCentre: true,
  rapidDirection: 'Right', rapidDurationMinutes: 0,
};

/** Per-stimulus result matching original StimuliResult model */
interface StimulusResultData {
  x: number;
  y: number;
  correct: boolean;
  presented: boolean;
  responseMs: number;
  isTopLeft: boolean;
  isTopRight: boolean;
  isBottomLeft: boolean;
  isBottomRight: boolean;
  isCenter: boolean;
}

/** Per-fixation result matching original FixationResult model */
interface FixationResultData {
  index: number; // Presentation index when fixation change occurs
  correct: boolean;
  presented: boolean;
  responseMs: number;
}

/**
 * VRT Session Engine — faithful replication of TherapySessionTrialViewModel.cs
 *
 * Key differences from simplified version:
 * - Centre cell calculated via Ceiling(GridSize * FixationRatio) - 1 (not Math.floor)
 * - Quadrant: cells on centre row/col (but not centre) get NO quadrant flag
 * - Fixation schedule: first change always at index 0
 * - Progress block: every 5th is random WITH retry to avoid therapy area
 * - Rapid block: directional ordering (Left/Right/Up/Down)
 * - Status/Standard: centre excluded AFTER population (matching original filter order)
 * - False positive warning after 5 consecutive
 * - Fixation error warning after 3 consecutive misses
 */
export class VrtSessionEngine {
  private canvas: TherapyCanvas;
  private stimulusRenderer: StimulusRenderer;
  private fixationRenderer: FixationRenderer;
  private grid: GridSystem;
  private timing: TimingEngine;
  private input: InputHandler;
  private recorder: SessionRecorder;

  private config: VrtBlockConfig;
  private phase: VrtSessionPhase = 'idle';

  // Centre cell coords (original formula)
  private centreX: number;
  private centreY: number;

  // Stimulus list and tracking
  private stimuliResults: StimulusResultData[] = [];
  private fixationResults: FixationResultData[] = [];
  private presentedStimuli: number = 0;
  private presentedFixations: number = 0;

  // Current presentation state
  private currentStimulus: StimulusConfig | null = null;
  private currentStimulusData: StimulusResultData | null = null;
  private currentFixationData: FixationResultData | null = null;
  private presentedAt: number = 0;
  private nextPresentAt: number = 0;
  private isFixationActive: boolean = false;

  // Error tracking (matches original)
  private falsePositiveCount: number = 0;
  private fixationErrorCount: number = 0;
  private readonly maxFalsePositives = 5;
  private readonly maxFixationErrors = 3;

  // Rapid block timing
  private sessionStartTime: number = 0;

  private onPhaseChange: ((phase: VrtSessionPhase) => void) | null = null;
  private onProgress: ((presented: number, total: number) => void) | null = null;
  private onWarning: ((message: string) => void) | null = null;

  constructor(canvas: TherapyCanvas, config: VrtBlockConfig = DEFAULT_VRT_BLOCK) {
    this.canvas = canvas;
    this.config = config;

    // Original formula: Ceiling(GridSize * FixationRatio) - 1
    this.centreX = Math.ceil(config.gridSizeX * config.fixationX) - 1;
    this.centreY = Math.ceil(config.gridSizeY * config.fixationY) - 1;

    this.stimulusRenderer = new StimulusRenderer(canvas);
    this.grid = new GridSystem({
      sizeX: config.gridSizeX, sizeY: config.gridSizeY,
      gridAngle: config.gridAngle, verticalExtent: 32,
    });
    this.fixationRenderer = new FixationRenderer(canvas, {
      shape: config.fixationShape1,
      color: config.fixationColour1,
      altColor: config.fixationColour2,
      sizeDegrees: 0.3,
    });
    this.timing = new TimingEngine({
      stimulusDisplayTimeMs: config.stimulusDisplayTimeMs,
      stimulusMinResponseTimeMs: config.stimulusMinResponseTimeMs,
      stimulusMaxDelayTimeMs: config.stimulusMaxDelayTimeMs,
      minIntervalMs: config.minIntervalMs,
      maxIntervalMs: config.maxIntervalMs,
    });
    this.input = new InputHandler();
    this.recorder = new SessionRecorder();
  }

  start(
    onPhaseChange?: (phase: VrtSessionPhase) => void,
    onProgress?: (presented: number, total: number) => void,
    onWarning?: (message: string) => void,
  ): void {
    this.onPhaseChange = onPhaseChange ?? null;
    this.onProgress = onProgress ?? null;
    this.onWarning = onWarning ?? null;

    this.populateStimuliCells();
    this.buildFixationSchedule();
    this.orderStimuli();

    this.presentedStimuli = 0;
    this.presentedFixations = 0;
    this.falsePositiveCount = 0;
    this.fixationErrorCount = 0;
    this.sessionStartTime = performance.now();

    this.nextPresentAt = this.timing.now() + this.timing.randomInterval();
    this.recorder.start();
    this.canvas.clear('#000000');
    this.fixationRenderer.renderNormal();

    this.input.start(
      (ts, cls) => this.handleResponse(ts, cls),
      () => this.pause(),
    );
    this.input.updateTimingConfig(
      this.config.stimulusMinResponseTimeMs,
      this.config.stimulusMaxDelayTimeMs,
    );

    this.timing.start((ts) => this.tick(ts));
    this.setPhase('interval');
  }

  pause(): void {
    this.timing.pause();
    this.setPhase('paused');
  }

  resume(): void {
    this.timing.resume();
    this.nextPresentAt = this.timing.now() + this.timing.randomInterval();
    this.setPhase('interval');
    this.canvas.clear('#000000');
    this.fixationRenderer.renderNormal();
  }

  stop(): void {
    this.timing.stop();
    this.input.stop();
    this.setPhase('complete');
  }

  getRecorder(): SessionRecorder { return this.recorder; }
  getTimingStats() { return this.timing.getStats(); }

  getProgress(): { presented: number; total: number } {
    return { presented: this.presentedStimuli, total: this.stimuliResults.length };
  }

  getStimuliResults(): StimulusResultData[] { return this.stimuliResults; }
  getFixationResults(): FixationResultData[] { return this.fixationResults; }

  // ========== TICK LOOP ==========

  private tick(timestamp: number): void {
    // Rapid block: check time limit
    if (this.config.blockType === 'Rapid' && this.config.rapidDurationMinutes > 0) {
      const elapsed = timestamp - this.sessionStartTime;
      if (elapsed >= this.config.rapidDurationMinutes * 60000) {
        this.stop();
        return;
      }
    }

    if (this.phase === 'interval') {
      if (timestamp >= this.nextPresentAt) {
        this.presentNext(timestamp);
      }
    } else if (this.phase === 'presenting') {
      if (timestamp - this.presentedAt >= this.config.stimulusDisplayTimeMs) {
        // Hide stimulus/restore fixation
        if (this.currentStimulus) {
          this.stimulusRenderer.erase(this.currentStimulus, '#000000');
          this.currentStimulus = null;
        }
        if (this.isFixationActive) {
          this.fixationRenderer.renderNormal();
        }
        this.phase = 'waitingResponse';
      }
    } else if (this.phase === 'waitingResponse') {
      const responseTime = this.isFixationActive
        ? this.config.fixationMaxDelayTimeMs
        : this.config.stimulusMaxDelayTimeMs;

      if (timestamp - this.presentedAt > responseTime) {
        // Miss -- no response within window
        if (this.isFixationActive && this.currentFixationData) {
          this.currentFixationData.presented = true;
          // Fixation miss
          this.fixationErrorCount++;
          if (this.fixationErrorCount >= this.maxFixationErrors) {
            this.onWarning?.('Please keep your eyes on the central point.');
            this.fixationErrorCount = 0;
          }
        } else if (this.currentStimulusData) {
          this.currentStimulusData.presented = true;
          this.recorder.recordResponse('miss', 0, timestamp,
            this.currentStimulusData.x, this.currentStimulusData.y);
        }
        this.isFixationActive = false;
        this.currentFixationData = null;
        this.currentStimulusData = null;
        this.advanceToNext(timestamp);
      }
    }
  }

  // ========== PRESENTATION ==========

  private presentNext(timestamp: number): void {
    const totalPresented = this.presentedStimuli + this.presentedFixations;

    // Check completion
    if (this.isSessionComplete()) {
      this.stop();
      return;
    }

    // Check if next is a fixation change
    const nextFixation = this.fixationResults.find(
      f => !f.presented && f.index === totalPresented
    );

    if (nextFixation || this.fixationErrorCount > 0) {
      // Present fixation change
      const fix = nextFixation ?? this.fixationResults.find(f => !f.presented);
      if (fix) {
        this.currentFixationData = fix;
        this.isFixationActive = true;
        this.fixationRenderer.renderChanged();
        this.presentedAt = timestamp;
        this.phase = 'presenting';
        this.input.setFixationChangeActive(true);
        this.recorder.recordFixationChange(timestamp);
        this.presentedFixations++;
      }
    } else {
      // Present stimulus
      const stimulus = this.stimuliResults.find(s => !s.presented);
      if (!stimulus) {
        this.stop();
        return;
      }

      stimulus.presented = true;
      this.currentStimulusData = stimulus;
      this.isFixationActive = false;

      const degrees = this.grid.cellToDegrees(stimulus.x, stimulus.y);
      this.currentStimulus = {
        degX: degrees.x, degY: degrees.y,
        diameter: this.config.stimulusDiameter,
        shape: this.config.stimulusShape,
        color: this.config.stimulusColour,
      };

      this.stimulusRenderer.render(this.currentStimulus);
      this.presentedAt = timestamp;
      this.phase = 'presenting';
      this.input.setStimulusActive(true, timestamp);
      this.recorder.recordStimulus(stimulus.x, stimulus.y, timestamp);
      this.presentedStimuli++;

      this.onProgress?.(this.presentedStimuli, this.stimuliResults.length);
    }
  }

  // ========== RESPONSE HANDLING ==========

  private handleResponse(timestamp: number, classification: ResponseClassification): void {
    if (this.phase === 'paused') return;

    const responseTime = timestamp - this.presentedAt;

    if (classification === 'fixationResponse' && this.isFixationActive && this.currentFixationData) {
      this.currentFixationData.correct = true;
      this.currentFixationData.presented = true;
      this.currentFixationData.responseMs = responseTime;
      this.recorder.recordResponse('fixationResponse', responseTime, timestamp);
      this.fixationRenderer.renderNormal();
      this.isFixationActive = false;
      this.input.setFixationChangeActive(false);
      this.currentFixationData = null;
      this.falsePositiveCount = 0;
      this.fixationErrorCount = 0;
      // After valid response: hide and schedule next
      this.advanceToNext(timestamp);
      return;
    }

    if (classification === 'falsePositive') {
      this.falsePositiveCount++;
      this.recorder.recordResponse('falsePositive', 0, timestamp);
      if (this.falsePositiveCount >= this.maxFalsePositives) {
        this.onWarning?.('Please respond only when you see a stimulus.');
        this.falsePositiveCount = 0;
      }
      return;
    }

    if (classification === 'tooEarly') return;

    if (classification === 'hit' && this.currentStimulusData &&
        (this.phase === 'presenting' || this.phase === 'waitingResponse')) {
      this.currentStimulusData.correct = true;
      this.currentStimulusData.responseMs = responseTime;
      this.recorder.recordResponse('hit', responseTime, timestamp,
        this.currentStimulusData.x, this.currentStimulusData.y);

      // Hide stimulus immediately
      if (this.currentStimulus) {
        this.stimulusRenderer.erase(this.currentStimulus, '#000000');
        this.currentStimulus = null;
      }
      this.input.setStimulusActive(false);
      this.falsePositiveCount = 0;
      this.fixationErrorCount = 0;
      this.currentStimulusData = null;
      this.advanceToNext(timestamp);
    }
  }

  private advanceToNext(timestamp: number): void {
    this.nextPresentAt = timestamp + this.timing.randomInterval();
    this.phase = 'interval';
  }

  private isSessionComplete(): boolean {
    if (this.config.blockType === 'Progress') {
      return this.presentedStimuli >= this.config.progressStimuliCount;
    }
    // Status/Standard: all non-centre cells presented
    const nonCentre = this.stimuliResults.filter(s => !s.isCenter);
    return nonCentre.every(s => s.presented);
  }

  private setPhase(phase: VrtSessionPhase): void {
    this.phase = phase;
    this.onPhaseChange?.(phase);
  }

  // ========== STIMULUS POPULATION (matches PopulateStimuliCells) ==========

  private populateStimuliCells(): void {
    this.stimuliResults = [];
    const cx = this.centreX;
    const cy = this.centreY;

    if (this.config.blockType === 'Progress') {
      // Progress block: therapy area with every-5th random
      const therapyArea = this.config.therapyArea
        ? this.grid.parseTherapyArea(this.config.therapyArea)
        : [];

      for (let i = 0; i < this.config.progressStimuliCount; i++) {
        let x: number, y: number;

        if (!therapyArea.length || i % 5 === 0) {
          // Every 5th (or no therapy area): random from full grid
          // Retry if in therapy area or is centre (matches original)
          do {
            x = Math.floor(Math.random() * this.config.gridSizeX);
            y = Math.floor(Math.random() * this.config.gridSizeY);
          } while (
            (therapyArea.some(c => c.x === x && c.y === y)) ||
            (x === cx && y === cy)
          );
        } else {
          // 80% of time: random from therapy area
          const cell = therapyArea[Math.floor(Math.random() * therapyArea.length)];
          x = cell.x;
          y = cell.y;
        }

        this.stimuliResults.push(this.createStimulusResult(x, y, cx, cy));
      }

    } else if (this.config.blockType === 'Rapid') {
      // Rapid: therapy area cells (or all if no area defined)
      const therapyArea = this.config.therapyArea
        ? this.grid.parseTherapyArea(this.config.therapyArea)
        : null;

      for (let x = 0; x < this.config.gridSizeX; x++) {
        for (let y = 0; y < this.config.gridSizeY; y++) {
          if (!therapyArea || therapyArea.some(c => c.x === x && c.y === y)) {
            this.stimuliResults.push(this.createStimulusResult(x, y, cx, cy));
          }
        }
      }

    } else {
      // Status / Standard: all grid cells
      for (let x = 0; x < this.config.gridSizeX; x++) {
        for (let y = 0; y < this.config.gridSizeY; y++) {
          this.stimuliResults.push(this.createStimulusResult(x, y, cx, cy));
        }
      }
    }
  }

  /** Quadrant classification matching original exactly:
   * Cells where x==centreX OR y==centreY (but not centre) get NO quadrant flag */
  private createStimulusResult(x: number, y: number, cx: number, cy: number): StimulusResultData {
    return {
      x, y,
      correct: false,
      presented: false,
      responseMs: 0,
      isTopLeft: x < cx && y < cy,
      isTopRight: x > cx && y < cy,
      isBottomLeft: x < cx && y > cy,
      isBottomRight: x > cx && y > cy,
      isCenter: x === cx && y === cy,
    };
  }

  // ========== STIMULUS ORDERING (matches original) ==========

  private orderStimuli(): void {
    if (this.config.blockType === 'Rapid') {
      // Directional ordering
      switch (this.config.rapidDirection) {
        case 'Left':
          this.stimuliResults.sort((a, b) => b.x - a.x || a.y - b.y);
          break;
        case 'Right':
          this.stimuliResults.sort((a, b) => a.x - b.x || a.y - b.y);
          break;
        case 'Up':
          this.stimuliResults.sort((a, b) => b.y - a.y || a.x - b.x);
          break;
        case 'Down':
          this.stimuliResults.sort((a, b) => a.y - b.y || a.x - b.x);
          break;
      }
    } else {
      // Status/Standard/Progress: filter out centre, randomise
      this.stimuliResults = this.stimuliResults
        .filter(s => !s.isCenter)
        .sort(() => Math.random() - 0.5);
    }
  }

  // ========== FIXATION SCHEDULE (matches original exactly) ==========

  private buildFixationSchedule(): void {
    this.fixationResults = [];
    const count = this.stimuliResults.filter(s => !s.isCenter).length;
    const fixationChanges = Math.round(count * this.config.fixationRate);
    if (fixationChanges === 0) return;

    const frequency = Math.round(
      ((1 - this.config.fixationVariance ** 2) * count) / fixationChanges
    );

    for (let i = 0; i < fixationChanges; i++) {
      let index: number;
      if (i === 0) {
        index = 0; // First fixation ALWAYS at presentation 0
      } else {
        const maxPrev = Math.max(...this.fixationResults.map(f => f.index));
        const rangeMin = maxPrev + frequency;
        const rangeMax = maxPrev + frequency + Math.floor(frequency / 2);
        index = rangeMin + Math.floor(Math.random() * (rangeMax - rangeMin));
      }

      if (index < count) {
        this.fixationResults.push({
          index,
          correct: false,
          presented: false,
          responseMs: 0,
        });
      }
    }
  }
}
