import { describe, it, expect } from 'vitest';

/**
 * NET contrast staircase: ASYMMETRIC steps.
 * Original NovaVisionApp logic (UserNetTherapyResultData.cs):
 *   if correctCount >= upperLimit AND contrast >= 0.15 → contrast -= 0.1
 *   if correctCount <= lowerLimit AND contrast <= 0.9  → contrast += 0.05
 *
 * Contrast is 0.0-1.0 scale (NOT percentage).
 * Upper/Lower limits are CORRECT COUNT thresholds, not contrast bounds.
 */

const CONTRAST_MIN = 0.15;
const CONTRAST_MAX = 0.9;
const STEP_DOWN = 0.1;  // Correct → harder (asymmetric!)
const STEP_UP = 0.05;   // Incorrect → easier (asymmetric!)

function adjustContrast(
  current: number,
  correctCount: number,
  upperLimit: number,
  lowerLimit: number,
): number {
  if (correctCount >= upperLimit && current >= CONTRAST_MIN) {
    return Math.max(current - STEP_DOWN, CONTRAST_MIN);
  }
  if (correctCount <= lowerLimit && current <= CONTRAST_MAX) {
    return Math.min(current + STEP_UP, CONTRAST_MAX);
  }
  return current;
}

describe('NET Staircase (Asymmetric)', () => {
  const upper = 43;
  const lower = 32;

  it('correct above threshold decreases contrast by 0.1', () => {
    expect(adjustContrast(0.6, 45, upper, lower)).toBeCloseTo(0.5, 3);
  });

  it('incorrect below threshold increases contrast by 0.05', () => {
    expect(adjustContrast(0.4, 30, upper, lower)).toBeCloseTo(0.45, 3);
  });

  it('count between thresholds does not change contrast', () => {
    expect(adjustContrast(0.5, 38, upper, lower)).toBeCloseTo(0.5, 3);
  });

  it('contrast should not go below minimum (0.15)', () => {
    const result = adjustContrast(0.2, 45, upper, lower);
    expect(result).toBeGreaterThanOrEqual(CONTRAST_MIN);
  });

  it('contrast should not exceed maximum (0.9)', () => {
    const result = adjustContrast(0.88, 28, upper, lower);
    expect(result).toBeLessThanOrEqual(CONTRAST_MAX);
  });

  it('staircase is asymmetric: down step (0.1) > up step (0.05)', () => {
    expect(STEP_DOWN).toBeGreaterThan(STEP_UP);
  });

  it('five targets are independent', () => {
    const contrasts = [0.8, 0.6, 0.5, 0.4, 0.3];
    const counts = [45, 30, 38, 44, 29]; // above, below, between, above, below
    const updated = contrasts.map((c, i) => adjustContrast(c, counts[i], upper, lower));

    expect(updated[0]).toBeCloseTo(0.7, 3);   // -0.1
    expect(updated[1]).toBeCloseTo(0.65, 3);   // +0.05
    expect(updated[2]).toBeCloseTo(0.5, 3);    // no change
    expect(updated[3]).toBeCloseTo(0.3, 3);    // -0.1
    expect(updated[4]).toBeCloseTo(0.35, 3);   // +0.05
  });
});
