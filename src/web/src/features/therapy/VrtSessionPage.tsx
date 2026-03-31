import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { VrtSessionEngine, type VrtBlockConfig, DEFAULT_VRT_BLOCK, TherapyCanvas, type CalibrationData } from '../../therapy-engine';
import type { SessionSummary } from '../../therapy-engine';

type SessionPhase = 'pre' | 'countdown' | 'active' | 'paused' | 'complete';

export function VrtSessionPage() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VrtSessionEngine | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('pre');
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState({ presented: 0, total: 284 });
  const [results, setResults] = useState<SessionSummary | null>(null);

  // TODO: load from API based on patient's assigned therapy
  const calibration: CalibrationData = {
    degreePixels: 50, distanceCm: 30, pixelsPerCm: 37.8,
    screenWidth: 1920, screenHeight: 1080, devicePixelRatio: window.devicePixelRatio,
  };

  const blockConfig: VrtBlockConfig = { ...DEFAULT_VRT_BLOCK };

  const startCountdown = useCallback(() => {
    setPhase('countdown');
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        startSession();
      }
    }, 1000);
  }, []);

  const startSession = useCallback(() => {
    if (!containerRef.current) return;

    const canvas = new TherapyCanvas(containerRef.current, calibration);
    const engine = new VrtSessionEngine(canvas, blockConfig);
    engineRef.current = engine;

    containerRef.current.requestFullscreen?.();

    engine.start(
      (enginePhase) => {
        if (enginePhase === 'complete') {
          setResults(engine.getRecorder().getSummary());
          setPhase('complete');
          document.exitFullscreen?.();
        } else if (enginePhase === 'paused') {
          setPhase('paused');
        }
      },
      (presented, total) => setProgress({ presented, total }),
    );

    setPhase('active');
  }, []);

  const handlePause = () => engineRef.current?.pause();
  const handleResume = () => {
    engineRef.current?.resume();
    setPhase('active');
  };
  const handleEnd = () => {
    engineRef.current?.stop();
    setResults(engineRef.current?.getRecorder().getSummary() ?? null);
    setPhase('complete');
    document.exitFullscreen?.();
  };

  // Pre-session instructions
  if (phase === 'pre') {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h1 className="text-3xl font-bold text-text">Vision Restoration Therapy</h1>
        <p className="mt-2 text-lg text-text-secondary">Block 1 - Status (Diagnostic)</p>

        <div className="mt-8 rounded-xl border-2 border-border bg-surface p-8">
          <h2 className="text-xl font-bold text-text">Session Instructions</h2>
          <ul className="mt-4 space-y-3 text-lg text-text-secondary">
            <li>Focus on the central red point at all times</li>
            <li>Press <span className="font-bold text-text">SPACE</span> when you see a light appear</li>
            <li>Press <span className="font-bold text-text">SPACE</span> when the central point changes</li>
            <li>Try not to move your eyes from the centre</li>
            <li>Press <span className="font-bold text-text">ESC</span> to pause at any time</li>
          </ul>

          <div className="mt-6 rounded-lg bg-surface-secondary p-4 text-base text-text-secondary">
            <p>Stimuli: {blockConfig.sessionStimuli} presentations</p>
            <p>Estimated duration: ~{Math.round(blockConfig.sessionStimuli * 1.5 / 60)} minutes</p>
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
      <div className="flex min-h-screen items-center justify-center bg-surface-dark">
        <p className="text-8xl font-bold text-text-on-dark">{countdown}</p>
      </div>
    );
  }

  // Paused overlay
  if (phase === 'paused') {
    const stats = engineRef.current?.getRecorder().getRunningStats();
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-dark/90">
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
      <div className="mx-auto max-w-2xl py-8">
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
          <button className="flex-1 rounded-lg bg-primary px-4 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover">
            View Visual Field Map
          </button>
          <a
            href="/"
            className="flex-1 rounded-lg border-2 border-border px-4 py-3 text-center text-lg font-semibold text-text-secondary hover:bg-surface-secondary"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Active session -- canvas container (fullscreen dark)
  return (
    <div className="relative h-screen w-screen bg-black">
      <div ref={containerRef} className="h-full w-full" />

      {/* Minimal HUD */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-between px-6 text-sm text-gray-500 opacity-50 hover:opacity-100 transition-opacity">
        <button onClick={handlePause} className="text-lg">
          ▌▌ Pause
        </button>
        <span className="text-lg">
          {progress.presented}/{progress.total} ({Math.round(progress.presented / progress.total * 100)}%)
        </span>
      </div>
    </div>
  );
}
