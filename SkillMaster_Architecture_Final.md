# Skill Master — Complete Application Architecture 
## Unified & Corrected Reference Document 

**Document Type:** Definitive product architecture — merged, corrected, approved  
**Project:** Skill Master  
**App Type:** React Single Page Application (SPA)  
**Version:** Final MVP  
**Status:** Locked for design and development 

---

# 1. Product Purpose 

Skill Master is a structured self-learning application designed to: 

- collect learner information and preferences 
- generate a fully personalised AI-driven learning roadmap
- guide the learner through a daily study flow
- keep progress visible at all times
- allow the learner to read lessons, perform tasks, and receive AI feedback
- support revision and exam flow without making the app confusing

The soul of this application is giving a **personalised learning platform** to individuals who have confusion about where to start and who need a proper structured path.

---

# 2. Application Type

## Core Model
- Single Page Application (SPA)
- Route-based navigation using React Router
- No full page reloads
- Shared authenticated layout after login

## Architecture Principle
The application stays:
- simple
- focused
- beginner-friendly to build
- easy to expand in future versions

---

# 3. Final Route Map

## Public Route
```
/auth
```

## Protected Routes
```
/setup
/roadmap
/learn
/progress
/session/:dayId
```

## Utility Route
```
*  →  Not Found (404 fallback)
```

---

# 4. Final Screen Count

## Core Screens
1. Auth View — `/auth`
2. Setup View — `/setup`
3. Roadmap View — `/roadmap`
4. Learn / Home View — `/learn`
5. Progress View — `/progress`
6. Session View — `/session/:dayId`

## Utility Screen
7. Not Found View — `*`

**Total: 6 core screens + 1 utility screen**

---

# 5. Views That Were Intentionally Removed or Merged

To keep the MVP simple and clean, these are **not separate pages**:

| Removed View | New Placement |
|---|---|
| Separate Settings page | Profile dropdown in top navbar |
| Separate Profile page | Profile dropdown in top navbar |
| Separate Exam page | Inside Session View (state-based) |
| Revision queue management | Informational only — shown in Home and Progress |

---

# 6. Global User Flow

## First-Time User Flow
```
/auth
→ /setup
→ /roadmap
→ /learn
→ /session/:dayId
→ /learn
```

## Returning User Flow
```
/auth
→ /learn
→ /session/:dayId
→ /learn
```

## If Roadmap Does Not Exist
```
/auth
→ /setup
```

---

# 7. Shared Authenticated Layout

Used on all protected routes:
- `/roadmap`
- `/learn`
- `/progress`
- `/session/:dayId`

## A. Top Navbar

Contains:
- Skill Master logo / app name (left)
- Navigation links (centre):
  - **Home** → `/learn`
  - **Roadmap** → `/roadmap`
  - **Progress** → `/progress`
- Right side:
  - Dark/Light mode toggle icon (moon/sun icon — standard in MVP; removed only if it creates significant implementation complexity)
  - Profile trigger (avatar or initials)

## B. Profile Dropdown

Contains:
- User full name
- User email
- Current skill (short display line)
- Logout

> Note: "Edit Learning Setup" has been intentionally removed from the profile dropdown. There is no edit setup action in MVP.

## C. Main Content Area

The changing view area where route-specific content renders based on the active route.

## Layout Decision
- No sidebar for MVP
- Top navbar only
- Simpler for responsive layout
- Easier to build for the team

---

# 8. Page-by-Page Specification

---

## 8.1 Auth View

### Route
```
/auth
```

### Purpose
- Allow user login
- Allow new account creation

### Layout
- Full-page centered layout
- Left panel: branding (logo, app name, subtitle)
- Right panel / card: auth form with tab switching

### Sections

#### A. Branding Area
- Logo mark
- App name: **Skill Master**
- Subtitle: *AI-powered personalized learning*

#### B. Auth Form — Two Modes (Tab Switch)

**Login Mode**
Inputs:
- Email
- Password (with show/hide toggle)

Actions:
- Login button (primary)
- Switch to Sign Up (inline link)

**Sign Up Mode**
Inputs:
- Full Name
- Email
- Password
- Confirm Password

Actions:
- Create Account button (primary)
- Switch to Login (inline link)

### States
- Idle
- Validation error (inline field-level messages)
- Submitting (loading state on button)
- Failed login/signup (error message above form)
- Success

