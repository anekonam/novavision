# NovaVision PoC - Testing Strategy

## Context

The existing NovaVisionApp has **zero automated tests** -- no unit tests, no integration tests, no test frameworks. This is a significant risk for FDA-regulated medical device software where IEC 62304 requires documented verification at every level.

The new platform must have comprehensive testing from day one. Every layer of the application -- from therapy timing precision to API contracts to accessibility compliance -- must be validated automatically and continuously.

## Testing Pyramid

```
                    ┌─────────────┐
                    │   Manual    │  Exploratory, usability,
                    │  Testing    │  clinical validation
                    ├─────────────┤
                  ┌─┤  E2E Tests  ├─┐  Playwright: full patient/clinician
                  │ │  (Browser)  │ │  flows through real browser
                  │ ├─────────────┤ │
                ┌─┤ │  Therapy    │ ├─┐  Canvas timing validation,
                │ │ │  Precision  │ │ │  WPF equivalence, cross-browser
                │ │ ├─────────────┤ │ │
              ┌─┤ │ │ Integration │ │ ├─┐  API tests against real DB,
              │ │ │ │   Tests    │ │ │ │  auth flows, data persistence
              │ │ │ ├─────────────┤ │ │ │
            ┌─┤ │ │ │   Unit     │ │ │ ├─┐  Therapy logic, grid math,
            │ │ │ │ │   Tests    │ │ │ │ │  calibration, staircase,
            │ │ │ │ │            │ │ │ │ │  renderers, state machines
            └─┴─┴─┴─┴────────────┴─┴─┴─┴─┘
              ~60%    ~20%    ~10%   ~5%  ~5%
```

## Test Categories

### 1. Unit Tests

**Backend (.NET -- xUnit + FluentAssertions)**

| Module | What to Test | Example |
|--------|-------------|---------|
| `Therapy.Vrt` | Grid coordinate math, therapy area parsing, block result aggregation, visual field map generation | `GridSystem.CellToDegrees(9, 7)` returns `(0, 0)` for centre cell |
| `Therapy.Nec` | Level progression logic, adaptive difficulty rules, trial scoring | Advancing from level 5 to 6 when accuracy > 80% over 3 sessions |
| `Therapy.Net` | Staircase contrast adaptation, threshold estimation, target normalisation | Contrast decreases by step after correct detection |
| `Therapy.Common` | DegreePixels calculation, calibration validation, session timing validation | `DegreePixels(30cm, 37.8px/cm) = 19.8` |
| `Identity` | JWT token generation/validation, role assignment, password policy | Token with "Patient" role cannot access clinician endpoints |
| `Reporting` | Result aggregation, statistics calculation, PDF content correctness | VRT block with 200/284 stimuli correct = 70.4% detection rate |
| `Infrastructure` | Entity validation, query filters, data mapping | Therapy results round-trip through DB correctly |

**Frontend (TypeScript -- Vitest)**

| Module | What to Test | Example |
|--------|-------------|---------|
| `TherapyCanvas` | Coordinate conversion, DPI scaling math | `degreesToPixels(1, 0)` at 50 DegreePixels = `(50, 0)` relative to centre |
| `StimulusRenderer` | Shape geometry calculations, size conversion | 0.15° stimulus at 50 px/deg on 2x DPI = 15px canvas pixels |
| `TimingEngine` | State machine transitions, interval scheduling logic | After stimulus display, next stimulus scheduled within min/max interval |
| `InputHandler` | Response classification logic | Response at 120ms after stimulus = "too early" (< 150ms minimum) |
| `GridSystem` | Cell-to-degree mapping, quadrant classification, therapy area parsing | Cell (0, 0) = top-left quadrant, cell (18, 14) = bottom-right |
| `NecSessionEngine` | Level configuration, difficulty parameters, scoring | Level 1: 5 distractors, low similarity; Level 12: 20 distractors, high similarity |
| `NetSessionEngine` | Staircase state machine, contrast step logic | 3 correct → contrast decreases; 1 incorrect → contrast increases |
| `SessionRecorder` | Event serialisation, IndexedDB operations | Session with 500 events serialises and deserialises correctly |
| `CalibrationValidator` | Display fingerprint comparison | Changed `devicePixelRatio` triggers recalibration prompt |

