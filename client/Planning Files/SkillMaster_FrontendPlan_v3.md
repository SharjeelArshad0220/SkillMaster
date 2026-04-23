# Skill Master — Frontend Build Plan v3
**Stack:** React 18 + Vite + Tailwind CSS v3
**State:** React Context API
**Routing:** React Router v6
**Font:** Plus Jakarta Sans
**Version:** 3.0 — Milestones 0–3 Complete, Replanning from Milestone 4
**Date:** 2026

---

## WHAT IS ALREADY DONE (Milestones 0–3)

The following are complete — do not touch these:

- Milestone 0: Vite + Tailwind setup, tailwind.config.js, index.css, font import
- Milestone 1: API layer (/src/api/), tokenHelpers, validators, sessionHelpers, mock roadmap.json
- Milestone 2: AuthContext, AppContext, ProtectedRoute, all route stubs, App.jsx
- Milestone 3: Button, Badge, Card, StatCard, PillOption, LoadingSpinner components

---

## WHAT CHANGED IN v3

1. **AppShell restructured** — Desktop: top navbar + bottom footer. Mobile: bottom tab bar replacing top navbar.
2. **Lesson structure changed** — Lessons now have 3 parts. Each part has cards. After each part: mini MCQ exercise. After all 3 exercises: Task phase begins.
3. **Task phase clarified** — Text answer for conceptual/practical tasks. MCQ quest (15–20 questions) as the alternative for comprehension-heavy topics. AI decides which based on lesson type.
4. **Pixel-level design spec** — Every component has exact Tailwind classes defined. No ambiguity for Antigravity.
5. **Data contracts updated** — roadmapJson structure updated to reflect new lesson anatomy.

---

## DESIGN TOKEN REFERENCE

These are the only colors used in this application. Antigravity must reference these tokens only — never arbitrary hex values.

### tailwind.config.js custom colors (already set up in Milestone 0)

```js
colors: {
  "navy":         "#0F1923",   // page background
  "navy-mid":     "#162032",   // card, panel, navbar background
  "navy-light":   "#1E2F42",   // card border, input border on dark
  "divider":      "#2E3D52",   // dividers, inactive borders
  "accent":       "#38BDF8",   // primary accent — dark mode
  "accent-dk":    "#0EA5E9",   // primary accent — light mode + hover
  "slate":        "#CBD5E1",   // body text dark mode
  "muted":        "#64748B",   // secondary text, inactive, placeholder
  "pass":         "#22C55E",   // success, pass state
  "fail":         "#EF4444",   // error, fail state
  "warn":         "#F59E0B",   // warning, revision state
  "exam-red":     "#EF4444",   // exam phase accent (red both modes)
}
```

### Light mode Tailwind pattern

Tailwind v3 with `darkMode: "class"` means:
- Dark mode styles: write normally (`bg-navy`, `text-slate`)
- Light mode overrides: use `dark:` prefix INVERTED — actually use a custom `light:` variant

Since Tailwind v3 does not support `light:` natively, use this approach:
- Default classes = light mode styles
- `dark:` prefix = dark mode overrides

```jsx
// CORRECT pattern — light mode default, dark mode override:
<div className="bg-white dark:bg-navy-mid border border-gray-200 dark:border-navy-light">
  <p className="text-gray-900 dark:text-white">Title</p>
  <p className="text-gray-500 dark:text-muted">Body</p>
</div>
```

**This is the pattern for every single component. Light = default. Dark = dark: prefix.**

### Border rules
- Card borders: `border border-gray-200 dark:border-navy-light`
- Input borders: `border border-gray-300 dark:border-divider` normal state
- Input focus: `focus:border-accent-dk dark:focus:border-accent focus:outline-none focus:ring-0`
- Active/selected borders: `border-accent-dk dark:border-accent`

### Typography rules
- H1 page title: `text-2xl font-bold text-gray-900 dark:text-white`
- H2 section title: `text-lg font-semibold text-gray-900 dark:text-white`
- Body text: `text-sm text-gray-600 dark:text-slate`
- Muted/secondary: `text-xs text-gray-400 dark:text-muted`
- Section category label: `text-xs font-bold uppercase tracking-widest text-accent-dk dark:text-accent`
- All fonts: `font-sans` (Plus Jakarta Sans via tailwind.config.js)

---

## UPDATED DATA CONTRACTS

### roadmapJson — Updated Lesson Structure

The roadmapJson shape changes at the lesson level. Each Learning day now has a structured lesson with 3 parts, each part with cards, and a mini exercise after each part.

