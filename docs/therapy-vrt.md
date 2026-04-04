# Vision Restoration Therapy (VRT) - Technical Specification

## Overview

VRT is NovaVision's flagship restoration therapy. It systematically stimulates the "transition zone" -- the border between intact and damaged visual field -- to reactivate residual neuronal structures. Patients focus on a central fixation point while light stimuli flash at grid positions. They press a button when they detect a stimulus or when the fixation point changes.

## Session Protocol

- Performed at home on the patient's computer
- Twice daily sessions (~30 minutes each)
- Six days per week
- Standard course: 6 months
- Monthly parameter adjustment by clinician (or future AI)

---

## Grid System

| Parameter | Default | Description |
|-----------|---------|-------------|
| GridSizeX | 19 | Columns |
| GridSizeY | 15 | Rows |
| GridAngle | 43 | Horizontal extent in visual degrees |
| VerticalExtent | 32 | Vertical extent in visual degrees (fixed) |
| Total cells | 285 | 19 × 15 |

### Coordinate Mapping

Each grid cell maps to a position in visual degrees relative to the fixation point (centre of the screen):

```
degreesPerCellX = gridAngle / (gridSizeX - 1) = 43 / 18 ≈ 2.39°
degreesPerCellY = verticalExtent / (gridSizeY - 1) = 32 / 14 ≈ 2.29°
centreX = gridSizeX / 2 = 9.5
centreY = gridSizeY / 2 = 7.5

cellDegX = (cellX - centreX) × degreesPerCellX
cellDegY = (centreY - cellY) × degreesPerCellY  // Y inverted: top = positive
```

### Quadrant Classification

| Quadrant | Condition |
|----------|-----------|
| TL (Top-Left) | X < centreX AND Y < centreY |
| TR (Top-Right) | X > centreX AND Y < centreY |
| BL (Bottom-Left) | X < centreX AND Y > centreY |
| BR (Bottom-Right) | X > centreX AND Y > centreY |
| Centre | X == centreX AND Y == centreY |

---

## Screen Calibration

### Original Method (Ruler-Based)

The existing WPF application uses a ruler measurement approach:

1. Display a 400-pixel horizontal line and a 400-pixel vertical line
2. Patient measures each line with a physical ruler (in centimetres)
3. Calculate pixel dimensions:
   ```
   horizontalPixelDimension = horizontalLengthMM / 400
   verticalPixelDimension = verticalLengthMM / 400
   ```
4. Calculate physical screen size:
   ```
   horizontalDimensionMM = horizontalPixelDimension × screenWidthPixels
   verticalDimensionMM = verticalPixelDimension × screenHeightPixels
   ```
5. Calculate viewing distance (derived from 17° half-angle):
   ```
   viewingDistanceMM = (verticalDimensionMM / 2.0) / tan(17°)
   ```
6. **DegreePixels** (the critical value -- pixels per visual degree):
   ```
   DegreePixels = ROUND(viewingDistanceMM × tan(0.5°) × 2 × (screenHeightPixels / verticalDimensionMM))
   ```

### Validation Constraints

- Viewing distance must be 400-800mm (16-31.5 inches)
- Default DegreePixels = 32 (fallback if not calibrated)

### New Method (Credit Card)

The web rebuild uses a credit card reference (85.6mm × 53.98mm) for physical size calibration with explicit distance input, then:

```
pixelsPerCm = rectangleWidthPx / 8.56
DegreePixels = distanceCm × tan(1°) × pixelsPerCm
```

---

## Block Types

### Status Block (Code: "STA")

**Purpose:** Diagnostic perimetry -- maps the patient's entire visual field.

- All grid cells tested (minus centre)
- Each cell presented multiple times (default 3 repetitions)
- Randomised presentation order
- Used for pre-therapy baseline and post-therapy evaluation
- Results produce a visual field map showing detection rates per cell

**Block name format:** "Block-ACS" (binocular) or "Block-ACS-L" / "Block-ACS-R" (monocular)