**Coverage Target: 80% line coverage for therapy logic modules, 60% overall**

---

### 2. Integration Tests

**Backend API Integration (xUnit + WebApplicationFactory + Testcontainers)**

Uses `WebApplicationFactory<Program>` to spin up the real API with a real SQL Server database (via Testcontainers Docker) for each test class.

| Test Area | What to Validate | Example |
|-----------|-----------------|---------|
| **Auth Flow** | Register → login → get JWT → access protected endpoint → refresh → logout | Patient registers, receives JWT, accesses `/api/therapies/vrt`, refresh token works, logout invalidates refresh |
| **Role Authorization** | Each endpoint enforces correct role | Patient cannot `POST /api/patients`, clinician cannot `GET /api/admin/users` |
| **VRT Therapy CRUD** | Create therapy → configure block → submit results → read results | Clinician creates VRT therapy, assigns to patient, patient submits block results, clinician reads results |
| **NEC Therapy Flow** | Start NEC → submit sessions → level progression → completion | Patient completes 3 sessions at level 1 with >80% accuracy → advances to level 2 |
| **NET Therapy Flow** | Start NET → submit sessions → contrast adaptation persists | Patient submits session, contrast levels updated per target, next session returns updated contrasts |
| **Calibration Persistence** | Save calibration → retrieve → validate fingerprint | Patient saves calibration at DegreePixels=50, retrieves it, changes display triggers recalibration |
| **Data Integrity** | Results round-trip correctly through API → DB → API | Submit VRT block with 284 stimuli, read back, all 284 stimulus results present with correct values |
| **Concurrent Sessions** | Multiple patients running sessions simultaneously | 10 patients submitting results concurrently, no data cross-contamination |
| **Edge Cases** | Empty results, maximum payload, invalid data | Submit session with 0 stimuli (rejected), submit with 10000 stimuli (accepted), submit with negative response time (rejected) |

**Database Integration (EF Core + Testcontainers)**

| Test Area | What to Validate |
|-----------|-----------------|
| Migrations | `dotnet ef database update` succeeds on empty database |
| Seed data | Seed creates valid test users and therapy configurations |
| Cascade deletes | Deleting a therapy cascades to blocks and results |
| Constraints | Unique email enforced, FK constraints prevent orphan records |
| Query performance | Key queries (patient list, therapy results) execute within 100ms on test dataset |

---

### 3. Therapy Precision Tests

These are specialised tests that validate the therapy engine produces clinically equivalent results to the existing WPF desktop applications. They are the most critical tests for FDA validation.

**Timing Precision Suite**

| Test | Method | Pass Criteria |
|------|--------|---------------|
| **Stimulus Duration Accuracy** | Present 1000 stimuli at 200ms, measure actual display duration via `requestAnimationFrame` timestamps | Mean duration: 200ms +/- 3ms, Std dev: < 5ms |
| **Reaction Time Precision** | Simulate key press at known offset from stimulus, measure recorded reaction time | Measured RT within 2ms of actual RT |
| **Inter-Stimulus Interval** | Measure gap between 1000 consecutive stimuli with min=1000ms, max=2000ms | All intervals within [1000, 2000]ms range |
| **Frame Drop Detection** | Run 30-minute simulated session, count frames where deltaTime > 20ms | Frame drop rate < 0.5% |
| **High-DPI Rendering** | Render stimuli at devicePixelRatio 1x, 2x, 3x, measure rendered pixel size | Stimulus size in physical pixels matches DegreePixels calculation |
| **Refresh Rate Independence** | Run timing suite at 60Hz, 120Hz, 144Hz | Timing precision consistent across refresh rates |

**VRT Equivalence Suite**