```json
{
  "skillName": "string",
  "level": "string",
  "totalModules": 4,
  "estimatedWeeks": 4,
  "dailyTime": "string",
  "modules": [
    {
      "moduleNumber": 1,
      "title": "string",
      "weeks": [
        {
          "weekNumber": 1,
          "days": [
            {
              "dayNumber": 1,
              "dayName": "Monday",
              "type": "Learning",
              "title": "string",
              "lesson": {
                "parts": [
                  {
                    "partNumber": 1,
                    "partTitle": "string",
                    "cards": [
                      {
                        "cardNumber": 1,
                        "content": "string — lesson content for this card, min 100 words"
                      }
                    ],
                    "miniExercise": {
                      "question": "string",
                      "options": ["string", "string", "string", "string"],
                      "correctIndex": 0,
                      "explanation": "string — why the correct answer is correct"
                    }
                  },
                  {
                    "partNumber": 2,
                    "partTitle": "string",
                    "cards": [...],
                    "miniExercise": { ... }
                  },
                  {
                    "partNumber": 3,
                    "partTitle": "string",
                    "cards": [...],
                    "miniExercise": { ... }
                  }
                ]
              },
              "task": {
                "type": "text | mcq",
                "description": "string — task instructions (for text type)",
                "questions": [
                  {
                    "question": "string",
                    "options": ["string", "string", "string", "string"],
                    "correctIndex": 0
                  }
                ],
                "questionCount": 15
              }
            },
            {
              "dayNumber": 6,
              "dayName": "Saturday",
              "type": "Revision",
              "title": "string",
              "lesson": {
                "parts": [
                  {
                    "partNumber": 1,
                    "partTitle": "Week Revision",
                    "cards": [...],
                    "miniExercise": null
                  }
                ]
              },
              "task": null
            },
            {
              "dayNumber": 7,
              "dayName": "Sunday",
              "type": "Exam",
              "title": "Weekly Exam",
              "lesson": null,
              "task": null,
              "examQuestions": [
                {
                  "question": "string",
                  "options": ["string", "string", "string", "string"],
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

### Task Type Decision Rule

The AI generates tasks. In the roadmap generation prompt, instruct:
- If the day's lesson is conceptual/theoretical: `task.type = "mcq"`, 15 questions
- If the day's lesson is practical/hands-on: `task.type = "text"`, one open-ended description question
- Revision days: no task
- Exam days: use `examQuestions` array, not `task`

### API call shapes — unchanged from APIContract.md

All request/response shapes remain exactly as defined in SkillMaster_APIContract.md.
The only internal change is `roadmapJson.modules[].weeks[].days[].lesson` structure above.
The API endpoints, auth, and response envelopes are identical.

---

## MILESTONE 4 — APPSHELL, NAVBAR, FOOTER, MOBILE BOTTOM BAR

**Goal:** Build the complete authenticated shell with responsive navigation before any page is built.

**What this milestone produces:**
- Desktop: top navbar + page content + bottom footer
- Mobile: page content + bottom tab bar (no top navbar on mobile)

---

### 4.1 File List

```
CREATE: src/components/layout/AppShell.jsx
CREATE: src/components/layout/Navbar.jsx
CREATE: src/components/layout/Footer.jsx
CREATE: src/components/layout/BottomTabBar.jsx
CREATE: src/components/layout/ProfileDropdown.jsx
CREATE: src/hooks/useTheme.js
```

---

### 4.2 useTheme.js

```js
import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("sm-theme") || "dark"
  );

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark", "light");
    html.classList.add(theme);
    localStorage.setItem("sm-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  return { theme, toggleTheme };
}
```

---

### 4.3 Navbar.jsx — Desktop Only (hidden on mobile)

**Exact Tailwind classes:**

```jsx
// Outer navbar bar
<nav className="hidden md:flex fixed top-0 left-0 right-0 z-50
                h-14 items-center justify-between px-6
                bg-navy-mid dark:bg-navy-mid bg-white
                border-b border-navy-light dark:border-navy-light border-gray-200">

  {/* LEFT — Logo + App Name */}
  <div className="flex items-center gap-2">
    {/* Logo mark — 28x28 rounded square */}
    <div className="w-7 h-7 rounded-[6px] bg-accent-dk dark:bg-accent
                    flex items-center justify-center flex-shrink-0">
      {/* Insert logo SVG here — stroke="currentColor" on icon paths */}
      {/* Icon color: text-navy (dark bg) or text-white (light bg) */}
    </div>
    <span className="text-base font-semibold text-gray-900 dark:text-white font-sans">
      Skill Master
    </span>
  </div>

  {/* CENTER — Nav Links */}
  <div className="flex items-center gap-8">
    {/* Each nav link: */}
    {/* Inactive: text-muted dark:text-muted, no underline */}
    {/* Active: text-gray-900 dark:text-white, 2px bottom border in accent */}
    <NavLink to="/learn"     label="Home"     active={location.pathname === "/learn"} />
    <NavLink to="/roadmap"   label="Roadmap"  active={location.pathname === "/roadmap"} />
    <NavLink to="/progress"  label="Progress" active={location.pathname === "/progress"} />
  </div>

  {/* RIGHT — Theme toggle + Profile */}
  <div className="flex items-center gap-4">
    {/* Theme toggle button */}
    <button onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center
                       text-muted dark:text-muted text-gray-400
                       hover:text-gray-700 dark:hover:text-slate
                       rounded-lg transition-colors">
      {/* Moon icon for dark mode, Sun icon for light mode */}
    </button>
    {/* Profile trigger */}
    <ProfileDropdown />
  </div>
</nav>
```

**NavLink sub-component inside Navbar.jsx:**
```jsx
function NavLink({ to, label, active }) {
  return (
    <Link to={to}
          className={`text-sm font-medium pb-1 transition-colors
            ${active
              ? "text-gray-900 dark:text-white border-b-2 border-accent-dk dark:border-accent"
              : "text-gray-400 dark:text-muted hover:text-gray-700 dark:hover:text-slate"
            }`}>
      {label}
    </Link>
  );
}
```

---

### 4.4 Footer.jsx — Desktop Only (hidden on mobile)

**Exact Tailwind classes:**

```jsx
<footer className="hidden md:block
                   bg-navy-mid dark:bg-navy-mid bg-white
                   border-t border-navy-light dark:border-navy-light border-gray-200
                   px-6 py-3">
  <div className="max-w-5xl mx-auto flex items-center justify-between">

    {/* Left — app name + version */}
    <span className="text-xs text-muted dark:text-muted text-gray-400 font-sans">
      Skill Master — MVP v1.0
    </span>

    {/* Center — current skill badge (from AppContext) */}
    <span className="text-xs font-medium text-gray-500 dark:text-muted font-sans">
      {roadmapJson ? `Learning: ${roadmapJson.skillName}` : "No active skill"}
    </span>

    {/* Right — current position */}
    <span className="text-xs text-muted dark:text-muted text-gray-400 font-sans">
      {progress
        ? `Module ${progress.currentModule} · Week ${progress.currentWeek} · ${progress.currentDay}`
        : "—"
      }
    </span>

  </div>
</footer>
```

---

### 4.5 BottomTabBar.jsx — Mobile Only (hidden on desktop)

**This replaces the top navbar on mobile. It appears at the bottom of the screen like a native app.**

**Exact Tailwind classes:**

```jsx
<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50
                h-16 flex items-center justify-around
                bg-navy-mid dark:bg-navy-mid bg-white
                border-t border-navy-light dark:border-navy-light border-gray-200
                px-2 pb-safe">
  {/* pb-safe handles iPhone home indicator via safe-area-inset */}

  {/* Tab item structure — 4 tabs: Home, Roadmap, Progress, Profile */}
  <TabItem to="/learn"     icon={HomeIcon}     label="Home"     active={...} />
  <TabItem to="/roadmap"   icon={MapIcon}      label="Roadmap"  active={...} />
  <TabItem to="/progress"  icon={ChartIcon}    label="Progress" active={...} />
  <TabItem to="/profile"   icon={PersonIcon}   label="Profile"  active={...} />
</nav>
```

**TabItem sub-component:**
```jsx
function TabItem({ to, icon: Icon, label, active }) {
  return (
    <Link to={to}
          className="flex flex-col items-center justify-center gap-0.5
                     flex-1 h-full py-2 transition-colors">
      {/* Icon */}
      <Icon className={`w-5 h-5
        ${active
          ? "text-accent-dk dark:text-accent"
          : "text-gray-400 dark:text-muted"
        }`} />
      {/* Label */}
      <span className={`text-[10px] font-medium font-sans
        ${active
          ? "text-accent-dk dark:text-accent"
          : "text-gray-400 dark:text-muted"
        }`}>
        {label}
      </span>
      {/* Active dot indicator */}
      {active && (
        <div className="absolute top-1 w-1 h-1 rounded-full
                        bg-accent-dk dark:bg-accent" />
      )}
    </Link>
  );
}
```

**Icons:** Use `react-icons/hi2` (Heroicons v2 outline). Install: `npm install react-icons`
- Home: `HiOutlineHome` / active: `HiHome`
- Roadmap: `HiOutlineMap` / active: `HiMap`
- Progress: `HiOutlineChartBar` / active: `HiChartBar`
- Profile: `HiOutlineUser` / active: `HiUser`

---

### 4.6 ProfileDropdown.jsx

```jsx
// Trigger: pill with user initials
// Position: absolute, right-0, top-10 (below navbar)
// Close on outside click