### Routing After Success
- New user → `/setup`
- Returning user with roadmap → `/learn`
- Returning user without roadmap → `/setup`

---

## 8.2 Setup View

### Route
```
/setup
```

### Purpose
- Collect learner profile information
- Collect learning preferences
- Collect skill goal
- Feed all collected data into the AI prompt for personalised roadmap generation

### Layout
- Page heading at top
- One large form card
- Multiple sections in a single scrollable page

### Sections

#### A. Learner Information
Inputs:
- Full Name *(prefilled from registration if available)*
- Role / Identity *(fed to AI prompt — affects roadmap tone and structure)*
  - Student
  - Job Seeker
  - Other
- Current Level *(fed to AI prompt — affects depth and starting point)*
  - Beginner
  - Intermediate
  - Advanced

#### B. Learning Goal
Inputs:
- What do you want to learn? *(skill name — main AI prompt input)*
- Why do you want to learn it? *(optional — gives AI context for motivation framing)*

#### C. Learning Preferences
Inputs:
- Daily available time *(fed to AI — affects task length and session scope)*
- Preferred pace *(fed to AI — affects weekly progression speed)*
- Preferred learning style *(fed to AI — affects how content is presented)*

### Why These Fields Matter
Every field in this form is either directly or contextually fed to the AI roadmap generation prompt. The AI uses:
- Role → to frame the roadmap professionally or academically
- Level → to set starting depth
- Skill → as the core topic
- Time and Pace → to structure weeks and sessions appropriately
- Learning Style → to shape how lessons are presented

This is not a generic profile form. It is the **AI prompt configuration layer**.

### Actions
- **Generate Roadmap** (primary — triggers AI call)
- **Back** (secondary)

### Helper Text
> Your answers will be used to generate a personalised roadmap built specifically for you.

### States
- Idle
- Validation error
- Generating roadmap (loading — AI call in progress)
- Generation failed (retry option)

### On Success
→ `/roadmap`

---

## 8.3 Roadmap View

### Route
```
/roadmap
```

### Purpose
- Show the generated roadmap clearly
- Let the learner understand the full structure before starting
- Show where the journey begins

### Layout
- Roadmap summary card at top
- Roadmap structure breakdown in middle (accordion)
- Action area at bottom

### Sections

#### A. Roadmap Summary Card
Shows:
- Skill name
- Current level
- Estimated duration
- Number of modules
- Daily study time
- Generation timestamp *(optional)*

#### B. Roadmap Structure Area
- Accordion-style module list
- Each module expandable to show weeks
- Each week expandable to show day-by-day session titles
- Current position clearly marked
- Locked/unlocked states visible per module

#### C. Action Area
- **Start Learning** (primary — first time)
- **Continue Learning** (if already started — navigates to `/learn`)

### States
- Loading roadmap
- Roadmap loaded
- Empty (no roadmap generated — prompt user to go to `/setup`)

---

## 8.4 Learn / Home View

### Route
```
/learn
```

### Purpose
This is the learner's main in-app home screen. It is **current-state focused** — the learner sees where they are right now and what the immediate next action is.

### Layout

**Desktop:**
```
Header
→ Current Point Summary (4 cards in a row)
→ Current Session Card
→ Revision Queue (light)
```

**Mobile:**
```
Header
→ Current Point Summary (2x2 grid)
→ Current Session Card
→ Revision Queue (light)
```

### Header
- Title: **Dashboard**
- Subtitle: *Pick up where you left off.*
- Optional context line: *Current Skill: [skill name]* (subtle, small)

### Section 1 — Current Point Summary
Four compact stat cards:
1. **Current Module** — e.g. Module 1
2. **Current Week** — e.g. Week 2
3. **Current Day** — e.g. Day 3
4. **Revision Queue** — e.g. 2 topics

Design rule: small, fast to scan, no extra descriptions inside cards.

### Section 2 — Current Session Card
The main visual focus of this view.

Shows:
- Session title (e.g. *Introduction to Components*)
- Current day label (e.g. *Day 3 — Monday*)
- Session type badge: **Learning** / **Revision** / **Exam**
- Estimated time (e.g. *45 min*)
- Current status: *Not Started* / *Ready to Continue* / *In Progress*
- One-line description (e.g. *Continue with the basics of React components.*)

Primary action: **Continue Session** → navigates to `/session/:dayId`

### Section 3 — Revision Queue (Light Summary)
Informational only — no management controls in MVP.

