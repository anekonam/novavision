# NovaVision Portal & Therapy UI/UX Design Brief

## 1. Product Overview

NovaVision is an FDA-cleared medical technology platform that delivers vision restoration and compensation therapies to patients with neurological visual impairments caused by stroke, traumatic brain injury, or brain surgery. The platform is being rebuilt from legacy Windows desktop applications into a modern web-based experience.

**The platform serves three user roles:**
- **Patients** -- people with partial vision loss performing therapy at home
- **Clinicians** -- medical professionals managing patients and configuring therapy
- **Administrators** -- system managers handling users, licences, and configuration

---

## 2. Critical Design Constraint: Users Have Vision Impairments

This is the single most important design consideration. Every patient using this platform has some degree of **neurological vision loss**. Common conditions include:

- **Hemianopia** -- loss of half the visual field (left or right side is blind)
- **Quadrantanopia** -- loss of a quarter of the visual field
- **Tunnel vision** -- only the central area of vision works
- **Reduced contrast sensitivity** -- difficulty distinguishing subtle differences

### What this means for design:

| Constraint | Design Implication |
|------------|-------------------|
| Patients may not see content on one side of the screen | Centre-align critical content and actions. Never put the only CTA in a far corner. |
| Patients may miss peripheral UI elements | Navigation and key actions must be prominent and centrally discoverable |
| Reduced contrast sensitivity | WCAG AAA contrast ratios (7:1 minimum for text). No light grey on white. |
| Patients may have slow visual processing | Simple layouts, generous whitespace, no visual clutter |
| Patients may struggle with small targets | Minimum 48x48px touch/click targets. Large buttons (full-width on mobile). |
| Patients may rely on keyboard navigation | Clear focus indicators (3px+ outline), logical tab order |
| Sessions cause visual fatigue | Clean, calming aesthetic. No animations or flashing. Dark therapy backgrounds. |
| Patients are often elderly (stroke survivors) | Familiar UI patterns. No trendy/unusual interactions. Labels on everything. |

### Typography requirements:
- **Portal body text**: 18px minimum
- **Therapy instructions**: 20px minimum
- **Headings**: 24-36px
- **Button text**: 18px minimum, bold
- **No text below 16px anywhere in the application**

---

## 3. Brand & Visual Direction

### Current brand
- NovaVision's existing brand uses clean medical aesthetics
- Primary colour: blue (trust, medical professionalism)
- Logo: "NovaVision" wordmark

### Design direction for new platform
- **Medical professional** -- not consumer tech, not startup. This is FDA-cleared medical equipment.
- **Calm and reassuring** -- patients are dealing with life-changing injuries
- **High contrast** -- accessibility first, aesthetics second
- **Minimal** -- every element earns its place. Less is more for impaired vision.
- **Clear hierarchy** -- patients must immediately know what to do next

### Colour palette

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#1a56db` | Actions, links, active navigation, therapy progress |
| Primary Hover | `#1e40af` | Button hover states |
| Primary Light | `#dbeafe` | Active nav background, selected states |
| Secondary/Success | `#047857` | Positive progress, completed states, detected vision cells |
| Danger | `#dc2626` | Errors, critical alerts, missed vision cells |
| Warning | `#d97706` | Warnings, transition zone cells, attention needed |
| Surface | `#ffffff` | Card backgrounds, main content |
| Surface Secondary | `#f8fafc` | Page backgrounds, secondary areas |
| Surface Dark | `#0f172a` | Therapy session background (dark room simulation) |
| Text | `#0f172a` | Primary text (7:1 contrast on white) |
| Text Secondary | `#334155` | Secondary descriptions |
| Text Muted | `#64748b` | Tertiary info only (never for critical content) |
| Border | `#cbd5e1` | Card borders, dividers |
| Border Strong | `#64748b` | Input borders, emphasis |
| Focus Ring | `#2563eb` | Keyboard focus indicator (3px outline) |

### Therapy session colours (dark background)
- Background: `#000000` or `#0a0a0a` (near-black)
- Stimulus: `#ffffff` (white, high contrast against dark)
- Fixation point: Configurable (default `#ff0000` red)
- Text on dark: `#f1f5f9` (off-white)

