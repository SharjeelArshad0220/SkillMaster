# Skill Master — Execution Plan
**Version:** 1.0
**Stack:** Vite, React 18, React Router v6, CSS Modules, React Context API
**Font:** Plus Jakarta Sans (Google Fonts)
**Generated:** 2026-03-29
**Status:** Ready for coding agent

---

## 0. Confirmed Decisions

| Decision | Chosen Option | Reason |
|---|---|---|
| Language | JavaScript | Existing vite.config.js in repo — no TS migration overhead |
| Styling | CSS Modules (ComponentName.module.css) | Scoped styles, no Tailwind build config, no class conflicts |
| State management | React Context API | MVP scope — two contexts (Auth, Roadmap) cover all needs |
| Mock data | Static JSON in /src/mocks/ | No MSW overhead, easy to swap for real API later |
| Dark mode persistence | localStorage key "sm-theme" | Survives page reload; user expectation for a learning app |
| Dark mode mechanism | class="dark" on <html> element | CSS Modules + :global(.dark) selectors — clean and reliable |
| Existing repo | Build on existing Vite setup | Confirmed existing package.json and vite.config.js present |
| Font loading | Google Fonts link in index.html | Simplest, no npm package required |
| No glassmorphism | Flat surfaces only | Matches Stitch-approved brand kit — no backdrop-filter |

---

## 1. Project Structure

Every file the coding agent will touch. CREATE = new file. MODIFY = existing file.

```
project-root/
├── index.html                                    (MODIFY — add font link, update title)
├── vite.config.js                                (MODIFY — add path alias @ → src)
├── package.json                                  (MODIFY — add react-router-dom)
│
└── src/
    ├── main.jsx                                  (MODIFY — wrap App in BrowserRouter)
    ├── App.jsx                                   (MODIFY — define all routes)
    │
    ├── index.css                                 (MODIFY — design tokens only, no component styles)
    │
    ├── assets/
    │   └── logo.svg                              (CREATE — node-path SVG icon)
    │
    ├── components/
    │   │
    │   ├── layout/
    │   │   ├── AppShell.jsx                      (CREATE — authenticated layout wrapper)
    │   │   ├── AppShell.module.css               (CREATE)
    │   │   ├── Navbar.jsx                        (CREATE — top navigation bar)
    │   │   ├── Navbar.module.css                 (CREATE)
    │   │   ├── ProfileDropdown.jsx               (CREATE — dropdown trigger + panel)
    │   │   └── ProfileDropdown.module.css        (CREATE)
    │   │
    │   └── ui/
    │       ├── Button.jsx                        (CREATE — variants: primary, secondary, ghost)
    │       ├── Button.module.css                 (CREATE)
    │       ├── Badge.jsx                         (CREATE — variants: learning, revision, exam, current, locked, success, danger)
    │       ├── Badge.module.css                  (CREATE)
    │       ├── Card.jsx                          (CREATE — base card wrapper)
    │       ├── Card.module.css                   (CREATE)
    │       ├── StatCard.jsx                      (CREATE — label + value metric card)
    │       ├── StatCard.module.css               (CREATE)
    │       ├── PillOption.jsx                    (CREATE — selectable pill button)
    │       └── PillOption.module.css             (CREATE)
    │
    ├── pages/
    │   ├── AuthPage/
    │   │   ├── AuthPage.jsx                      (CREATE)
    │   │   └── AuthPage.module.css               (CREATE)
    │   ├── SetupPage/
    │   │   ├── SetupPage.jsx                     (CREATE)
    │   │   └── SetupPage.module.css              (CREATE)
    │   ├── RoadmapPage/
    │   │   ├── RoadmapPage.jsx                   (CREATE)
    │   │   └── RoadmapPage.module.css            (CREATE)
    │   ├── LearnPage/
    │   │   ├── LearnPage.jsx                     (CREATE — dashboard / home view)
    │   │   └── LearnPage.module.css              (CREATE)
    │   ├── ProgressPage/
    │   │   ├── ProgressPage.jsx                  (CREATE)
    │   │   └── ProgressPage.module.css           (CREATE)
    │   ├── SessionPage/
    │   │   ├── SessionPage.jsx                   (CREATE — phase container)
    │   │   ├── SessionPage.module.css            (CREATE)
    │   │   ├── phases/
    │   │   │   ├── LessonPhase.jsx               (CREATE)
    │   │   │   ├── LessonPhase.module.css        (CREATE)
    │   │   │   ├── TaskPhase.jsx                 (CREATE)
    │   │   │   ├── TaskPhase.module.css          (CREATE)
    │   │   │   ├── FeedbackPhase.jsx             (CREATE)
    │   │   │   ├── FeedbackPhase.module.css      (CREATE)
    │   │   │   ├── ExamPhase.jsx                 (CREATE)
    │   │   │   └── ExamPhase.module.css          (CREATE)
    │   │   └── ExamResult.jsx                    (CREATE — pass/fail result screen)
    │   └── NotFoundPage/
    │       ├── NotFoundPage.jsx                  (CREATE)
    │       └── NotFoundPage.module.css           (CREATE)
    │
    ├── context/
    │   ├── AuthContext.jsx                       (CREATE — user, isLoading, mockLogin, mockSignup, logout)
    │   └── RoadmapContext.jsx                    (CREATE — roadmapJson, progress, phase state)
    │
    ├── hooks/
    │   ├── useAuth.js                            (CREATE — consumes AuthContext)
    │   ├── useRoadmap.js                         (CREATE — consumes RoadmapContext)
    │   └── useTheme.js                           (CREATE — dark/light toggle + localStorage)
    │
    ├── routes/
    │   └── ProtectedRoute.jsx                    (CREATE — redirects to /auth if no user)
    │
    ├── mocks/
    │   ├── user.json                             (CREATE — mock user object)
    │   └── roadmap.json                          (CREATE — full mock roadmapJson for MERN Stack)
    │
    └── utils/
        ├── validators.js                         (CREATE — form validation functions)
        └── sessionHelpers.js                     (CREATE — derive current session from roadmapJson + progress)
```

