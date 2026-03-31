# NovaVision PoC - Architecture

## Overview

The PoC is a clean-room rebuild using a modern stack. It is **not** an incremental upgrade of the existing ASP.NET MVC 4.0 codebase -- it is a new application built from scratch, designed from day one to support the full future roadmap (multi-tenancy, AI, SignalR, on-premise deployment) even though those features are not implemented in the PoC.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React SPA (Vite)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐ │
│  │  Portal   │ │ Dashboards│ │   Therapy Engine         │ │
│  │  (Auth,   │ │ (Patient, │ │   (Canvas, Timing,       │ │
│  │  Layout)  │ │ Clinician,│ │   Calibration, Sessions) │ │
│  │          │ │  Admin)   │ │                          │ │
│  └──────────┘ └──────────┘ └──────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (REST + future SignalR)
┌────────────────────────┴────────────────────────────────┐
│                 ASP.NET Core 8 Web API                   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Modules (Modular Monolith)                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │ │
│  │  │ Identity │ │ Therapy  │ │ Reporting│            │ │
│  │  │ (Auth,   │ │ (VRT,NEC,│ │ (Results,│            │ │
│  │  │  Users,  │ │  NET,    │ │  Charts, │            │ │
│  │  │  Roles)  │ │  Common) │ │  PDF)    │            │ │
│  │  └──────────┘ └──────────┘ └──────────┘            │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Infrastructure (EF Core, Blob Storage, Email)      │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                   SQL Server 2022                        │
│  (Containerized in dev, managed service in cloud)        │
└─────────────────────────────────────────────────────────┘
```

## Solution Structure

```
NovaVision/
├── src/
│   ├── NovaVision.Api/                 -- ASP.NET Core host, Program.cs, middleware
│   ├── NovaVision.Core/                -- Shared entities, interfaces, enums, constants
│   ├── NovaVision.Identity/            -- ASP.NET Core Identity, JWT, auth endpoints
│   ├── NovaVision.Therapy.Common/      -- Shared therapy: calibration, sessions, timing
│   ├── NovaVision.Therapy.Vrt/         -- VRT domain: blocks, schedules, grid, stimuli
│   ├── NovaVision.Therapy.Nec/         -- NEC domain: levels, trials, visual search
│   ├── NovaVision.Therapy.Net/         -- NET domain: targets, contrast, staircase
│   ├── NovaVision.Reporting/           -- Results, progress, PDF generation
│   └── NovaVision.Infrastructure/      -- EF Core DbContext, migrations, blob storage
├── src/web/                            -- React SPA
│   ├── src/
│   │   ├── app/                        -- App shell, routing, providers
│   │   ├── features/
│   │   │   ├── auth/                   -- Login, register, password reset
│   │   │   ├── patient/                -- Patient dashboard, therapy list
│   │   │   ├── clinician/              -- Clinician dashboard, patient management
│   │   │   ├── admin/                  -- Admin dashboard, user management
│   │   │   └── therapy/                -- Therapy session UI, results views
│   │   ├── therapy-engine/             -- Canvas rendering engine (see below)
│   │   ├── components/                 -- Shared UI components
│   │   ├── hooks/                      -- Shared React hooks
│   │   ├── api/                        -- API client (generated from OpenAPI)
│   │   ├── i18n/                       -- Internationalization setup
│   │   └── types/                      -- Shared TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── tests/
│   ├── NovaVision.Api.Tests/
│   ├── NovaVision.Therapy.Tests/       -- Therapy logic unit tests
│   └── NovaVision.Integration.Tests/   -- API integration tests
├── NovaVision.sln
├── Dockerfile.api                      -- Multi-stage build for API
├── Dockerfile.web                      -- nginx + React SPA
├── Dockerfile.migrate                  -- EF Core migration runner
├── docker-compose.yml                  -- Development (full stack, hot reload)
├── docker-compose.cloud.yml            -- Cloud override (external DB/Redis)
├── docker-compose.onprem.yml           -- On-premise (bundled, TLS, Watchtower)
└── docker-compose.test.yml             -- CI/CD test environment
```

## Therapy Canvas Engine Architecture

The therapy engine is the most critical component. It is a standalone TypeScript module within the React SPA that handles all real-time therapy rendering and interaction.

```
therapy-engine/
├── core/
│   ├── TherapyCanvas.ts            -- Canvas lifecycle, DPI scaling, coordinate system
│   │                                  Creates and manages the HTML5 Canvas element
│   │                                  Handles devicePixelRatio for crisp rendering
│   │                                  Provides degree-to-pixel coordinate mapping
│   │
│   ├── StimulusRenderer.ts         -- Shape drawing: circle, square, diamond, triangle
│   │                                  All sizes specified in visual degrees
│   │                                  Converted to pixels via DegreePixels calibration
│   │                                  Anti-aliased rendering with sub-pixel accuracy
│   │
│   ├── FixationRenderer.ts         -- Central fixation point rendering
│   │                                  Shape changes (circle ↔ cross ↔ square)
│   │                                  Colour changes for fixation monitoring
│   │
│   ├── GridSystem.ts               -- 19x15 visual field grid
│   │                                  Maps grid positions to visual degree coordinates
│   │                                  Supports configurable grid angles (43° default)
│   │                                  Therapy area definition and highlighting
│   │
│   ├── TimingEngine.ts             -- requestAnimationFrame render loop
│   │                                  performance.now() for all timestamps
│   │                                  Frame-counted stimulus duration (not setTimeout)
│   │                                  Configurable intervals with jitter
│   │
│   └── InputHandler.ts             -- Keyboard and mouse event capture
│                                      High-resolution event.timeStamp
│                                      Response window enforcement (min/max)
│                                      False positive detection
│
├── therapies/
│   ├── VrtSessionEngine.ts         -- VRT session orchestration
│   │                                  Status block: full-field diagnostic perimetry
│   │                                  Progress block: targeted therapy area stimulation
│   │                                  Rapid block: directional rapid stimulation
│   │                                  Fixation monitoring with accuracy tracking
│   │                                  Block result aggregation
│   │
│   ├── NecSessionEngine.ts         -- NEC session orchestration
│   │                                  12 difficulty levels
│   │                                  Visual search paradigm (target among distractors)
│   │                                  Adaptive difficulty based on performance
│   │                                  Position, distractor count, similarity progression
│   │
│   └── NetSessionEngine.ts         -- NET session orchestration
│                                      5-target contrast tracking
│                                      Staircase contrast adaptation algorithm
│                                      Per-target position and diameter management
│                                      Practice mode support
│
├── calibration/
│   ├── ScreenCalibration.ts        -- Credit-card reference calibration
│   │                                  Physical size estimation via user adjustment
│   │                                  DegreePixels calculation from distance + px/cm
│   │                                  Display fingerprint for recalibration detection
│   │
│   └── CalibrationValidator.ts     -- Validates calibration is still current
│                                      Detects monitor/resolution changes
│                                      Prompts recalibration when needed
│
├── session/
│   ├── SessionRecorder.ts          -- Records all session events to IndexedDB
│   │                                  Stimulus presentations, responses, fixation events
│   │                                  Timestamps, positions, correctness
│   │                                  Resilient to network interruption
│   │
│   ├── SessionSync.ts              -- Syncs completed sessions to server
│   │                                  Retry with exponential backoff on failure
│   │                                  Queue management for offline sessions
│   │
│   └── SessionState.ts             -- In-memory session state management
│                                      Current block, stimulus index, running totals
│                                      Pause/resume support
│
└── types/
    ├── stimulus.ts                 -- StimulusConfig, StimulusResult, Shape, Colour
    ├── fixation.ts                 -- FixationConfig, FixationResult
    ├── session.ts                  -- SessionConfig, SessionResult, SessionEvent
    ├── calibration.ts              -- CalibrationData, DisplayFingerprint
    └── grid.ts                     -- GridConfig, GridCell, TherapyArea
