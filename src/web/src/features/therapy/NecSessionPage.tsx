import { useRef, useState, useCallback } from 'react';
import { NecSessionEngine, TherapyCanvas, type CalibrationData, type MatrixItem } from '../../therapy-engine';

type SessionPhase = 'pre' | 'active' | 'complete';

export function NecSessionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NecSessionEngine | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('pre');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [results, setResults] = useState<ReturnType<NecSessionEngine['getResults']>>(null);

  const calibration: CalibrationData = {
    degreePixels: 50, distanceCm: 30, pixelsPerCm: 37.8,
    screenWidth: 1920, screenHeight: 1080, devicePixelRatio: window.devicePixelRatio,
  };

  const startSession = useCallback(() => {
    if (!containerRef.current) return;

    const canvas = new TherapyCanvas(containerRef.current, calibration);
    const engine = new NecSessionEngine(canvas);
    engineRef.current = engine;

    const level = 4; // TODO: load from API
    const stageIndex = level % 4;

    engine.start(level, stageIndex);
    engine.render();
    engine.startInput((_item: MatrixItem, result: 'correct' | 'incorrect') => {
      setFeedback(result);
      setTimeout(() => setFeedback(null), 300);

      const state = engine.getState();
      if (state?.isComplete) {
        engine.stopInput();
        setResults(engine.getResults());
        setPhase('complete');
      }
    });

    containerRef.current.requestFullscreen?.();
    setPhase('active');
  }, []);

  if (phase === 'pre') {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h1 className="text-3xl font-bold text-text">NeuroEyeCoach</h1>
        <p className="mt-2 text-lg text-text-secondary">Level 4 of 12</p>

        <div className="mt-8 rounded-xl border-2 border-border bg-surface p-8">
          <h2 className="text-xl font-bold text-text">Instructions</h2>
          <ul className="mt-4 space-y-3 text-lg text-text-secondary">
            <li>A field of shapes will appear on screen</li>
            <li><span className="font-bold text-text">Click all the target shapes</span> (diamonds for this stage)</li>
            <li>Avoid clicking distractors (circles and crosses)</li>
            <li>Find all targets as quickly as you can</li>
            <li>The session ends when all targets are found</li>
          </ul>

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
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h1 className="text-3xl font-bold text-text">Session Complete</h1>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border-2 border-border bg-surface p-6 text-center">
            <p className="text-base font-medium text-text-secondary">Targets Found</p>
            <p className="mt-1 text-3xl font-bold text-text">
              {results.correctClicks}/{results.totalTargets}
            </p>
            <p className="text-xl font-semibold text-primary">{(results.accuracy * 100).toFixed(0)}%</p>
          </div>
          <div className="rounded-xl border-2 border-border bg-surface p-6 text-center">
            <p className="text-base font-medium text-text-secondary">Time</p>
            <p className="mt-1 text-3xl font-bold text-text">{results.elapsedSeconds.toFixed(1)}s</p>
          </div>
          <div className="rounded-xl border-2 border-border bg-surface p-6 text-center">
            <p className="text-base font-medium text-text-secondary">Incorrect Clicks</p>
            <p className="mt-1 text-3xl font-bold text-text">{results.incorrectClicks}</p>
          </div>
          <div className="rounded-xl border-2 border-border bg-surface p-6 text-center">
            <p className="text-base font-medium text-text-secondary">Missed</p>
            <p className="mt-1 text-3xl font-bold text-text">{results.missedTargets}</p>
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
    <div className="relative h-screen w-screen bg-slate-900">
      <div ref={containerRef} className="h-full w-full" />
      {feedback && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 rounded-lg px-6 py-2 text-lg font-bold ${
          feedback === 'correct' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {feedback === 'correct' ? 'Found!' : 'Wrong shape'}
        </div>
      )}
    </div>
  );
}
