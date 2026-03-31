import type { TherapyCanvas } from '../core/TherapyCanvas';
import { StimulusRenderer, type StimulusConfig } from '../core/StimulusRenderer';
import { FixationRenderer, type FixationConfig } from '../core/FixationRenderer';
import { GridSystem } from '../core/GridSystem';
import { TimingEngine, type TimingConfig } from '../core/TimingEngine';
import { InputHandler } from '../core/InputHandler';
import { SessionRecorder } from '../session/SessionRecorder';
import type { StimulusShape, Quadrant, ResponseClassification } from '../types/common';

export type VrtBlockType = 'Status' | 'Progress' | 'Rapid' | 'Standard';
type VrtSessionPhase = 'idle' | 'presenting' | 'waitingResponse' | 'interval' | 'complete' | 'paused';

export interface VrtBlockConfig {
  blockType: VrtBlockType;
  therapyArea?: string;
  gridSizeX: number;
  gridSizeY: number;
  gridAngle: number;
  stimulusShape: StimulusShape;
  stimulusColour: string;
  stimulusDiameter: number;
  stimulusDisplayTimeMs: number;
  stimulusMinResponseTimeMs: number;
  stimulusMaxDelayTimeMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  fixationShape1: StimulusShape;
  fixationShape2: StimulusShape;
  fixationColour1: string;
  fixationColour2: string;
  fixationRate: number;
  fixationVariance: number;
  fixationDisplayTimeMs: number;
  fixationMinResponseTimeMs: number;
  fixationMaxDelayTimeMs: number;
  sessionStimuli: number;
  progressStimuliCount: number;
  excludeCentre: boolean;
}

export const DEFAULT_VRT_BLOCK: VrtBlockConfig = {
  blockType: 'Status',
  gridSizeX: 19, gridSizeY: 15, gridAngle: 43,
  stimulusShape: 'circle', stimulusColour: '#ffffff', stimulusDiameter: 0.15,
  stimulusDisplayTimeMs: 200, stimulusMinResponseTimeMs: 150, stimulusMaxDelayTimeMs: 1500,
  minIntervalMs: 1000, maxIntervalMs: 2000,
  fixationShape1: 'circle', fixationShape2: 'square',
  fixationColour1: '#ff0000', fixationColour2: '#00ff00',
  fixationRate: 0.2, fixationVariance: 0.17,
  fixationDisplayTimeMs: 200, fixationMinResponseTimeMs: 150, fixationMaxDelayTimeMs: 1500,
  sessionStimuli: 284, progressStimuliCount: 200, excludeCentre: true,
};

