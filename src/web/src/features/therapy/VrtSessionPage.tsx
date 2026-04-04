import { useRef, useState, useCallback, useEffect } from 'react';
import { VrtSessionEngine, type VrtBlockConfig, DEFAULT_VRT_BLOCK, TherapyCanvas, type CalibrationData } from '../../therapy-engine';
import type { SessionSummary } from '../../therapy-engine';

type SessionPhase = 'pre' | 'countdown' | 'active' | 'paused' | 'complete';

export function VrtSessionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VrtSessionEngine | null>(null);
  const canvasRef = useRef<TherapyCanvas | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('pre');
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState({ presented: 0, total: 284 });
  const [results, setResults] = useState<SessionSummary | null>(null);

  const calibration: CalibrationData = {
    degreePixels: 50, distanceCm: 30, pixelsPerCm: 37.8,
    screenWidth: 1920, screenHeight: 1080, devicePixelRatio: window.devicePixelRatio,
  };

  const blockConfig: VrtBlockConfig = { ...DEFAULT_VRT_BLOCK, sessionStimuli: 50 }; // Reduced for demo

  const startCountdown = useCallback(() => {
    setPhase('countdown');
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setPhase('active'); // This triggers useEffect to start the engine
      }
    }, 1000);
  }, []);

  // Start engine AFTER the canvas container is mounted in the DOM
  useEffect(() => {
    if (phase !== 'active' || !containerRef.current || engineRef.current) return;

    // Clean any previous canvas
    containerRef.current.innerHTML = '';

    const canvas = new TherapyCanvas(containerRef.current, calibration);
    canvasRef.current = canvas;

    const engine = new VrtSessionEngine(canvas, blockConfig);
    engineRef.current = engine;

    // Try fullscreen (may be blocked by browser without user gesture)
    containerRef.current.requestFullscreen?.().catch(() => {});

    engine.start(
      (enginePhase) => {
        if (enginePhase === 'complete') {
          setResults(engine.getRecorder().getSummary());
          setPhase('complete');
          document.exitFullscreen?.().catch(() => {});
          engine.stop();
        } else if (enginePhase === 'paused') {
          setPhase('paused');
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

  const handleResume = () => {
    engineRef.current?.resume();
    setPhase('active');
  };

  const handleEnd = () => {
    const summary = engineRef.current?.getRecorder().getSummary() ?? null;
    engineRef.current?.stop();
    canvasRef.current?.destroy();
    engineRef.current = null;
    canvasRef.current = null;
    setResults(summary);
    setPhase('complete');
    document.exitFullscreen?.().catch(() => {});
  };

  // Pre-session instructions
  if (phase === 'pre') {
    return (
      <div className="mx-auto max-w-2xl py-8 px-4">
        <h1 className="text-3xl font-bold text-text">Vision Restoration Therapy</h1>
        <p className="mt-2 text-lg text-text-secondary">Block 1 - Status (Diagnostic)</p>

        <div className="mt-8 rounded-xl border-2 border-border bg-surface p-8">
          <h2 className="text-xl font-bold text-text">Session Instructions</h2>
          <ul className="mt-4 space-y-3 text-lg text-text-secondary">
            <li>Focus on the <span className="font-bold text-danger">central red point</span> at all times</li>
            <li>Press <kbd className="rounded bg-surface-secondary px-2 py-1 font-bold text-text">SPACE</kbd> when you see a white light appear</li>
            <li>Press <kbd className="rounded bg-surface-secondary px-2 py-1 font-bold text-text">SPACE</kbd> when the central point changes shape or colour</li>
            <li>Try not to move your eyes from the centre</li>
            <li>Press <kbd className="rounded bg-surface-secondary px-2 py-1 font-bold text-text">ESC</kbd> to pause at any time</li>
          </ul>

          <div className="mt-6 rounded-lg bg-surface-secondary p-4 text-base text-text-secondary">
            <p>Stimuli: {blockConfig.sessionStimuli} presentations</p>
            <p>Estimated duration: ~{Math.max(1, Math.round(blockConfig.sessionStimuli * 1.5 / 60))} minutes</p>
          </div>

          <button
            onClick={startCountdown}
            className="mt-8 w-full rounded-lg bg-primary px-4 py-4 text-xl font-semibold text-text-on-primary hover:bg-primary-hover"
          >
            I understand. Begin session
          </button>
        </div>
      </div>
    );
  }

  // Countdown
  if (phase === 'countdown') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-9xl font-bold text-white">{countdown}</p>
          <p className="mt-4 text-xl text-gray-400">Focus on the centre of the screen...</p>
        </div>
      </div>
    );
  }

  // Paused overlay
  if (phase === 'paused') {
    const stats = engineRef.current?.getRecorder().getRunningStats();
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-full max-w-md rounded-xl border-2 border-border bg-surface p-8 text-center">
          <h2 className="text-2xl font-bold text-text">Session Paused</h2>
          {stats && (
            <div className="mt-4 space-y-2 text-lg text-text-secondary">
              <p>Stimuli: {stats.correct}/{stats.presented}</p>
              <p>Fixation accuracy: {(stats.fixationAccuracy * 100).toFixed(0)}%</p>
              <p>False positives: {stats.falsePositives}</p>
            </div>
          )}
          <div className="mt-8 space-y-3">
            <button
              onClick={handleResume}
              className="w-full rounded-lg bg-primary px-4 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover"
            >
              Resume
            </button>
            <button
              onClick={handleEnd}
              className="w-full text-lg font-medium text-danger hover:underline"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Session complete
  if (phase === 'complete' && results) {
    const accuracy = results.stimuliPresented > 0
      ? ((results.stimuliCorrect / results.stimuliPresented) * 100).toFixed(1)
      : '0';
    const fixAccuracy = results.fixationChanges > 0
      ? ((results.fixationCorrect / results.fixationChanges) * 100).toFixed(1)
      : '100';

    return (
      <div className="mx-auto max-w-2xl py-8 px-4">
        <h1 className="text-3xl font-bold text-text">Session Complete</h1>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border-2 border-border bg-surface p-6 text-center">
            <p className="text-base font-medium text-text-secondary">Stimuli Detected</p>
            <p className="mt-1 text-3xl font-bold text-text">
              {results.stimuliCorrect}/{results.stimuliPresented}
            </p>
            <p className="text-xl font-semibold text-primary">{accuracy}%</p>
          </div>
          <div className="rounded-xl border-2 border-border bg-surface p-6 text-center">
            <p className="text-base font-medium text-text-secondary">Fixation Accuracy</p>
            <p className="mt-1 text-3xl font-bold text-text">
              {results.fixationCorrect}/{results.fixationChanges}
            </p>
            <p className="text-xl font-semibold text-primary">{fixAccuracy}%</p>
          </div>
          <div className="rounded-xl border-2 border-border bg-surface p-6 text-center">
            <p className="text-base font-medium text-text-secondary">Avg Response Time</p>
            <p className="mt-1 text-3xl font-bold text-text">
              {results.averageResponseTimeMs.toFixed(0)}ms
            </p>
          </div>
          <div className="rounded-xl border-2 border-border bg-surface p-6 text-center">
            <p className="text-base font-medium text-text-secondary">Duration</p>
            <p className="mt-1 text-3xl font-bold text-text">
              {Math.floor(results.durationMs / 60000)}m {Math.floor((results.durationMs % 60000) / 1000)}s
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border-2 border-border bg-surface p-6 text-center">
          <p className="text-base font-medium text-text-secondary">False Positives</p>
          <p className="mt-1 text-2xl font-bold text-text">{results.falsePositives}</p>
        </div>

        <div className="mt-8 flex gap-4">
          <a href="/" className="flex-1 rounded-lg bg-primary px-4 py-3 text-center text-lg font-semibold text-text-on-primary hover:bg-primary-hover">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Active session -- canvas container always in DOM
  return (
    <div className="relative h-screen w-screen bg-black">
      <div ref={containerRef} className="h-full w-full" />

      {/* Minimal HUD */}
      <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-between px-6 text-sm text-gray-600 opacity-30 transition-opacity hover:opacity-100">
        <span className="pointer-events-auto cursor-pointer" onClick={handleEnd}>
          ▌▌ End
        </span>
        <span>
          {progress.presented}/{progress.total} ({progress.total > 0 ? Math.round(progress.presented / progress.total * 100) : 0}%)
        </span>
      </div>
    </div>
  );
}