---

## 2. Design System (index.css)

All tokens defined as CSS custom properties. No component styles in this file.

```css
/* Plus Jakarta Sans — add to index.html <head> first */
/* <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"> */

:root {
  /* Typography */
  --font-sans: 'Plus Jakarta Sans', sans-serif;

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 100px;

  /* Transition */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
}

/* ── DARK MODE (default) ── */
:root,
html.dark {
  --color-page-bg:        #0F1923;
  --color-panel-bg:       #162032;
  --color-card-bg:        #162032;
  --color-card-border:    #1E2F42;
  --color-divider:        #2E3D52;
  --color-input-bg:       #0F1923;
  --color-input-border:   #2E3D52;
  --color-accent:         #38BDF8;
  --color-accent-hover:   #0EA5E9;
  --color-accent-muted:   rgba(56, 189, 248, 0.12);
  --color-text-primary:   #FFFFFF;
  --color-text-body:      #CBD5E1;
  --color-text-muted:     #64748B;
  --color-btn-primary-bg: #38BDF8;
  --color-btn-primary-fg: #0F1923;
  --color-badge-learning-bg:  rgba(56, 189, 248, 0.12);
  --color-badge-learning-fg:  #38BDF8;
  --color-badge-revision-bg:  rgba(245, 158, 11, 0.12);
  --color-badge-revision-fg:  #F59E0B;
  --color-badge-exam-bg:      rgba(239, 68, 68, 0.12);
  --color-badge-exam-fg:      #EF4444;
  --color-badge-locked-bg:    #2E3D52;
  --color-badge-locked-fg:    #64748B;
  --color-success:        #22C55E;
  --color-danger:         #EF4444;
  --color-warning:        #F59E0B;
}

/* ── LIGHT MODE ── */
html.light {
  --color-page-bg:        #F1F5F9;
  --color-panel-bg:       #FFFFFF;
  --color-card-bg:        #FFFFFF;
  --color-card-border:    #E2E8F0;
  --color-divider:        #E2E8F0;
  --color-input-bg:       #FFFFFF;
  --color-input-border:   #CBD5E1;
  --color-accent:         #0EA5E9;
  --color-accent-hover:   #0284C7;
  --color-accent-muted:   rgba(14, 165, 233, 0.12);
  --color-text-primary:   #0F172A;
  --color-text-body:      #334155;
  --color-text-muted:     #94A3B8;
  --color-btn-primary-bg: #0EA5E9;
  --color-btn-primary-fg: #FFFFFF;
  --color-badge-learning-bg:  rgba(14, 165, 233, 0.12);
  --color-badge-learning-fg:  #0EA5E9;
  --color-badge-revision-bg:  rgba(245, 158, 11, 0.12);
  --color-badge-revision-fg:  #B45309;
  --color-badge-exam-bg:      rgba(239, 68, 68, 0.12);
  --color-badge-exam-fg:      #DC2626;
  --color-badge-locked-bg:    #F1F5F9;
  --color-badge-locked-fg:    #94A3B8;
  --color-success:        #16A34A;
  --color-danger:         #DC2626;
  --color-warning:        #B45309;
}

/* Global reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  background-color: var(--color-page-bg);
  color: var(--color-text-body);
  -webkit-font-smoothing: antialiased;
}
```

---

## 3. Data Contracts

### User Object (mock + real)
```json
{
  "_id": "usr_mock_001",
  "name": "Sharjeel Arshad",
  "email": "sharjeel@example.com",
  "firstName": "Sharjeel",
  "createdAt": "2026-03-01T00:00:00.000Z"
}
```