/**
 * VRT Session Engine -- orchestrates a complete VRT therapy session.
 *
 * Supports all 4 block types:
 *   Status: full-field diagnostic perimetry (all grid cells minus centre)
 *   Progress: targeted therapy area stimulation (every 5th is random)
 *   Rapid: directional rapid stimulation in therapy area
 *   Standard: all grid cells minus centre, randomised
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
  private stimulusList: { x: number; y: number }[] = [];
  private currentStimulusIndex: number = 0;
  private currentStimulus: StimulusConfig | null = null;
  private stimulusPresentedAt: number = 0;
  private nextStimulusAt: number = 0;
  private fixationChangeIndices: Set<number> = new Set();
  private fixationChangePresentedAt: number = 0;
  private isFixationChanged: boolean = false;

  private onPhaseChange: ((phase: VrtSessionPhase) => void) | null = null;
  private onProgress: ((presented: number, total: number) => void) | null = null;

  constructor(canvas: TherapyCanvas, config: VrtBlockConfig = DEFAULT_VRT_BLOCK) {
    this.canvas = canvas;
    this.config = config;
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

  /** Start the VRT session */
  start(
    onPhaseChange?: (phase: VrtSessionPhase) => void,
    onProgress?: (presented: number, total: number) => void,
  ): void {
    this.onPhaseChange = onPhaseChange ?? null;
    this.onProgress = onProgress ?? null;

    this.stimulusList = this.buildStimulusList();
    this.fixationChangeIndices = this.buildFixationSchedule();
    this.currentStimulusIndex = 0;
    this.phase = 'interval';
    this.nextStimulusAt = this.timing.now() + this.timing.randomInterval();

    this.recorder.start();
    this.canvas.clear('#000000');
    this.fixationRenderer.renderNormal();

    this.input.start(
      (timestamp, classification) => this.handleResponse(timestamp, classification),
      () => this.pause(),
    );
    this.input.updateTimingConfig(
      this.config.stimulusMinResponseTimeMs,
      this.config.stimulusMaxDelayTimeMs,
    );

    this.timing.start((timestamp, _delta) => this.tick(timestamp));
    this.setPhase('interval');
  }

  pause(): void {
    this.timing.pause();
    this.setPhase('paused');
  }

  resume(): void {
    this.timing.resume();
    this.nextStimulusAt = this.timing.now() + this.timing.randomInterval();
    this.setPhase('interval');
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

  getTimingStats() {
    return this.timing.getStats();
  }

  getProgress(): { presented: number; total: number } {
    return { presented: this.currentStimulusIndex, total: this.stimulusList.length };
  }

  private tick(timestamp: number): void {
    if (this.phase === 'interval') {
      if (timestamp >= this.nextStimulusAt) {
        this.presentNextStimulus(timestamp);
      }
    } else if (this.phase === 'presenting') {
      if (this.timing.isStimulusExpired(this.stimulusPresentedAt, timestamp)) {
        this.removeStimulus();
        this.phase = 'waitingResponse';
      }
    } else if (this.phase === 'waitingResponse') {
      if (this.timing.isTimedOut(this.stimulusPresentedAt, timestamp)) {
        // Miss -- no response
        this.recorder.recordResponse('miss', 0, timestamp,
          this.stimulusList[this.currentStimulusIndex - 1]?.x,
          this.stimulusList[this.currentStimulusIndex - 1]?.y);
        this.advanceToNext(timestamp);
      }
    }

    // Handle fixation change expiry
    if (this.isFixationChanged &&
        this.timing.now() - this.fixationChangePresentedAt > this.config.fixationDisplayTimeMs) {
      this.fixationRenderer.renderNormal();
      this.isFixationChanged = false;
      this.input.setFixationChangeActive(false);
    }
  }

  private presentNextStimulus(timestamp: number): void {
    if (this.currentStimulusIndex >= this.stimulusList.length) {
      this.stop();
      return;
    }

    // Check for fixation change
    if (this.fixationChangeIndices.has(this.currentStimulusIndex)) {
      this.fixationRenderer.renderChanged();
      this.isFixationChanged = true;
      this.fixationChangePresentedAt = timestamp;
      this.input.setFixationChangeActive(true);
      this.recorder.recordFixationChange(timestamp);
    }

    const cell = this.stimulusList[this.currentStimulusIndex];
    const degrees = this.grid.cellToDegrees(cell.x, cell.y);

    this.currentStimulus = {
      degX: degrees.x,
      degY: degrees.y,
      diameter: this.config.stimulusDiameter,
      shape: this.config.stimulusShape,
      color: this.config.stimulusColour,
    };

    this.stimulusRenderer.render(this.currentStimulus);
    this.stimulusPresentedAt = timestamp;
    this.phase = 'presenting';
    this.input.setStimulusActive(true, timestamp);

    this.recorder.recordStimulus(cell.x, cell.y, timestamp);
    this.onProgress?.(this.currentStimulusIndex + 1, this.stimulusList.length);
  }

  private removeStimulus(): void {
    if (this.currentStimulus) {
      this.stimulusRenderer.erase(this.currentStimulus, '#000000');
      this.currentStimulus = null;
    }
  }

  private handleResponse(timestamp: number, classification: ResponseClassification): void {
    if (this.phase === 'paused') return;

    if (classification === 'fixationResponse') {
      const rt = timestamp - this.fixationChangePresentedAt;
      this.recorder.recordResponse('fixationResponse', rt, timestamp);
      this.fixationRenderer.renderNormal();
      this.isFixationChanged = false;
      this.input.setFixationChangeActive(false);
      return;
    }

    if (classification === 'falsePositive') {
      this.recorder.recordResponse('falsePositive', 0, timestamp);
      return;
    }

    if (classification === 'tooEarly') return; // Ignored

    if (classification === 'hit' && (this.phase === 'presenting' || this.phase === 'waitingResponse')) {
      const rt = timestamp - this.stimulusPresentedAt;
      const cell = this.stimulusList[this.currentStimulusIndex];
      this.recorder.recordResponse('hit', rt, timestamp, cell?.x, cell?.y);
      this.removeStimulus();
      this.input.setStimulusActive(false);
      this.advanceToNext(timestamp);
    }
  }

  private advanceToNext(timestamp: number): void {
    this.currentStimulusIndex++;
    this.input.setStimulusActive(false);

    if (this.currentStimulusIndex >= this.stimulusList.length) {
      this.stop();
      return;
    }

    this.nextStimulusAt = timestamp + this.timing.randomInterval();
    this.phase = 'interval';
  }

  private setPhase(phase: VrtSessionPhase): void {
    this.phase = phase;
    this.onPhaseChange?.(phase);
  }

  /**
   * Build the stimulus list based on block type.
   * Matches original NovaVisionApp TherapySessionTrialViewModel logic.
   */
  private buildStimulusList(): { x: number; y: number }[] {
    const allCells = this.grid.getAllCells();
    const centreX = Math.floor(this.config.gridSizeX / 2);
    const centreY = Math.floor(this.config.gridSizeY / 2);

    switch (this.config.blockType) {
      case 'Status':
      case 'Standard': {
        // All cells except centre (if excludeCentre), randomised
        let cells = this.config.excludeCentre
          ? allCells.filter(c => !(c.x === centreX && c.y === centreY))
          : allCells;
        return this.shuffle(cells).slice(0, this.config.sessionStimuli);
      }

      case 'Progress': {
        // Therapy area cells + every 5th from all cells
        const therapyArea = this.config.therapyArea
          ? this.grid.parseTherapyArea(this.config.therapyArea)
          : allCells;
        const result: { x: number; y: number }[] = [];
        const shuffledArea = this.shuffle([...therapyArea]);
        const shuffledAll = this.shuffle([...allCells]);
        let areaIdx = 0;
        let allIdx = 0;

        for (let i = 0; i < this.config.progressStimuliCount; i++) {
          if (i % 5 === 0 && i > 0) {
            // Every 5th: pick from ALL grid cells (boundary bias mitigation)
            result.push(shuffledAll[allIdx % shuffledAll.length]);
            allIdx++;
          } else {
            result.push(shuffledArea[areaIdx % shuffledArea.length]);
            areaIdx++;
          }
        }
        return result;
      }

      case 'Rapid': {
        // Therapy area cells ordered by direction (sweep)
        const therapyArea = this.config.therapyArea
          ? this.grid.parseTherapyArea(this.config.therapyArea)
          : allCells;
        // Sort left-to-right for horizontal sweep
        return [...therapyArea].sort((a, b) => a.x - b.x || a.y - b.y);
      }
    }
  }

  /**
   * Build fixation change schedule.
   * Matches original: fixationChanges = round(stimuliCount * rate)
   * Distributed with variance-based pseudo-random spacing.
   */
  private buildFixationSchedule(): Set<number> {
    const count = this.stimulusList.length;
    const fixationChanges = Math.round(count * this.config.fixationRate);
    if (fixationChanges === 0) return new Set();

    const frequency = Math.round(
      (1 - this.config.fixationVariance ** 2) * count / fixationChanges
    );

    const indices = new Set<number>();
    let maxIndex = frequency;

    for (let i = 0; i < fixationChanges && maxIndex < count; i++) {
      const variance = Math.floor(frequency / 2);
      const index = maxIndex + Math.floor(Math.random() * variance);
      if (index < count) {
        indices.add(index);
      }
      maxIndex = index + frequency;
    }

    return indices;
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
