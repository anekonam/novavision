# NovaVision Platform

A modern web-based platform for delivering FDA-cleared vision restoration and compensation therapies to patients with neurological visual impairments.

## About NovaVision

NovaVision offers a portfolio of therapies grounded in neuroplasticity -- using repetitive stimulation to reactivate and strengthen residual visual function in damaged brain areas. The platform serves patients recovering from stroke, traumatic brain injury, and other neurological conditions affecting vision.

### Therapies

| Therapy | Type | Description |
|---------|------|-------------|
| **Vision Restoration Therapy (VRT)** | Restoration | FDA-cleared therapy that expands the visual field by stimulating transition zones between intact and damaged vision. 6-month home-based programme with twice-daily sessions. |
| **NeuroEyeCoach (NEC)** | Compensation | Saccadic training that improves eye movement efficiency through a 12-level adaptive visual search programme. Completable in 2-4 weeks. |
| **NeuroEyeTherapy (NET)** | Restoration | Contrast-based therapy using staircase adaptation to improve visual sensitivity at specific visual field positions. |

## Platform Overview

This repository contains the planning and documentation for the next-generation NovaVision platform, which replaces the existing ASP.NET MVC 4.0 portal and WPF desktop applications with a modern, containerised web application.

### Key Capabilities

- **Web-based therapy delivery** -- all three therapies run in the browser via HTML5 Canvas with sub-millisecond timing precision, eliminating the need for desktop application installation
- **Modern portal** -- React-based patient, clinician, and admin dashboards with full accessibility for vision-impaired users
- **Container-first deployment** -- `docker compose up` runs the entire platform; supports cloud SaaS, cloud-hosted centres, and on-premise Windows Server deployments
- **Multi-language** -- full i18n with English and German at launch, infrastructure for 13+ languages
- **Licensing** -- patient and centre licence management with online and offline validation
- **Multi-factor authentication** -- TOTP-based MFA required for clinicians/admins, recommended for patients

### Architecture

```
┌─────────────────────────────────────────────┐
│            React SPA (TypeScript)            │
│   Portal UI  |  Dashboards  |  Therapy      │
│              |              |  Canvas Engine │
└──────────────────────┬──────────────────────┘
                       │ HTTPS
┌──────────────────────┴──────────────────────┐
│         ASP.NET Core 10 Web API              │
│  Identity | Therapy Modules | Reporting      │
│  (Modular Monolith)                          │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────┴──────────────────────┐
│              SQL Server 2022                 │
└──────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | .NET 10 LTS, ASP.NET Core Web API, EF Core, Hangfire |
| Frontend | React 18+, TypeScript, Vite, Tailwind CSS, Radix UI |
| Therapy Engine | HTML5 Canvas 2D, `performance.now()`, `requestAnimationFrame` |
| Database | SQL Server 2022 |
| Auth | ASP.NET Core Identity, JWT, TOTP MFA |
| Deployment | Docker, docker-compose (dev / cloud / on-premise) |
| Testing | xUnit, Testcontainers, Vitest, Playwright, axe-core |

## Documentation

| Document | Description |
|----------|-------------|
| [NovaVision.md](docs/NovaVision.md) | Company and therapy background -- clinical evidence, how therapies work, commercial models |
| [strategy-poc.md](docs/strategy-poc.md) | PoC strategy -- scope, success criteria, 30-minute demo script for client buy-in |
| [architecture-poc.md](docs/architecture-poc.md) | Architecture -- solution structure, therapy engine design, containerization, API design |
| [technology-stack.md](docs/technology-stack.md) | Technology choices -- rationale, containerization strategy, browser support |
| [testing-strategy.md](docs/testing-strategy.md) | Testing -- unit, integration, therapy precision, E2E, accessibility, performance, security |

## Project Tracking

Work is tracked via [GitHub Issues](https://github.com/anekonam/novavision/issues) organised into milestones:

| Milestone | Issues | Description |
|-----------|--------|-------------|
| [Phase 0: Portal Foundation](https://github.com/anekonam/novavision/milestone/1) | #1-#8, #26-#29, #35-#36 | .NET 10 solution, Docker, React SPA, database, auth + MFA, dashboards, CI/CD, i18n, licensing, test infra |
| [Phase 1: Therapy Canvas Engine](https://github.com/anekonam/novavision/milestone/2) | #9-#16, #30 | Canvas core, stimulus/fixation rendering, timing, input, grid system, calibration, session recording, engine tests |
| [Phase 2: NeuroEyeCoach Web](https://github.com/anekonam/novavision/milestone/3) | #17 | 12-level adaptive visual search therapy |
| [Phase 3: VRT Web](https://github.com/anekonam/novavision/milestone/4) | #18-#21 | Status/Progress/Rapid blocks, visual field mapping, progress reporting |
| [Phase 4: NeuroEyeTherapy Web](https://github.com/anekonam/novavision/milestone/5) | #22 | Contrast targets with staircase adaptation |
| [Phase 5: Integration & Validation](https://github.com/anekonam/novavision/milestone/6) | #23-#25, #31-#34 | Timing precision, WPF equivalence, E2E flows, accessibility, performance, security |

## Getting Started

> **Note:** The application is not yet implemented. The sections below describe the target development workflow.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine on Linux)
- [.NET 10 SDK](https://dotnet.microsoft.com/download) (for local development without Docker)
- [Node.js 22+](https://nodejs.org/) (for frontend development)

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/anekonam/novavision.git
cd novavision

# Start the full platform
docker compose up

# Platform available at:
#   Web portal:  https://localhost:443
#   API:         https://localhost:5000
#   Seq logs:    http://localhost:5341
```

### Development

```bash
# Backend
cd src/NovaVision.Api
dotnet run

# Frontend (separate terminal)
cd src/web
npm install
npm run dev

# Run tests
dotnet test
npm run test
npm run test:e2e
```

### On-Premise Centre Deployment

```powershell
# Single command to deploy at a medical centre
./install.ps1 -CentreName "Berlin Rehabilitation Centre" -AdminEmail "admin@berlin-rehab.de"
```

## Future Roadmap

The PoC establishes the foundation. The full evolution programme adds:

- **AI therapy recommendations** -- ML-driven parameter tuning with clinician override (replacing manual monthly adjustments)
- **SignalR real-time monitoring** -- clinicians observe live patient therapy sessions
- **Multi-tenant SaaS** -- shared infrastructure with row-level data isolation
- **B2C retail mode** -- patient self-service with online payment
- **Data migration** -- port existing patients from the legacy platform
- **FDA/HIPAA/GDPR compliance hardening** -- 21 CFR Part 11 audit trails, electronic signatures, encryption at rest

See the full evolution plan at [plans/distributed-growing-phoenix.md](C:\Users\ArrashNekonam\.claude\plans\distributed-growing-phoenix.md).

## Licence

Proprietary. All rights reserved.