<div className="relative" ref={dropdownRef}>
  {/* Trigger */}
  <button onClick={() => setOpen(o => !o)}
          className="h-8 px-3 rounded-full flex items-center gap-1.5 font-sans
                     bg-navy-light dark:bg-navy-light bg-gray-100
                     text-sm font-semibold text-slate dark:text-slate text-gray-700
                     hover:bg-divider dark:hover:bg-divider hover:bg-gray-200
                     transition-colors">
    {initials}
  </button>

  {/* Dropdown panel */}
  {open && (
    <div className="absolute right-0 top-10 w-56 z-50 font-sans
                    bg-navy-mid dark:bg-navy-mid bg-white
                    border border-navy-light dark:border-navy-light border-gray-200
                    rounded-xl shadow-lg overflow-hidden">

      {/* User info */}
      <div className="px-4 py-3 border-b border-divider dark:border-divider border-gray-100">
        <p className="text-sm font-semibold text-white dark:text-white text-gray-900">
          {user.name}
        </p>
        <p className="text-xs text-muted dark:text-muted text-gray-400 mt-0.5">
          {user.email}
        </p>
      </div>

      {/* Logout button */}
      <button onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-sm font-medium
                         text-fail dark:text-fail
                         hover:bg-navy-light dark:hover:bg-navy-light hover:bg-gray-50
                         transition-colors">
        Log Out
      </button>
    </div>
  )}
</div>
```

**Initials derivation:**
```js
const initials = user.name
  .split(" ")
  .map(word => word[0])
  .slice(0, 2)
  .join("")
  .toUpperCase();
```

---

### 4.7 AppShell.jsx

```jsx
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomTabBar from "./BottomTabBar";
import { Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-navy font-sans">

      {/* Desktop top navbar — hidden on mobile */}
      <Navbar />

      {/* Main content area */}
      {/* md:pt-14 = padding for fixed top navbar on desktop */}
      {/* md:pb-0 = no bottom padding on desktop (footer is in flow) */}
      {/* pb-16 = space for fixed bottom tab bar on mobile */}
      <main className="flex-1 pt-0 md:pt-14 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Desktop footer — hidden on mobile */}
      <Footer />

      {/* Mobile bottom tab bar — hidden on desktop */}
      <BottomTabBar />

    </div>
  );
}
```

---

### 4.8 Milestone 4 Test Checklist

- [ ] Desktop (≥768px): top navbar visible, bottom tab bar hidden
- [ ] Mobile (<768px): top navbar hidden, bottom tab bar visible at screen bottom
- [ ] Desktop: footer visible below page content, shows skill name + progress position
- [ ] Active nav link has accent underline (desktop) or accent color + dot (mobile)
- [ ] Theme toggle in navbar switches dark/light and persists on reload
- [ ] Profile dropdown opens on click, closes on outside click
- [ ] Logout from dropdown clears token and redirects to /auth
- [ ] Profile initials correctly derived from user.name
- [ ] All text uses font-sans (Plus Jakarta Sans)
- [ ] No hardcoded hex values — all Tailwind custom tokens
- [ ] AppShell does NOT render on /auth or /setup (those are standalone pages)

---

## MILESTONE 5 — AUTH PAGE

**Reference files:** design-reference/auth-login-dark-desktop.html, auth-login-light-desktop.html, auth-login-dark-mobile.html, auth-signup-dark-desktop.html

**Note:** Milestones 4 and 5 were previously 4 and 5 in v2. Content is identical but now includes full Tailwind class specs.

### 5.1 File
```
MODIFY: src/pages/AuthPage/AuthPage.jsx
```

### 5.2 Full Tailwind Layout Spec

**Outer wrapper — full screen, centered:**
```jsx
<div className="min-h-screen flex bg-gray-50 dark:bg-navy font-sans">
```

**Desktop: two-panel split**
```jsx
{/* LEFT PANEL — 40% — branding */}
<div className="hidden md:flex md:w-[40%] flex-col items-center justify-center
                bg-white dark:bg-navy-mid
                border-r border-gray-200 dark:border-navy-light
                p-12 gap-6">
  {/* Logo mark */}
  <div className="w-10 h-10 rounded-[10px] bg-accent-dk dark:bg-accent
                  flex items-center justify-center">
    {/* SVG icon — import logo.svg */}
  </div>
  {/* App name */}
  <h1 className="text-[26px] font-semibold text-gray-900 dark:text-white tracking-tight">
    Skill Master
  </h1>
  {/* Tagline */}
  <p className="text-sm text-gray-400 dark:text-muted text-center">
    AI-powered personalized learning
  </p>
  {/* Decorative line */}
  <p className="text-xs italic text-gray-300 dark:text-muted opacity-60 mt-4">
    Learn. Track. Master.
  </p>
</div>

{/* RIGHT PANEL — 60% — auth form */}
<div className="w-full md:w-[60%] flex items-center justify-center
                p-6 md:p-12 bg-gray-50 dark:bg-navy">
  <div className="w-full max-w-[400px]
                  bg-white dark:bg-navy-mid
                  border border-gray-200 dark:border-navy-light
                  rounded-xl p-8">
    {/* Auth card content here */}
  </div>
</div>
```

**Tab row:**
```jsx
<div className="flex border-b border-gray-200 dark:border-divider mb-8">
  {/* Active tab */}
  <button className="px-6 py-3 text-sm font-semibold
                     text-gray-900 dark:text-white
                     border-b-2 border-accent-dk dark:border-accent
                     transition-colors">
    Log In
  </button>
  {/* Inactive tab */}
  <button className="px-6 py-3 text-sm font-medium
                     text-gray-400 dark:text-muted
                     hover:text-gray-700 dark:hover:text-slate
                     transition-colors">
    Sign Up
  </button>
</div>
```

**Input field wrapper:**
```jsx
<div className="space-y-1.5">
  <label className="block text-xs font-medium text-gray-700 dark:text-slate">
    Email
  </label>
  <input
    className="w-full h-10 px-4 rounded-lg text-sm font-sans
               bg-white dark:bg-navy
               border border-gray-300 dark:border-divider
               text-gray-900 dark:text-white
               placeholder:text-gray-300 dark:placeholder:text-muted
               focus:border-accent-dk dark:focus:border-accent
               focus:outline-none focus:ring-0
               transition-colors"
    {/* Error state — add: border-fail dark:border-fail */}
  />
  {/* Error text — only visible when error exists */}
  <p className="text-xs text-fail">Enter a valid email address</p>
</div>
```

**Primary button:**
```jsx
<button className="w-full h-10 rounded-lg text-sm font-semibold font-sans
                   bg-accent-dk dark:bg-accent
                   text-white dark:text-navy
                   hover:bg-sky-600 dark:hover:bg-accent-dk
                   active:scale-[0.98]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all flex items-center justify-center gap-2">
  {loading ? <><LoadingSpinner size="sm" /> Logging in...</> : "Log In"}
</button>
```

**Helper text:**
```jsx
<p className="text-center text-sm text-gray-400 dark:text-muted mt-4">
  Don't have an account?{" "}
  <button onClick={() => setTab("signup")}
          className="text-accent-dk dark:text-accent font-medium hover:underline">
    Sign Up
  </button>
