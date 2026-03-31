import { describe, it, expect } from 'vitest';

const MAX_LEVEL = 12;
const MIN_SESSIONS_PER_LEVEL = 3;
const ADVANCE_THRESHOLD = 0.8;
const REGRESS_THRESHOLD = 0.5;

function calculateProgression(
  currentLevel: number,
  sessionsAtLevel: number,
  accuracy: number,
): number {
  if (sessionsAtLevel < MIN_SESSIONS_PER_LEVEL) return currentLevel;
  if (accuracy >= ADVANCE_THRESHOLD) return Math.min(currentLevel + 1, MAX_LEVEL);
  if (accuracy < REGRESS_THRESHOLD) return Math.max(currentLevel - 1, 1);
  return currentLevel;
}

describe('NEC Level Progression', () => {
  it('high accuracy should advance level', () => {
    expect(calculateProgression(4, 3, 0.87)).toBe(5);
  });

  it('low accuracy should regress level', () => {
    expect(calculateProgression(6, 3, 0.40)).toBe(5);
  });

  it('medium accuracy should hold level', () => {
    expect(calculateProgression(4, 3, 0.65)).toBe(4);
  });

  it('insufficient sessions should hold level', () => {
    expect(calculateProgression(4, 2, 0.95)).toBe(4);
  });

  it('level 1 should not regress', () => {
    expect(calculateProgression(1, 3, 0.30)).toBe(1);
  });

  it('level 12 should not advance', () => {
    expect(calculateProgression(12, 3, 0.95)).toBe(12);
  });

  it('full progression should reach level 12', () => {
    let level = 1;
    for (let i = 0; i < MAX_LEVEL * MIN_SESSIONS_PER_LEVEL; i++) {
      level = calculateProgression(level, MIN_SESSIONS_PER_LEVEL, 0.9);
    }
    expect(level).toBe(MAX_LEVEL);
  });
});