---

## 4. Page-by-Page Design Specifications

### 4.1 Login Page

**Purpose:** Authenticate patients, clinicians, and admins.

**Layout:**
- Centred card on muted background
- NovaVision logo/wordmark at top
- Email and password fields (large, 48px+ height inputs)
- "Sign In" button (full-width, primary colour, bold text)
- "Forgot Password?" link
- "Don't have an account? Register" link
- Language switcher at bottom (dropdown: English, Deutsch)

**MFA Challenge (shown after credentials verified):**
- Same centred card layout
- Title: "Two-Factor Authentication"
- Subtitle: "Enter the 6-digit code from your authenticator app"
- 6 individual large digit input boxes (56px square each, auto-advance)
- "Verify" button (full-width, primary)
- "Use a recovery code instead" link below

**MFA Setup (first-time for clinicians/admins, prompted for patients):**
- Step 1: QR code display (large, centred) + manual text key below
- Step 2: Enter verification code to confirm
- Step 3: Display 10 recovery codes with "Copy" and "Print" buttons
- Warning: "Save these codes somewhere safe. You'll need them if you lose your phone."

---

### 4.2 Patient Dashboard

**Purpose:** The patient's home screen after login. Must immediately show what to do next.

**Layout:**
- Welcome message: "Welcome back, [First Name]"
- Calibration alert banner (if screen not calibrated or display changed): yellow warning bar at top
- **Therapy cards** (3 cards in a row on desktop, stacked on tablet):

**Each therapy card contains:**
```
┌──────────────────────────────────┐
│  [Therapy Icon]                  │
│  Vision Restoration Therapy      │  ← therapy name (20px bold)
│  In Progress                     │  ← status badge (green/yellow/grey)
│                                  │
│  Progress: ████████░░ 67%        │  ← progress bar (12px height)
│  Last session: 2 days ago        │  ← last activity
│  Next: Block 4 - Progress        │  ← what's next
│                                  │
│  ┌────────────────────────────┐  │
│  │     Start Session          │  │  ← large primary button
│  └────────────────────────────┘  │
│  View Results                    │  ← text link
└──────────────────────────────────┘
```

- **Session history** section below cards: list of recent sessions (date, therapy type, duration, key metric)
- **Quick stats**: total sessions completed, current streak, days in programme

**Card states:**
- Not started: grey border, "Not Started" badge, "Begin Therapy" button
- In progress: primary border, "In Progress" badge with progress bar
- Complete: green border, "Complete" badge, checkmark, "View Report" button
- Locked (no licence): muted card, padlock icon, "Licence Required" message

---

### 4.3 Screen Calibration Wizard

**Purpose:** Determine how many pixels = 1 visual degree on the patient's screen. Required before first therapy session.

**Step 1: Physical Reference (credit card)**
- Large instruction text: "Hold a standard credit card flat against your screen"
- On-screen rectangle (adjustable with a large slider)
- Instruction: "Adjust the slider until the rectangle matches your card exactly"
- Large slider control with +/- buttons at each end
- "My card matches" primary button

**Step 2: Distance Confirmation**
- Illustration showing chin rest setup at 30cm from screen
- Text: "Position yourself 30cm from the screen using your chin rest"
- Distance input (pre-filled with 30cm, editable)
- "I'm in position" primary button

**Step 3: Verification**
- Show a circle at a known visual degree size
- Ask: "Does this circle appear approximately 1cm in diameter?"
- Yes/No buttons
- If No, restart calibration

**Step 4: Complete**
- Success message with calibration values
- "Your screen is calibrated. You're ready to begin therapy."
- "Start Therapy" primary button

---

### 4.4 VRT Therapy Session UI

**Purpose:** Deliver Vision Restoration Therapy in the browser. The most precision-critical screen.

**Pre-Session Screen:**
- Block information: "Block 3 - Progress" with description
- Session parameters summary (number of stimuli, estimated duration ~30 min)
- Instructions (translated):
  - "Focus on the central point at all times"
  - "Press SPACE when you see a light appear"
  - "Press SPACE when the central point changes"
  - "Try not to move your eyes"