</p>
```

**Mobile layout:**
```jsx
{/* On mobile: stack branding top (35vh) + form bottom (65vh) */}
<div className="md:hidden flex flex-col min-h-screen">
  {/* Top branding zone */}
  <div className="h-[35vh] flex flex-col items-center justify-center
                  bg-white dark:bg-navy-mid gap-3">
    {/* Logo 36x36px, app name 22px, tagline 12px */}
  </div>
  {/* Bottom form zone */}
  <div className="flex-1 bg-gray-50 dark:bg-navy px-6 pt-7 pb-10">
    {/* Tabs + form — no card wrapper on mobile, flat on bg */}
  </div>
</div>
```

### 5.3 Test Checklist
- [ ] "Log In" tab active by default, tab text never changes to "Join" or "Register"
- [ ] Login with empty fields: both field errors visible
- [ ] Login with invalid email: email error only, red border #EF4444 on field
- [ ] Login success: navigates to /learn (if hasRoadmap) or /setup
- [ ] Signup with mismatched passwords: confirm field error
- [ ] Signup success: navigates to /setup
- [ ] Loading state visible for ~500ms on both submit buttons
- [ ] Light mode: all surfaces white/gray-50, no dark colors
- [ ] Mobile: branding top zone, form flat on bottom zone, no card border
- [ ] Desktop: two-panel split, form inside card

---

## MILESTONE 6 — SETUP PAGE

**Reference files:** design-reference/setup-dark-desktop.html, setup-light-desktop.html, setup-dark-mobile.html

### 6.1 File
```
MODIFY: src/pages/SetupPage/SetupPage.jsx
```

### 6.2 Key Tailwind Specs

**Page wrapper — no AppShell, standalone:**
```jsx
<div className="min-h-screen bg-gray-50 dark:bg-navy font-sans
                py-12 px-5 md:px-0">
  <div className="max-w-[720px] mx-auto">
    {/* Page title block */}
    {/* Form card */}
  </div>
</div>
```

**Page title block (outside card):**
```jsx
<div className="mb-8">
  <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 dark:text-white">
    Set Up Your Learning Profile
  </h1>
  <p className="text-sm md:text-[14px] text-gray-500 dark:text-muted mt-2">
    Welcome, {user?.firstName}. Tell us your goal and preferences so we can build your roadmap.
  </p>
</div>
```

**Form card:**
```jsx
<div className="bg-white dark:bg-navy-mid
                border border-gray-200 dark:border-navy-light
                rounded-xl p-6 md:p-10
                shadow-sm">
  {/* Sections inside */}
</div>
```

**Section category label:**
```jsx
<p className="text-[10px] font-bold uppercase tracking-[0.12em]
              text-accent-dk dark:text-accent mb-4">
  LEARNER INFORMATION
</p>
```

**Section divider between sections:**
```jsx
<div className="my-8 border-t border-gray-100 dark:border-divider" />
```

**PillOption group:**
```jsx
<div className="flex flex-wrap gap-2.5 mt-2">
  {["Student", "Job Seeker", "Other"].map(option => (
    <PillOption
      key={option}
      label={option}
      selected={form.role === option}
      onClick={() => setForm(f => ({ ...f, role: option }))}
    />
  ))}
</div>
```

**Text input field:**
```jsx
<input
  className="w-full h-[42px] px-4 rounded-lg text-sm font-sans
             bg-white dark:bg-navy
             border border-gray-300 dark:border-divider
             text-gray-900 dark:text-white
             placeholder:text-gray-300 dark:placeholder:text-muted
             focus:border-accent-dk dark:focus:border-accent
             focus:outline-none focus:ring-0 transition-colors"
  placeholder="e.g. React.js, Python, Data Science"
/>
```

**Textarea:**
```jsx
<textarea
  className="w-full px-4 py-3 rounded-lg text-sm font-sans
             bg-white dark:bg-navy
             border border-gray-300 dark:border-divider
             text-gray-900 dark:text-white
             placeholder:text-gray-300 dark:placeholder:text-muted
             focus:border-accent-dk dark:focus:border-accent
             focus:outline-none focus:ring-0
             resize-none h-[88px] transition-colors"
  placeholder="e.g. I want to switch careers into tech"
/>
```

**Select dropdown:**
```jsx
<select
  className="w-full h-[42px] px-4 rounded-lg text-sm font-sans
             appearance-none
             bg-white dark:bg-navy
             border border-gray-300 dark:border-divider
             text-gray-900 dark:text-slate
             focus:border-accent-dk dark:focus:border-accent
             focus:outline-none focus:ring-0 transition-colors">
  <option>30 – 60 minutes</option>
  ...
</select>
```

**Action area:**
```jsx
{/* Desktop: horizontal right-aligned */}
<div className="hidden md:flex items-center justify-end gap-3 mt-8
                pt-8 border-t border-gray-100 dark:border-divider">
  <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
  <Button variant="primary" loading={isGenerating} onClick={handleSubmit}>
    {isGenerating ? "Generating your roadmap..." : "Generate Roadmap"}
  </Button>
</div>

{/* Mobile: stacked full width */}
<div className="md:hidden flex flex-col gap-2.5 mt-8
                pt-6 border-t border-gray-100 dark:border-divider">
  <Button variant="primary" fullWidth loading={isGenerating} onClick={handleSubmit}>
    {isGenerating ? "Generating..." : "Generate Roadmap"}
  </Button>
  <Button variant="secondary" fullWidth onClick={() => navigate(-1)}>Back</Button>
</div>
```

### 6.3 Test Checklist
- [ ] No navbar anywhere on this page
- [ ] user.firstName in subtitle — not hardcoded
- [ ] No Full Name field exists
- [ ] Empty skill name shows validation error on submit
- [ ] Loading state visible ~1500ms
- [ ] After success: navigates to /roadmap
- [ ] Desktop: buttons right-aligned, not full width
- [ ] Mobile: buttons full width, stacked, Generate on top

---

## MILESTONE 7 — ROADMAP PAGE

**Reference files:** design-reference/roadmap-dark-desktop.html, roadmap-dark-mobile.html

### 7.1 File
```
MODIFY: src/pages/RoadmapPage/RoadmapPage.jsx
```

### 7.2 Key Specs

**Page container:**
```jsx
<div className="max-w-[900px] mx-auto px-5 py-10 font-sans">
```

**Summary card:**
```jsx
<div className="bg-white dark:bg-navy-mid
                border border-gray-200 dark:border-navy-light
                rounded-xl p-6 shadow-sm mb-8">
  {/* 5 stats in a row on desktop, 2x3 grid on mobile */}
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
    {/* Each stat: */}
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.08em]
                    text-gray-400 dark:text-muted mb-1">SKILL</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">MERN Stack</p>
    </div>
    {/* Vertical divider between stats on desktop: */}
    {/* <div className="hidden md:block w-px bg-gray-200 dark:bg-divider self-stretch" /> */}
  </div>