### Progress Block (Code: "PRO")

**Purpose:** Active therapy -- targeted stimulation of the transition zone.

- Stimuli presented only within the defined therapy area
- **Every 5th stimulus is fully random** (from any grid cell) to mitigate boundary bias
- Configurable stimulus count via `ProgressStimuliCount`
- Supports brightness gradient: `ProgressLeftPointColour` → `ProgressRightPointColour` with `ProgressBrightnessSteps`

### Rapid Block (Code: "RAP")

**Purpose:** Intensive directional stimulation.

- Stimuli sweep through the therapy area in a specific direction
- Directions: Left, Right, Up, Down
- Ordering:
  - Left: cells sorted by X descending
  - Right: cells sorted by X ascending
  - Up: cells sorted by Y descending
  - Down: cells sorted by Y ascending
- Duration-limited (`RapidDuration` in minutes)
- Additional parameters: `RapidIterationsPerTrack`, `RapidDiffuseTests`, `RapidStimuliDistance`

### Standard Block

**Purpose:** General stimulation across the full visual field.

- All grid cells except centre
- Randomised presentation order
- Standard timing parameters

---

## Timing Parameters

| Parameter | Default | Unit | Description |
|-----------|---------|------|-------------|
| StimuliDisplayTimeMilliseconds | 200 | ms | How long the stimulus is visible |
| StimuliMinimumResponseTimeMilliseconds | 150 | ms | Earliest valid response (below = rejected as "too early") |
| StimuliMaximumDelayTimeMilliseconds | 1500 | ms | Latest valid response (above = "miss") |
| MinimumIntervalMilliseconds | 1000 | ms | Minimum gap between stimuli |
| MaximumIntervalMilliseconds | 2000 | ms | Maximum gap between stimuli |

Inter-stimulus interval is randomised uniformly between Minimum and Maximum.

---

## Fixation Monitoring

The fixation system monitors whether the patient is maintaining gaze on the central point.

### Dual Fixation Points

The original system uses **two alternating fixation appearances**:
- `FixationShape1` / `FixationColour1` (default: red circle)
- `FixationShape2` / `FixationColour2` (default: green square)

A fixation "change" swaps from appearance 1 to appearance 2 (or vice versa). The patient must respond to detect the change.

### Fixation Timing

| Parameter | Default | Description |
|-----------|---------|-------------|
| FixationRate | 0.2 | Proportion of stimuli that trigger a fixation change (20%) |
| FixationVariance | 0.17 | Variance in spacing between fixation changes |
| FixationDisplayTimeMilliseconds | 200 | How long the changed fixation is shown |
| FixationMinimumResponseTimeMilliseconds | 150 | Earliest valid fixation response |
| FixationMaximumDelayTimeMilliseconds | 1500 | Latest valid fixation response |

### Fixation Change Scheduling Algorithm

From the original `TherapySessionTrialViewModel.cs`:

```
fixationChanges = ROUND(stimuliCount × fixationRate)
fixationChangeFrequency = ROUND(((1 - fixationVariance²) × stimuliCount) / fixationChanges)

For each change i:
  if i == 0: index = 0
  else: index = RANDOM(prevIndex + frequency, prevIndex + frequency + FLOOR(frequency / 2))
```

This produces pseudo-random spacing with a tendency toward even distribution, but with enough variance to be unpredictable.

---

## Stimulus Shapes

| Code | Shape | Canvas Rendering |
|------|-------|-----------------|
| CIR | Circle | `ctx.arc()` |
| SQU | Square | `ctx.fillRect()` |
| DIA | Diamond | `ctx.rotate(π/4)` + `ctx.fillRect()` |
| TRI | Triangle | `ctx.beginPath()` + `moveTo/lineTo` path |

Default stimulus: white circle, 0.15° visual degrees diameter.

---

## Therapy Area

The therapy area defines which grid cells are stimulated during Progress and Rapid blocks. It is configured by the clinician based on the patient's visual field map.