- "I understand. Begin session" primary button
- "Cancel" text link

**Active Therapy Session (fullscreen dark canvas):**
```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
│                    ●                         │  ← fixation point (red dot at centre)
│                                              │
│               ○                              │  ← stimulus (white dot, brief flash)
│                                              │
│                                              │
│                                              │
│                                              │
│  ▌▌ Pause                    127/284  44%    │  ← minimal HUD at bottom
└──────────────────────────────────────────────┘
```

**Key design elements:**
- Pure black background (simulates dark room)
- NO UI chrome during active stimulus presentation
- Minimal HUD at bottom: pause button (||), stimulus count, percentage
- HUD fades to near-invisible after 5 seconds, reappears on mouse move
- Fixation point: small coloured shape at dead centre (red circle default)
- Stimuli: white shapes appearing briefly at grid positions

**Pause Overlay (on pressing Pause or Escape):**
- Semi-transparent dark overlay
- Centred card: "Session Paused"
- "Resume" primary button (large)
- "End Session" danger text link
- Current progress stats (stimuli completed, fixation accuracy, elapsed time)

**Session Complete Screen:**
- "Session Complete" heading
- Key metrics displayed prominently:
  - Stimuli detected: 234/284 (82%)
  - Fixation accuracy: 91%
  - Average response time: 412ms
  - Duration: 27 minutes
- "View Visual Field Map" button
- "Return to Dashboard" button

---

### 4.5 VRT Visual Field Map

**Purpose:** Display the patient's visual field as a colour-coded grid showing where they can and cannot see.

**Map design:**
- 19 columns x 15 rows grid
- Each cell colour-coded by detection rate:
  - `#047857` (green) = 80-100% detected (intact vision)
  - `#65a30d` (lime) = 60-80% (good detection)
  - `#d97706` (amber) = 40-60% (transition zone -- therapy target)
  - `#ea580c` (orange) = 20-40% (poor detection)
  - `#dc2626` (red) = 0-20% (blind area)
  - `#6b7280` (grey) = not tested
- Central fixation point marked with crosshair
- Quadrant labels: TL, TR, BL, BR
- Nose indicator on left or right side
- Scale legend showing colour-to-percentage mapping

**Clinician view adds:**
- Therapy area overlay (blue outline around cells being targeted)
- Click-to-select cells for therapy area editing
- Toggle between pre-therapy and current maps (side-by-side or overlay)
- Difference map (cells that improved shown in bright green)

---

### 4.6 NeuroEyeCoach Therapy Session UI

**Purpose:** Visual search training -- patient finds a target among distractors.

**Pre-Session Screen:**
- Current level: "Level 4 of 12"
- Level progress bar
- Instructions:
  - "A target shape will appear among other shapes"
  - "Press LEFT ARROW if the target is present"
  - "Press RIGHT ARROW if the target is absent"
  - "Respond as quickly and accurately as possible"
- Example image showing target vs distractors
- "Begin Session" primary button

**Active Session (fullscreen, lighter background than VRT):**
```
┌──────────────────────────────────────────────┐
│                                              │
│     ◇    ○    ◇         ○                    │
│                    ◇              ○           │
│  ○         ★              ◇                  │  ← ★ is the target
│                    ○                   ◇      │
│     ◇              ○         ◇               │
│              ○                    ◇           │
│                                              │
│                                              │
│  Level 4          Trial 15/40      ← →       │  ← HUD
└──────────────────────────────────────────────┘
```

- Background: dark grey (`#1e293b`) or configurable
- Shapes: circles, crosses, diamonds, stars in contrasting colours
- Target shape clearly defined in instructions
- Distractor shapes similar but distinguishable
- Response feedback: brief green flash (correct) or red flash (incorrect)
- Trial counter and level indicator in minimal HUD

**Session Results:**
- Accuracy: 87%
- Average response time: 1.2 seconds
- Targets found: 18/20
- False alarms: 1
- Level progression indicator: "Ready for Level 5!" or "Practice Level 4 again"

---

### 4.7 NeuroEyeTherapy Session UI

**Purpose:** Contrast sensitivity training -- detect targets at varying contrast levels.

