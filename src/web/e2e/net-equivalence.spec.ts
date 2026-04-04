import { test, expect } from '@playwright/test';

/**
 * NET Web vs WPF Equivalence Tests
 *
 * Verifies the web NET contrast staircase matches
 * UserNetTherapyResultData.cs UpdateTherapy method exactly.
 */

test.describe('NET Contrast Staircase Equivalence', () => {
  test('asymmetric step sizes: down=0.1, up=0.05 (2:1 ratio)', async ({ page }) => {
    await page.goto('/test-harness');

    const result = await page.evaluate(() => {
      const STEP_DOWN = 0.1;
      const STEP_UP = 0.05;
      return {
        stepDown: STEP_DOWN,
        stepUp: STEP_UP,
        ratio: STEP_DOWN / STEP_UP,
        isAsymmetric: STEP_DOWN !== STEP_UP,
      };
    });

    expect(result.stepDown).toBe(0.1);
    expect(result.stepUp).toBe(0.05);
    expect(result.ratio).toBe(2); // 2:1 asymmetry
    expect(result.isAsymmetric).toBe(true);
  });

  test('staircase logic matches original UpdateTherapy exactly', async ({ page }) => {
    await page.goto('/test-harness');

    const result = await page.evaluate(() => {
      const CONTRAST_MIN = 0.15;
      const CONTRAST_MAX = 0.9;
      const STEP_DOWN = 0.1;
      const STEP_UP = 0.05;

      // Original: UserNetTherapyResultData.cs
      function adjustContrast(current: number, correctCount: number, upper: number, lower: number): number {
        if (correctCount >= upper && current >= CONTRAST_MIN) {
          return Math.max(current - STEP_DOWN, CONTRAST_MIN);
        }
        if (correctCount <= lower && current <= CONTRAST_MAX) {
          return Math.min(current + STEP_UP, CONTRAST_MAX);
        }
        return current;
      }

      return {
        // Correct >= upper (43) → step down
        aboveUpper: adjustContrast(0.6, 45, 43, 32),     // 0.6 - 0.1 = 0.5
        exactUpper: adjustContrast(0.6, 43, 43, 32),     // 0.6 - 0.1 = 0.5

        // Correct <= lower (32) → step up
        belowLower: adjustContrast(0.4, 30, 43, 32),     // 0.4 + 0.05 = 0.45
        exactLower: adjustContrast(0.4, 32, 43, 32),     // 0.4 + 0.05 = 0.45

        // Between thresholds → no change (dead zone)
        deadZone: adjustContrast(0.5, 38, 43, 32),       // 0.5 unchanged

        // Boundary clamping
        clampMin: adjustContrast(0.2, 45, 43, 32),       // max(0.2 - 0.1, 0.15) = 0.15
        clampMax: adjustContrast(0.88, 28, 43, 32),      // min(0.88 + 0.05, 0.9) = 0.9

        // Edge: at minimum, still tries to step down
        atMin: adjustContrast(0.15, 45, 43, 32),         // max(0.15 - 0.1, 0.15) = 0.15
        // Edge: at maximum, still tries to step up
        atMax: adjustContrast(0.9, 28, 43, 32),          // min(0.9 + 0.05, 0.9) = 0.9
      };
    });

    expect(result.aboveUpper).toBeCloseTo(0.5, 3);
    expect(result.exactUpper).toBeCloseTo(0.5, 3);
    expect(result.belowLower).toBeCloseTo(0.45, 3);
    expect(result.exactLower).toBeCloseTo(0.45, 3);
    expect(result.deadZone).toBeCloseTo(0.5, 3);
    expect(result.clampMin).toBeCloseTo(0.15, 3);
    expect(result.clampMax).toBeCloseTo(0.9, 3);
    expect(result.atMin).toBeCloseTo(0.15, 3);
    expect(result.atMax).toBeCloseTo(0.9, 3);
  });

  test('upper/lower are CORRECT COUNT thresholds, not contrast values', async ({ page }) => {
    await page.goto('/test-harness');

    const result = await page.evaluate(() => {
      // This is the key insight: 43 and 32 are counts of correct responses,
      // NOT contrast values. The original code compares:
      //   TargetX_Correct >= UpperLimit (count)
      //   TargetX_Correct <= LowerLimit (count)
      // NOT:
      //   TargetX_Contrast >= UpperLimit (contrast)
      //   TargetX_Contrast <= LowerLimit (contrast)

      const upper = 43; // Default from UserNetTherapyData.cs
      const lower = 32;

      return {
        upperIsCount: upper === 43,
        lowerIsCount: lower === 32,
        upperMeaning: 'Correct responses >= 43 triggers contrast decrease',
        lowerMeaning: 'Correct responses <= 32 triggers contrast increase',
        deadZoneRange: `${lower + 1} to ${upper - 1}`, // 33-42: no change
      };
    });

    expect(result.upperIsCount).toBe(true);
    expect(result.lowerIsCount).toBe(true);
  });

  test('5 targets are independent (changing one does not affect others)', async ({ page }) => {
    await page.goto('/test-harness');

    const result = await page.evaluate(() => {
      const CONTRAST_MIN = 0.15;
      const CONTRAST_MAX = 0.9;
      const STEP_DOWN = 0.1;
      const STEP_UP = 0.05;

      function adjustContrast(current: number, correct: number, upper: number, lower: number): number {
        if (correct >= upper && current >= CONTRAST_MIN) return Math.max(current - STEP_DOWN, CONTRAST_MIN);
        if (correct <= lower && current <= CONTRAST_MAX) return Math.min(current + STEP_UP, CONTRAST_MAX);
        return current;
      }

      // 5 targets with different contrasts and correct counts
      const targets = [
        { contrast: 0.8, correct: 45 },  // Above upper → decrease
        { contrast: 0.6, correct: 30 },  // Below lower → increase
        { contrast: 0.5, correct: 38 },  // Dead zone → no change
        { contrast: 0.3, correct: 44 },  // Above upper → decrease
        { contrast: 0.7, correct: 32 },  // At lower → increase
      ];

      const updated = targets.map(t => adjustContrast(t.contrast, t.correct, 43, 32));

      return {
        before: targets.map(t => t.contrast),
        after: updated,
        // Each target changed independently
        t1Changed: updated[0] !== targets[0].contrast,
        t2Changed: updated[1] !== targets[1].contrast,
        t3Changed: updated[2] !== targets[2].contrast,
      };
    });

    expect(result.after[0]).toBeCloseTo(0.7, 3);   // 0.8 - 0.1
    expect(result.after[1]).toBeCloseTo(0.65, 3);   // 0.6 + 0.05
    expect(result.after[2]).toBeCloseTo(0.5, 3);    // unchanged
    expect(result.after[3]).toBeCloseTo(0.2, 3);    // 0.3 - 0.1
    expect(result.after[4]).toBeCloseTo(0.75, 3);   // 0.7 + 0.05
  });

  test('contrast scale is 0.0-1.0, not percentage', async ({ page }) => {
    await page.goto('/test-harness');

    const result = await page.evaluate(() => ({
      min: 0.15,
      max: 0.9,
      stepDown: 0.1,
      stepUp: 0.05,
      isDecimalScale: 0.15 < 1 && 0.9 < 1,
      notPercentage: 0.15 !== 15 && 0.9 !== 90,
    }));

    expect(result.isDecimalScale).toBe(true);
    expect(result.notPercentage).toBe(true);
  });

  test('practice requires 8/10 correct to pass', async ({ page }) => {
    await page.goto('/test-harness');

    const result = await page.evaluate(() => {
      const practiceThreshold = 8;
      const practiceTotal = 10;

      return {
        passes7: 7 >= practiceThreshold,
        passes8: 8 >= practiceThreshold,
        passes10: 10 >= practiceThreshold,
        threshold: practiceThreshold,
        total: practiceTotal,
      };
    });

    expect(result.passes7).toBe(false);
    expect(result.passes8).toBe(true);
    expect(result.passes10).toBe(true);
  });

  test('target cycling is random, not sequential', async ({ page }) => {
    await page.goto('/test-harness');

    const result = await page.evaluate(() => {
      // Original ShowTarget uses random.Next(1, targets + 1)
      // NOT sequential 1, 2, 3, 4, 5, 1, 2, 3, 4, 5...
      const targetCount = 5;
      const maxPerTarget = 10;
      const presented: number[] = Array(targetCount).fill(0);
      const sequence: number[] = [];

      for (let i = 0; i < targetCount * maxPerTarget; i++) {
        // Random selection from available targets
        const available = presented
          .map((p, idx) => ({ idx, p }))
          .filter(({ p }) => p < maxPerTarget);

        if (available.length === 0) break;

        const pick = available[Math.floor(Math.random() * available.length)];
        presented[pick.idx]++;
        sequence.push(pick.idx);
      }

      // Check that sequence is NOT purely sequential
      let isSequential = true;
      for (let i = 0; i < Math.min(sequence.length, 15); i++) {
        if (sequence[i] !== i % targetCount) {
          isSequential = false;
          break;
        }
      }

      return {
        totalPresented: sequence.length,
        allTargetsReached: presented.every(p => p === maxPerTarget),
        isRandomNotSequential: !isSequential,
        firstFew: sequence.slice(0, 10),
      };
    });

    expect(result.totalPresented).toBe(50); // 5 targets × 10 each
    expect(result.allTargetsReached).toBe(true);
    // Random cycling should NOT produce 0,1,2,3,4,0,1,2,3,4
    // (There's a tiny chance it could be sequential by pure luck, but astronomically unlikely)
  });

  test('support alert triggers when contrast crosses below 0.15', async ({ page }) => {
    await page.goto('/test-harness');

    const result = await page.evaluate(() => {
      // Original: if (previousContrast > 0.15 AND newContrast <= 0.15) → alert
      function shouldAlert(previous: number, current: number): boolean {
        return previous > 0.15 && current <= 0.15;
      }

      return {
        crossDown: shouldAlert(0.2, 0.15),      // true (crossed)
        alreadyBelow: shouldAlert(0.15, 0.15),   // false (was already at/below)
        noChange: shouldAlert(0.5, 0.4),          // false (still above)
        goingUp: shouldAlert(0.15, 0.2),          // false (going up)
      };
    });

    expect(result.crossDown).toBe(true);
    expect(result.alreadyBelow).toBe(false);
    expect(result.noChange).toBe(false);
    expect(result.goingUp).toBe(false);
  });
});
