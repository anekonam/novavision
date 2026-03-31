// Core engine
export { TherapyCanvas } from './core/TherapyCanvas';
export { StimulusRenderer } from './core/StimulusRenderer';
export type { StimulusConfig } from './core/StimulusRenderer';
export { FixationRenderer } from './core/FixationRenderer';
export type { FixationConfig } from './core/FixationRenderer';
export { GridSystem, DEFAULT_GRID } from './core/GridSystem';
export { TimingEngine, DEFAULT_TIMING } from './core/TimingEngine';
export type { TimingConfig, TimingCallback } from './core/TimingEngine';
export { InputHandler } from './core/InputHandler';

// Therapy session engines
export { VrtSessionEngine, DEFAULT_VRT_BLOCK } from './therapies/VrtSessionEngine';
export type { VrtBlockConfig } from './therapies/VrtSessionEngine';
export { NecSessionEngine, NEC_STAGES } from './therapies/NecSessionEngine';
export type { NecStageConfig, NecSessionState, MatrixItem } from './therapies/NecSessionEngine';
export { NetSessionEngine } from './therapies/NetSessionEngine';
export type { NetTargetConfig, NetSessionConfig } from './therapies/NetSessionEngine';

// Session management
export { SessionRecorder } from './session/SessionRecorder';
export type { SessionEvent, SessionSummary } from './session/SessionRecorder';

// Types
export type {
  Point,
  Size,
  StimulusShape,
  CalibrationData,
  GridConfig,
  Quadrant,
  ResponseClassification,
} from './types/common';
