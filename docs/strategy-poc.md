# NovaVision Platform Evolution - Proof of Concept Strategy

## Purpose: Client Demonstration & Buy-In

This PoC exists to **demonstrate to NovaVision stakeholders** that the full platform overhaul is technically viable and commercially worthwhile. It must be compelling enough as a live demo to secure buy-in for the complete evolution programme.

**The demo should show:**
- A patient registering, calibrating their screen, and completing real therapy sessions in a web browser -- no desktop application required
- A clinician managing patients, configuring therapy parameters, and viewing results through a modern portal
- All three therapies (VRT, NeuroEyeCoach, NeuroEyeTherapy) running with equivalent precision to the existing WPF desktop applications
- Multi-language support (English + German) with a seamless language switcher
- The same platform running from a single `docker compose up` command -- demonstrating how easily a medical centre could deploy this
- Licensing controls gating therapy access

**What the stakeholder should walk away thinking:**
- "This is a clear improvement over what we have today"
- "Patients will find this easier to use than installing desktop software"
- "This can scale to B2C retail, centre deployments, and AI integration"
- "The architecture is solid enough to build the full roadmap on"

---

## Objective

Build a ground-up proof of concept that demonstrates all three NovaVision therapies (VRT, NeuroEyeCoach, NeuroEyeTherapy) running as web-based experiences within a new modern portal, replacing the current WPF desktop applications.

## What the PoC Proves

1. **Therapy precision in the browser** -- HTML5 Canvas delivers stimulus presentation, timing accuracy, and reaction time measurement equivalent to the current WPF desktop applications
2. **Modern portal viability** -- a new .NET 10 + React architecture serves as the foundation for all future requirements (B2C, multi-tenancy, AI, SignalR, etc.)
3. **Patient experience** -- visually impaired patients can navigate and complete therapy sessions through a web browser with an accessible, intuitive UI
4. **Deployment simplicity** -- `docker compose up` brings up the entire platform, proving the centre deployment model
5. **Multi-language readiness** -- English and German fully translated, infrastructure supports all 13+ languages
6. **Licensing model** -- therapy access controlled via licensing for patients and centres

## What the PoC Does NOT Include (Deferred to Full Programme)

- AI therapy recommendation engine (architecture supports it, not implemented)
- SignalR real-time clinician monitoring (architecture supports it, not implemented)
- Multi-tenant SaaS mode (single-tenant PoC, multi-tenant architecture in place)
- Payment/Stripe integration
- Data migration from existing platform
- Full FDA/HIPAA/GDPR compliance hardening (audit trails, electronic signatures, penetration testing)
- Full i18n (English only for PoC, with i18n infrastructure in place)
- Legacy WPF client compatibility layer

These are all planned for subsequent phases and the architecture will be designed to accommodate them, but they are not in scope for the PoC.

## PoC Scope

### Portal

| Feature | Description |
|---------|-------------|
| Patient registration & login | Email/password with JWT auth |
| Patient dashboard | View assigned therapies, progress summary, start therapy session |
| Clinician dashboard | View patients, assign therapies, view therapy results, configure parameters |
| Admin dashboard | User management, system configuration |
| Screen calibration | Browser-based calibration flow for therapy precision |
| Therapy session runner | Full-screen Canvas-based therapy execution |
| Results & reporting | View session results, visual field maps, progress charts |
| Multi-language | English (en-GB) + German (de-DE) fully translated, language switcher, i18n infrastructure for all 13+ languages |
| Licensing | Patient and centre licence management, online/offline validation, therapy access gating |
| Containerised deployment | `docker compose up` runs the full platform (demo centre deployment) |

### Therapies (Web-Based)