| Test | Method | Pass Criteria |
|------|--------|---------------|
| **Grid Coordinate Mapping** | Compare web GridSystem output vs WPF grid calculation for all 285 cells | All cell positions match within 0.01° |
| **Status Block Simulation** | Run identical Status block on web and WPF with automated input | Per-cell detection maps identical, aggregate stats match |
| **Visual Field Map Rendering** | Generate visual field map from known result data on web and WPF | Maps visually identical (pixel comparison with <1% difference) |
| **Fixation Accuracy Calculation** | Known fixation input sequence, compare accuracy calculation | Fixation accuracy percentage matches to 2 decimal places |
| **DegreePixels Calibration** | Same physical setup, calibrate on web and WPF | DegreePixels within 2% |

**NEC Equivalence Suite**

| Test | Method | Pass Criteria |
|------|--------|---------------|
| **Level Progression** | Same session results fed to web and WPF progression logic | Level transitions occur at same points |
| **Difficulty Parameters** | Compare level configs (distractor count, similarity, positions) | All 12 levels match WPF configuration |
| **Scoring** | Same trial results, compare calculated scores | Scores match exactly |

**NET Equivalence Suite**

| Test | Method | Pass Criteria |
|------|--------|---------------|
| **Staircase Convergence** | Same response sequence, compare contrast level trajectories | Contrast levels match after each trial |
| **Threshold Estimation** | Same reversal sequence, compare estimated threshold | Threshold within 0.5 contrast units |
| **Multi-Target Independence** | Verify per-target adaptation is independent | Target 1 contrast change does not affect Target 2 |

---

### 4. End-to-End Tests (Playwright)

Full browser automation testing real user flows against the deployed application (using `docker-compose.test.yml`).

**Patient Flows**

| Flow | Steps |
|------|-------|
| **Registration → First Session** | Register → verify email → login → complete calibration → start NEC session → complete trial → view results |
| **VRT Full Session** | Login → start VRT Status block → respond to stimuli (automated via keyboard injection) → complete block → view visual field map |
| **NET Session** | Login → start NET session → respond to contrast targets → session completes → view contrast progression |
| **Session Resilience** | Start session → disconnect network → continue session → reconnect → verify data syncs |
| **Multi-Session Progress** | Complete 5 NEC sessions → verify level progression → view progress charts |

**Clinician Flows**

| Flow | Steps |
|------|-------|
| **Patient Management** | Login as clinician → create patient → assign VRT therapy → configure therapy area → view patient list |
| **Therapy Configuration** | Select patient → view VRT progress → edit therapy area on grid → save → verify patient receives updated config |
| **Results Review** | Login → select patient → view VRT visual field map → view NEC level progress → view NET contrast trends |
| **Report Generation** | Select patient → generate PDF report → verify report contains correct data and visual field maps |

**Admin Flows**

| Flow | Steps |
|------|-------|
| **User Management** | Login as admin → create clinician → create patient → assign patient to clinician → disable user → verify disabled user cannot login |

**Cross-Browser Matrix**

| Browser | Windows | macOS | Linux |
|---------|---------|-------|-------|
| Chrome 120+ | Yes | Yes | Yes |
| Edge 120+ | Yes | - | - |
| Firefox 120+ | Yes | Yes | Yes |
| Safari 17+ | - | Yes | - |

---

### 5. Accessibility Tests

| Test Type | Tool | What |
|-----------|------|------|
| **Automated WCAG scan** | axe-core (via Playwright) | Run on every page, zero AA violations |
| **Keyboard navigation** | Playwright | Tab through all interactive elements, verify focus order and visibility |
| **Colour contrast** | axe-core | All text meets 4.5:1 (AA) minimum, therapy content meets 7:1 (AAA) |
| **Screen reader** | Manual (NVDA on Windows, VoiceOver on macOS) | Portal navigation, form completion, results reading |
| **Touch targets** | Automated CSS check | All interactive elements >= 48x48px |
| **Font sizing** | Automated CSS check | No text below 16px, therapy content >= 18px |
| **Focus indicators** | Visual review | All focusable elements have visible focus ring |
| **Motion** | `prefers-reduced-motion` | Animations respect user preference |

