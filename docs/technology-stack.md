# NovaVision PoC - Technology Stack

## Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | .NET 10 LTS | 10.x | Current LTS (Nov 2025), cross-platform |
| Web Framework | ASP.NET Core Web API | 10.x | RESTful API endpoints |
| ORM | Entity Framework Core | 10.x | Code-first, migrations, LINQ queries |
| Database | SQL Server | 2022 (LocalDB/Docker for dev) | Primary data store |
| Auth | ASP.NET Core Identity | 10.x | User management, password hashing |
| Auth Tokens | JWT Bearer | - | Stateless API authentication |
| Background Jobs | Hangfire | 1.8+ | Scheduled tasks (therapy checks, notifications) |
| PDF Generation | QuestPDF | 2024.x | Cross-platform report generation |
| Logging | Serilog | 4.x | Structured logging with sinks |
| API Docs | Swashbuckle (OpenAPI) | 6.x | Auto-generated API documentation |
| Mapping | AutoMapper | 13.x | Entity ↔ DTO mapping |
| Validation | FluentValidation | 11.x | Request validation |

## Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React | 18+ | Component-based UI |
| Language | TypeScript | 5.x | Type safety for medical software |
| Build Tool | Vite | 5.x | Fast dev server and builds |
| Routing | React Router | 6.x | SPA navigation |
| State | Zustand | 4.x | Lightweight, therapy session state |
| Styling | Tailwind CSS | 3.x | Utility-first, high-contrast theming |
| UI Primitives | Radix UI | latest | Accessible, unstyled components |
| Charts | Recharts | 2.x | Visual field maps, progress charts |
| Forms | React Hook Form + Zod | latest | Form management with schema validation |
| HTTP | Axios or fetch + OpenAPI codegen | - | Type-safe API client |
| i18n | react-i18next | 14.x | Internationalization (infrastructure for PoC) |
| Therapy Rendering | HTML5 Canvas 2D API | native | Stimulus presentation |
| Timing | performance.now() + rAF | native | Sub-millisecond precision |
| Offline Storage | IndexedDB (via idb) | native | Session buffering |

## Development & Tooling

| Component | Technology | Purpose |
|-----------|-----------|---------|
| IDE | Visual Studio 2022 / VS Code / Rider | .NET + React development |
| Package Manager | NuGet (.NET) + npm (frontend) | Dependency management |
| Containerization | Docker + docker-compose | SQL Server dev environment |
| Testing (.NET) | xUnit + FluentAssertions + Moq | Unit and integration tests |
| Testing (React) | Vitest + React Testing Library | Component and logic tests |
| E2E Testing | Playwright | Cross-browser therapy validation |
| Linting | ESLint + Prettier (frontend), dotnet format (backend) | Code quality |
| API Client Gen | NSwag or openapi-typescript-codegen | Generate typed API client from OpenAPI spec |

## Why These Choices

### .NET 10 LTS over alternatives
- Current LTS release (shipped November 2025, supported through November 2028)
- Existing team expertise (current codebase is .NET Framework)
- ASP.NET Core SignalR for future real-time (native, no third-party)
- EF Core for SQL Server continuity
- Cross-platform: runs on Linux containers (cloud) and Windows (on-premise)
- Performance improvements over .NET 8 (AOT compilation, reduced memory footprint)

### React over Blazor
- Richer ecosystem for Canvas-based interactive rendering
- Better control over the rendering loop (therapy engine needs to bypass framework)
- Larger talent pool for hiring
- TypeScript provides equivalent type safety to C#
- Blazor WebAssembly has higher latency for real-time therapy interactions

### SQL Server over PostgreSQL
- Team expertise and existing infrastructure
- Direct migration path from current SQL Server databases
- Azure SQL and AWS RDS support
- Always Encrypted for future HIPAA column-level encryption
- Row-Level Security for future multi-tenancy

### Tailwind + Radix UI over component libraries (MUI, Ant Design)
- Full control over visual design (medical/accessibility requirements)
- Radix provides WCAG-compliant primitives without opinionated styling
- Tailwind enables rapid high-contrast theme development
- No dependency on a component library's design decisions

### Zustand over Redux
- Simpler API for therapy session state management
- No boilerplate (actions, reducers, selectors)
- Sufficient for PoC scope, can scale or swap if needed
- First-class TypeScript support

### Canvas 2D over WebGL/SVG
- Canvas 2D: precise pixel control, efficient for many small shapes
- SVG: DOM overhead with hundreds of stimulus elements, slower
- WebGL: unnecessary complexity for 2D shape rendering
- Canvas 2D anti-aliasing handles sub-pixel accuracy for stimuli
- `requestAnimationFrame` integration is straightforward

## Containerization & Deployment Strategy

The platform is designed container-first. Every deployment mode -- developer workstation, cloud SaaS, cloud centre, and on-premise centre -- uses the same container images. This ensures parity across environments and makes centre provisioning as simple as running a compose file.

### Container Architecture

```
┌────────────────────────────────────────────────────┐
│  docker-compose.yml (single command deployment)     │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ novavision-  │  │ novavision-  │  │  sql-    │ │
│  │ api          │  │ web          │  │  server  │ │
│  │ (.NET 10)    │  │ (nginx +     │  │  (2022)  │ │
│  │              │  │  React SPA)  │  │          │ │
│  │ Port 5000    │  │  Port 443    │  │ Port 1433│ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ redis        │  │ seq          │               │
│  │ (cache +     │  │ (structured  │               │
│  │  future      │  │  log viewer) │               │
│  │  SignalR)    │  │              │               │
│  │ Port 6379    │  │  Port 5341   │               │
│  └──────────────┘  └──────────────┘               │
└────────────────────────────────────────────────────┘
```

### Container Images

