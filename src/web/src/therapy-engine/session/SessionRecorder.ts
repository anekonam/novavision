import type { ResponseClassification } from '../types/common';

export interface SessionEvent {
  type: 'stimulus' | 'response' | 'fixation' | 'fixationResponse' | 'pause' | 'resume';
  timestamp: number;
  data: Record<string, unknown>;
}

export interface SessionSummary {
  stimuliPresented: number;
  stimuliCorrect: number;
  fixationChanges: number;
  fixationCorrect: number;
  falsePositives: number;
  averageResponseTimeMs: number;
  minResponseTimeMs: number;
  maxResponseTimeMs: number;
  responseTimes: number[];
  durationMs: number;
}

/**
 * Records all therapy session events for audit trail and result submission.
 * Buffers events in memory (and optionally IndexedDB for persistence).
 */
export class SessionRecorder {
  private events: SessionEvent[] = [];
  private startTime: number = 0;
  private stimuliPresented: number = 0;
  private stimuliCorrect: number = 0;
  private fixationChanges: number = 0;
  private fixationCorrect: number = 0;
  private falsePositives: number = 0;
  private responseTimes: number[] = [];

  start(): void {
    this.events = [];
    this.startTime = performance.now();
    this.stimuliPresented = 0;
    this.stimuliCorrect = 0;
    this.fixationChanges = 0;
    this.fixationCorrect = 0;
    this.falsePositives = 0;
    this.responseTimes = [];
  }

  recordStimulus(gridX: number, gridY: number, timestamp: number): void {
    this.stimuliPresented++;
    this.events.push({
      type: 'stimulus',
      timestamp,
      data: { gridX, gridY, index: this.stimuliPresented },
    });
  }

  recordResponse(
    classification: ResponseClassification,
    responseTimeMs: number,
    timestamp: number,
    gridX?: number,
    gridY?: number,
  ): void {
    this.events.push({
      type: 'response',
      timestamp,
      data: { classification, responseTimeMs, gridX, gridY },
    });

    switch (classification) {
      case 'hit':
        this.stimuliCorrect++;
        this.responseTimes.push(responseTimeMs);
        break;
      case 'falsePositive':
        this.falsePositives++;
        break;
      case 'fixationResponse':
        this.fixationCorrect++;
        break;
    }
  }

  recordFixationChange(timestamp: number): void {
    this.fixationChanges++;
    this.events.push({
      type: 'fixation',
      timestamp,
      data: { index: this.fixationChanges },
    });
  }

  recordPause(timestamp: number): void {
    this.events.push({ type: 'pause', timestamp, data: {} });
  }

  recordResume(timestamp: number): void {
    this.events.push({ type: 'resume', timestamp, data: {} });
  }

  getSummary(): SessionSummary {
    const now = performance.now();
    const times = this.responseTimes;
    return {
      stimuliPresented: this.stimuliPresented,
      stimuliCorrect: this.stimuliCorrect,
      fixationChanges: this.fixationChanges,
      fixationCorrect: this.fixationCorrect,
      falsePositives: this.falsePositives,
      averageResponseTimeMs: times.length > 0
        ? times.reduce((a, b) => a + b, 0) / times.length
        : 0,
      minResponseTimeMs: times.length > 0 ? Math.min(...times) : 0,
      maxResponseTimeMs: times.length > 0 ? Math.max(...times) : 0,
      responseTimes: [...times],
      durationMs: now - this.startTime,
    };
  }

  getEvents(): SessionEvent[] {
    return [...this.events];
  }

  getRunningStats(): {
    presented: number;
    correct: number;
    fixationAccuracy: number;
    falsePositives: number;
  } {
    return {
      presented: this.stimuliPresented,
      correct: this.stimuliCorrect,
      fixationAccuracy: this.fixationChanges > 0
        ? this.fixationCorrect / this.fixationChanges
        : 1,
      falsePositives: this.falsePositives,
    };
  }
}