---

### 6. Performance Tests

| Test | Tool | Pass Criteria |
|------|------|---------------|
| **API Response Time** | k6 or Artillery | p95 < 100ms for therapy data endpoints, p95 < 500ms for report generation |
| **Concurrent Sessions** | k6 | 100 concurrent therapy sessions submitting results, no errors, p95 < 200ms |
| **Canvas Frame Rate** | Custom harness | Maintain 60fps during therapy session with 20+ on-screen elements (NEC) |
| **Database Query Performance** | EF Core logging + query analysis | No query > 100ms on test dataset (1000 patients, 100k results) |
| **Container Startup** | Docker | Full stack from `docker compose up` to healthy < 60 seconds |
| **Bundle Size** | Vite build analysis | React SPA < 500KB gzipped initial load, therapy engine < 200KB |
| **Memory** | Browser DevTools profiling | No memory leaks during 30-minute therapy session (stable heap) |

---

### 7. Security Tests

| Test | Tool/Method | What |
|------|-------------|------|
| **Dependency vulnerabilities** | `dotnet list package --vulnerable`, `npm audit` | Zero known high/critical vulnerabilities |
| **OWASP Top 10** | OWASP ZAP (DAST) against staging | Zero high-severity findings |
| **SQL injection** | Automated via ZAP + manual review of raw SQL (if any) | EF Core parameterisation verified |
| **XSS** | ZAP + manual review of React rendering | No dangerouslySetInnerHTML without sanitisation |
| **Auth bypass** | Playwright tests attempting cross-role access | Patient cannot access clinician/admin endpoints |
| **Token security** | Verify JWT not in localStorage, refresh token HttpOnly | Tokens stored correctly |
| **CORS** | Verify CORS policy rejects unexpected origins | Only allowed origins accepted |
| **Rate limiting** | Automated repeated auth attempts | Lockout after N failed attempts |

---

### 8. Contract Tests

| Test | Purpose |
|------|---------|
| **OpenAPI Schema Validation** | Generated OpenAPI spec matches actual API responses (no drift) |
| **API Client Codegen** | Generated TypeScript client compiles and matches API |
| **Database Schema** | EF Core model matches actual DB schema (no pending migrations) |
| **Therapy Config Contract** | VRT block config shape matches between API response and Canvas engine expectation |
| **Session Result Contract** | Session result shape submitted by Canvas engine matches API DTO |

---

## Test Infrastructure

### Backend Test Projects
```
tests/
├── NovaVision.Unit.Tests/             -- All backend unit tests
│   ├── Therapy.Vrt/                   -- VRT logic tests
│   ├── Therapy.Nec/                   -- NEC logic tests
│   ├── Therapy.Net/                   -- NET logic tests
│   ├── Therapy.Common/                -- Calibration, timing validation
│   ├── Identity/                      -- Auth logic tests
│   └── Reporting/                     -- Report generation tests
├── NovaVision.Integration.Tests/      -- API + DB integration tests
│   ├── Api/                           -- WebApplicationFactory API tests
│   ├── Database/                      -- Migration and query tests
│   └── TestFixtures/                  -- Shared test setup (Testcontainers)
└── NovaVision.Precision.Tests/        -- Therapy equivalence (run manually or in CI with special hardware)
```

### Frontend Test Structure
```
src/web/
├── src/
│   ├── therapy-engine/
│   │   ├── core/__tests__/            -- Canvas, renderer, timing, input unit tests
│   │   ├── therapies/__tests__/       -- VRT, NEC, NET session engine tests
│   │   ├── calibration/__tests__/     -- Calibration calculation tests
│   │   └── session/__tests__/         -- Recorder, sync, state tests
│   ├── features/
│   │   ├── auth/__tests__/            -- Auth flow component tests
│   │   ├── patient/__tests__/         -- Patient dashboard tests
│   │   └── clinician/__tests__/       -- Clinician dashboard tests
│   └── components/__tests__/          -- Shared component tests
├── e2e/                               -- Playwright E2E tests
│   ├── patient-flows/
│   ├── clinician-flows/
│   ├── admin-flows/
│   ├── therapy-sessions/
│   ├── accessibility/
│   └── fixtures/                      -- Test data, page objects
└── vitest.config.ts
```