</div>
```

**Module cards row:**
```jsx
{/* Desktop: single row. Mobile: horizontal scroll */}
<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
  {roadmapJson.modules.map((mod) => (
    <button
      key={mod.moduleNumber}
      onClick={() => { setActiveModule(mod.moduleNumber - 1); setActiveWeek(0); }}
      className={`flex-shrink-0 w-[210px] md:flex-1 p-4 rounded-[10px]
                  border text-left transition-all
        ${activeModule === mod.moduleNumber - 1
          ? "border-accent-dk dark:border-accent border-[1.5px]
             bg-sky-50 dark:bg-accent/10"
          : "border-gray-200 dark:border-navy-light
             bg-white dark:bg-navy-mid
             hover:border-gray-300 dark:hover:border-divider"
        }`}>
      <p className={`text-[10px] font-bold uppercase tracking-[0.08em] mb-1.5
        ${activeModule === mod.moduleNumber - 1
          ? "text-accent-dk dark:text-accent"
          : "text-gray-400 dark:text-muted"
        }`}>
        MODULE 0{mod.moduleNumber}
      </p>
      <p className={`text-[13px] font-semibold mb-2
        ${activeModule === mod.moduleNumber - 1
          ? "text-gray-900 dark:text-white"
          : "text-gray-600 dark:text-slate"
        }`}>
        {mod.title}
      </p>
      {/* Status badge */}
    </button>
  ))}
</div>
```

**Week items row:**
```jsx
<div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
  {activeModuleData.weeks.map((week, i) => (
    <button
      key={i}
      onClick={() => setActiveWeek(i)}
      className={`flex-shrink-0 h-11 min-w-[72px] px-4 rounded-lg
                  border text-xs font-semibold transition-all
        ${activeWeek === i
          ? "bg-accent-dk dark:bg-accent text-white dark:text-navy border-accent-dk dark:border-accent"
          : "bg-white dark:bg-navy-mid text-gray-400 dark:text-muted border-gray-200 dark:border-navy-light"
        }`}>
      Week {week.weekNumber}
    </button>
  ))}
</div>
```

**Day rows container:**
```jsx
<div className="bg-white dark:bg-navy-mid
                border border-gray-200 dark:border-navy-light
                rounded-xl overflow-hidden">
  {activeWeekDays.map((day, i) => (
    <div key={i}
         className={`flex items-center justify-between h-[52px] px-5
                     ${i < activeWeekDays.length - 1
                       ? "border-b border-gray-100 dark:border-divider"
                       : ""
                     }`}>
      <div className="flex items-center gap-3">
        {/* Current day dot */}
        {isCurrent(day) && (
          <div className="w-1.5 h-1.5 rounded-full bg-accent-dk dark:bg-accent flex-shrink-0" />
        )}
        {/* Day info */}
        <span className="text-xs font-medium text-gray-400 dark:text-muted">
          Day {day.dayNumber}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-slate">
          {day.title}
        </span>
      </div>
      {/* Two badges */}
      <div className="flex gap-2">
        <Badge variant={day.type.toLowerCase()} />
        <Badge variant={...status} />
      </div>
    </div>
  ))}
</div>
```

**CTA button:**
```jsx
{/* Desktop: centered, auto width. Mobile: full width */}
<div className="flex justify-center md:justify-center mt-10">
  <Button variant="primary" fullWidth={isMobile} onClick={() => navigate("/learn")}>
    Get Started
  </Button>
</div>
```

### 7.3 Test Checklist
- [ ] Clicking Module 2 card updates weeks section
- [ ] Clicking Week 2 updates days section
- [ ] Module 1 active with accent border on load
- [ ] Week 1 active (filled accent bg) on load
- [ ] Day rows not clickable
- [ ] All 7 days show correct type badges
- [ ] Current day shows accent dot
- [ ] "Get Started" navigates to /learn
- [ ] Mobile: module cards scroll horizontally

---

## MILESTONE 8 — LEARN / DASHBOARD PAGE

**Reference files:** design-reference/dashboard-dark-desktop.html, dashboard-dark-mobile.html

### 8.1 File
```
MODIFY: src/pages/LearnPage/LearnPage.jsx
```

### 8.2 Key Specs

**Page container:**
```jsx
<div className="max-w-[900px] mx-auto px-5 py-8 font-sans">
```

**Page header:**
```jsx
<div className="mb-8">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
  <p className="text-sm text-gray-500 dark:text-muted mt-1">Pick up where you left off.</p>
  {roadmapJson && (
    <p className="text-xs text-gray-400 dark:text-muted mt-1">
      Current Skill: {roadmapJson.skillName}
    </p>
  )}
</div>
```

**Stat cards grid:**
```jsx
{/* Desktop: 4 in a row. Mobile: 2x2 grid */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
  <StatCard label="CURRENT MODULE" value={`Module ${progress?.currentModule}`} />
  <StatCard label="CURRENT WEEK"   value={`Week ${progress?.currentWeek}`} />
  <StatCard label="CURRENT DAY"    value={progress?.currentDay} />
  <StatCard label="REVISION QUEUE" value={`${progress?.weakTopics?.length || 0} Topics`} />
</div>
```

**Session card — most prominent element:**
```jsx
<div className="bg-white dark:bg-navy-mid
                border-[1.5px] border-accent-dk dark:border-accent
                rounded-xl p-6 md:p-7 mb-8
                shadow-[0_0_0_4px_rgba(14,165,233,0.08)] dark:shadow-[0_0_0_4px_rgba(56,189,248,0.08)]">

  {/* Desktop: two-column. Mobile: single column */}
  <div className="flex flex-col md:flex-row md:gap-6">

    {/* LEFT — session info */}
    <div className="flex-1">
      {/* Badges row */}
      <div className="flex flex-wrap gap-2 mb-3.5">
        <Badge variant={session.type.toLowerCase()}>{session.type}</Badge>
        <Badge variant="locked">Day {session.dayNumber}</Badge>
        <Badge variant="current">Ready to Continue</Badge>
      </div>

      {/* Title */}
      <h2 className="text-xl md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {session.title}
      </h2>

      {/* Meta line */}
      <p className="text-sm text-gray-400 dark:text-muted mb-3">
        Day {session.dayNumber} — {session.dayName} · Module {session.moduleNumber} · Week {session.weekNumber}
      </p>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-slate mb-6 max-w-[90%]">
        Continue with today's lesson. Click to enter your learning session.
      </p>

      <Button variant="primary" onClick={() => navigate(`/session/${session.dayId}`)}>
        Continue Session
      </Button>
    </div>

    {/* VERTICAL DIVIDER — desktop only */}
    <div className="hidden md:block w-px bg-gray-200 dark:bg-divider" />

    {/* RIGHT — estimated time — desktop only, inline on mobile */}
    <div className="hidden md:flex flex-col items-center justify-center w-36">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em]
                    text-gray-400 dark:text-muted mb-2">ESTIMATED TIME</p>
      <p className="text-4xl font-bold text-gray-900 dark:text-white">45</p>
      <p className="text-xs text-gray-400 dark:text-muted mt-1">min</p>
    </div>

  </div>
