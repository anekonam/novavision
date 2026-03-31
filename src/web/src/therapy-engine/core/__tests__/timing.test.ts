import { describe, it, expect } from 'vitest';

type ResponseClassification = 'hit' | 'miss' | 'falsePositive' | 'tooEarly' | 'fixationResponse';

function classifyResponse(
  responseTimeMs: number,
  stimulusActive: boolean,
  isFixationChange: boolean,
  minResponseTimeMs: number = 150,
  maxDelayTimeMs: number = 1500,
): ResponseClassification {
  if (isFixationChange) return 'fixationResponse';
  if (!stimulusActive) return 'falsePositive';
  if (responseTimeMs < minResponseTimeMs) return 'tooEarly';
  if (responseTimeMs > maxDelayTimeMs) return 'miss';
  return 'hit';
}

function calculateInterStimulusInterval(minMs: number, maxMs: number): number {
  return minMs + Math.random() * (maxMs - minMs);
}

describe('Response Classification', () => {
  it('should classify valid response as hit', () => {
    expect(classifyResponse(350, true, false)).toBe('hit');
  });

  it('should classify too-fast response as tooEarly', () => {
    expect(classifyResponse(100, true, false)).toBe('tooEarly');
  });

  it('should classify response at exactly min threshold as hit', () => {
    expect(classifyResponse(150, true, false)).toBe('hit');
  });

  it('should classify response at exactly max threshold as hit', () => {
    expect(classifyResponse(1500, true, false)).toBe('hit');
  });

  it('should classify late response as miss', () => {
    expect(classifyResponse(1600, true, false)).toBe('miss');
  });

  it('should classify response without stimulus as falsePositive', () => {
    expect(classifyResponse(300, false, false)).toBe('falsePositive');
  });

  it('should classify fixation response separately', () => {
    expect(classifyResponse(300, true, true)).toBe('fixationResponse');
  });
});

describe('Inter-Stimulus Interval', () => {
  it('should generate interval within range', () => {
    for (let i = 0; i < 100; i++) {
      const interval = calculateInterStimulusInterval(1000, 2000);
      expect(interval).toBeGreaterThanOrEqual(1000);
      expect(interval).toBeLessThanOrEqual(2000);
    }
  });
});
