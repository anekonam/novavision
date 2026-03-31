import { describe, it, expect } from 'vitest';

function calculateDegreePixels(distanceCm: number, pixelsPerCm: number): number {
  return distanceCm * Math.tan(Math.PI / 180) * pixelsPerCm;
}

function calculateStimulusSizePixels(
  diameterDegrees: number,
  degreePixels: number,
  devicePixelRatio: number,
): number {
  return diameterDegrees * degreePixels * devicePixelRatio;
}

interface DisplayFingerprint {
  width: number;
  height: number;
  devicePixelRatio: number;
}

function fingerprintMatches(a: DisplayFingerprint, b: DisplayFingerprint): boolean {
  return (
    a.width === b.width &&
    a.height === b.height &&
    Math.abs(a.devicePixelRatio - b.devicePixelRatio) < 0.01
  );
}

describe('DegreePixels Calculation', () => {
  it.each([
    [30, 37.8, 19.8],  // 96 DPI, 30cm
    [30, 56.7, 29.7],  // 144 DPI, 30cm
    [30, 75.6, 39.5],  // 192 DPI, 30cm
    [40, 37.8, 26.4],  // 96 DPI, 40cm
  ])(
    'at %fcm with %f px/cm should be approximately %f',
    (distance, pxPerCm, expected) => {
      const result = calculateDegreePixels(distance, pxPerCm);
      expect(result).toBeCloseTo(expected, 0);
    },
  );
});

describe('Stimulus Size', () => {
  it('0.15 degrees at 50 px/deg on 2x display = 15 physical pixels', () => {
    const size = calculateStimulusSizePixels(0.15, 50, 2.0);
    expect(size).toBeCloseTo(15.0, 2);
  });

  it('0.15 degrees at 50 px/deg on 1x display = 7.5 physical pixels', () => {
    const size = calculateStimulusSizePixels(0.15, 50, 1.0);
    expect(size).toBeCloseTo(7.5, 2);
  });
});

describe('Display Fingerprint', () => {
  it('should match identical fingerprints', () => {
    const a: DisplayFingerprint = { width: 1920, height: 1080, devicePixelRatio: 1.0 };
    const b: DisplayFingerprint = { width: 1920, height: 1080, devicePixelRatio: 1.0 };
    expect(fingerprintMatches(a, b)).toBe(true);
  });

  it('should not match different resolution', () => {
    const a: DisplayFingerprint = { width: 1920, height: 1080, devicePixelRatio: 1.0 };
    const b: DisplayFingerprint = { width: 2560, height: 1440, devicePixelRatio: 1.0 };
    expect(fingerprintMatches(a, b)).toBe(false);
  });

  it('should not match different DPR', () => {
    const a: DisplayFingerprint = { width: 1920, height: 1080, devicePixelRatio: 1.0 };
    const b: DisplayFingerprint = { width: 1920, height: 1080, devicePixelRatio: 2.0 };
    expect(fingerprintMatches(a, b)).toBe(false);
  });
});