</div>
```

**Revision queue:**
```jsx
<div>
  <p className="text-[10px] font-bold uppercase tracking-[0.12em]
                text-accent-dk dark:text-accent mb-3.5">
    REVISION QUEUE
  </p>
  <div className="bg-white dark:bg-navy-mid
                  border border-gray-200 dark:border-navy-light
                  rounded-xl overflow-hidden">
    {weakTopics.length === 0 ? (
      <p className="px-5 py-4 text-sm text-gray-400 dark:text-muted">
        No revision topics yet
      </p>
    ) : (
      weakTopics.map((topic, i) => (
        <div key={i}
             className={`flex items-center justify-between h-[52px] px-5
               ${i < weakTopics.length - 1
                 ? "border-b border-gray-100 dark:border-divider"
                 : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-divider" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate">{topic}</span>
          </div>
        </div>
      ))
    )}
  </div>
</div>
```

### 8.3 Test Checklist
- [ ] 4 stat cards correct values from progress
- [ ] Session card accent border visible
- [ ] Session title from roadmapJson current day
- [ ] "Continue Session" navigates to /session/[dayId]
- [ ] Desktop: session card two-column with time on right
- [ ] Mobile: session card single column
- [ ] Revision queue shows weakTopics or "No revision topics yet"
- [ ] Empty roadmap shows empty state with Create Roadmap button

---

## MILESTONE 9 — PROGRESS PAGE

**Reference files:** design-reference/progress-dark-desktop.html, progress-dark-mobile.html

### 9.1 File
```
MODIFY: src/pages/ProgressPage/ProgressPage.jsx
```

### 9.2 Key Specs

**Page container + header:**
```jsx
<div className="max-w-[900px] mx-auto px-5 py-8 font-sans">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>
  <p className="text-sm text-gray-500 dark:text-muted mt-1">
    Your learning record, performance, and growth.
  </p>
</div>
```

**Two panels layout:**
```jsx
{/* Desktop: side by side. Mobile: stacked */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  {/* Learning Summary panel */}
  <div className="bg-white dark:bg-navy-mid
                  border border-gray-200 dark:border-navy-light
                  rounded-xl p-6">
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4
                   pb-4 border-b border-gray-100 dark:border-divider">
      Learning Summary
    </h3>
    {/* Rows */}
    {rows.map((row, i) => (
      <div key={i} className={`flex justify-between items-center h-10
        ${i < rows.length - 1 ? "border-b border-gray-100 dark:border-divider" : ""}`}>
        <span className="text-sm text-gray-500 dark:text-muted">{row.label}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-slate">{row.value}</span>
      </div>
    ))}
  </div>
  {/* Recent Outcomes panel — same structure */}
</div>
```

### 9.3 Test Checklist
- [ ] 4 stat cards derive values from progress object (not hardcoded)
- [ ] "Passed" value in green (text-pass)
- [ ] Desktop: two panels side by side
- [ ] Mobile: two panels stacked
- [ ] No "Continue Session" button anywhere on this page

---

## MILESTONE 10 — SESSION PAGE (PHASE ENGINE)

**Reference files:** design-reference/session-lesson-dark-desktop.html, session-task-dark-desktop.html, session-feedback-dark-desktop.html, session-exam-dark-desktop.html

### 10.1 Files
```
MODIFY:  src/pages/SessionPage/SessionPage.jsx
CREATE:  src/pages/SessionPage/phases/LessonPhase.jsx
CREATE:  src/pages/SessionPage/phases/PartCard.jsx
CREATE:  src/pages/SessionPage/phases/MiniExercise.jsx
CREATE:  src/pages/SessionPage/phases/TaskPhase.jsx
CREATE:  src/pages/SessionPage/phases/FeedbackPhase.jsx
CREATE:  src/pages/SessionPage/phases/ExamPhase.jsx
CREATE:  src/pages/SessionPage/ExamResult.jsx
```

### 10.2 Phase Flow (Updated)

```
Session type = Learning or Revision:
  LessonPhase
    → Part 1 cards → MiniExercise 1
    → Part 2 cards → MiniExercise 2
    → Part 3 cards → MiniExercise 3
    → TaskPhase
      → If task.type = "text": textarea answer → AI feedback → FeedbackPhase → /learn
      → If task.type = "mcq": 15–20 MCQ quest → score → FeedbackPhase → /learn

Session type = Exam:
  ExamPhase (MCQ from examQuestions)
    → Score ≥ 80%: ExamResult (pass) → /learn
    → Score < 80%: ExamResult (fail) → weakTopics added → currentDay reset to Saturday → /learn
```

### 10.3 SessionPage.jsx — Phase State Machine

```jsx
const PHASES = {
  LESSON: "lesson",
  TASK: "task",
  FEEDBACK: "feedback",
  EXAM: "exam",
  RESULT: "result"
};

// Phase state
const [phase, setPhase] = useState(null);
const [currentPart, setCurrentPart] = useState(0);       // 0-indexed part within lesson
const [currentCard, setCurrentCard] = useState(0);       // 0-indexed card within part
const [miniAnswered, setMiniAnswered] = useState(false);  // whether mini exercise answered
const [taskAnswer, setTaskAnswer] = useState("");
const [feedbackData, setFeedbackData] = useState(null);  // { feedback, outcome }
const [examAnswers, setExamAnswers] = useState([]);
const [examResult, setExamResult] = useState(null);

// On load: determine starting phase
useEffect(() => {
  if (!session) return;
  if (session.type === "Exam") setPhase(PHASES.EXAM);
  else setPhase(PHASES.LESSON);
}, [session]);
```

### 10.4 LessonPhase.jsx — Part + Card + MiniExercise structure

**State within LessonPhase:**
```
parts = session.lesson.parts (array of 3)
currentPart = 0, 1, 2
currentCard = 0..n (cards within current part)
showMini = false (show mini exercise after last card of part)
miniAnswered = false
```

**Part progress indicator:**
```jsx
{/* Part progress bar at top */}
<div className="mb-6">
  {/* "Part 1 of 3 · Card 2 of 4" */}
  <div className="flex justify-between text-xs font-medium
                  text-gray-400 dark:text-muted mb-2">
    <span>Part {currentPart + 1} of 3</span>
    <span>{Math.round(overallProgress)}% complete</span>
  </div>
  <div className="w-full h-1.5 bg-gray-200 dark:bg-divider rounded-full overflow-hidden">
    <div className="h-full bg-accent-dk dark:bg-accent rounded-full transition-all"
         style={{ width: `${overallProgress}%` }} />
  </div>
</div>
```

**Card display:**
```jsx
{!showMini ? (
  <div className="bg-white dark:bg-navy-mid
                  border border-gray-200 dark:border-navy-light
                  rounded-xl p-8 md:p-10 shadow-sm">
    {/* Part title */}
    <p className="text-[10px] font-bold uppercase tracking-[0.12em]
                  text-accent-dk dark:text-accent mb-4">
      {activePart.partTitle}
    </p>

    {/* Card content */}
    <p className="text-[15px] text-gray-600 dark:text-slate leading-[1.75]">
      {activeCard.content}
    </p>

    {/* Card navigation */}
    <div className="flex justify-between mt-8">
      {currentCard > 0 && (
        <Button variant="secondary" onClick={prevCard}>← Previous</Button>
      )}
      <div className="ml-auto">
        {currentCard < activePart.cards.length - 1 ? (
          <Button variant="primary" onClick={nextCard}>Next Card →</Button>
        ) : (
          <Button variant="primary" onClick={() => setShowMini(true)}>
            Continue to Exercise →
          </Button>
        )}
      </div>
    </div>
  </div>
) : (
  <MiniExercise
    exercise={activePart.miniExercise}
    onComplete={handleMiniComplete}
  />
)}
```

### 10.5 MiniExercise.jsx

```jsx
// After last card of each part — before moving to next part or task phase
<div className="bg-white dark:bg-navy-mid
                border border-gray-200 dark:border-navy-light
                rounded-xl p-8 shadow-sm">

  {/* Header */}
  <div className="flex items-center gap-2 mb-6">
    <div className="w-2 h-2 rounded-full bg-accent-dk dark:bg-accent" />
    <p className="text-xs font-bold uppercase tracking-[0.1em]
                  text-accent-dk dark:text-accent">
      Mini Exercise
    </p>
  </div>

  {/* Question */}
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 leading-snug">
    {exercise.question}
  </h3>

  {/* Options */}
  <div className="flex flex-col gap-3">
    {exercise.options.map((opt, i) => (
      <button
        key={i}
        onClick={() => setSelected(i)}
        disabled={answered}
        className={`flex items-center gap-4 h-14 px-5 rounded-[10px]
                    border-[1.5px] text-sm font-medium text-left transition-all
          ${answered && i === exercise.correctIndex
            ? "bg-pass/10 border-pass text-pass"
            : answered && i === selected && i !== exercise.correctIndex
            ? "bg-fail/10 border-fail text-fail dark:text-fail"
            : selected === i && !answered
            ? "bg-sky-50 dark:bg-accent/10 border-accent-dk dark:border-accent text-gray-900 dark:text-white"
            : "bg-white dark:bg-navy border-gray-200 dark:border-divider text-gray-700 dark:text-slate"
          }`}>
        {/* Radio circle */}
        <div className={`w-5 h-5 rounded-full border-[1.5px] flex-shrink-0
                         flex items-center justify-center
          ${selected === i
            ? "border-accent-dk dark:border-accent"
            : "border-gray-300 dark:border-divider"
          }`}>
          {selected === i && (
            <div className="w-2.5 h-2.5 rounded-full bg-accent-dk dark:bg-accent" />
          )}
        </div>
        {opt}
      </button>
    ))}
  </div>

  {/* Explanation after answer */}
  {answered && (
    <div className="mt-5 p-4 rounded-lg bg-gray-50 dark:bg-navy
                    border border-gray-200 dark:border-divider">
      <p className="text-sm text-gray-600 dark:text-slate leading-relaxed">
        {exercise.explanation}
      </p>
    </div>
  )}

  {/* Action button */}
  <div className="mt-6">
    {!answered ? (
      <Button variant="primary" disabled={selected === null}
              onClick={() => setAnswered(true)}>
        Check Answer
      </Button>
    ) : (
      <Button variant="primary" onClick={onComplete}>
        {isLastPart ? "Proceed to Task →" : "Next Part →"}
      </Button>
    )}
  </div>
</div>
```

### 10.6 TaskPhase.jsx

Handles both task types. Read `session.task.type` to determine which UI to show.

**Text task:**
```jsx
{session.task.type === "text" && (
  <div className="bg-white dark:bg-navy-mid
                  border border-gray-200 dark:border-navy-light
                  rounded-xl p-8 shadow-sm">
    {/* Task description */}
    <p className="text-[15px] text-gray-700 dark:text-slate leading-[1.65] mb-6">
      {session.task.description}
    </p>
    <div className="border-t border-gray-100 dark:border-divider pt-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.06em]
                    text-accent-dk dark:text-accent mb-3">YOUR ANSWER</p>
      <textarea
        className="w-full h-[200px] px-4 py-3 rounded-lg text-sm font-sans
                   bg-white dark:bg-navy
                   border border-gray-300 dark:border-divider
                   text-gray-900 dark:text-white
                   placeholder:text-gray-300 dark:placeholder:text-muted
                   focus:border-accent-dk dark:focus:border-accent
                   focus:outline-none focus:ring-0 resize-none"
        placeholder="Write your answer here. Explain your thinking as you go."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <div className="flex justify-between items-center mt-2 mb-6">
        <span /> {/* spacer */}
        <span className="text-xs text-gray-400 dark:text-muted">
          {answer.length} / 1000 characters
        </span>
      </div>
      <Button variant="primary" loading={loading}
              disabled={answer.trim().length < 20}
              onClick={handleSubmit}>
        {loading ? "Getting Feedback..." : "Submit Task"}
      </Button>
    </div>
  </div>
)}
```

**MCQ quest task (15–20 questions):**
```jsx
{session.task.type === "mcq" && (
  /* Same MCQ structure as ExamPhase but with taskQuestions array */
  /* Score threshold for task MCQ: not graded pass/fail — all answers reviewed */
  /* After all answered: show score summary, then proceed to FeedbackPhase */
)}
```

### 10.7 FeedbackPhase.jsx

```jsx
<div className="bg-white dark:bg-navy-mid
                border border-gray-200 dark:border-navy-light
                rounded-xl p-8 shadow-sm">

  {/* Outcome indicator */}
  <div className={`flex items-center gap-3 p-4 rounded-[10px] mb-6
                   border
    ${outcome === "positive"
      ? "bg-pass/10 border-pass/30 dark:border-pass/25"
      : "bg-warn/10 border-warn/30 dark:border-warn/25"
    }`}>
    {/* Checkmark or warning SVG icon */}
    <p className={`text-sm font-semibold
      ${outcome === "positive" ? "text-pass" : "text-warn"}`}>
      {outcome === "positive"
        ? "Good work — your answer demonstrates understanding."
        : "Keep going — some areas need more attention."}
    </p>
  </div>

  {/* AI feedback paragraphs */}
  <p className="text-[11px] font-bold uppercase tracking-[0.06em]
                text-accent-dk dark:text-accent mb-4">AI FEEDBACK</p>
  <div className="space-y-4">
    {feedbackParagraphs.map((para, i) => (
      <p key={i} className="text-[15px] text-gray-600 dark:text-slate leading-[1.7]">
        {para}
      </p>
    ))}
  </div>

  {/* Continue button */}
  <div className="mt-8">
    <Button variant="primary" onClick={handleContinue}>
      Continue to Next Session
    </Button>
  </div>
</div>
```

### 10.8 ExamPhase.jsx

```jsx
{/* Progress: "Question 3 of 10" */}
{/* Same MCQ structure as MiniExercise but no explanation shown during exam */}
{/* "Submit Exam" button shown when all questions answered */}
{/* On submit: calculate score, identify wrong-answer topics, call onComplete */}

// Score calculation:
const score = (correctCount / totalQuestions) * 100;
const passed = score >= 80;
const weakTopics = wrongAnswerQuestions.map(q => q.relatedTopic || q.question.slice(0, 40));
```

**Exam progress bar uses red (`exam-red` / `#EF4444`) instead of accent:**
```jsx
<div className="h-1.5 bg-gray-200 dark:bg-divider rounded-full overflow-hidden">
  <div className="h-full bg-fail rounded-full transition-all"
       style={{ width: `${(answeredCount / totalQ) * 100}%` }} />
</div>
```

**Submit button red both modes:**
```jsx
<Button
  className="bg-fail text-white hover:bg-red-600 border-0"
  onClick={handleSubmit}>
  Submit Exam
</Button>
```

### 10.9 ExamResult.jsx

```jsx
{/* Pass state */}
{result.passed && (
  <div className="text-center py-12">
    <div className="w-16 h-16 rounded-full bg-pass/10 border-2 border-pass
                    flex items-center justify-center mx-auto mb-4">
      {/* Checkmark SVG */}
    </div>
    <p className="text-3xl font-bold text-gray-900 dark:text-white">{result.score}%</p>
    <p className="text-pass font-semibold mt-1">Passed</p>
    <p className="text-sm text-gray-500 dark:text-muted mt-2">
      Advancing to next week
    </p>
    <Button variant="primary" className="mt-8" onClick={onContinue}>
      Continue to Next Week
    </Button>
  </div>
)}

{/* Fail state */}
{!result.passed && (
  <div className="text-center py-12">
    <p className="text-3xl font-bold text-gray-900 dark:text-white">{result.score}%</p>
    <p className="text-fail font-semibold mt-1">Needs Revision</p>
    <p className="text-sm text-gray-500 dark:text-muted mt-2 mb-6">
      Returning to Saturday revision before re-attempting
    </p>
    {result.weakTopics.length > 0 && (
      <div className="text-left mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-fail mb-3">
          Topics to Review
        </p>
        {result.weakTopics.map((t, i) => (
          <div key={i} className="flex items-center gap-2 py-2 border-b
                                   border-gray-100 dark:border-divider">
            <div className="w-1.5 h-1.5 rounded-full bg-fail flex-shrink-0" />
            <span className="text-sm text-gray-700 dark:text-slate">{t}</span>
          </div>
        ))}
      </div>
    )}
    <Button variant="primary" onClick={onContinue}>
      Back to Revision
    </Button>
  </div>
)}
```

### 10.10 Session Page Container Tailwind

**Minimal top bar inside session (no active nav link):**
```jsx
{/* Session header — not the AppShell navbar, a lightweight inline header */}
<div className="sticky top-0 md:top-14 z-40
                bg-white dark:bg-navy-mid
                border-b border-gray-200 dark:border-navy-light
                px-5 py-3">
  <div className="max-w-[760px] mx-auto flex items-center justify-between">
    {/* Phase label */}
    <p className="text-[10px] font-bold uppercase tracking-[0.12em]
                  text-accent-dk dark:text-accent">
      {phaseLabel}
    </p>
    {/* Session title + day */}
    <p className="text-sm font-medium text-gray-700 dark:text-slate">
      {session.title} · Day {session.dayNumber}
    </p>
    {/* Badge */}
    <Badge variant={session.type.toLowerCase()}>{session.type}</Badge>
  </div>
</div>

{/* Session content */}
<div className="max-w-[760px] mx-auto px-5 py-8 font-sans">
  {/* Phase component renders here */}
</div>
```

### 10.11 Milestone 10 Test Checklist
- [ ] /session/m1-w1-d1 starts with Lesson phase, Part 1, Card 1
- [ ] Cards advance within a part using "Next Card"
- [ ] After last card of Part 1: Mini Exercise appears
- [ ] Selecting wrong answer shows red state + correct answer green + explanation
- [ ] After Mini Exercise: Part 2 begins
- [ ] After all 3 parts + 3 exercises: Task phase begins
- [ ] Text task: empty answer blocked, min 20 chars
- [ ] Text task submit shows ~1500ms loading, then FeedbackPhase
- [ ] MCQ task: all questions shown, score summary before FeedbackPhase
- [ ] FeedbackPhase shows green or amber outcome indicator
- [ ] "Continue to Next Session" updates progress and navigates to /learn
- [ ] /session/m1-w1-d7 (Sunday) goes directly to ExamPhase, no lesson
- [ ] Exam: 80% = pass, below 80% = fail
- [ ] Fail exam: weakTopics added, currentDay reset to Saturday
- [ ] ExamResult pass state shows green, ExamResult fail shows red + weak topics list

---

## MILESTONE 11 — NOT FOUND PAGE + FULL FLOW POLISH

### 11.1 Files
```
MODIFY: src/pages/NotFoundPage/NotFoundPage.jsx
```

### 11.2 NotFoundPage spec
```jsx
<div className="min-h-screen flex flex-col items-center justify-center
                bg-gray-50 dark:bg-navy font-sans px-5">
  <p className="text-7xl font-bold text-gray-200 dark:text-divider mb-4">404</p>
  <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
    Page not found
  </h1>
  <p className="text-sm text-gray-400 dark:text-muted mb-8">
    The page you are looking for does not exist.
  </p>
  <Button variant="primary" onClick={() => navigate(user ? "/learn" : "/auth")}>
    {user ? "Back to Dashboard" : "Go to Login"}
  </Button>
</div>
```

### 11.3 Final Polish Checklist
- [ ] Full flow: /auth → login → /learn → Continue Session → all phases → /learn
- [ ] Full flow: /auth → signup → /setup → Generate → /roadmap → Get Started → /learn
- [ ] Theme toggle persists on every route after reload
- [ ] Desktop layout correct at 1440px — no stretched elements
- [ ] Mobile layout correct at 390px — no overflow, no broken grids
- [ ] Bottom tab bar correct on mobile, completely hidden on desktop
- [ ] Top navbar completely hidden on mobile
- [ ] Footer visible on desktop, hidden on mobile
- [ ] `npm run build` — zero errors
- [ ] Zero console errors on every page

---

## ANTIGRAVITY USAGE GUIDE

### How to give instructions to Antigravity

Start every milestone message with:

```
Read SkillMaster_FrontendPlan_v3.md.
We are implementing Milestone [N] — [Name].

Rules:
- Light mode = default Tailwind classes. Dark mode = dark: prefix overrides.
- Use ONLY the custom color tokens: navy, navy-mid, navy-light, divider, accent,
  accent-dk, slate, muted, pass, fail, warn. Never arbitrary hex values.
- Font: font-sans everywhere (Plus Jakarta Sans via tailwind.config.js)
- Implement exactly what the milestone specifies. No extra features.
- Show me each file before writing it.
- Reference: design-reference/[filename].html for visual layout only.
  Do not copy its inline styles — translate to Tailwind tokens per this plan.
```

### How to correct Antigravity

**Wrong color:** "The button should use `bg-accent dark:bg-accent` not `bg-[#38BDF8]`. Use the token."

**Wrong dark/light pattern:** "Light mode is the default. Dark mode uses `dark:` prefix. Reverse this — remove `dark:bg-white`, write `bg-white dark:bg-navy-mid`."

**Wrong layout:** "Check design-reference/[file].html for layout reference. The stat cards should be `grid grid-cols-2 md:grid-cols-4` not stacked."

**Missing mobile bottom bar:** "On mobile the top navbar must be hidden (`hidden md:flex` on Navbar). The BottomTabBar uses `md:hidden` and `fixed bottom-0`."

---

*End of Plan — Skill Master Frontend Build Plan v3.0*
