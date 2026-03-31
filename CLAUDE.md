# CLAUDE.md - NovaVision Platform

## Project Overview
NovaVision is an FDA-cleared medical technology platform delivering vision restoration and compensation therapies (VRT, NeuroEyeCoach, NeuroEyeTherapy) to patients with neurological visual impairments. This repo is a ground-up rebuild from legacy ASP.NET MVC + WPF desktop apps to a modern web-based platform.

## Tech Stack
- **Backend**: .NET 10 LTS, ASP.NET Core Web API, EF Core, SQL Server 2022
- **Frontend**: React 18+, TypeScript, Vite, Tailwind CSS, Radix UI
- **Auth**: ASP.NET Core Identity, JWT, TOTP MFA
- **Testing**: xUnit + FluentAssertions + Testcontainers (backend), Vitest + Testing Library (frontend)
- **Deployment**: Docker (docker-compose for dev, cloud, on-premise)
- **CI/CD**: GitHub Actions

## Solution Structure
```
src/
  NovaVision.Api/              -- ASP.NET Core host, controllers, middleware
  NovaVision.Core/             -- Shared entities, enums, interfaces
  NovaVision.Identity/         -- ApplicationUser, DTOs, TokenService
  NovaVision.Therapy.Common/   -- Shared therapy domain (calibration, sessions)
  NovaVision.Therapy.Vrt/      -- VRT entities (Therapy, Block, BlockResult, StimulusResult, FixationResult)
  NovaVision.Therapy.Nec/      -- NEC entities (Therapy, TrialResult)
  NovaVision.Therapy.Net/      -- NET entities (Therapy, Target, SessionResult, SessionResultTarget)
  NovaVision.Reporting/        -- PDF generation, progress reports
  NovaVision.Infrastructure/   -- EF Core DbContext, migrations
  web/                         -- React SPA (Vite + TypeScript)
tests/
  NovaVision.Unit.Tests/       -- Backend unit tests (therapy logic, calibration, grid math)
  NovaVision.Integration.Tests/ -- API integration tests (Testcontainers SQL Server)
```

## Commands
- `dotnet build` -- build entire solution
- `dotnet test` -- run all backend tests (integration tests need Docker running)
- `dotnet test tests/NovaVision.Unit.Tests` -- unit tests only (no Docker needed)
- `cd src/web && npm run dev` -- start React dev server (port 5173)
- `cd src/web && npm run test` -- run frontend tests (Vitest)
- `cd src/web && npm run build` -- production build
- `docker compose up` -- start full dev stack (API + web + SQL Server + Redis + Seq)

## Key Conventions
- **Modular monolith**: each therapy type is its own project/module. Don't add cross-module dependencies.
- **Entities**: inherit from `BaseEntity` for audit fields (CreatedAt, CreatedBy, ModifiedAt, ModifiedBy)
- **Enums stored as strings**: all EF Core enum conversions use `.HasConversion<string>()`
- **Therapy results are structured data**: never use BinaryFormatter. Store as normalized tables or JSON.
- **i18n**: all user-facing strings must go through react-i18next (frontend) or CultureMiddleware (backend). English (en-GB) and German (de-DE) are the two required languages.
- **Accessibility**: minimum 48px touch targets, 18px base font, 7:1 contrast ratio (WCAG AAA). Patients have vision impairments.
- **No hardcoded secrets**: connection strings and JWT secrets come from configuration/env vars, never source code.

## Testing Requirements
- Backend therapy logic must have unit tests (grid math, calibration, staircase adaptation, level progression)
- API endpoints must have integration tests using Testcontainers
- Frontend therapy engine logic must have Vitest tests mirroring backend test coverage
- All tests must pass before merging to main

## Existing Legacy Codebase
The existing platform is at `D:\Working\NovaVisionApp` (not this repo). Key reference files:
- `NovaVision.App.DataAccess/Linq/Model.dbml` -- original 23-table schema
- `VisualRestorationTherapy.Client/ViewModels/Therapy/TherapySessionTrialViewModel.cs` -- VRT stimulus logic
- `NovaVision.App.Web/ControllersApi/VrtController.cs` -- VRT API contract
- `NovaVision.App.Model/Vrt/UserVrtTherapyBlockResultModel.cs` -- VRT result model (BinaryFormatter serialized)

## Documentation
- `docs/strategy-poc.md` -- PoC scope, success criteria, demo script
- `docs/architecture-poc.md` -- system architecture, therapy engine design
- `docs/technology-stack.md` -- tech choices, containerization strategy
- `docs/testing-strategy.md` -- full test pyramid specification
- `docs/design-brief.md` -- Figma UI/UX design brief with accessibility requirements
- `docs/NovaVision.md` -- company and therapy clinical background
