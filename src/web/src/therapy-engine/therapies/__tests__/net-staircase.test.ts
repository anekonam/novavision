import { describe, it, expect } from 'vitest';

function adjustContrast(
  current: number,
  correct: boolean,
  stepSize: number,
  lowerLimit: number,
  upperLimit: number,
): number {
  const adjusted = correct ? current - stepSize : current + stepSize;
  return Math.max(lowerLimit, Math.min(upperLimit, adjusted));
}

describe('NET Staircase Adaptation', () => {
  it('correct response should decrease contrast', () => {
    expect(adjustContrast(80, true, 2, 32, 100)).toBe(78);
  });

  it('missed response should increase contrast', () => {
    expect(adjustContrast(50, false, 2, 32, 100)).toBe(52);
  });

  it('should not exceed upper limit', () => {
    expect(adjustContrast(99, false, 2, 32, 100)).toBe(100);
  });

  it('should not go below lower limit', () => {
    expect(adjustContrast(33, true, 2, 32, 100)).toBe(32);
  });

  it('targets should be independent', () => {
    const targets = [80, 60, 70, 55, 45];
    const responses = [true, false, true, false, true];
    const updated = targets.map((t, i) => adjustContrast(t, responses[i], 2, 32, 100));

    expect(updated).toEqual([78, 62, 68, 57, 43]);
  });

  it('should converge near threshold over many trials', () => {
    let contrast = 100;
    const threshold = 60;
    let stepSize = 4;
    let reversals = 0;
    let lastDirection = 0;

    for (let trial = 0; trial < 50; trial++) {
      const detected = contrast > threshold;
      const direction = detected ? -1 : 1;
      if (lastDirection !== 0 && direction !== lastDirection) reversals++;
      lastDirection = direction;
      contrast = adjustContrast(contrast, detected, stepSize, 32, 100);
      if (reversals >= 4) stepSize = 2;
      if (reversals >= 8) stepSize = 1;
    }

    expect(contrast).toBeGreaterThan(threshold - 5);
    expect(contrast).toBeLessThan(threshold + 5);
  });
});