Shows:
- Simple list of flagged revision topics
- Optional source note per topic (e.g. *React Props — Week 1*)

### Empty States

| Condition | Title | Message | Action |
|---|---|---|---|
| No roadmap | No roadmap available | Create your roadmap to begin your guided learning flow. | Create Roadmap → `/setup` |
| No active session | No active session found | Return to your roadmap or refresh your learning state. | View Roadmap / Refresh |
| Revision queue empty | — | *No revision topics yet* (helper text only) | — |

### What This View Does NOT Contain
- No full lesson content
- No task input fields
- No feedback panel
- No exam questions
- No recent progress history block
- No full analytics charts
- No roadmap structure breakdown

---

## 8.5 Progress View

### Route
```
/progress
```

### Purpose
The Progress View shows broader learning history and completion data that would clutter the Home screen. It is the learner's lightweight progress record — not a heavy analytics dashboard.

### Header
- Title: **Progress**
- Subtitle: *Your learning record, performance, and growth.*

### Layout

**Desktop:**
```
Header
→ Top Summary Stats (4 cards in a row)
→ Learning Summary | Recent Outcomes (side by side)
→ Revision & Weak Topics
```

**Mobile:**
```
Header
→ Top Summary Stats (2x2 grid)
→ Learning Summary
→ Recent Outcomes
→ Revision & Weak Topics
```

### Section 1 — Top Summary Stats
Four compact stat cards:
1. **Completed Sessions** — e.g. 12
2. **Modules Completed** — e.g. 1/4
3. **Latest Result** — e.g. Passed
4. **Revision Topics** — e.g. 5

### Section 2 — Learning Summary
Shows:
- Lessons Completed: 9
- Revision Sessions Completed: 2
- Exams Attempted: 2
- Exams Passed: 1

### Section 3 — Recent Outcomes
Shows:
- Last Completed Session/Lesson name
- Latest Session Outcome (Passed / Failed / In Progress)
- Latest Exam Result (e.g. *70% — Needs Revision*)

Keep this short. Not a long activity feed.

### Section 4 — Revision & Weak Topics
Shows:
- Count of pending revision topics
- Compact topic list (e.g. React Props, JSX Syntax, Component Structure)
- Optional: source note per topic (e.g. Week 1, Exam Review)

Interaction: **Informational only in MVP.** No edit, remove, or management controls.

### What This View Does NOT Contain
- No full roadmap structure
- No session entry button
- No lesson content preview
- No task execution controls
- No AI feedback logs
- No long activity history feed
- No charts (MVP)
- No revision topic management actions
- No Current Session CTA (that belongs on Home only)
- No duplicate of Current Position (that belongs on Home only)

---

## 8.6 Session View

### Route
```
/session/:dayId
```

### Purpose
This is the learner's **learning arena**. All actual learning activity happens here. The page content changes based on the current learning phase — the route stays the same, the UI state changes.

### Core Concept: Phase-Based Content Switching
The Session View is a single page that renders different content depending on which phase the learner is in for that session. The phase transitions happen sequentially and automatically based on completion.

### Phase Flow
```
Phase 1: Lesson
→ Phase 2: Task
→ Phase 3: Feedback
→ End: Return to /learn (next session begins next day)
```

For Sunday / Exam sessions:
```
Phase 1: Exam (MCQ)
→ Result: Pass → advance to next week → /learn
→ Result: Fail → flag weak topics → reset to Saturday revision → /learn
```

---

### Phase 1 — Lesson Phase

**Content:**
- Session title and day label
- Session type badge (Learning)
- Lesson content area:
  - Lesson body (text, structured content from roadmapJson)
  - Mini exercises or comprehension points embedded in lesson (if defined in roadmap)
- Progress indicator showing position in lesson (e.g. Part 1 of 3)

**Primary Action:**
- **Next** (moves through lesson parts)
- **I've Finished the Lesson** (advances to Task phase after all parts are done)

---

### Phase 2 — Task Phase

**Content:**
- Task title and description
- Task instructions (what the learner must do)
- Answer / submission input area (text area)
- Submit button

**Primary Action:**
- **Submit Task** → triggers AI feedback call → advances to Feedback phase

---

### Phase 3 — Feedback Phase

**Content:**
- Task recap (what was submitted — brief)
- AI-generated feedback display area
- Feedback clearly labelled as AI-generated
- Visual outcome indicator (positive / needs improvement)

