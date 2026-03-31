import { useRef, useState, useCallback } from 'react';
import { NetSessionEngine, TherapyCanvas, type CalibrationData, type NetSessionConfig } from '../../therapy-engine';
import type { SessionSummary } from '../../therapy-engine';

type SessionPhase = 'pre' | 'active' | 'complete';

export function NetSessionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NetSessionEngine | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('pre');
  const [progress, setProgress] = useState({ presented: 0, total: 100 });
  const [results, setResults] = useState<SessionSummary | null>(null);

  const calibration: CalibrationData = {
    degreePixels: 50, distanceCm: 30, pixelsPerCm: 37.8,
    screenWidth: 1920, screenHeight: 1080, devicePixelRatio: window.devicePixelRatio,
  };

  // TODO: load from API
  const sessionConfig: NetSessionConfig = {
    targets: [
      { targetNumber: 1, x: -12, y: -4, diameter: 1.0, contrast: 0.8 },
      { targetNumber: 2, x: -6, y: 4, diameter: 1.0, contrast: 0.7 },
      { targetNumber: 3, x: 0, y: -4, diameter: 1.0, contrast: 0.6 },
      { targetNumber: 4, x: 6, y: 4, diameter: 1.0, contrast: 0.5 },
      { targetNumber: 5, x: 12, y: -4, diameter: 1.0, contrast: 0.4 },
    ],
    upperLimit: 43,
    lowerLimit: 32,
    presentations: 100,
    practicePresentations: 10,
    practiceContrast: 0.9,
    practiceX: 0,
    practiceY: 5,
    practiceDiameter: 1.5,
  };

  const startSession = useCallback(() => {
    if (!containerRef.current) return;

    const canvas = new TherapyCanvas(containerRef.current, calibration);
    const engine = new NetSessionEngine(canvas, sessionConfig);
    engineRef.current = engine;

    containerRef.current.requestFullscreen?.();

    engine.start(
      (enginePhase) => {
        if (enginePhase === 'complete') {
          setResults(engine.getRecorder().getSummary());
          setPhase('complete');
          document.exitFullscreen?.();
        }
      },
      (presented, total) => setProgress({ presented, total }),
    );

    setPhase('active');
  }, []);

  if (phase === 'pre') {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h1 className="text-3xl font-bold text-text">NeuroEyeTherapy</h1>
        <p className="mt-2 text-lg text-text-secondary">Session - 5 targets active</p>

        <div className="mt-8 rounded-xl border-2 border-border bg-surface p-8">
          <h2 className="text-xl font-bold text-text">Instructions</h2>
          <ul className="mt-4 space-y-3 text-lg text-text-secondary">
            <li>Focus on the central red point at all times</li>
            <li>Press <span className="font-bold text-text">SPACE</span> when you see a target appear</li>
            <li>Targets may be very faint -- respond even if unsure</li>
            <li>The session begins with a short practice phase</li>
          </ul>

          <div className="mt-6 rounded-lg bg-surface-secondary p-4 text-base text-text-secondary">
            <p>Practice: {sessionConfig.practicePresentations} presentations</p>
            <p>Main session: {sessionConfig.presentations} presentations</p>
            <p>Estimated duration: ~25 minutes</p>
          </div>

          <button
            onClick={startSession}
            className="mt-8 w-full rounded-lg bg-primary px-4 py-4 text-xl font-semibold text-text-on-primary hover:bg-primary-hover"
          >
            Begin Session
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'complete' && results) {
    const targetStates = engineRef.current?.getTargetStates() ?? [];
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h1 className="text-3xl font-bold text-text">Session Complete</h1>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border-2 border-border bg-surface p-6 text-center">
            <p className="text-base font-medium text-text-secondary">Stimuli Detected</p>
            <p className="mt-1 text-3xl font-bold text-text">
              {results.stimuliCorrect}/{results.stimuliPresented}
            </p>
          </div>
          <div className="rounded-xl border-2 border-border bg-surface p-6 text-center">
            <p className="text-base font-medium text-text-secondary">Duration</p>
            <p className="mt-1 text-3xl font-bold text-text">
              {Math.floor(results.durationMs / 60000)}m {Math.floor((results.durationMs % 60000) / 1000)}s
            </p>
          </div>
        </div>

        {/* Per-target contrast results */}
        <div className="mt-6 rounded-xl border-2 border-border bg-surface p-6">
          <h2 className="text-xl font-bold text-text">Contrast Levels (per target)</h2>
          <div className="mt-4 space-y-3">
            {targetStates.map((ts) => (
              <div key={ts.config.targetNumber} className="flex items-center gap-4">
                <span className="w-20 text-base font-medium text-text-secondary">
                  Target {ts.config.targetNumber}
                </span>
                <div className="flex-1">
                  <div className="h-4 w-full rounded-full bg-surface-secondary">
                    <div
                      className="h-4 rounded-full bg-primary"
                      style={{ width: `${ts.currentContrast * 100}%` }}
                    />
                  </div>
                </div>
                <span className="w-16 text-right text-base font-bold text-text">
                  {(ts.currentContrast * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <a
          href="/"
          className="mt-8 block w-full rounded-lg border-2 border-border px-4 py-3 text-center text-lg font-semibold text-text-secondary hover:bg-surface-secondary"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  // Active session
  return (
    <div className="relative h-screen w-screen bg-black">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute bottom-4 right-6 text-sm text-gray-500 opacity-50 hover:opacity-100">
        {progress.presented}/{progress.total}
      </div>
    </div>
  );
}