```

## Data Model (PoC)

The PoC database schema mirrors the existing NovaVisionApp schema structure but is implemented in EF Core code-first. Key entities:

### Users & Auth
- `User` -- identity, email, name, role, culture
- `UserDetail` -- extended profile (demographics, therapy settings, calibration)
- `UserRole` -- enum: Patient, Clinician, Admin

### Therapy Configuration
- `VrtTherapy` -- VRT program for a patient (grid config, schedule)
- `VrtTherapyBlock` -- individual block definition (type, therapy area, stimuli config)
- `NecTherapy` -- NEC program (current level, completion status)
- `NetTherapy` -- NET program (target configurations)
- `NetTherapyTarget` -- normalized per-target config (position, contrast, diameter)

### Therapy Results
- `VrtBlockResult` -- per-block aggregates (stimuli correct/presented, fixation accuracy, response times)
- `VrtStimulusResult` -- per-stimulus detail (grid position, correct, response time, quadrant)
- `VrtFixationResult` -- per-fixation-change detail (correct, response time)
- `NecTrialResult` -- per-trial detail (level, target present, correct, response time)
- `NetSessionResult` -- per-session detail (per-target contrast, accuracy)
- `NetSessionResultTarget` -- normalized per-target result

### Screen Calibration
- `ScreenCalibration` -- DegreePixels, distance, screen dimensions, display fingerprint, timestamp

## API Design

RESTful API with OpenAPI documentation. Key endpoint groups:

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

GET    /api/patients                          -- clinician: list patients
GET    /api/patients/{id}                     -- clinician: patient detail
POST   /api/patients/{id}/assign-therapy      -- clinician: assign therapy

GET    /api/therapies/vrt                     -- patient: get my VRT therapy
GET    /api/therapies/vrt/blocks/{blockId}    -- patient: get block config
POST   /api/therapies/vrt/blocks/{blockId}/results  -- patient: submit block results
GET    /api/therapies/vrt/results             -- view VRT progress/history

GET    /api/therapies/nec                     -- patient: get my NEC therapy
POST   /api/therapies/nec/sessions            -- patient: submit NEC session results
GET    /api/therapies/nec/results             -- view NEC progress/history

GET    /api/therapies/net                     -- patient: get my NET therapy
POST   /api/therapies/net/sessions            -- patient: submit NET session results
GET    /api/therapies/net/results             -- view NET progress/history

POST   /api/calibration                       -- save screen calibration
GET    /api/calibration                       -- get current calibration

GET    /api/admin/users                       -- admin: user management
POST   /api/admin/users
PUT    /api/admin/users/{id}
```