**Primary Action:**
- **Continue to Next Session** → navigates back to `/learn`
- This updates `currentDay` in the backend and the Home view will reflect the next session

**Important rule:** Feedback is displayed in session scope only. It is **not persisted** in the database.

---

### Exam Phase (Sunday Sessions Only)

**Content:**
- Exam header: *Weekly Exam — Week X*
- MCQ question list (from roadmapJson)
- One question at a time OR all at once — decision to be made during implementation
- Answer selection UI
- Submit Exam button

**After Submission:**

Pass (≥ 80%):
- Result display: score, Passed badge
- Summary of performance
- Primary action: **Continue** → advances to next week → `/learn`

Fail (< 80%):
- Result display: score, Needs Revision badge
- Weak topics flagged and added to revision queue
- currentDay reset to Saturday for revision
- Primary action: **Back to Revision** → `/learn`

---

### Session View States

| State | Description |
|---|---|
| Loading | Fetching session data from roadmapJson |
| Lesson phase | Lesson content rendering |
| Task phase | Task input active |
| Submitting task | AI feedback call in progress (loading indicator) |
| Feedback phase | AI feedback displayed |
| Exam phase | MCQ rendering |
| Exam submitted | Result displayed |
| Error | Session data failed to load — retry option |

---

### What Session View Does NOT Contain
- No top-level navigation to other screens during active session (to keep learner focused)
- No roadmap structure sidebar
- No progress history
- No ability to skip phases out of order
- Feedback is session-only — not stored, not accessible later

---

## 8.7 Not Found View

### Route
```
*
```

### Purpose
Fallback for any undefined route.

### Content
- Clear message: page not found
- Link back to `/learn` (if authenticated) or `/auth` (if not)

---

# 9. Navigation Summary

## Active State Rules
The navbar highlights the correct link based on the current route:

| Route | Active Nav Item |
|---|---|
| `/learn` | Home |
| `/roadmap` | Roadmap |
| `/progress` | Progress |
| `/session/:dayId` | No item highlighted (learner is in session) |

## Public Routes
`/auth` has no navbar — standalone screen.
`/setup` has no navbar — standalone screen (pre-dashboard).

---

# 10. Data That Feeds the AI

All fields collected in Setup View are passed to the AI roadmap generation prompt:

| Field | How AI Uses It |
|---|---|
| Role / Identity | Frames roadmap tone — academic for students, practical for job seekers |
| Current Level | Sets starting depth and assumed prior knowledge |
| Skill Name | Core topic of the entire roadmap |
| Why learning | Contextual motivation framing in lesson tone |
| Daily Time | Structures task length and session scope |
| Preferred Pace | Controls weekly progression speed |
| Learning Style | Shapes how lessons are written and presented |

The AI is called **exactly once** per roadmap. The result is stored in MongoDB and never regenerated unless the user explicitly starts a new setup flow (which resets all progress).

---

# 11. AI Call Summary

| Trigger | AI Called? | Stored? |
|---|---|---|
| Roadmap generation (Setup → submit) | Yes — once | Yes — roadmapJson in DB |
| Task submission | Yes — per request | No — session only |
| Exam MCQ regen on re-attempt | Yes — conditional | No |
| Daily task completion | No | Yes — progress update |
| Login / session restore | No | No |

---

# 12. Mode Toggle

Dark/Light mode toggle is **standard in MVP** and appears in the top navbar as a moon/sun icon. It affects the entire application's colour scheme globally.

If implementation proves complex during development, it may be removed — but the default plan is to include it.

---

# 13. Locked Decisions

The following decisions are final and locked for MVP:

**Routing**
- `/progress` is a full protected route
- `/session/:dayId` handles all learning phases via state switching
- `/auth` and `/setup` have no shared navbar

**Navigation**
- Navbar links: Home · Roadmap · Progress · Mode Toggle · Profile
- Profile dropdown contains: name, email, current skill, logout only
- No Edit Learning Setup in MVP

**Session View**
- Single route, phase-based content switching
- Phases: Lesson → Task → Feedback (learning days)
- Exam phase on Sunday only
- Feedback not persisted to DB

**Progress View**
- Separate route `/progress`
- No charts in MVP
- No management controls for revision topics
- No duplicate of current session CTA

**Home View**
- Route is `/learn` — not `/home`
- Title: Dashboard
- Subtitle: Pick up where you left off.
- Main CTA: Continue Session → `/session/:dayId`