**Storage format:** Comma-separated "X-Y" coordinate pairs.
Example: `"7-5,7-6,7-7,8-5,8-6,8-7,9-5,9-6,10-5,10-6,10-7,11-5,11-6,11-7"`

**Selection criteria:** Target the transition zone -- cells with 30-70% detection rate in the most recent Status block.

---

## Result Data Model

### Per-Session Aggregates (VrtBlockResult)

| Field | Type | Description |
|-------|------|-------------|
| StimuliPresented | int | Total stimuli shown |
| StimuliCorrect | int | Stimuli detected by patient |
| FixationChanges | int | Total fixation changes presented |
| FixationCorrect | int | Fixation changes detected |
| FalsePositives | int | Responses when no stimulus/fixation active |
| AverageResponseTimeMs | double | Mean response time (valid responses only) |
| AvgResponseTimeTLMs | double | Mean response time in top-left quadrant |
| AvgResponseTimeTRMs | double | Mean response time in top-right quadrant |
| AvgResponseTimeBLMs | double | Mean response time in bottom-left quadrant |
| AvgResponseTimeBRMs | double | Mean response time in bottom-right quadrant |
| MinResponseTimeMs | double | Fastest valid response |
| MaxResponseTimeMs | double | Slowest valid response |

### Per-Stimulus Detail (VrtStimulusResult)

| Field | Type | Description |
|-------|------|-------------|
| GridX | int | Grid column (0-18) |
| GridY | int | Grid row (0-14) |
| Correct | bool | Patient detected the stimulus |
| Presented | bool | Stimulus was shown (always true) |
| ResponseTimeMs | double | Reaction time in milliseconds |
| Quadrant | string | "TL", "TR", "BL", "BR" |

### Per-Fixation Detail (VrtFixationResult)

| Field | Type | Description |
|-------|------|-------------|
| Index | int | Position in fixation sequence |
| Correct | bool | Patient detected the fixation change |
| Presented | bool | Fixation change was shown |
| ResponseTimeMs | double | Reaction time in milliseconds |

### Response Validation

Only responses within the valid window are counted:
```
Valid stimulus response: ResponseTimeMs >= 150 AND ResponseTimeMs <= 1500
Valid fixation response: ResponseTimeMs >= 150 AND ResponseTimeMs <= 1500
```

Responses outside this window are excluded from averages.

---

## Diagnostic Phase (ACS Test)

Before therapy begins, a diagnostic assessment maps the patient's visual field:

1. Patient completes screen calibration
2. Patient selects fixation point preferences (shape, colour, eye)
3. Server creates an "AC Status Test" therapy with default parameters
4. Status block created with standard 19×15 grid
5. Schedule: 3 sessions (configurable via `AcStatusTestSessions`)
6. For monocular-both: 6 sessions total (3 left eye, 3 right eye)
7. Results averaged across sessions to produce baseline visual field map
8. Clinician reviews map and defines therapy area for Progress blocks

### Eye Types

| Code | Type | Sessions |
|------|------|----------|
| BIN | Binocular | 3 |
| MOL | Monocular Left | 3 |
| MOR | Monocular Right | 3 |
| MOB | Monocular Both | 6 (3 per eye, alternating) |

---

## Therapy Schedule

Each therapy block has a schedule defining required and completed sessions:

| Field | Description |
|-------|-------------|
| Sessions | Required number of sessions |
| SessionsCompleted | How many have been completed |

When `SessionsCompleted >= Sessions` for all schedules in a therapy, the therapy is marked complete and a notification email is sent.

---

## Key Settings

| Setting | Default | Description |
|---------|---------|-------------|
| AcStatusTestSessions | 3 | Sessions per eye for diagnostic |
| GridSizeX | 19 | Standard grid width |
| GridSizeY | 15 | Standard grid height |
| PassPercentage | 0.8 | 80% fixation accuracy required |
| MinimumThresholdPercentage | 0.55 | 55% minimum detection threshold |
| Size | 11 | Default stimulus size parameter |
