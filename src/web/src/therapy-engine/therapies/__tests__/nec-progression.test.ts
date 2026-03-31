import { describe, it, expect } from 'vitest';

/**
 * NEC is a CANCELLATION task, not visual search.
 * 4 stages with specific target/distractor shapes:
 *   Stage 0/1: Target=Diamond, Distractors=Circle+Cross
 *   Stage 2: Target=Star, Distractors=Diamond+Cross
 *   Stage 3: Target=Circle, Distractors=Diamond+Cross
 * Patient clicks targets on screen. Crosses are always wrong.
 */

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

type ClickResult = 'correct' | 'incorrect';

function clickShape(stage: number, shape: string): ClickResult {
  if (shape === 'cross') return 'incorrect'; // Cross always wrong
  if ((stage === 0 || stage === 1) && shape === 'diamond') return 'correct';
  if (stage === 2 && shape === 'star') return 'correct';
  if (stage === 3 && shape === 'circle') return 'correct';
  return 'incorrect';
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
});

describe('NEC Cancellation Task Scoring', () => {
  it('stage 0/1: diamond clicks are correct', () => {
    expect(clickShape(0, 'diamond')).toBe('correct');
    expect(clickShape(1, 'diamond')).toBe('correct');
  });

  it('stage 2: star clicks are correct', () => {
    expect(clickShape(2, 'star')).toBe('correct');
  });

  it('stage 3: circle clicks are correct', () => {
    expect(clickShape(3, 'circle')).toBe('correct');
  });

  it('cross clicks are always incorrect in all stages', () => {
    for (let stage = 0; stage < 4; stage++) {
      expect(clickShape(stage, 'cross')).toBe('incorrect');
    }
  });

  it('clicking wrong target type is incorrect', () => {
    expect(clickShape(0, 'star')).toBe('incorrect');
    expect(clickShape(2, 'diamond')).toBe('incorrect');
    expect(clickShape(3, 'star')).toBe('incorrect');
  });
});
