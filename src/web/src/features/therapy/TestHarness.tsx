import { useRef, useState } from 'react';
import {
  TherapyCanvas, VrtSessionEngine, NecSessionEngine, NetSessionEngine,
  DEFAULT_VRT_BLOCK, NEC_STAGES,
  type VrtBlockConfig, type CalibrationData, type NetSessionConfig, type MatrixItem,
} from '../../therapy-engine';
import type { SessionSummary } from '../../therapy-engine';

type TherapyChoice = 'vrt' | 'nec' | 'net';

/**
 * Standalone test harness for running therapy sessions with custom parameters.
 * Accessible at /test-harness — no login, no API required.
 */
export function TestHarness() {
  const [therapy, setTherapy] = useState<TherapyChoice>('vrt');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<string | null>(null);

  // VRT params
  const [vrtBlock, setVrtBlock] = useState<'Status' | 'Progress' | 'Rapid' | 'Standard'>('Status');
  const [vrtStimuli, setVrtStimuli] = useState(30);
  const [vrtDisplayMs, setVrtDisplayMs] = useState(200);
  const [vrtMinInterval, setVrtMinInterval] = useState(1000);
  const [vrtMaxInterval, setVrtMaxInterval] = useState(2000);
  const [vrtFixRate, setVrtFixRate] = useState(0.2);
  const [vrtTherapyArea, setVrtTherapyArea] = useState('7-5,7-6,8-5,8-6,9-5,9-6');
  const [vrtDirection, setVrtDirection] = useState<'Left' | 'Right' | 'Up' | 'Down'>('Right');

  // NEC params
  const [necStage, setNecStage] = useState(0);

  // NET params
  const [netPresentations, setNetPresentations] = useState(20);
  const [netTargets, setNetTargets] = useState(3);
  const [netUpperLimit, setNetUpperLimit] = useState(8);
  const [netLowerLimit, setNetLowerLimit] = useState(4);

  // Calibration
  const [degreePixels, setDegreePixels] = useState(50);

  const containerRef = useRef<HTMLDivElement>(null);

  const calibration: CalibrationData = {
    degreePixels, distanceCm: 30, pixelsPerCm: 37.8,
    screenWidth: window.screen.width, screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
  };

  const startVrt = () => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    setRunning(true);
    setResults(null);

    const canvas = new TherapyCanvas(containerRef.current, calibration);
    const config: VrtBlockConfig = {
      ...DEFAULT_VRT_BLOCK,
      blockType: vrtBlock,
      sessionStimuli: vrtStimuli,
      progressStimuliCount: vrtStimuli,
      stimulusDisplayTimeMs: vrtDisplayMs,
      minIntervalMs: vrtMinInterval,
      maxIntervalMs: vrtMaxInterval,
      fixationRate: vrtFixRate,
      therapyArea: vrtBlock === 'Progress' || vrtBlock === 'Rapid' ? vrtTherapyArea : undefined,
      rapidDirection: vrtDirection,
    };

    const engine = new VrtSessionEngine(canvas, config);
    engine.start(
      (phase) => {
        if (phase === 'complete') {
          const summary = engine.getRecorder().getSummary();
          setResults(formatVrtResults(summary, engine));
          setRunning(false);
          canvas.destroy();
        }
      },
      undefined,
      (msg) => console.warn('VRT Warning:', msg),
    );
  };

  const startNec = () => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    setRunning(true);
    setResults(null);

    const canvas = new TherapyCanvas(containerRef.current, calibration);
    const engine = new NecSessionEngine(canvas);
    engine.start(1, necStage);

    engine.render();
    engine.startInput((_item: MatrixItem, _result: 'correct' | 'incorrect') => {
      engine.render();
      if (engine.getState()?.isComplete) {
        engine.stopInput();
        const r = engine.getResults()!;
        setResults([
          `Stage: ${necStage} (${NEC_STAGES[necStage].targetShape} targets)`,
          `Targets found: ${r.correctClicks}/${r.totalTargets}`,
          `Incorrect clicks: ${r.incorrectClicks}`,
          `Missed: ${r.missedTargets}`,
          `Time: ${r.elapsedSeconds.toFixed(1)}s`,
          `Accuracy: ${(r.accuracy * 100).toFixed(0)}%`,
        ].join('\n'));
        setRunning(false);
        canvas.destroy();
      }
    });
  };

  const startNet = () => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    setRunning(true);
    setResults(null);

    const canvas = new TherapyCanvas(containerRef.current, calibration);
    const targets = [];
    for (let i = 0; i < netTargets; i++) {
      targets.push({
        targetNumber: i + 1,
        x: (i - Math.floor(netTargets / 2)) * 8,
        y: (i % 2 === 0) ? -3 : 3,
        diameter: 1.5,
        contrast: 0.8 - i * 0.1,
      });
    }

    const config: NetSessionConfig = {
      targets,
      upperLimit: netUpperLimit,
      lowerLimit: netLowerLimit,
      presentations: netPresentations,
      practicePresentations: 5,
      practiceContrast: 0.9,
      practiceX: 0, practiceY: 5, practiceDiameter: 2.0,
    };

    const engine = new NetSessionEngine(canvas, config);
    engine.start(
      (phase) => {
        if (phase === 'complete') {
          const summary = engine.getRecorder().getSummary();
          const states = engine.getTargetStates();
          setResults([
            `Detected: ${summary.stimuliCorrect}/${summary.stimuliPresented}`,
            `Avg RT: ${summary.averageResponseTimeMs.toFixed(0)}ms`,
            `False positives: ${summary.falsePositives}`,
            `Duration: ${(summary.durationMs / 1000).toFixed(1)}s`,
            '',
            'Per-target contrasts:',
            ...states.map(ts =>
              `  Target ${ts.config.targetNumber}: ${(ts.currentContrast * 100).toFixed(0)}% (${ts.correct}/${ts.presented} correct)`
            ),
          ].join('\n'));
          setRunning(false);
          canvas.destroy();
        } else if (phase === 'practiceFailed') {
          setResults('Practice failed (need 8/10 correct). Restart to try again.');
          setRunning(false);
          canvas.destroy();
        }
      },
    );
  };

  const startSession = () => {
    switch (therapy) {
      case 'vrt': startVrt(); break;
      case 'nec': startNec(); break;
      case 'net': startNet(); break;
    }
  };

  if (running) {
    return (
      <div className="relative h-screen w-screen bg-black">
        <div ref={containerRef} className="h-full w-full" />
        <div className="absolute bottom-2 right-4 text-xs text-gray-600">
          ESC to pause | Test Harness
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold text-text">Therapy Test Harness</h1>
      <p className="mt-1 text-base text-text-secondary">
        Run therapy sessions with custom parameters. No login or API required.
      </p>

      {/* Therapy selector */}
      <div className="mt-6 flex gap-2">
        {(['vrt', 'nec', 'net'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTherapy(t)}
            className={`rounded-lg px-6 py-3 text-lg font-semibold ${
              therapy === t
                ? 'bg-primary text-white'
                : 'border-2 border-border text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Global: DegreePixels */}
      <div className="mt-6 rounded-lg border-2 border-border bg-surface p-4">
        <h3 className="text-base font-bold text-text">Calibration</h3>
        <label className="mt-2 flex items-center gap-3 text-sm">
          DegreePixels:
          <input type="number" value={degreePixels} onChange={e => setDegreePixels(+e.target.value)}
            className="w-20 rounded border px-2 py-1 text-center" />
          <span className="text-text-muted">(default 50 = ~30cm at 96DPI)</span>
        </label>
      </div>

      {/* VRT params */}
      {therapy === 'vrt' && (
        <div className="mt-4 rounded-lg border-2 border-border bg-surface p-4 space-y-3">
          <h3 className="text-base font-bold text-text">VRT Parameters</h3>
          <label className="flex items-center gap-3 text-sm">
            Block type:
            <select value={vrtBlock} onChange={e => setVrtBlock(e.target.value as typeof vrtBlock)}
              className="rounded border px-2 py-1">
              <option>Status</option><option>Progress</option><option>Rapid</option><option>Standard</option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm">
            Stimuli count:
            <input type="number" value={vrtStimuli} onChange={e => setVrtStimuli(+e.target.value)}
              className="w-20 rounded border px-2 py-1 text-center" />
          </label>
          <label className="flex items-center gap-3 text-sm">
            Display time (ms):
            <input type="number" value={vrtDisplayMs} onChange={e => setVrtDisplayMs(+e.target.value)}
              className="w-20 rounded border px-2 py-1 text-center" />
          </label>
          <label className="flex items-center gap-3 text-sm">
            Interval (ms): min
            <input type="number" value={vrtMinInterval} onChange={e => setVrtMinInterval(+e.target.value)}
              className="w-20 rounded border px-2 py-1 text-center" />
            max
            <input type="number" value={vrtMaxInterval} onChange={e => setVrtMaxInterval(+e.target.value)}
              className="w-20 rounded border px-2 py-1 text-center" />
          </label>
          <label className="flex items-center gap-3 text-sm">
            Fixation rate:
            <input type="number" step="0.05" value={vrtFixRate} onChange={e => setVrtFixRate(+e.target.value)}
              className="w-20 rounded border px-2 py-1 text-center" />
          </label>
          {(vrtBlock === 'Progress' || vrtBlock === 'Rapid') && (
            <label className="flex items-center gap-3 text-sm">
              Therapy area:
              <input type="text" value={vrtTherapyArea} onChange={e => setVrtTherapyArea(e.target.value)}
                className="flex-1 rounded border px-2 py-1 font-mono text-xs" />
            </label>
          )}
          {vrtBlock === 'Rapid' && (
            <label className="flex items-center gap-3 text-sm">
              Direction:
              <select value={vrtDirection} onChange={e => setVrtDirection(e.target.value as typeof vrtDirection)}
                className="rounded border px-2 py-1">
                <option>Left</option><option>Right</option><option>Up</option><option>Down</option>
              </select>
            </label>
          )}
        </div>
      )}

      {/* NEC params */}
      {therapy === 'nec' && (
        <div className="mt-4 rounded-lg border-2 border-border bg-surface p-4 space-y-3">
          <h3 className="text-base font-bold text-text">NEC Parameters</h3>
          <label className="flex items-center gap-3 text-sm">
            Stage:
            <select value={necStage} onChange={e => setNecStage(+e.target.value)}
              className="rounded border px-2 py-1">
              <option value={0}>0 (Practice): Diamond targets, Circle+Cross distractors</option>
              <option value={1}>1: Diamond targets, Circle+Cross distractors</option>
              <option value={2}>2: Star targets, Diamond+Cross distractors</option>
              <option value={3}>3: Circle targets, Diamond+Cross distractors</option>
            </select>
          </label>
          <p className="text-xs text-text-muted">
            Click all {NEC_STAGES[necStage]?.targetShape} shapes. Cross clicks are always wrong.
          </p>
        </div>
      )}

      {/* NET params */}
      {therapy === 'net' && (
        <div className="mt-4 rounded-lg border-2 border-border bg-surface p-4 space-y-3">
          <h3 className="text-base font-bold text-text">NET Parameters</h3>
          <label className="flex items-center gap-3 text-sm">
            Number of targets:
            <input type="number" min={1} max={5} value={netTargets} onChange={e => setNetTargets(+e.target.value)}
              className="w-20 rounded border px-2 py-1 text-center" />
          </label>
          <label className="flex items-center gap-3 text-sm">
            Presentations per target:
            <input type="number" value={netPresentations} onChange={e => setNetPresentations(+e.target.value)}
              className="w-20 rounded border px-2 py-1 text-center" />
          </label>
          <label className="flex items-center gap-3 text-sm">
            Upper threshold (correct count to decrease):
            <input type="number" value={netUpperLimit} onChange={e => setNetUpperLimit(+e.target.value)}
              className="w-20 rounded border px-2 py-1 text-center" />
          </label>
          <label className="flex items-center gap-3 text-sm">
            Lower threshold (correct count to increase):
            <input type="number" value={netLowerLimit} onChange={e => setNetLowerLimit(+e.target.value)}
              className="w-20 rounded border px-2 py-1 text-center" />
          </label>
          <p className="text-xs text-text-muted">
            Staircase: correct &ge; upper → contrast -0.1 | correct &le; lower → contrast +0.05
          </p>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={startSession}
        className="mt-6 w-full rounded-lg bg-primary px-4 py-4 text-xl font-semibold text-white hover:bg-primary-hover"
      >
        Start {therapy.toUpperCase()} Session
      </button>

      {/* Results */}
      {results && (
        <div className="mt-6 rounded-lg border-2 border-border bg-surface-secondary p-6">
          <h3 className="text-lg font-bold text-text">Results</h3>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-sm text-text-secondary">{results}</pre>
        </div>
      )}

      {/* Canvas container (hidden until running) */}
      <div ref={containerRef} className="hidden" />
    </div>
  );
}

function formatVrtResults(summary: SessionSummary, engine: VrtSessionEngine): string {
  const stimuli = engine.getStimuliResults();
  const fixation = engine.getFixationResults();

  // Quadrant breakdown
  const quads = { TL: { hit: 0, total: 0 }, TR: { hit: 0, total: 0 }, BL: { hit: 0, total: 0 }, BR: { hit: 0, total: 0 } };
  for (const s of stimuli.filter(s => s.presented)) {
    if (s.isTopLeft) { quads.TL.total++; if (s.correct) quads.TL.hit++; }
    if (s.isTopRight) { quads.TR.total++; if (s.correct) quads.TR.hit++; }
    if (s.isBottomLeft) { quads.BL.total++; if (s.correct) quads.BL.hit++; }
    if (s.isBottomRight) { quads.BR.total++; if (s.correct) quads.BR.hit++; }
  }

  return [
    `Stimuli: ${summary.stimuliCorrect}/${summary.stimuliPresented} (${(summary.stimuliPresented > 0 ? summary.stimuliCorrect / summary.stimuliPresented * 100 : 0).toFixed(1)}%)`,
    `Fixation: ${summary.fixationCorrect}/${summary.fixationChanges} (${(summary.fixationChanges > 0 ? summary.fixationCorrect / summary.fixationChanges * 100 : 0).toFixed(1)}%)`,
    `False positives: ${summary.falsePositives}`,
    `Avg RT: ${summary.averageResponseTimeMs.toFixed(0)}ms (min ${summary.minResponseTimeMs.toFixed(0)}, max ${summary.maxResponseTimeMs.toFixed(0)})`,
    `Duration: ${(summary.durationMs / 1000).toFixed(1)}s`,
    '',
    'Quadrant detection:',
    `  TL: ${quads.TL.hit}/${quads.TL.total}  TR: ${quads.TR.hit}/${quads.TR.total}`,
    `  BL: ${quads.BL.hit}/${quads.BL.total}  BR: ${quads.BR.hit}/${quads.BR.total}`,
    '',
    `Fixation changes: ${fixation.length} scheduled`,
    `Stimuli list: ${stimuli.length} cells`,
  ].join('\n');
}
