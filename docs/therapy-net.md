# NeuroEyeTherapy (NET) - Technical Specification

## Overview

NeuroEyeTherapy uses contrast-based stimulation to improve visual sensitivity at specific positions in the patient's visual field. Targets appear at fixed positions with varying contrast levels. An asymmetric staircase algorithm adjusts the contrast per target based on the patient's responses, converging on their contrast detection threshold.

## Session Protocol

- Sessions last approximately 25 minutes
- Twice daily, six days per week
- Duration determined by clinician based on progress
- Requires clinician involvement for configuration

---

## Target Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| NumberOfTargets | 3-5 | Independent targets tracked simultaneously |
| Presentations | 50 | Presentations per target per session |
| Target X, Y | Configurable | Position in visual degrees from fixation |
| Target Diameter | Configurable | Size in visual degrees |
| StartContrast | 0.9 | Initial contrast (0.0-1.0 scale) |

Targets are positioned at different locations in the patient's visual field, typically in or near the transition zone between intact and damaged vision.

---

## Contrast Scale

Contrast is expressed on a **0.0 to 1.0 fractional scale** (NOT percentage):

| Value | Meaning |
|-------|---------|
| 0.0 | Invisible (same as background) |
| 0.15 | Minimum usable contrast (alert threshold) |
| 0.5 | Mid-range |
| 0.9 | Maximum starting contrast (near-white on black) |
| 1.0 | Full contrast (pure white) |

**Operational range: 0.15 to 0.9**

---

## Asymmetric Staircase Algorithm

The staircase adjusts contrast per target after each presentation cycle. It is **asymmetric** -- it makes stimuli harder faster than it makes them easier.

### Step Sizes

| Direction | Step Size | When |
|-----------|----------|------|
| **Down** (harder) | **-0.1** | When correct count ≥ UpperLimit AND contrast ≥ 0.15 |
| **Up** (easier) | **+0.05** | When correct count ≤ LowerLimit AND contrast ≤ 0.9 |
| **No change** | 0 | When correct count is between thresholds |

**Asymmetry ratio: 2:1** (down step is twice as large as up step). This biases the staircase toward finding the patient's true threshold more efficiently.

### Threshold Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| UpperLimit | 43 | Correct **count** threshold to decrease contrast |
| LowerLimit | 32 | Correct **count** threshold to increase contrast |

**These are CORRECT COUNT thresholds, not contrast values.** After a set of presentations:
- If the patient got ≥ 43 correct → they're performing well → make it harder (reduce contrast by 0.1)
- If the patient got ≤ 32 correct → they're struggling → make it easier (increase contrast by 0.05)
- If between 33-42 → no change

### Algorithm (from original `UserNetTherapyResultData.cs`)

```
For each target (1-5):
  if (correctCount >= upperLimit AND currentContrast >= 0.15):
    newContrast = currentContrast - 0.1   // Step DOWN (harder)
  else if (correctCount <= lowerLimit AND currentContrast <= 0.9):
    newContrast = currentContrast + 0.05  // Step UP (easier)
  else:
    newContrast = currentContrast          // No change
    
  // Clamp to valid range
  newContrast = clamp(newContrast, 0.15, 0.9)
```

### Target Independence

Each target's contrast is adjusted **independently**. Target 1's performance does not affect Target 2's contrast. This allows the staircase to find different thresholds for different visual field positions.

---

## Support Alert

When any target's contrast crosses below 0.15 (the minimum), an alert email is sent to NovaVision clinical support:

```
if (previousContrast > 0.15 AND newContrast <= 0.15):
  sendAlertEmail()  // Patient may have reached maximum improvement for this target
```

---

## Practice Phase

Each session begins with a practice phase:

| Parameter | Default | Description |
|-----------|---------|-------------|
| PracticePresentations | 10 | Practice trials |
| PracticeContrast | 0.9 | High contrast (easy) |
| PracticePass | 8 | Minimum correct to pass practice |
| PracticeX, PracticeY | 0.6, 0.6 | Practice target position |
| PracticeDiameter | 6 | Practice target size |

Practice uses a separate target at high contrast to ensure the patient understands the task before the main session begins. The `PracticeComplete` flag is set on the therapy after the first successful practice.

---

## Target Presentation Pattern

Targets are presented in a **random** order (not sequential 1→2→3→4→5):

```
while (!targetValid):
  currentTarget = random(1, numberOfTargets)
  targetValid = presentations[currentTarget] < maxPresentations
```

This ensures each target gets exactly `Presentations` presentations but in a randomised order.

---

## Luminance Lookup Table

The original system uses a 256-level non-linear luminance lookup table for precise contrast rendering:

| Index Range | Luminance Range | Characteristic |
|-------------|----------------|----------------|
| 0-15 | 0.217 - 0.245 | Near-flat (imperceptible) |
| 16-80 | 0.26 - 12.0 | Gradual increase |
| 81-255 | 12.3 - 218.2 | Steep exponential increase |

This maps between RGB values and physical luminance for accurate contrast presentation. The web implementation approximates this using CSS `rgba(255, 255, 255, contrast)` alpha values, which provides a reasonable approximation for most displays.

---

## Stimulus Timing

| Parameter | Default | Description |
|-----------|---------|-------------|
| FramesPerSecond | 60 | Display refresh rate |
| StimulusDurationSeconds | 2 | How long each stimulus is shown |
| StimulusFrequencyHz | 10 | Sinusoidal modulation frequency |

The original system uses sinusoidal contrast modulation (the target fades in and out). The web implementation simplifies this to a static presentation at the target contrast level.

---

## Result Data Model

### Per-Session (NetSessionResult)

| Field | Type | Description |
|-------|------|-------------|
| SessionNumber | int | Sequential session number |
| Duration | TimeSpan | Session duration |
| IsComplete | bool | Session completed successfully |

### Per-Target Per-Session (NetSessionResultTarget)

| Field | Type | Description |
|-------|------|-------------|
| TargetNumber | int | 1-5 |
| Contrast | double | Contrast level at end of session (0.0-1.0) |
| Presented | int | Presentations for this target |
| Correct | int | Correct detections for this target |
| X, Y | double | Target position (visual degrees) |
| Diameter | double | Target size (visual degrees) |

### Therapy Configuration (NetTherapy)

| Field | Type | Description |
|-------|------|-------------|
| NumberOfTargets | int | 1-5 active targets |
| Presentations | int | Per-target presentations per session |
| UpperLimit | int | Correct count threshold for contrast decrease |
| LowerLimit | int | Correct count threshold for contrast increase |
| PracticeComplete | bool | Practice phase completed |

### Target Configuration (NetTherapyTarget)

| Field | Type | Description |
|-------|------|-------------|
| TargetNumber | int | 1-5 |
| X, Y | double | Position in visual degrees |
| Diameter | double | Size in visual degrees |
| StartContrast | double | Initial contrast (0.0-1.0) |
| CurrentContrast | double | Current contrast after staircase adjustments |

---

## Clinical Interpretation

- **Decreasing contrast over sessions** = improvement (patient detecting fainter stimuli)
- **Contrast plateau** = patient has reached their threshold for that position
- **Contrast at 0.15** = maximum sensitivity achieved; alert clinical support
- **Contrast increasing** = regression; may indicate fatigue, poor fixation, or progression of underlying condition
