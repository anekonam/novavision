import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

interface CalibrationResult {
  degreePixels: number;
  distanceCm: number;
  pixelsPerCm: number;
}

export function CalibrationWizard({ onComplete }: { onComplete: (result: CalibrationResult) => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [rectangleWidth, setRectangleWidth] = useState(323); // ~85.6mm at 96 DPI
  const [distanceCm, setDistanceCm] = useState(30);
  const [saving, setSaving] = useState(false);

  const CARD_WIDTH_MM = 85.6;

  const pixelsPerCm = (rectangleWidth / CARD_WIDTH_MM) * 10;
  const degreePixels = distanceCm * Math.tan(Math.PI / 180) * pixelsPerCm;

  // Verification: show a circle that should appear ~1cm diameter
  const verificationSizePx = pixelsPerCm;

  const saveCalibration = async () => {
    setSaving(true);
    try {
      await api.post('/calibration', {
        degreePixels,
        distanceCm,
        pixelsPerCm,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
      });
      onComplete({ degreePixels, distanceCm, pixelsPerCm });
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Step indicator */}
      <div className="mb-8 flex justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-3 w-12 rounded-full ${s <= step ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>

      {/* Step 1: Credit card reference */}
      {step === 1 && (
        <div className="rounded-xl border-2 border-border bg-surface p-8">
          <h2 className="text-2xl font-bold text-text">Step 1: Screen Size Reference</h2>
          <p className="mt-2 text-lg text-text-secondary">
            Hold a standard credit card flat against your screen. Adjust the slider until the
            rectangle below matches the width of your card exactly.
          </p>

          <div className="my-8 flex justify-center">
            <div
              style={{ width: rectangleWidth, height: rectangleWidth * 0.63 }}
              className="rounded-lg border-4 border-dashed border-primary bg-primary-light"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setRectangleWidth(Math.max(200, rectangleWidth - 5))}
              className="rounded-lg border-2 border-border px-4 py-3 text-2xl font-bold"
              aria-label="Decrease size"
            >
              &minus;
            </button>
            <input
              type="range"
              min={200}
              max={500}
              value={rectangleWidth}
              onChange={(e) => setRectangleWidth(Number(e.target.value))}
              className="h-3 flex-1 cursor-pointer"
              aria-label="Adjust rectangle width"
            />
            <button
              onClick={() => setRectangleWidth(Math.min(500, rectangleWidth + 5))}
              className="rounded-lg border-2 border-border px-4 py-3 text-2xl font-bold"
              aria-label="Increase size"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setStep(2)}
            className="mt-8 w-full rounded-lg bg-primary px-4 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover"
          >
            My card matches
          </button>
        </div>
      )}

      {/* Step 2: Distance confirmation */}
      {step === 2 && (
        <div className="rounded-xl border-2 border-border bg-surface p-8">
          <h2 className="text-2xl font-bold text-text">Step 2: Viewing Distance</h2>
          <p className="mt-2 text-lg text-text-secondary">
            Position yourself at the correct distance from the screen using your chin rest.
            The standard distance is 30cm for VRT therapy.
          </p>

          <div className="mt-6">
            <label htmlFor="distance" className="block text-base font-semibold text-text">
              Distance (cm)
            </label>
            <input
              id="distance"
              type="number"
              min={20}
              max={60}
              value={distanceCm}
              onChange={(e) => setDistanceCm(Number(e.target.value))}
              className="mt-1 block w-32 rounded-lg border-2 border-border px-4 py-3 text-center text-xl font-bold text-text focus:border-primary"
            />
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border-2 border-border px-4 py-3 text-lg font-semibold text-text-secondary"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover"
            >
              I'm in position
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Verification */}
      {step === 3 && (
        <div className="rounded-xl border-2 border-border bg-surface p-8">
          <h2 className="text-2xl font-bold text-text">Step 3: Verification</h2>
          <p className="mt-2 text-lg text-text-secondary">
            Does the circle below appear approximately 1cm in diameter?
          </p>

          <div className="my-8 flex justify-center">
            <div
              style={{
                width: verificationSizePx,
                height: verificationSizePx,
                borderRadius: '50%',
              }}
              className="bg-primary"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border-2 border-danger px-4 py-3 text-lg font-semibold text-danger"
            >
              No, recalibrate
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover"
            >
              Yes, looks correct
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <div className="rounded-xl border-2 border-border bg-surface p-8 text-center">
          <div className="text-5xl">&#10003;</div>
          <h2 className="mt-4 text-2xl font-bold text-text">Calibration Complete</h2>
          <p className="mt-2 text-lg text-text-secondary">
            Your screen is calibrated. You're ready to begin therapy.
          </p>
          <div className="mt-4 rounded-lg bg-surface-secondary p-4 text-base text-text-secondary">
            <p>DegreePixels: {degreePixels.toFixed(1)}</p>
            <p>Distance: {distanceCm}cm</p>
            <p>Resolution: {pixelsPerCm.toFixed(1)} px/cm</p>
          </div>

          <button
            onClick={saveCalibration}
            disabled={saving}
            className="mt-8 w-full rounded-lg bg-primary px-4 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? 'Saving...' : t('actions.startSession')}
          </button>
        </div>
      )}
    </div>
  );
}