**AI**
- Roadmap generated once, stored in DB
- All Setup fields feed the AI prompt
- Feedback session-scoped only

---

# 14. Textual Wireframes

## `/auth`
```
[ Full page centered ]
  [ Left: Branding ]
    Logo | Skill Master | AI-powered personalized learning

  [ Right: Auth Card ]
    [ Log In ] [ Sign Up ]  ← tab switch

    Login Mode:
      Email ___________
      Password _________ [eye]
      [ Log In ]
      Don't have an account? Sign Up

    Sign Up Mode:
      Full Name ________
      Email ____________
      Password _________
      Confirm Password _
      [ Create Account ]
      Already have an account? Log In
```

## `/setup`
```
[ Setup ]
  What is your name?        ___________
  Your role?                [ Student | Job Seeker | Other ]
  Current level?            [ Beginner | Intermediate | Advanced ]
  What do you want to learn? ___________
  Why do you want to learn it? ___________  (optional)
  Daily available time?     ___________
  Preferred pace?           ___________
  Preferred learning style? ___________

  Your answers will be used to generate a personalised roadmap built specifically for you.

  [ Back ]  [ Generate Roadmap ]
```

## `/roadmap`
```
[ Shared Navbar: Skill Master | Home | Roadmap | Progress | 🌙 | Profile ]

[ Roadmap Summary Card ]
  Skill: MERN Stack | Level: Beginner | Duration: 4 weeks
  Modules: 4 | Daily Time: 1 hr

[ Module List — Accordion ]
  ▼ Module 1 — HTML Fundamentals
      Week 1
        Day 1 — Introduction
        Day 2 — Structure
        ...
        Saturday — Revision
        Sunday — Exam
  ▶ Module 2 — CSS Layout (locked)
  ▶ Module 3 — JavaScript (locked)
  ▶ Module 4 — React (locked)

[ Continue Learning ]
```

## `/learn`
```
[ Shared Navbar ]

[ Header ]
  Dashboard
  Pick up where you left off.
  Current Skill: MERN Stack

[ Current Point Summary ]
  [ Module 1 ] [ Week 2 ] [ Day 3 ] [ Revision: 2 ]

[ Current Session Card ]
  Current Session
  Introduction to Components
  Day 3 — Monday  |  Learning  |  45 min  |  Ready to Continue
  Continue with the basics of React components.
  [ Continue Session ]

[ Revision Queue ]
  - React Props — Week 1
  - JSX Basics — Exam Review
```

## `/progress`
```
[ Shared Navbar — Progress active ]

[ Header ]
  Progress
  Your learning record, performance, and growth.

[ Top Summary Stats ]
  [ Completed Sessions: 12 ] [ Modules Completed: 1/4 ]
  [ Latest Result: Passed  ] [ Revision Topics: 5    ]

[ Learning Summary ]          [ Recent Outcomes ]
  Lessons Completed: 9          Last Completed: React JSX Basics
  Revision Sessions: 2          Latest Outcome: Passed
  Exams Attempted: 2            Latest Exam: 70% — Needs Revision
  Exams Passed: 1

[ Revision & Weak Topics ]
  - React Props — Week 1
  - JSX Syntax — Exam Review
  - Component Structure — Week 2
```

## `/session/:dayId` — Lesson Phase
```
[ Minimal header — Skill Master logo + exit/back only ]

  Introduction to Components
  Day 3 — Monday  |  Learning  |  Part 1 of 3

  [ Lesson Content Area ]
  React components are the building blocks of any React application...

  [ Next Part ]
```

## `/session/:dayId` — Task Phase
```
  Task: Build a Basic Component
  Create a functional React component that displays a greeting message.

  [ Text area for answer ]

  [ Submit Task ]
```

## `/session/:dayId` — Feedback Phase
```
  AI Feedback
  ✓ Your component structure is correct.
  The function name follows React conventions.
  Consider adding a prop to make it dynamic.

  [ Continue to Next Session ]
```

## `/session/:dayId` — Exam Phase
```
  Weekly Exam — Week 1
  Question 3 of 10

  What does JSX stand for?
  ○ JavaScript XML
  ○ Java Syntax Extension
  ○ JSON XML
  ○ JavaScript Extension

  [ Previous ]  [ Next ]  [ Submit Exam ]
```

---

*End of Document — Skill Master Architecture Final MVP*
