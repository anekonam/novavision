# NeuroEyeCoach (NEC) - Technical Specification

## Overview

NeuroEyeCoach is a compensation therapy that trains patients to make more efficient eye movements (saccades) to compensate for their visual field loss. It uses two distinct task paradigms:

1. **Cancellation Task** (Stages 0-3): Patient clicks target shapes among distractors in a matrix
2. **Visual Search Task** (Levels 1-12): Patient determines if a target is present or absent among distractors

The programme is self-adaptive, adjusting difficulty based on performance.

---

## Cancellation Task (Stages 0-3)

### How It Works

A grid of shapes is displayed on screen. The patient must find and click all instances of the target shape while avoiding distractors. The session ends when all targets are found.

### Stage Definitions

| Stage | Target Shape | Distractors | Target Count | Distractor Counts |
|-------|-------------|-------------|--------------|-------------------|
| 0 (Practice) | Diamond (10) | Circle (6), Cross (5) | 10 | 11 |
| 1 | Diamond (20) | Circle (12), Cross (10) | 20 | 22 |
| 2 | Star (20) | Diamond (11), Cross (11) | 20 | 22 |
| 3 | Circle (20) | Diamond (12), Cross (10) | 20 | 22 |

### Shape Codes

| Code | Shape | Visual |
|------|-------|--------|
| C | Circle | ○ |
| X | Cross | ✕ |
| D | Diamond | ◇ |
| S | Star | ★ |

### Scoring Rules

| Click | Stage 0/1 | Stage 2 | Stage 3 |
|-------|-----------|---------|---------|
| Diamond | Correct | Incorrect | Incorrect |
| Star | Incorrect | Correct | Incorrect |
| Circle | Incorrect | Incorrect | Correct |
| Cross | **Always incorrect** | **Always incorrect** | **Always incorrect** |

### Matrix Generation

- Matrix generated randomly for each session
- Centre 2×2 cells excluded (fixation area)
- Shapes placed randomly in remaining cells
- Exact counts enforced per stage definition
- Random seed: `new Random((int)DateTime.Now.Ticks)`

### Session Completion

Session ends immediately when `correctClicks == totalTargets` for that stage.

### Data Recorded Per Session

| Field | Type | Description |
|-------|------|-------------|
| Stage | enum | 0-3 |
| TotalTargets | int | Targets in the matrix |
| CorrectClicks | int | Targets correctly clicked |
| IncorrectClicks | int | Distractors incorrectly clicked |
| MissedTargets | int | TotalTargets - CorrectClicks |
| ElapsedSeconds | double | Time to complete |

---

## Visual Search Task (Levels 1-12)

### How It Works

A field of items is displayed. The patient must determine whether a specific target item is present among distractors, then respond via keyboard:
- Press one key if target is **present**
- Press another key if target is **absent**

### 12-Level Progression

Difficulty increases through three dimensions:
1. **Search type**: Parallel (easy) → Mixed → Serial (hard)
2. **Target-distractor similarity**: Dissimilar (easy) → Similar (hard)
3. **Distractor count**: 7 (easy) → 15 → 23 (hard) per sub-stage

| Level | Type | Target | Distractor(s) | Category |
|-------|------|--------|----------------|----------|
| 0 | Practice | BlackO (OX) | BlackT, BlackL | Baseline |
| 1 | Parallel | T | O | Simple shape |
| 2 | Parallel | X | O | Rotation variant |
| 3 | Parallel | H | C | Shape variant |
| 4 | Parallel | T,X,H (random) | O,C (random) | Multiple targets |
| 5 | Mixed | S | C | Curved shapes |
| 6 | Mixed | O | G | High similarity |
| 7 | Mixed | B | D | High similarity |
| 8 | Mixed | S,O,B (random) | C,G,D (random) | Multiple targets |
| 9 | Serial | X | BlueX, R | Colour + shape |
| 10 | Serial | b | BlueLowerB, p | Subtle differences |
| 11 | Serial | T | BlueT, TI (inverted) | Colour + rotation |
| 12 | Serial | B | BlueB, 8 (digit) | Shape + digit |

### Sub-Stages Per Level (A, B, C)

Each level has three sub-stages with increasing distractor counts:

| Sub-Stage | Distractors (present) | Distractors (absent) |
|-----------|----------------------|---------------------|
| A | 7 + 1 target | 8 |
| B | 15 + 1 target | 16 |
| C | 23 + 1 target | 24 |

### Trial Structure Per Sub-Stage

| Parameter | Value |
|-----------|-------|
| Trial blocks | 10 |
| Present-left presentations | 5 |
| Present-right presentations | 5 |
| Absent presentations | 10 |
| Total per sub-stage | 20 |

---

## Level Progression Logic

### Advance to Next Level

Criteria: accuracy ≥ 80% over minimum 3 sessions at current level.

### Regress to Previous Level

Criteria: accuracy < 50% over minimum 3 sessions at current level.

### Hold at Current Level

Criteria: accuracy between 50-80%, or fewer than 3 sessions completed.

### Boundaries

- Cannot regress below Level 1
- Cannot advance beyond Level 12
- Minimum 36 sessions total (3 per level × 12 levels)

```
function calculateProgression(currentLevel, sessionsAtLevel, accuracy):
  if sessionsAtLevel < 3: return currentLevel  // Not enough data
  if accuracy >= 0.80: return min(currentLevel + 1, 12)  // Advance
  if accuracy < 0.50: return max(currentLevel - 1, 1)   // Regress
  return currentLevel  // Hold
```

---

## Key Settings

| Setting | Default | Description |
|---------|---------|-------------|
| TrialBlocks | 10 | Blocks per sub-stage |
| TrialPassPercentage | 0.80 | 80% accuracy to advance |
| TrialReminderPercentage | 0.55 | 55% accuracy triggers reminder |
| PresentLeftPresentations | 5 | Target-present trials (left) |
| PresentRightPresentations | 5 | Target-present trials (right) |
| AbsentPresentations | 10 | Target-absent trials |

---

## Clinical Protocol

- Each session: ~15-20 minutes
- Minimum 36 sessions across 12 levels
- Can be completed in 2-3 weeks if performed daily
- 2-6 sessions per day recommended
- Self-adaptive: limited clinician intervention needed
- Pre- and post-therapy evaluation via cancellation task (Stages 0-3)