| Image | Base | Purpose | Size Target |
|-------|------|---------|-------------|
| `novavision-api` | `mcr.microsoft.com/dotnet/aspnet:10.0` | .NET API backend | <200MB |
| `novavision-web` | `nginx:alpine` | Static React SPA + reverse proxy | <50MB |
| `novavision-migrate` | `mcr.microsoft.com/dotnet/runtime:10.0` | EF Core migration runner | <150MB |

### Deployment Modes

#### Developer Workstation
```bash
docker compose up
```
Spins up the full stack including SQL Server, Redis, and Seq. Hot-reload enabled for both .NET and React via volume mounts. Database seeded with test data automatically.

#### Cloud SaaS (NovaVision-Hosted)
- Orchestrated via Kubernetes (AKS/EKS) or Azure Container Apps
- `novavision-api` horizontally scaled (2-10 replicas)
- Azure SQL or RDS for managed SQL Server (not containerized)
- Azure Cache for Redis (managed, not containerized)
- `novavision-web` served via CDN for static assets
- SSL termination at load balancer / ingress controller
- Helm chart for repeatable deployment

#### Cloud Centre (Dedicated Per-Centre)
- Each centre gets its own namespace or resource group
- Same container images as SaaS, different configuration
- Isolated database (separate Azure SQL database or schema)
- Provisioned via a CLI tool or admin portal that:
  1. Creates the infrastructure (database, DNS, TLS cert)
  2. Deploys the compose stack with centre-specific config
  3. Runs the migration container to initialize the schema
  4. Seeds the admin user

#### On-Premise Centre (Windows Server)
```
┌──────────────────────────────────────────┐
│  Windows Server 2022 with Docker Desktop │
│  or Docker Engine (Linux containers)     │
│                                          │
│  docker compose -f compose.onprem.yml up │
│                                          │
│  Same images, different compose file:    │
│  - SQL Server container (or external)    │
│  - Redis container                       │
│  - API container                         │
│  - Web container (with self-signed or    │
│    provided TLS cert)                    │
│  - Watchtower for auto-updates           │
│    (optional, pulls new image versions)  │
└──────────────────────────────────────────┘
```

For centres that cannot run Docker, a fallback deployment is available:
- Self-contained .NET 10 publish as a Windows Service
- SQL Server Express installed locally
- IIS as reverse proxy
- But **Docker is the primary and recommended approach**

### Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Development (all services, hot reload, seeded data) |
| `docker-compose.cloud.yml` | Cloud override (external DB/Redis, no SQL container) |
| `docker-compose.onprem.yml` | On-premise (all services bundled, TLS config, Watchtower) |
| `docker-compose.test.yml` | CI/CD (ephemeral, runs tests against real services) |

### Centre Provisioning Flow (Containerized)

```
1. Centre admin receives provisioning package:
   - docker-compose.onprem.yml
   - .env.template (fill in centre name, admin email, TLS cert path)
   - install.sh / install.ps1 (checks Docker, pulls images, runs setup)

2. Admin runs: ./install.ps1 -CentreName "Berlin Rehab" -AdminEmail "admin@br.de"

3. Script:
   - Validates Docker is installed and running
   - Generates .env from template with provided values
   - Pulls container images from NovaVision container registry
   - Runs: docker compose -f docker-compose.onprem.yml up -d
   - Runs: docker compose exec api dotnet NovaVision.Migrate.dll
   - Runs: docker compose exec api dotnet NovaVision.Seed.dll --admin-email admin@br.de
   - Outputs: "NovaVision is running at https://localhost:443"

4. Updates:
   - Watchtower polls for new image versions (configurable interval)
   - Or manual: docker compose pull && docker compose up -d
```

### Container Registry

- Images published to a private container registry (Azure Container Registry, GitHub Container Registry, or Docker Hub private)
- Tagged with semantic versions: `novavision-api:1.2.3`, `novavision-api:latest`
- Multi-arch builds (amd64 + arm64) for future ARM server support
- Signed images for supply chain security

### Environment Configuration

All configuration injected via environment variables (12-factor app):

| Variable | Description | Example |
|----------|-------------|---------|
| `NOVAVISION_DB_CONNECTION` | SQL Server connection string | `Server=sql-server;Database=NovaVision;...` |
| `NOVAVISION_REDIS_CONNECTION` | Redis connection string | `redis:6379` |
| `NOVAVISION_JWT_SECRET` | JWT signing key | (generated per deployment) |
| `NOVAVISION_CENTRE_NAME` | Centre display name | `Berlin Rehabilitation Centre` |
| `NOVAVISION_DEPLOYMENT_MODE` | `saas`, `cloud-centre`, `onprem` | `onprem` |
| `NOVAVISION_TLS_CERT_PATH` | TLS certificate path (on-prem) | `/certs/novavision.pfx` |
| `NOVAVISION_BLOB_STORAGE` | `local` or `azure` or `s3` | `local` |

No configuration is baked into container images. Same image, different config = different deployment mode.

## Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Primary target, best Canvas performance |
| Edge | 90+ | Chromium-based, equivalent to Chrome |
| Firefox | 100+ | Good Canvas support, verify timing precision |
| Safari | 15+ | Test carefully -- timing APIs may differ |

Mobile browsers are **not** in scope for therapy delivery (screen size and precision requirements), but the portal dashboard should be responsive for clinician monitoring.

## Minimum Hardware Requirements (Patient)

| Requirement | Specification |
|-------------|--------------|
| Screen size | 15" or larger (13" minimum) |
| Resolution | 1920x1080 or higher recommended |
| Refresh rate | 60Hz minimum |
| Input | Physical keyboard (space bar for responses) |
| Browser | See browser support above |
| Network | Broadband for session sync (therapy runs offline-capable) |