### Testcontainers (Integration Tests)

Integration tests use [Testcontainers](https://dotnet.testcontainers.org/) to spin up real SQL Server and Redis containers per test class:

```csharp
public class VrtApiTests : IAsyncLifetime
{
    private readonly MsSqlContainer _sqlContainer = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .Build();

    public async Task InitializeAsync()
    {
        await _sqlContainer.StartAsync();
        // Apply EF Core migrations to fresh database
        // Seed test data
    }

    [Fact]
    public async Task SubmitVrtBlockResult_WithValidData_ReturnsCreated()
    {
        // Arrange: create patient with VRT therapy
        // Act: POST /api/therapies/vrt/blocks/{id}/results
        // Assert: 201 Created, results persisted correctly
    }
}
```

### CI Pipeline Integration

```yaml
# GitHub Actions workflow
test:
  steps:
    - dotnet test NovaVision.Unit.Tests          # Fast, no dependencies
    - dotnet test NovaVision.Integration.Tests    # Needs Docker (Testcontainers)
    - npm run test                                # Frontend unit tests (Vitest)
    - npm run test:e2e                            # Playwright against docker-compose.test.yml
    - npm run test:accessibility                  # axe-core scan via Playwright
    - npm run test:timing                         # Therapy precision tests (headless Chrome)
```

### Test Data Management

| Data Type | Strategy |
|-----------|----------|
| **Unit test data** | Inline test fixtures, builder pattern for complex objects |
| **Integration test data** | Seeded per-test-class via EF Core, isolated per test (Testcontainers) |
| **E2E test data** | Seeded via API calls in test setup, cleaned up in teardown |
| **Therapy precision data** | Golden dataset: known stimulus sequences with expected results |
| **Performance test data** | Generated: 1000 patients, 100k therapy results via data generator script |

### Test Reporting

| Report | Format | Audience |
|--------|--------|----------|
| Unit + Integration results | JUnit XML → GitHub Actions summary | Developers |
| E2E results | Playwright HTML report with screenshots/video | Developers + QA |
| Coverage | Coverlet → Codecov / GitHub summary | Developers |
| Accessibility | axe-core JSON → HTML report | Developers + Compliance |
| Timing precision | Custom CSV + charts | Clinical validation team |
| Security scan | ZAP HTML report | Security team |

---

## Test Execution Schedule

| When | What Runs | Duration |
|------|-----------|----------|
| **Every commit (PR)** | Unit tests (backend + frontend) | ~2 min |
| **Every PR** | Unit + Integration + E2E + Accessibility | ~10 min |
| **Nightly** | Full suite + Performance + Security scan | ~30 min |
| **Before release** | Full suite + Timing precision + Manual exploratory | ~2 hours |
| **Before FDA submission** | Full suite + WPF equivalence + Clinical validation dataset | Manual review |

---

## Mocking Strategy

| What | Mock? | Why |
|------|-------|-----|
| Database (unit tests) | Yes -- in-memory or mock repository | Unit tests must be fast and isolated |
| Database (integration tests) | **No** -- real SQL Server via Testcontainers | Must validate real queries, constraints, migrations |
| External APIs (email, payment) | Yes -- mock/stub | No external dependencies in tests |
| Canvas rendering (unit tests) | Yes -- mock Canvas context | Test rendering logic without actual Canvas |
| Browser APIs (unit tests) | Yes -- mock `performance.now()`, `requestAnimationFrame` | Deterministic timing for logic tests |
| Browser APIs (precision tests) | **No** -- real browser | Must validate actual timing behaviour |
| IndexedDB (unit tests) | Yes -- fake-indexeddb | Test recording logic without browser |
| IndexedDB (E2E tests) | **No** -- real browser IndexedDB | Must validate persistence behaviour |
