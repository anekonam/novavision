import { useRef, useState, useEffect, useCallback } from 'react';
import { NetSessionEngine, TherapyCanvas, type CalibrationData, type NetSessionConfig } from '../../therapy-engine';
import type { SessionSummary } from '../../therapy-engine';

type SessionPhase = 'pre' | 'active' | 'complete';

export function NetSessionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NetSessionEngine | null>(null);
  const canvasRef = useRef<TherapyCanvas | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('pre');
  const [progress, setProgress] = useState({ presented: 0, total: 50 });
  const [results, setResults] = useState<SessionSummary | null>(null);

  const calibration: CalibrationData = {
    degreePixels: 50, distanceCm: 30, pixelsPerCm: 37.8,
    screenWidth: 1920, screenHeight: 1080, devicePixelRatio: window.devicePixelRatio,
  };

  const sessionConfig: NetSessionConfig = {
    targets: [
      { targetNumber: 1, x: -10, y: -3, diameter: 1.5, contrast: 0.8 },
      { targetNumber: 2, x: -5, y: 3, diameter: 1.5, contrast: 0.7 },
      { targetNumber: 3, x: 0, y: -3, diameter: 1.5, contrast: 0.6 },
      { targetNumber: 4, x: 5, y: 3, diameter: 1.5, contrast: 0.5 },
      { targetNumber: 5, x: 10, y: -3, diameter: 1.5, contrast: 0.4 },
    ],
    upperLimit: 8, // Smaller for demo (original uses 43 over many more presentations)
    lowerLimit: 4,
    presentations: 50, // Reduced for demo
    practicePresentations: 5,
    practiceContrast: 0.9,
    practiceX: 0,
    practiceY: 5,
    practiceDiameter: 2.0,
  };

  const startSession = useCallback(() => {
    setPhase('active');
  }, []);

  // Start engine AFTER canvas container is mounted
  useEffect(() => {
    if (phase !== 'active' || !containerRef.current || engineRef.current) return;

    containerRef.current.innerHTML = '';

    const canvas = new TherapyCanvas(containerRef.current, calibration);
    canvasRef.current = canvas;

    const engine = new NetSessionEngine(canvas, sessionConfig);
    engineRef.current = engine;

    containerRef.current.requestFullscreen?.().catch(() => {});

    engine.start(
      (enginePhase) => {
        if (enginePhase === 'complete') {
          setResults(engine.getRecorder().getSummary());
          setPhase('complete');
          document.exitFullscreen?.().catch(() => {});
        }
      },
      (presented, total) => setProgress({ presented, total }),
    );

    return () => {
      engine.stop();
      canvas.destroy();
      engineRef.current = null;
      canvasRef.current = null;
    };
  }, [phase]);

  if (phase === 'pre') {
    return (
      <div className="mx-auto max-w-2xl py-8 px-4">
        <h1 className="text-3xl font-bold text-text">NeuroEyeTherapy</h1>
        <p className="mt-2 text-lg text-text-secondary">Session - 5 targets active</p>

        <div className="mt-8 rounded-xl border-2 border-border bg-surface p-8">
          <h2 className="text-xl font-bold text-text">Instructions</h2>
          <ul className="mt-4 space-y-3 text-lg text-text-secondary">
            <li>Focus on the <span className="font-bold text-danger">central red point</span> at all times</li>
            <li>Press <kbd className="rounded bg-surface-secondary px-2 py-1 font-bold text-text">SPACE</kbd> when you see a circle appear anywhere on screen</li>
            <li>Circles may be very faint -- respond even if you're unsure</li>
            <li>The session begins with a short practice phase ({sessionConfig.practicePresentations} trials)</li>
          </ul>

          <div className="mt-6 rounded-lg bg-surface-secondary p-4 text-base text-text-secondary">
            <p>Practice: {sessionConfig.practicePresentations} presentations</p>
            <p>Main session: {sessionConfig.presentations} presentations</p>
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
      <div className="mx-auto max-w-2xl py-8 px-4">
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

        {targetStates.length > 0 && (
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
        )}

        <a
          href="/"
          className="mt-8 block w-full rounded-lg bg-primary px-4 py-3 text-center text-lg font-semibold text-text-on-primary hover:bg-primary-hover"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  // Active session -- canvas always in DOM
  return (
    <div className="relative h-screen w-screen bg-black">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-6 py-2 text-lg text-gray-400">
        {progress.presented}/{progress.total}
      </div>
    </div>
  );
}