| Therapy | Key Technical Challenge | PoC Target |
|---------|------------------------|------------|
| **NeuroEyeCoach** | Visual search task rendering, 12 adaptive difficulty levels, target/distractor discrimination | Full 12-level implementation with session recording |
| **VRT** | Sub-degree stimulus precision, fixation control, grid-based visual field mapping, screen calibration | Full Status/Progress/Rapid block implementation with calibration |
| **NeuroEyeTherapy** | Contrast target rendering, staircase adaptation algorithm, 5-target tracking | Full implementation with contrast adaptation |

### Implementation Order

1. **Portal foundation** -- auth, routing, basic UI shell, API skeleton
2. **Therapy canvas engine** -- shared rendering, timing, input, calibration infrastructure
3. **NeuroEyeCoach** -- simplest therapy, proves canvas engine works, no sub-degree precision needed
4. **VRT** -- hardest therapy, proves precision calibration and grid-based stimulus delivery
5. **NeuroEyeTherapy** -- contrast-based therapy, proves staircase adaptation in browser

## Success Criteria

- [ ] All three therapies run in Chrome, Edge, and Firefox on Windows, macOS, and Linux
- [ ] VRT stimulus presentation timing measured within 5ms of WPF equivalent
- [ ] Screen calibration produces DegreePixels values within 2% of WPF calibration on same hardware
- [ ] A patient can complete a full NeuroEyeCoach program (36 sessions across 12 levels)
- [ ] A patient can complete a full VRT diagnostic (Status block) with results matching WPF output format
- [ ] A patient can complete a full NeuroEyeTherapy session with contrast adaptation working correctly
- [ ] A clinician can view patient progress and configure therapy parameters
- [ ] Therapy sessions are resilient to brief network interruptions (IndexedDB buffering)
- [ ] UI passes basic accessibility checks (keyboard navigation, high contrast, large text)
- [ ] Portal works in English and German with seamless language switching
- [ ] Licensing gates therapy access (patient cannot start therapy without valid licence)
- [ ] `docker compose up` brings up the entire platform from scratch (demo-ready)
- [ ] Comprehensive test suite passes: unit, integration, E2E, timing precision, accessibility

## Demo Script (Client Presentation)

The following demonstrates the PoC capabilities in approximately 30 minutes:

### 1. Platform Deployment (2 min)
- Show `docker compose up` starting the entire platform from a single command
- Navigate to the portal in a browser -- "This is how easily a centre deploys the platform"

### 2. Admin Setup (3 min)
- Login as admin, show user management
- Create a clinician account
- Create a centre licence (covers VRT + NEC + NET)
- Switch language to German, show all UI translates

### 3. Clinician Workflow (5 min)
- Login as clinician
- Create a new patient
- Assign VRT therapy -- show the visual field grid therapy area editor
- Assign NeuroEyeCoach -- show level configuration
- Assign NeuroEyeTherapy -- show contrast target configuration
- Show the empty patient dashboard (no sessions yet)

### 4. Patient Experience - NeuroEyeCoach (5 min)
- Login as patient, show the accessible patient dashboard
- Complete screen calibration (credit card method)
- Start a NeuroEyeCoach session
- Show the visual search task running in fullscreen Canvas
- Complete a few trials, show adaptive difficulty
- View session results and level progress

### 5. Patient Experience - VRT (8 min)
- Start a VRT Status block (diagnostic)
- Show precise stimulus presentation on the calibrated grid
- Show fixation monitoring (central point changes)
- Complete a portion of the diagnostic
- View the visual field map generated from results
- Show the clinician view of the same results

### 6. Patient Experience - NeuroEyeTherapy (5 min)
- Start a NET session
- Show contrast targets appearing at configured positions
- Demonstrate staircase adaptation (contrast getting harder after correct responses)
- View per-target contrast progression chart

### 7. Technical Demonstration (5 min)
- Show timing precision test results (200ms stimulus accuracy)
- Show cross-browser compatibility (open in Chrome, Edge, Firefox)
- Disconnect network during session -- show it continues
- Reconnect -- show data syncs automatically
- Show the test suite running and passing