**Pre-Session Screen:**
- Session info: "Session 12 - 5 targets active"
- Instructions:
  - "Focus on the central point"
  - "Press SPACE when you see a target appear"
  - "Targets may be very faint -- respond even if unsure"
- Target positions diagram (shows where the 5 targets will appear)
- "Begin Session" primary button

**Active Session (fullscreen dark canvas):**
```
┌──────────────────────────────────────────────┐
│                                              │
│         ○                                    │  ← target 1 (faint, low contrast)
│                                              │
│                                              │
│                                  ○           │  ← target 3 (medium contrast)
│                    ●                         │  ← fixation point (centre)
│                                              │
│    ○                                         │  ← target 4 (high contrast, bright)
│                                              │
│                          ○                   │  ← target 5
│                                              │
│  ▌▌                              Trial 47    │
└──────────────────────────────────────────────┘
```

- Targets appear as circles at fixed positions
- Contrast varies per target (some barely visible, some obvious)
- Staircase: gets harder when patient detects (lower contrast), easier when they miss

**Session Results:**
- Per-target contrast threshold chart (bar chart showing each target's achieved contrast level)
- Trend line: contrast over sessions (line chart showing improvement)
- "Your contrast sensitivity improved by 12% this session"

---

### 4.8 Clinician Dashboard

**Purpose:** Manage patients and monitor therapy progress.

**Layout:**
- **Patient list** (primary view):
  - Table or card grid with search bar and filters
  - Each patient row: name, email, assigned therapies (VRT/NEC/NET badges), last activity, status indicator
  - Click patient → patient detail view
  - "Add Patient" primary button

- **Patient Detail View:**
  - Patient profile header (name, email, age, injury details, licence status)
  - Tabs: VRT | NEC | NET | Documents | Notes
  - Each therapy tab shows:
    - Current configuration (therapy area for VRT, level for NEC, targets for NET)
    - Progress charts (session-over-session trends)
    - Session history (expandable rows with per-session metrics)
    - "Configure Therapy" button

- **VRT Configuration Panel:**
  - Interactive visual field grid (19x15)
  - Clinician clicks cells to define therapy area (selected cells highlighted in blue)
  - Sidebar shows block parameters:
    - Block type: Status / Progress / Rapid
    - Stimulus shape, colour, size
    - Session count, repeat count
    - Timing parameters
  - "Save Configuration" button
  - Preview of how the therapy area maps to the patient's visual field

---

### 4.9 Admin Dashboard

**Purpose:** System administration.

**Sections:**
- **Users**: table with name, email, role, status, last login. CRUD actions.
- **Licences**: table with licence key (truncated), type, therapies, assigned to, expiry, status. Create/revoke actions.
- **System**: deployment info, database status, version

---

### 4.10 Shared Components

**Navigation:**
- Left sidebar on desktop (collapsible) or top bar
- Items vary by role:
  - Patient: Dashboard, My Therapies, Results, Profile, Help
  - Clinician: Dashboard, Patients, Reports, Settings, Help
  - Admin: Dashboard, Users, Licences, Settings
- Active item clearly highlighted (primary colour background)
- User avatar/initials + name + role badge in nav footer/header
- Language switcher accessible from navigation

**Buttons:**
- Primary: `bg-primary text-white` rounded-lg, 48px height, 18px bold text
- Secondary: `border-2 border-primary text-primary` rounded-lg, 48px height
- Danger: `bg-danger text-white` rounded-lg, 48px height
- Ghost: text only with underline on hover

**Form Inputs:**
- Height: 48px minimum
- Border: 2px solid (not 1px -- visibility)
- Font size: 18px
- Labels: bold, above the input (not placeholder-only)
- Error messages: red text below input with error icon, 16px
- Focus: 3px primary-coloured outline

**Cards:**
- White background, 2px border, 12px border-radius
- Generous padding (24px)
- Subtle shadow on hover (interactive cards)

**Status Badges:**
- Not Started: grey background, dark text
- In Progress: blue background, white text
- Complete: green background, white text
- Locked: red outline, muted text
- Pill shape, 14px text, medium weight

**Progress Bars:**
- 12px height (visible for low vision)
- Rounded-full
- Background: light grey
- Fill: primary (in progress), green (complete)
- Percentage label alongside

---

## 5. Page Flow / Sitemap

```
Login ─→ [MFA Challenge] ─→ Dashboard
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        Patient Routes    Clinician Routes   Admin Routes
                │               │               │
          Dashboard         Dashboard         Dashboard
          Therapies         Patient List      User Management
          ├─ VRT            Patient Detail    Licence Management
          │  ├─ Session     ├─ VRT Config     System Settings
          │  ├─ Results     ├─ NEC Config
          │  └─ Field Map   ├─ NET Config
          ├─ NEC            └─ Reports
          │  ├─ Session
          │  └─ Results
          ├─ NET
          │  ├─ Session
          │  └─ Results
          Calibration
          Profile
          Help
```

---

## 6. Responsive Behaviour

| Breakpoint | Layout |
|------------|--------|
| Desktop (1280px+) | Sidebar nav, 3-column therapy cards, full data tables |
| Tablet (768-1279px) | Top nav, 2-column cards, scrollable tables |
| Mobile (< 768px) | Hamburger nav, single-column, stacked cards. **Note: therapy sessions are desktop-only (15"+ screen required for clinical validity).** Mobile is for portal navigation and results viewing only. |

---

## 7. Therapy Session Fullscreen States

All therapy sessions share these UI states:

| State | Screen |
|-------|--------|
| **Pre-session** | Instructions, parameters, "Begin" button. Normal portal chrome. |
| **Calibration check** | If calibration needed, redirect to calibration wizard |
| **Countdown** | "Starting in 3... 2... 1..." centred on dark background. No other UI. |
| **Active session** | Fullscreen dark canvas. Minimal HUD (pause, progress). No browser chrome. |
| **Paused** | Dark overlay with pause card. Resume/End options. |
| **Session complete** | Results summary. Return to dashboard. |
| **Error/offline** | "Connection lost. Your session data is saved locally." Auto-retry indicator. |

---

## 8. Accessibility Checklist for Design

- [ ] All text meets 7:1 contrast ratio (WCAG AAA)
- [ ] No information conveyed by colour alone (always paired with text/icon)
- [ ] Focus indicators visible (3px outline, high contrast)
- [ ] All interactive elements >= 48x48px
- [ ] No text below 16px
- [ ] Therapy content text >= 18px
- [ ] Form labels always visible (no placeholder-only labels)
- [ ] Error states clearly marked with icon + text + colour
- [ ] Navigation consistent across all pages
- [ ] Critical actions (start session, save config) are prominent and centrally placed
- [ ] No reliance on hover states for critical information
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Dark mode / high contrast toggle available
- [ ] Language switcher always accessible

---

## 9. Deliverables Needed from Figma

1. **Design system / component library:**
   - Colour tokens, typography scale, spacing scale
   - Button variants (primary, secondary, danger, ghost) in all states
   - Form input components in all states (default, focus, error, disabled)
   - Card component variants
   - Navigation component (sidebar + top bar)
   - Status badges, progress bars
   - Table component
   - Modal/dialog component
   - Toast notification component

2. **Page designs (desktop + tablet):**
   - Login page + MFA challenge + MFA setup
   - Patient dashboard
   - Screen calibration wizard (4 steps)
   - VRT pre-session → active session → pause → results
   - NEC pre-session → active session → results
   - NET pre-session → active session → results
   - VRT visual field map (patient view + clinician editable view)
   - Clinician dashboard + patient list + patient detail
   - VRT/NEC/NET configuration panels for clinician
   - Admin dashboard + user management + licence management
   - Profile/settings page
   - Language switcher in both English and German

3. **Therapy canvas mockups:**
   - VRT stimulus presentation (dark screen, white dot, red fixation point)
   - NEC visual search field (shapes on dark background)
   - NET contrast targets (circles at varying opacity on dark background)
   - Fixation point variants (circle, cross, square in different colours)

4. **Flow diagrams:**
   - Patient first-time journey (register → calibrate → first session)
   - Clinician patient setup journey (create patient → assign therapy → configure)
   - Therapy session state machine (pre → countdown → active → pause → complete)