### roadmapJson (full shape — see /src/mocks/roadmap.json)
```json
{
  "skillName": "MERN Stack",
  "level": "Beginner",
  "totalModules": 4,
  "estimatedWeeks": 4,
  "dailyTime": "1 hour",
  "modules": [
    {
      "moduleNumber": 1,
      "title": "HTML & CSS Fundamentals",
      "weeks": [
        {
          "weekNumber": 1,
          "days": [
            {
              "dayNumber": 1,
              "dayName": "Monday",
              "type": "Learning",
              "title": "Introduction to HTML",
              "lessonContent": "string — full lesson text",
              "task": { "description": "string", "expectedOutput": "string" },
              "examQuestions": null
            },
            "... days 2-6 same shape ...",
            {
              "dayNumber": 6, "dayName": "Saturday", "type": "Revision",
              "title": "Week 1 Revision", "lessonContent": "string",
              "task": null, "examQuestions": null
            },
            {
              "dayNumber": 7, "dayName": "Sunday", "type": "Exam",
              "title": "Weekly Exam",
              "lessonContent": null, "task": null,
              "examQuestions": [
                {
                  "question": "string",
                  "options": ["A", "B", "C", "D"],
                  "correctIndex": 0
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Progress Object
```json
{
  "roadmapId": "rdmp_mock_001",
  "currentModule": 1,
  "currentWeek": 1,
  "currentDay": "Monday",
  "completedTasks": [],
  "weakTopics": ["React Props", "JSX Basics"],
  "examScores": []
}
```

### Session Phase State (managed in RoadmapContext)
```json
{
  "phase": "lesson | task | feedback | exam | exam_result",
  "lessonPartIndex": 0,
  "taskAnswer": "",
  "feedbackText": "",
  "examAnswers": [],
  "examScore": null,
  "examPassed": null
}
```

---

## 4. Route Map

| Route | Component | Access | Redirect if unmet |
|---|---|---|---|
| /auth | AuthPage | Public — redirect to /learn if session exists | — |
| /setup | SetupPage | Protected | → /auth |
| /roadmap | AppShell → RoadmapPage | Protected | → /auth |
| /learn | AppShell → LearnPage | Protected | → /auth |
| /progress | AppShell → ProgressPage | Protected | → /auth |
| /session/:dayId | AppShell → SessionPage | Protected | → /auth |
| * | NotFoundPage | Public | — |

AppShell wraps all protected routes and renders the Navbar.
/auth and /setup do NOT use AppShell — they are standalone pages.

---

## 5. Implementation Milestones

---

### Milestone 0 — Design System, Font, and Global Setup

**Goal:** Every CSS token is defined and verifiable before any component is written.

**Files:**
- MODIFY index.html
- MODIFY src/index.css
- MODIFY vite.config.js

**Steps:**
1. Add Plus Jakarta Sans Google Fonts link to index.html `<head>`
2. Update `<title>` to "Skill Master"
3. Add `class="dark"` to `<html>` element in index.html as the default
4. Add path alias to vite.config.js: `resolve: { alias: { '@': path.resolve(__dirname, 'src') } }`
5. Add `import path from 'path'` to vite.config.js
6. Write full index.css as defined in Section 2 above — all tokens for both modes
7. Verify in browser: open devtools → Elements → html element has class="dark"
8. Verify: devtools → Computed → --color-accent resolves to #38BDF8

**Test checklist:**
- [ ] Dev server starts with `npm run dev` — zero console errors
- [ ] `<html>` has class="dark" by default
- [ ] --color-page-bg resolves to #0F1923 in dark mode
- [ ] Toggling class to "light" makes --color-page-bg resolve to #F1F5F9
- [ ] Plus Jakarta Sans renders in the browser (check Network tab — font loaded)
- [ ] No FOUC on hard refresh

---

### Milestone 1 — Routing Shell and Auth Guard

**Goal:** All routes exist and redirect correctly before any page UI is built.

**Files:**
- MODIFY src/main.jsx
- MODIFY src/App.jsx
- CREATE src/context/AuthContext.jsx
- CREATE src/hooks/useAuth.js
- CREATE src/routes/ProtectedRoute.jsx
- CREATE src/pages/NotFoundPage/NotFoundPage.jsx
- CREATE src/pages/NotFoundPage/NotFoundPage.module.css

**Steps:**
1. Install react-router-dom: `npm install react-router-dom`
2. Wrap `<App />` in `<BrowserRouter>` in main.jsx
3. Create AuthContext.jsx:
   - State: `{ user: null, isLoading: false }`
   - Functions: `mockLogin(email, password)`, `mockSignup(name, email, password)`, `logout()`
   - `mockLogin` sets user to mock user object from /src/mocks/user.json and saves to sessionStorage key "sm_session"
   - `mockSignup` does the same (simulates new user)
   - `logout` clears user state and removes "sm_session" from sessionStorage
   - On mount: read sessionStorage "sm_session" — if found, restore user state
   - Context value: `{ user, isLoading, mockLogin, mockSignup, logout }`
4. Create useAuth.js: exports `useContext(AuthContext)` — throw if used outside provider
5. Create ProtectedRoute.jsx:
   - Reads `user` from useAuth()
   - If user is null: `<Navigate to="/auth" replace />`
   - If user exists: `<Outlet />`
6. Define all routes in App.jsx:
   ```jsx
   <Routes>
     <Route path="/auth" element={<AuthPage />} />
     <Route element={<ProtectedRoute />}>
       <Route path="/setup" element={<SetupPage />} />
       <Route element={<AppShell />}>
         <Route path="/roadmap" element={<RoadmapPage />} />
         <Route path="/learn" element={<LearnPage />} />
         <Route path="/progress" element={<ProgressPage />} />
         <Route path="/session/:dayId" element={<SessionPage />} />
       </Route>
     </Route>
     <Route path="*" element={<NotFoundPage />} />
   </Routes>
   ```
7. Create stub components for every page (return `<div>PageName</div>`) so routes resolve
8. Create NotFoundPage with message "Page not found" and link to /learn

**Security notes:**
- ProtectedRoute must read from AuthContext only — never from localStorage directly
- sessionStorage is used for mock session, not localStorage, to limit exposure

**Test checklist:**
- [ ] Navigating to /learn without session redirects to /auth
- [ ] Navigating to /roadmap without session redirects to /auth
- [ ] Navigating to /auth after mock login redirects to /learn (add this logic in AuthPage later)
- [ ] /unknown-route renders NotFoundPage
- [ ] No full page reload occurs when navigating between routes
- [ ] Browser back/forward works correctly on all routes

---

### Milestone 2 — UI Component Library

**Goal:** All reusable UI primitives are built before any page uses them.

**Files:**
- CREATE src/components/ui/Button.jsx + Button.module.css
- CREATE src/components/ui/Badge.jsx + Badge.module.css
- CREATE src/components/ui/Card.jsx + Card.module.css
- CREATE src/components/ui/StatCard.jsx + StatCard.module.css
- CREATE src/components/ui/PillOption.jsx + PillOption.module.css
- CREATE src/assets/logo.svg

**Component specs:**

**Button.jsx**
Props: `variant` (primary | secondary | ghost), `size` (sm | md | lg), `fullWidth`, `loading`, `disabled`, `onClick`, `children`
- primary: bg var(--color-btn-primary-bg), color var(--color-btn-primary-fg)
- secondary: transparent bg, 1px solid var(--color-accent), color var(--color-accent)
- ghost: transparent bg, 1px solid var(--color-divider), color var(--color-text-muted)
- loading: shows spinner, disables click
- All variants: border-radius var(--radius-md), Plus Jakarta Sans, weight 600

**Badge.jsx**
Props: `variant` (learning | revision | exam | current | locked | success | danger)
- Pill shape: border-radius var(--radius-pill), padding 3px 10px, 11px weight 600
- Colors from CSS tokens per variant

**Card.jsx**
Props: `children`, `className`
- bg var(--color-card-bg), border 1px solid var(--color-card-border), border-radius var(--radius-lg)
- Default padding: var(--space-6)
- box-shadow: 0 1px 4px rgba(0,0,0,0.08)

**StatCard.jsx**
Props: `label`, `value`, `sub` (optional)
- label: 11px weight 500 uppercase letter-spacing 0.08em, var(--color-text-muted)
- value: 20px weight 600, var(--color-text-primary)
- sub: 13px weight 400, var(--color-text-muted)

**PillOption.jsx**
Props: `label`, `selected`, `onClick`
- Unselected: bg var(--color-input-bg), border 1px var(--color-input-border), text var(--color-text-muted)
- Selected: bg var(--color-accent), border var(--color-accent), text var(--color-btn-primary-fg)
- height 38px, border-radius var(--radius-pill), padding 0 20px, 13px weight 500

**logo.svg**
The node-path SVG icon (3 connected circles) from the brand kit.

**Test checklist:**
- [ ] Button renders in all 3 variants with correct colors
- [ ] Button loading state shows spinner and disables click
- [ ] Badge renders in all variants with correct colors
- [ ] PillOption toggles selected state visually
- [ ] All components switch colors correctly when html class changes dark ↔ light
- [ ] No hardcoded color values in any component — all use CSS variables

---

### Milestone 3 — AppShell and Navbar

**Goal:** Authenticated layout wrapper with functional navbar built before any protected page.

**Files:**
- CREATE src/components/layout/AppShell.jsx + AppShell.module.css
- CREATE src/components/layout/Navbar.jsx + Navbar.module.css
- CREATE src/components/layout/ProfileDropdown.jsx + ProfileDropdown.module.css
- CREATE src/hooks/useTheme.js

**Steps:**
1. Create useTheme.js:
   - On mount: read localStorage "sm-theme" — apply class to html element
   - Default: "dark" if no saved preference
   - `toggleTheme()` flips class and saves to localStorage
   - Returns `{ theme, toggleTheme }`

2. Create Navbar.jsx:
   - Left: logo SVG (28x28, bg var(--color-accent), border-radius 6px) + "Skill Master" text
   - Center: NavLinks — "Home" (→/learn), "Roadmap" (→/roadmap), "Progress" (→/progress)
   - Active link: use `useLocation()` to detect current path, apply active style
   - Active style: var(--color-accent) text + 2px bottom border in var(--color-accent)
   - Right: theme toggle icon button (moon/sun from useTheme) + ProfileDropdown
   - Height: 56px, bg var(--color-panel-bg), border-bottom 1px solid var(--color-card-border)
   - Mobile: hide center nav links on screens < 768px

3. Create ProfileDropdown.jsx:
   - Trigger: pill shape with user initials (derived from user.name first + last initial)
   - Dropdown panel: shows user.name, user.email, logout button
   - Click outside closes dropdown
   - Logout calls `logout()` from useAuth() then navigates to /auth

4. Create AppShell.jsx:
   - Renders `<Navbar />` at top
   - Renders `<Outlet />` below navbar with correct top padding (56px)
   - Full height layout

**Test checklist:**
- [ ] Navbar renders on /learn, /roadmap, /progress, /session/:dayId
- [ ] Navbar does NOT render on /auth or /setup
- [ ] Active link is highlighted correctly on each route
- [ ] Theme toggle switches dark ↔ light and persists after page reload
- [ ] Profile dropdown opens and closes correctly
- [ ] Logout from dropdown clears session and redirects to /auth
- [ ] On mobile (< 768px) center nav links are hidden
- [ ] Profile initials are correctly derived from user name

---

### Milestone 4 — Auth Page

**Goal:** Fully functional login and signup UI with all states.

**Files:**
- MODIFY src/pages/AuthPage/AuthPage.jsx (replace stub)
- CREATE src/pages/AuthPage/AuthPage.module.css
- CREATE src/mocks/user.json
- CREATE src/utils/validators.js

**Steps:**
1. Create validators.js:
   - `validateEmail(value)` — returns error string or null
   - `validatePassword(value)` — min 8 chars, returns error string or null
   - `validateName(value)` — non-empty, returns error string or null
   - `validateConfirmPassword(password, confirm)` — returns error string or null

2. Create user.json mock:
   ```json
   { "_id": "usr_001", "name": "Sharjeel Arshad", "firstName": "Sharjeel", "email": "sharjeel@example.com", "createdAt": "2026-01-01T00:00:00Z" }
   ```

3. Build AuthPage:
   - Desktop: split layout — left panel (40%) + right card (60%)
   - Left panel: logo mark + "Skill Master" + tagline + "Learn. Track. Master."
   - Right: auth card with tab switch (Log In | Sign Up)
   - Tab switching changes form content — NOT separate routes
   - Tab text must be exactly: "Log In" and "Sign Up" — no variations

4. Login form fields: Email, Password (eye toggle)
   - On submit: call `mockLogin(email, password)` from useAuth
   - On success: navigate to /learn (returning user) — for MVP all mock logins go to /learn
   - On error: show inline error message "Invalid email or password"
   - Loading state: button shows spinner text "Logging in..."

5. Sign Up form fields: Full Name, Email, Password, Confirm Password
   - On submit: validate all fields first — show field-level errors
   - Call `mockSignup(name, email, password)` on valid data
   - On success: navigate to /setup (new user)
   - Loading state: button shows "Creating account..."

6. Form validation:
   - Errors appear below the relevant field only
   - Error state: field border changes to var(--color-danger)
   - Error text: 11px var(--color-danger)
   - Validate on submit, not on every keystroke

7. Button text must be exactly:
   - Login tab: "Log In"
   - Signup tab: "Create Account"
   - Helper text login: "Don't have an account? Sign Up"
   - Helper text signup: "Already have an account? Log In"

**Security notes:**
- Never log passwords to console — not even in mock functions
- mockLogin should simulate 300ms delay before resolving (realistic UX)
- Form inputs must have autocomplete attributes set correctly

**Test checklist:**
- [ ] Login tab is active by default on page load
- [ ] Clicking "Sign Up" tab switches form — tab text does not change to "Join" or any other word
- [ ] Login with empty fields shows validation errors on both fields
- [ ] Login with invalid email format shows email error only
- [ ] Login button shows loading state during mock delay
- [ ] Successful mock login navigates to /learn
- [ ] Signup with mismatched passwords shows confirm password error
- [ ] Signup with all valid data navigates to /setup
- [ ] No console.log of any password value
- [ ] Already logged-in user visiting /auth is redirected to /learn

---

### Milestone 5 — Setup Page

**Goal:** Multi-section setup form that feeds all data into RoadmapContext.

**Files:**
- MODIFY src/pages/SetupPage/SetupPage.jsx
- CREATE src/pages/SetupPage/SetupPage.module.css
- CREATE src/context/RoadmapContext.jsx
- CREATE src/hooks/useRoadmap.js
- CREATE src/mocks/roadmap.json

**Steps:**
1. Create roadmap.json mock — full MERN Stack roadmap using the data contract from Section 3.
   Include 4 modules × 1 week × 7 days each. Days 1–5 are Learning, Day 6 Revision, Day 7 Exam.
   Include realistic lesson content, task descriptions, and 5 exam questions per week.

2. Create RoadmapContext.jsx:
   - State: `{ roadmapJson, progress, sessionPhase, setupData }`
   - `generateMockRoadmap(setupData)` — 1500ms delay, then sets roadmapJson from mock JSON
   - `updateProgress(dayId, status)` — updates progress object
   - `setSessionPhase(phase)` — updates phase for SessionPage
   - `resetSession()` — resets phase state to 'lesson'

3. Create useRoadmap.js — consumes RoadmapContext

4. Build SetupPage (no Navbar — standalone):
   - Page title: "Set Up Your Learning Profile"
   - Subtitle: "Welcome, [user.firstName]. Tell us your goal and preferences so we can build your roadmap."
   - user.firstName pulled from useAuth()
   - Three sections: LEARNER INFORMATION, LEARNING GOAL, LEARNING PREFERENCES
   - NO Full Name field — name already known from auth

5. Section A — LEARNER INFORMATION:
   - "Your Role" — PillOption group: Student | Job Seeker | Other (default: Student)
   - "Current Level" — PillOption group: Beginner | Intermediate | Advanced (default: Beginner)

6. Section B — LEARNING GOAL:
   - "What do you want to learn?" — text input, required, max 150 chars
   - "Why do you want to learn it?" — textarea, optional, helper: "Optional — helps us personalise your roadmap tone"

7. Section C — LEARNING PREFERENCES:
   - "Daily Available Time" — select: Less than 30 minutes | 30 – 60 minutes | 1 – 2 hours | 2+ hours (default: 30 – 60 minutes)
   - "Preferred Pace" — select: Relaxed | Steady | Intensive (default: Steady)
   - "Preferred Learning Style" — PillOption: Reading | Examples | Practice (default: Examples)

8. Action area:
   - Helper text: "Your answers will be used to generate a personalised roadmap built specifically for you."
   - Buttons right-aligned: "Back" (secondary) | "Generate Roadmap" (primary)
   - On "Generate Roadmap": validate skill name not empty, then call `generateMockRoadmap(setupData)`
   - During generation: button becomes "Generating..." with loading spinner, disabled
   - On success: navigate to /roadmap

**Test checklist:**
- [ ] User first name appears in subtitle — not hardcoded
- [ ] No Full Name field present anywhere on the page
- [ ] No Navbar present on this page
- [ ] Pill options toggle correctly — only one selected per group at a time
- [ ] "What do you want to learn?" shows error if empty on submit
- [ ] "Generate Roadmap" button shows loading state for ~1500ms
- [ ] After generation, navigates to /roadmap
- [ ] All dropdown options render with correct text — no extra/missing options
- [ ] On mobile: buttons stack vertically, full width

---

### Milestone 6 — Roadmap Page

**Goal:** Full roadmap orientation screen with module → week → day hierarchy.

**Files:**
- MODIFY src/pages/RoadmapPage/RoadmapPage.jsx
- CREATE src/pages/RoadmapPage/RoadmapPage.module.css

**Steps:**
1. Read roadmapJson and progress from useRoadmap()
2. Local state: `activeModuleIndex` (default: currentModule - 1), `activeWeekIndex` (default: 0)
3. Build page sections in order: Header → Summary Card → Modules → Weeks → Days → CTA

4. Summary card: 5 stats in row (desktop) / 2x3 grid (mobile): SKILL, LEVEL, MODULES, DURATION, DAILY TIME

5. Modules section:
   - Label: "MODULES"
   - 4 module cards in a horizontal row — NOT accordion
   - Active card: border var(--color-accent) 1.5px, bg var(--color-accent-muted)
   - Inactive card: standard card border
   - Click on a module card → sets activeModuleIndex, resets activeWeekIndex to 0
   - Each card shows: module number, title, status badge (Current | Locked)

6. Weeks section:
   - Label: "WEEKS — MODULE 0X" (X = activeModuleIndex + 1)
   - Shows weeks of active module only
   - Week items in horizontal row — active week: bg var(--color-accent), text var(--color-btn-primary-fg)
   - Click on week → sets activeWeekIndex

7. Days section:
   - Label: "DAYS — WEEK X"
   - Readonly list rows — no click action on day rows
   - Each row: day number + title + type badge + status badge
   - Current day (matches progress.currentDay in active week): shows accent dot indicator
   - Day rows in a bordered container with border-radius var(--radius-lg)

8. CTA: "Get Started" button — navigates to /learn — center aligned desktop, full width mobile

**Test checklist:**
- [ ] Clicking Module 2 card updates the weeks section to Module 2's weeks
- [ ] Clicking Week 2 updates the days section to Week 2's days
- [ ] Module 1 is active and styled correctly on first load
- [ ] Week 1 is active and styled correctly on first load
- [ ] All 7 day rows show correct type badges (days 1–5 Learning, 6 Revision, 7 Exam)
- [ ] Current day has accent dot indicator
- [ ] Day rows are NOT clickable — no cursor: pointer, no navigation
- [ ] Summary card shows 5 stats from roadmapJson
- [ ] "Get Started" navigates to /learn
- [ ] On mobile: module cards scroll horizontally if needed

---

### Milestone 7 — Learn / Dashboard Page

**Goal:** Home screen showing current learning state and session card.

**Files:**
- MODIFY src/pages/LearnPage/LearnPage.jsx
- CREATE src/pages/LearnPage/LearnPage.module.css
- CREATE src/utils/sessionHelpers.js

**Steps:**
1. Create sessionHelpers.js:
   - `getCurrentSession(roadmapJson, progress)` — traverses roadmapJson using currentModule, currentWeek, currentDay → returns session object (see data contract Section 3)
   - `getRevisionTopics(progress)` — returns progress.weakTopics array
   - `getDayType(roadmapJson, moduleNum, weekNum, dayName)` — returns "Learning" | "Revision" | "Exam"

2. Build LearnPage:
   - Page header: "Dashboard" / "Pick up where you left off." / optional "Current Skill: [skillName]"
   - Section 1 — Current Point Summary: 4 StatCards in row (desktop) / 2x2 grid (mobile)
     - Current Module, Current Week, Current Day, Revision Queue (count)
   - Section 2 — Current Session Card: full-width card (most prominent element on page)
     - Session title, day label, type badge, estimated time, status, one-line description
     - "Continue Session" button → navigates to /session/[derived dayId]
   - Section 3 — Revision Queue: flat list of weakTopics from progress
     - If empty: show "No revision topics yet" in muted text

3. Empty states:
   - No roadmap: show "No roadmap available" + "Create Roadmap" → /setup
   - No current session: show "No active session found" + "View Roadmap" button

**Test checklist:**
- [ ] All 4 stat cards show correct values from progress mock
- [ ] Session card title matches current day's session title from roadmapJson
- [ ] Session type badge shows correct variant (Learning / Revision / Exam)
- [ ] "Continue Session" navigates to /session/m1-w1-d1 (or correct dayId)
- [ ] Revision queue shows weakTopics from progress mock
- [ ] Empty revision queue shows "No revision topics yet"
- [ ] No roadmap empty state shows correctly when roadmapJson is null

---

### Milestone 8 — Progress Page

**Goal:** Learning record and stats screen.

**Files:**
- MODIFY src/pages/ProgressPage/ProgressPage.jsx
- CREATE src/pages/ProgressPage/ProgressPage.module.css

**Steps:**
1. Read progress from useRoadmap()
2. Derive stats from progress:
   - Completed Sessions: completedTasks.length
   - Modules Completed: derived from completedTasks
   - Latest Result: last item in examScores[].passed → "Passed" or "Failed"
   - Revision Topics: weakTopics.length

3. Build page sections:
   - Header: "Progress" / "Your learning record, performance, and growth."
   - Section 1 — Top Summary Stats: 4 StatCards (2x2 mobile, 1 row desktop)
   - Section 2 — Learning Summary + Recent Outcomes (side by side desktop, stacked mobile)
   - Section 3 — Revision & Weak Topics: flat informational list

**Test checklist:**
- [ ] All 4 stat cards derive values from progress object (not hardcoded)
- [ ] Revision topics list shows same topics as progress.weakTopics
- [ ] Page does not show Current Session CTA (that is for /learn only)
- [ ] Empty revision queue shows "No revision topics yet"

---

### Milestone 9 — Session Page (Phase Engine)

**Goal:** Phase-based learning arena. Most complex milestone — build state machine first.

**Files:**
- MODIFY src/pages/SessionPage/SessionPage.jsx
- CREATE src/pages/SessionPage/SessionPage.module.css
- CREATE src/pages/SessionPage/phases/LessonPhase.jsx + .module.css
- CREATE src/pages/SessionPage/phases/TaskPhase.jsx + .module.css
- CREATE src/pages/SessionPage/phases/FeedbackPhase.jsx + .module.css
- CREATE src/pages/SessionPage/phases/ExamPhase.jsx + .module.css
- CREATE src/pages/SessionPage/ExamResult.jsx + .module.css

**Phase state machine (in SessionPage.jsx local state):**
```
phase: 'lesson' | 'task' | 'feedback' | 'exam' | 'exam_result'
```

**Steps:**
1. SessionPage reads `:dayId` from URL params
2. Derives session object from roadmapJson + dayId using sessionHelpers
3. On load: if session.type === 'Exam', set initial phase to 'exam'; else 'lesson'
4. Renders phase component based on current phase state
5. Passes `onAdvance` callback to each phase that triggers next phase

6. LessonPhase:
   - Splits lessonContent into parts if long (paragraph-based splitting)
   - Shows one part at a time with "Next" button
   - After last part: button becomes "I've Finished the Lesson" → calls onAdvance to 'task'

7. TaskPhase:
   - Shows task.description
   - Textarea for user answer (required, min 20 chars)
   - "Submit Task" → simulate 1500ms AI feedback call → set mock feedback text → advance to 'feedback'
   - During submission: button loading state "Getting Feedback..."

8. FeedbackPhase:
   - Shows feedback text (from mock or simulated response)
   - Visual outcome indicator (positive: var(--color-success) accent; needs_improvement: var(--color-warning))
   - "Continue to Next Session" → call `updateProgress(dayId, 'passed')` → navigate to /learn

9. ExamPhase:
   - Shows questions one at a time (1 of 10 indicator)
   - Single-choice answer selection
   - "Next" / "Previous" between questions
   - "Submit Exam" → calculate score → if ≥ 80%: advance to 'exam_result' with passed=true; else passed=false
   - Add weak topics on failure: questions answered wrong → their topics added to progress.weakTopics

10. ExamResult:
    - Shows score as percentage
    - If passed: success badge + "Continue to Next Week" → updateProgress → /learn
    - If failed: danger badge + weak topics list + "Back to Revision" → resetCurrentDayToSaturday → /learn

**Session page has NO top navbar CTA — minimal distraction. Navbar still renders via AppShell but no session-specific nav items.**

**Security notes:**
- Exam answers validated on client for MVP (server validates in production)
- Task answers must not be submitted if empty — validate before mock API call

**Test checklist:**
- [ ] /session/m1-w1-d1 loads with lesson phase active
- [ ] Lesson part 1 shows, "Next" advances to part 2
- [ ] After all parts, button shows "I've Finished the Lesson"
- [ ] Task phase shows task.description correctly
- [ ] Empty task answer shows validation error — does not submit
- [ ] Submit Task shows loading state for ~1500ms
- [ ] Feedback phase shows mock feedback text
- [ ] "Continue to Next Session" updates progress and navigates to /learn
- [ ] /session/m1-w1-d7 (Sunday) loads with exam phase active (not lesson)
- [ ] Exam scoring: 8/10 correct = 80% = passes
- [ ] Exam fail adds wrong-question topics to progress.weakTopics
- [ ] Exam pass navigates to /learn with updated progress

---

### Milestone 10 — Full Flow Polish and Edge Cases

**Goal:** Complete clickthrough flow works end to end with all loading and empty states.

**Steps:**
1. Auth → Setup → Roadmap → Learn → Session → Feedback → Learn (full cycle works)
2. Add loading skeleton on LearnPage while roadmapJson is loading
3. Add error boundary around SessionPage — show retry button if session data fails
4. Verify all mobile layouts at 390px: grids, stacked buttons, horizontal scrollable module rows
5. Verify dark ↔ light theme switch on every page — no hardcoded colors remain anywhere
6. Run `npm run build` — fix any build errors or warnings
7. Check browser console on every page — zero errors, zero warnings

**Test checklist:**
- [ ] Complete flow: /auth → /setup → /roadmap → /learn → /session/:dayId → /learn
- [ ] Theme toggle persists after full page reload on every route
- [ ] All pages render without console errors in production build
- [ ] All pages render correctly at 390px width
- [ ] All pages render correctly at 1440px width
- [ ] No hardcoded hex color values in any component .module.css file
- [ ] `npm run build` produces zero errors

---

## 6. Mock Data Strategy

All mock data lives in `/src/mocks/`:

- `user.json` — mock user object, imported in AuthContext for `mockLogin` and `mockSignup`
- `roadmap.json` — full MERN Stack roadmapJson, imported in RoadmapContext for `generateMockRoadmap`

Components never import mock data directly — they read from Context only.
This means replacing mock with real API calls only requires changing the Context functions — zero component changes needed.

---

## 7. Security Checklist

| Concern | Location | Mitigation |
|---|---|---|
| Unauthenticated route access | /roadmap, /learn, /progress, /session | ProtectedRoute — redirects to /auth |
| Session persisting after logout | AuthContext | `logout()` clears sessionStorage + resets user state |
| XSS via user input in task answer | TaskPhase textarea | Render as text only — no dangerouslySetInnerHTML anywhere |
| XSS via AI feedback content | FeedbackPhase | Feedback rendered as plain text string |
| Password logged to console | AuthContext mockLogin/mockSignup | Never log password param — enforced in code review checklist |
| Hardcoded mock credentials committed | user.json | Only mock email/name — no real passwords in repo |
| API key exposure | Not applicable (MVP) | No real API calls in frontend — document that AI calls go through backend only |
| Source maps in production | vite.config.js | Add `build: { sourcemap: false }` to production config |
| Dark mode class overridable via URL | useTheme.js | Class applied on mount from localStorage — no URL param influence |

---

## 8. Known Risks & Deferred Items

| Item | Status | Reason |
|---|---|---|
| Real backend API | Deferred — Phase 2 | Mock Context functions cover all UI needs |
| Real AI roadmap generation | Deferred — Phase 2 | Mock roadmap.json provides realistic data |
| Real AI feedback | Deferred — Phase 2 | Hardcoded feedback string simulates the response |
| User registration data persistence | Deferred | sessionStorage cleared on tab close — acceptable for MVP |
| Multiple roadmaps per user | Deferred | MVP supports one active roadmap per session |
| Glassmorphism / backdrop-filter | Removed | Brand kit specifies flat surfaces only |
| TypeScript migration | Deferred | JavaScript sufficient for MVP — add TS in Phase 2 |
| Unit tests | Deferred | Manual test checklists per milestone cover MVP verification |

---

## 9. Completion Criteria

The coding agent marks this plan complete when all of the following are true:

- [ ] All 6 core routes render without crash: /auth, /setup, /roadmap, /learn, /progress, /session/:dayId
- [ ] /unknown-route renders NotFoundPage
- [ ] Full user flow is clickable end to end: Auth → Setup → Roadmap → Learn → Session (all phases) → Return to Learn
- [ ] Unauthenticated user visiting any protected route is redirected to /auth
- [ ] Dark mode renders correctly on all pages (no light surfaces visible)
- [ ] Light mode renders correctly on all pages (no dark surfaces visible)
- [ ] Theme preference persists after full page reload
- [ ] Mobile layout (390px) renders correctly on all pages — no overflow, no broken grids
- [ ] Desktop layout (1440px) renders correctly on all pages
- [ ] All form validation states are visible and block incorrect submission
- [ ] All loading states are visible (generate roadmap, task submit, login)
- [ ] No console errors in development mode
- [ ] No console errors in production build (`npm run build && npm run preview`)
- [ ] No hardcoded color hex values in any .module.css file — all use CSS variables
- [ ] mock data flows through all components without undefined or null rendering errors