## Authentication

- ASP.NET Core Identity for user management
- JWT Bearer tokens (access: 15 min, refresh: 24 hr)
- Role-based authorization: Patient, Clinician, Admin
- Password hashing: ASP.NET Core Identity default (PBKDF2)
- Multi-Factor Authentication (MFA) via TOTP (authenticator apps):
  - **Required** for Admin and Clinician roles
  - **Recommended** (prompted, deferrable) for Patient role
  - Recovery codes for authenticator loss
  - "Remember this device" (30-day trusted device cookie) to reduce patient friction
- Login flow: credentials → MFA challenge (if enabled) → JWT issued
- Account lockout after 5 failed attempts

## Key Design Decisions

### Why modular monolith?
Single deployable unit simplifies development, debugging, and eventual FDA validation. Module boundaries enforce separation of concerns. Easy to extract modules later if needed.

### Why Canvas 2D over WebGL?
Canvas 2D is simpler, has universal browser support, and provides sufficient precision for the stimulus rendering requirements. WebGL adds complexity without benefit for 2D shape rendering. Canvas 2D anti-aliasing handles sub-pixel rendering adequately.

### Why IndexedDB for session buffering?
Therapy sessions last 15-30 minutes. A network interruption during a session must not lose data. IndexedDB provides persistent, transactional, client-side storage that survives browser crashes and network failures.

### Why separate therapy engine from React?
The therapy engine runs a tight rendering loop (requestAnimationFrame) and must not be affected by React re-renders. It is a pure TypeScript module that mounts on a Canvas element, independent of React's lifecycle. React provides the surrounding UI (session setup, results display) but does not interfere with active therapy rendering.

## Containerization

The platform is container-first. Every deployment mode uses the same container images with different configuration. See [technology-stack.md](technology-stack.md#containerization--deployment-strategy) for full details.

Key principle: `docker compose up` is all it takes to run the full platform in any environment. Centre provisioning is a single command that pulls images and configures the deployment.

### Dockerfiles

**API (multi-stage):**
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish src/NovaVision.Api -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5000
ENTRYPOINT ["dotnet", "NovaVision.Api.dll"]
```

**Web (React SPA):**
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY src/web/package*.json .
RUN npm ci
COPY src/web .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 443
```

**Migration runner:**
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish src/NovaVision.Infrastructure -c Release -o /app

FROM mcr.microsoft.com/dotnet/runtime:10.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "ef", "database", "update"]
```

## Future-Proofing

The PoC architecture is designed so these future features slot in without restructuring:

| Future Feature | How it fits |
|----------------|-------------|
| SignalR real-time monitoring | Add hub to Api, add `RealtimeStreamer.ts` to therapy engine |
| AI recommendations | Add `NovaVision.AI` module, new API endpoints, clinician review UI |
| Multi-tenancy | Add TenantId to entities, EF Core global query filters, tenant middleware |
| On-premise deployment | Same container images, different compose file + env config |
| Cloud centre provisioning | Script creates namespace, deploys compose stack, runs migration container |
| i18n | react-i18next infrastructure in place, add translation JSON files |
| Payment (B2C) | Add payment module, Stripe integration, licence management |
| Data migration | Write migration tool that maps old schema to new EF Core entities |
