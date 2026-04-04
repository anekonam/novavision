export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type StimulusShape = 'circle' | 'square' | 'diamond' | 'triangle' | 'cross' | 'star';

export interface CalibrationData {
  degreePixels: number;
  distanceCm: number;
  pixelsPerCm: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
}

export interface GridConfig {
  sizeX: number;
  sizeY: number;
  gridAngle: number;
  verticalExtent: number;
}

export type Quadrant = 'TL' | 'TR' | 'BL' | 'BR';

export type ResponseClassification =
  | 'hit'
  | 'miss'
  | 'falsePositive'
  | 'tooEarly'
  | 'fixationResponse';
