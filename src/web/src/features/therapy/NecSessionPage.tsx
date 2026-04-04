import { useRef, useState, useEffect, useCallback } from 'react';
import { NecSessionEngine, TherapyCanvas, type CalibrationData, type MatrixItem } from '../../therapy-engine';

type SessionPhase = 'pre' | 'active' | 'complete';

export function NecSessionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NecSessionEngine | null>(null);
  const canvasRef = useRef<TherapyCanvas | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('pre');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [results, setResults] = useState<ReturnType<NecSessionEngine['getResults']>>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  const calibration: CalibrationData = {
    degreePixels: 50, distanceCm: 30, pixelsPerCm: 37.8,
    screenWidth: 1920, screenHeight: 1080, devicePixelRatio: window.devicePixelRatio,
  };

  const startSession = useCallback(() => {
    setPhase('active'); // This triggers useEffect to mount the engine
  }, []);

  // Start engine AFTER the canvas container is mounted
  useEffect(() => {
    if (phase !== 'active' || !containerRef.current || engineRef.current) return;

    containerRef.current.innerHTML = '';

    const canvas = new TherapyCanvas(containerRef.current, calibration);
    canvasRef.current = canvas;

    const engine = new NecSessionEngine(canvas);
    engineRef.current = engine;

    const level = 4; // TODO: load from API
    const stageIndex = level % 4;

    engine.start(level, stageIndex);
    engine.render();

    const state = engine.getState();
    if (state) setStats({ correct: 0, total: state.totalTargets });

    engine.startInput((_item: MatrixItem, result: 'correct' | 'incorrect') => {
      setFeedback(result);
      setTimeout(() => setFeedback(null), 400);

      const currentState = engine.getState();
      if (currentState) {
        setStats({ correct: currentState.correctClicks, total: currentState.totalTargets });
      }

      if (currentState?.isComplete) {
        engine.stopInput();
        setResults(engine.getResults());
        setPhase('complete');
      }
    });

    containerRef.current.requestFullscreen?.().catch(() => {});

    return () => {
      engine.stopInput();
      canvas.destroy();
      engineRef.current = null;
      canvasRef.current = null;
    };
  }, [phase]);

  if (phase === 'pre') {
    return (
      <div className="mx-auto max-w-2xl py-8 px-4">
        <h1 className="text-3xl font-bold text-text">NeuroEyeCoach</h1>
        <p className="mt-2 text-lg text-text-secondary">Level 4 of 12</p>

        <div className="mt-8 rounded-xl border-2 border-border bg-surface p-8">
          <h2 className="text-xl font-bold text-text">Instructions</h2>
          <ul className="mt-4 space-y-3 text-lg text-text-secondary">
            <li>A field of shapes will appear on screen</li>
            <li><span className="font-bold text-text">Click all the diamond shapes</span> (the rotated squares)</li>
            <li>Avoid clicking the other shapes (circles and triangles)</li>
            <li>Find all targets as quickly as you can</li>
            <li>The session ends when all targets are found</li>
          </ul>

          <div className="mt-6 flex items-center justify-center gap-8 rounded-lg bg-surface-secondary p-6">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 rotate-45 bg-white" />
              <p className="mt-2 text-sm font-bold text-secondary">Target (click these)</p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-8 w-8 rounded-full bg-gray-400" />
              <p className="mt-2 text-sm font-bold text-danger">Distractor (avoid)</p>
            </div>
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
    return (
      <div className="mx-auto max-w-2xl py-8 px-4">
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
          className="mt-8 block w-full rounded-lg bg-primary px-4 py-3 text-center text-lg font-semibold text-text-on-primary hover:bg-primary-hover"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  // Active session -- canvas always in DOM
  return (
    <div className="relative h-screen w-screen bg-slate-900">
      <div ref={containerRef} className="h-full w-full" />

      {/* Feedback toast */}
      {feedback && (
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 rounded-lg px-8 py-3 text-xl font-bold shadow-lg ${
          feedback === 'correct' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {feedback === 'correct' ? 'Found!' : 'Wrong shape'}
        </div>
      )}

      {/* Progress HUD */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/50 px-6 py-2 text-lg text-white">
        Found: {stats.correct} / {stats.total}
      </div>
    </div>
  );
}
