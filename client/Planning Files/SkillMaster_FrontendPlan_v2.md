# Skill Master — Frontend Build Plan
**Stack:** React + Vite + Tailwind CSS v3  
**Backend (later):** Node.js + Express.js + MongoDB Local  
**Auth:** JWT in localStorage  
**AI:** Google Gemini API  
**State:** React Context API  
**Structure:** Monorepo — /client + /server in one repo  
**Version:** 2.0 — Full Stack Aware, API-Ready  
**Status:** Ready for coding agent

---

## 0. Confirmed Decisions

| Decision | Choice | Reason |
|---|---|---|
| Frontend framework | React 18 + Vite | Fast dev server, modern tooling |
| Styling | Tailwind CSS v3 | Single CDN/import line, utility classes |
| Routing | React Router v6 | Industry standard for React SPA |
| State management | React Context API | Sufficient for MVP, no extra libraries |
| Auth token storage | localStorage | Simple for MVP — note: httpOnly cookies in production |
| AI provider | Google Gemini API | Free tier, no billing required |
| Backend (Phase 2) | Node.js + Express.js | Familiar stack for CS students |
| Database (Phase 2) | MongoDB Local — localhost:27017 | No Atlas account needed |
| Project structure | Monorepo — /client + /server | Single repo, easy to manage |
| Tailwind version | v3 | Single import line, stable, widely documented |

---

## 1. Monorepo Folder Structure

```
skill-master/                          ← root of the repo
│
├── client/                            ← entire React frontend lives here
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css                  ← Tailwind directives + custom CSS vars
│       │
│       ├── api/                       ← ALL backend calls live here — nothing else calls backend
│       │   ├── auth.api.js            ← login, signup, logout API functions
│       │   ├── roadmap.api.js         ← generate roadmap, get roadmap
│       │   ├── progress.api.js        ← update progress, get progress
│       │   ├── feedback.api.js        ← get AI feedback
│       │   └── axiosInstance.js       ← axios with baseURL + JWT header injection
│       │
│       ├── context/
│       │   ├── AuthContext.jsx        ← user state, login/logout, JWT handling
│       │   └── AppContext.jsx         ← roadmap, progress, session phase state
│       │
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useApp.js
│       │   └── useTheme.js
│       │
│       ├── routes/
│       │   └── ProtectedRoute.jsx
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.jsx
│       │   │   ├── Navbar.jsx
│       │   │   └── ProfileDropdown.jsx
│       │   └── ui/
│       │       ├── Button.jsx
│       │       ├── Badge.jsx
│       │       ├── Card.jsx
│       │       ├── StatCard.jsx
│       │       ├── PillOption.jsx
│       │       └── LoadingSpinner.jsx
│       │
│       ├── pages/
│       │   ├── AuthPage/
│       │   │   └── AuthPage.jsx
│       │   ├── SetupPage/
│       │   │   └── SetupPage.jsx
│       │   ├── RoadmapPage/
│       │   │   └── RoadmapPage.jsx
│       │   ├── LearnPage/
│       │   │   └── LearnPage.jsx
│       │   ├── ProgressPage/
│       │   │   └── ProgressPage.jsx
│       │   ├── SessionPage/
│       │   │   ├── SessionPage.jsx
│       │   │   └── phases/
│       │   │       ├── LessonPhase.jsx
│       │   │       ├── TaskPhase.jsx
│       │   │       ├── FeedbackPhase.jsx
│       │   │       ├── ExamPhase.jsx
│       │   │       └── ExamResult.jsx
│       │   └── NotFoundPage/
│       │       └── NotFoundPage.jsx
│       │
│       ├── utils/
│       │   ├── validators.js          ← form validation functions
│       │   ├── sessionHelpers.js      ← derive current session from roadmapJson + progress
│       │   └── tokenHelpers.js        ← save/read/delete JWT from localStorage
│       │
│       └── design-reference/          ← all Stitch HTML files (reference only, not imported)
│
└── server/                            ← backend (Phase 2 — build after frontend done)
    ├── package.json
    ├── .env                           ← MONGO_URI, JWT_SECRET, GEMINI_API_KEY
    ├── server.js
    └── src/
        ├── routes/
        ├── controllers/
        ├── models/
        ├── middleware/
        └── services/
```

---

## 2. Setup Instructions (Run Once)

```bash
# Create root folder
mkdir skill-master && cd skill-master
git init

# Create frontend
npm create vite@latest client -- --template react
cd client
npm install

# Install dependencies
npm install react-router-dom axios
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p

# Go back to root
cd ..
```

### tailwind.config.js (client/)
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark mode palette
        "navy":       "#0F1923",
        "navy-mid":   "#162032",
        "navy-light": "#1E2F42",
        "divider":    "#2E3D52",
        "accent":     "#38BDF8",
        "accent-dk":  "#0EA5E9",
        "slate":      "#CBD5E1",
        "muted":      "#64748B",
        "pass":       "#22C55E",
        "fail":       "#EF4444",
        "warn":       "#F59E0B",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
}
```

### index.css (client/src/)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

@layer base {
  html { font-family: 'Plus Jakarta Sans', sans-serif; }
  body { @apply bg-navy text-slate; }
}

/* Dark mode is default — class="dark" on <html> */
/* Toggle to class="light" for light mode */
```

---

## 3. API Layer Design (Critical — Read This First)

This is the most important architectural decision for API integration.

**The rule:** Components never call the backend directly. Every backend call goes through `/src/api/`. When backend is built, you only change these files — zero component changes needed.

### axiosInstance.js
```js
import axios from "axios";
import { getToken } from "../utils/tokenHelpers";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Automatically attach JWT to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — token expired or invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("sm_token");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default api;
```

### tokenHelpers.js
```js
const KEY = "sm_token";
export const saveToken  = (token) => localStorage.setItem(KEY, token);
export const getToken   = ()      => localStorage.getItem(KEY);
export const clearToken = ()      => localStorage.removeItem(KEY);
```

### auth.api.js
```js
import api from "./axiosInstance";

// During frontend-only phase: these functions return mock data
// During full-stack phase: uncomment the real calls, delete mock returns

export const loginUser = async (email, password) => {
  // MOCK — replace with real call when backend ready:
  // const res = await api.post("/auth/login", { email, password });
  // return res.data; // { token, user }

  // MOCK DATA:
  await new Promise(r => setTimeout(r, 500));
  return {
    token: "mock_jwt_token_123",
    user: { _id: "usr_001", name: "Sharjeel Arshad", firstName: "Sharjeel", email }
  };
};

export const signupUser = async (name, email, password) => {
  // REAL: const res = await api.post("/auth/signup", { name, email, password });
  // return res.data;

  await new Promise(r => setTimeout(r, 500));
  return {
    token: "mock_jwt_token_456",
    user: { _id: "usr_002", name, firstName: name.split(" ")[0], email }
  };
};
```

### roadmap.api.js
```js
import api from "./axiosInstance";
import mockRoadmap from "../mocks/roadmap.json"; // remove when backend ready

export const generateRoadmap = async (setupData) => {
  // REAL: const res = await api.post("/roadmap/generate", setupData);
  // return res.data; // { roadmapId, roadmapJson }

  await new Promise(r => setTimeout(r, 1500));
  return { roadmapId: "rdmp_001", roadmapJson: mockRoadmap };
};

export const getRoadmap = async (roadmapId) => {
  // REAL: const res = await api.get(`/roadmap/${roadmapId}`);
  // return res.data;

  return { roadmapId, roadmapJson: mockRoadmap };
};
```

### progress.api.js
```js
import api from "./axiosInstance";

export const updateProgress = async (roadmapId, dayId, status) => {
  // REAL: const res = await api.post("/progress/update", { roadmapId, dayId, status });
  // return res.data; // { success, newDay, newWeek, newModule }

  return { success: true, newDay: "Tuesday" };
};

export const getProgress = async (roadmapId) => {
  // REAL: const res = await api.get(`/progress/${roadmapId}`);
  // return res.data;

  return {
    roadmapId,
    currentModule: 1, currentWeek: 1, currentDay: "Monday",
    completedTasks: [], weakTopics: ["React Props", "JSX Basics"], examScores: []
  };
};
```

### feedback.api.js
```js
import api from "./axiosInstance";

export const getAIFeedback = async (roadmapId, dayId, userAnswer) => {
  // REAL: const res = await api.post("/feedback", { roadmapId, dayId, userAnswer });
  // return res.data; // { feedback, outcome }

  await new Promise(r => setTimeout(r, 1500));
  return {
    feedback: "Your component structure is correct. The function name is capitalised as required. Consider adding props to make it reusable.",
    outcome: "positive"
  };
};
```

---

## 4. Route Map

| Route | Component | Access | Behavior |
|---|---|---|---|
| /auth | AuthPage | Public — redirect to /learn if token exists | Login + Signup tabs |
| /setup | SetupPage | Protected — no AppShell | Multi-section form |
| /roadmap | AppShell → RoadmapPage | Protected + AppShell | Read-only roadmap view |
| /learn | AppShell → LearnPage | Protected + AppShell | Dashboard / home |
| /progress | AppShell → ProgressPage | Protected + AppShell | Learning record |
| /session/:dayId | AppShell → SessionPage | Protected + AppShell | Phase-based learning |
| * | NotFoundPage | Public | 404 fallback |

### App.jsx
```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppShell from "./components/layout/AppShell";

import AuthPage from "./pages/AuthPage/AuthPage";
import SetupPage from "./pages/SetupPage/SetupPage";
import RoadmapPage from "./pages/RoadmapPage/RoadmapPage";
import LearnPage from "./pages/LearnPage/LearnPage";
import ProgressPage from "./pages/ProgressPage/ProgressPage";
import SessionPage from "./pages/SessionPage/SessionPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/setup" element={<SetupPage />} />
              <Route element={<AppShell />}>
                <Route path="/roadmap"           element={<RoadmapPage />} />
                <Route path="/learn"             element={<LearnPage />} />
                <Route path="/progress"          element={<ProgressPage />} />
                <Route path="/session/:dayId"    element={<SessionPage />} />
              </Route>
            </Route>
            <Route path="/"  element={<Navigate to="/auth" replace />} />
            <Route path="*"  element={<NotFoundPage />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## 5. Context Design

### AuthContext.jsx
```jsx
import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, signupUser } from "../api/auth.api";
import { saveToken, getToken, clearToken } from "../utils/tokenHelpers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load — check if token exists, restore user
  useEffect(() => {
    const token = getToken();
    if (token) {
      // For mock: just set a stored user from localStorage
      // For real backend: validate token with GET /auth/me
      const stored = localStorage.getItem("sm_user");
      if (stored) setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    saveToken(data.token);
    localStorage.setItem("sm_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user; // caller uses this to decide redirect
  };

  const signup = async (name, email, password) => {
    const data = await signupUser(name, email, password);
    saveToken(data.token);
    localStorage.setItem("sm_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem("sm_user");
    localStorage.removeItem("sm_roadmap"); // clear roadmap too
    localStorage.removeItem("sm_progress");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
```

### AppContext.jsx
```jsx
import { createContext, useContext, useState } from "react";
import { generateRoadmap, getRoadmap } from "../api/roadmap.api";
import { updateProgress as updateProgressApi, getProgress } from "../api/progress.api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [roadmapJson, setRoadmapJson]   = useState(null);
  const [roadmapId, setRoadmapId]       = useState(null);
  const [progress, setProgress]         = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const createRoadmap = async (setupData) => {
    setIsGenerating(true);
    try {
      const data = await generateRoadmap(setupData);
      setRoadmapId(data.roadmapId);
      setRoadmapJson(data.roadmapJson);
      // Init default progress
      setProgress({
        roadmapId: data.roadmapId,
        currentModule: 1, currentWeek: 1, currentDay: "Monday",
        completedTasks: [], weakTopics: [], examScores: []
      });
      return data;
    } finally {
      setIsGenerating(false);
    }
  };

  const advanceProgress = async (dayId, status) => {
    const data = await updateProgressApi(roadmapId, dayId, status);
    setProgress(prev => ({ ...prev, currentDay: data.newDay }));
    return data;
  };

  const addWeakTopics = (topics) => {
    setProgress(prev => ({
      ...prev,
      weakTopics: [...new Set([...prev.weakTopics, ...topics])]
    }));
  };

  return (
    <AppContext.Provider value={{
      roadmapJson, roadmapId, progress, isGenerating,
      createRoadmap, advanceProgress, addWeakTopics
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
```

---

## 6. Data Contracts

### User Object
```json
{
  "_id": "string",
  "name": "Sharjeel Arshad",
  "firstName": "Sharjeel",
  "email": "sharjeel@example.com"
}
```

### roadmapJson Shape
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
              "task": {
                "description": "string",
                "expectedOutput": "string"
              },
              "examQuestions": null
            },
            {
              "dayNumber": 6,
              "dayName": "Saturday",
              "type": "Revision",
              "title": "Week 1 Revision",
              "lessonContent": "string",
              "task": null,
              "examQuestions": null
            },
            {
              "dayNumber": 7,
              "dayName": "Sunday",
              "type": "Exam",
              "title": "Weekly Exam",
              "lessonContent": null,
              "task": null,
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
  "roadmapId": "string",
  "currentModule": 1,
  "currentWeek": 1,
  "currentDay": "Monday",
  "completedTasks": [
    { "dayId": "m1-w1-d1", "status": "passed", "completedAt": "ISO date" }
  ],
  "weakTopics": ["React Props", "JSX Basics"],
  "examScores": [
    { "moduleNumber": 1, "weekNumber": 1, "score": 80, "passed": true }
  ]
}
```

### dayId Format
```
m{moduleNumber}-w{weekNumber}-d{dayNumber}
Example: m1-w1-d3 = Module 1, Week 1, Day 3
```

---

## 7. Tailwind Usage Rules

These apply to every component — tell the coding agent these explicitly:

1. **Dark mode default** — every component writes dark styles first, then `light:` prefix for light
2. **Colors** — use custom color names from tailwind.config.js: `bg-navy`, `text-accent`, `border-navy-light`
3. **Never use arbitrary values** like `bg-[#0F1923]` — use the named tokens instead
4. **Responsive** — mobile first: write base classes for mobile, then `md:` for desktop
5. **No inline styles** — everything through Tailwind classes
6. **Font** — `font-sans` applies Plus Jakarta Sans everywhere (set in config)

### Dark/Light mode pattern
```jsx
// html element gets class="dark" or class="light"
// Components use this pattern:

<div className="bg-navy-mid light:bg-white border border-navy-light light:border-gray-200">
  <p className="text-slate light:text-gray-700">Content</p>
</div>
```

### useTheme.js
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

## 8. Milestones

---

### Milestone 0 — Project Setup and Design System

**Goal:** Working Vite + React + Tailwind project with correct config before any component is written.

**Files:**
- client/tailwind.config.js — full config with custom colors and font
- client/postcss.config.js — auto-generated by init
- client/src/index.css — Tailwind directives + Google Font import
- client/index.html — add font link in head, set class="dark" on html
- client/src/main.jsx — default Vite entry, no changes needed yet
- client/src/App.jsx — placeholder, just returns a div for now

**Steps:**
1. Run setup commands from Section 2
2. Write tailwind.config.js exactly as in Section 2
3. Write index.css with three Tailwind directives + font import
4. Add `<link href="https://fonts.googleapis.com/...Plus+Jakarta+Sans..." rel="stylesheet">` to index.html head
5. Add `class="dark"` to `<html>` tag in index.html
6. Run `npm run dev` — verify page loads with dark background

**Test checklist:**
- [ ] `npm run dev` starts with zero errors
- [ ] Page background is dark (#0F1923 equivalent)
- [ ] Plus Jakarta Sans font loads (check Network tab in devtools)
- [ ] Tailwind classes work — add `className="bg-accent text-navy p-4"` to App.jsx temporarily and verify blue box appears
- [ ] Remove test class after verification

---

### Milestone 1 — API Layer and Utilities

**Goal:** All API functions written with mock data before any UI is built. This ensures components always call the right functions.

**Files — CREATE:**
- client/src/api/axiosInstance.js
- client/src/api/auth.api.js
- client/src/api/roadmap.api.js
- client/src/api/progress.api.js
- client/src/api/feedback.api.js
- client/src/utils/tokenHelpers.js
- client/src/utils/validators.js
- client/src/utils/sessionHelpers.js
- client/src/mocks/roadmap.json

**Write each file exactly as specified in Section 3 (API Layer Design).**

**validators.js:**
```js
export const validateEmail = (v) => {
  if (!v) return "Email is required";
  if (!/\S+@\S+\.\S+/.test(v)) return "Enter a valid email address";
  return null;
};

export const validatePassword = (v) => {
  if (!v) return "Password is required";
  if (v.length < 8) return "Password must be at least 8 characters";
  return null;
};

export const validateName = (v) => {
  if (!v || !v.trim()) return "Full name is required";
  return null;
};

export const validateConfirmPassword = (pw, confirm) => {
  if (!confirm) return "Please confirm your password";
  if (pw !== confirm) return "Passwords do not match";
  return null;
};

export const validateRequired = (v, label) => {
  if (!v || !v.trim()) return `${label} is required`;
  return null;
};
```

**sessionHelpers.js:**
```js
export const parseDayId = (dayId) => {
  // "m1-w1-d3" → { moduleNumber: 1, weekNumber: 1, dayNumber: 3 }
  const [m, w, d] = dayId.split("-");
  return {
    moduleNumber: parseInt(m.replace("m", "")),
    weekNumber:   parseInt(w.replace("w", "")),
    dayNumber:    parseInt(d.replace("d", "")),
  };
};

export const buildDayId = (moduleNumber, weekNumber, dayNumber) =>
  `m${moduleNumber}-w${weekNumber}-d${dayNumber}`;

export const getCurrentSession = (roadmapJson, progress) => {
  if (!roadmapJson || !progress) return null;
  const { currentModule, currentWeek, currentDay } = progress;
  const module = roadmapJson.modules.find(m => m.moduleNumber === currentModule);
  if (!module) return null;
  const week = module.weeks.find(w => w.weekNumber === currentWeek);
  if (!week) return null;
  const day = week.days.find(d => d.dayName === currentDay);
  if (!day) return null;
  return {
    ...day,
    dayId: buildDayId(currentModule, currentWeek, day.dayNumber),
    moduleNumber: currentModule,
    weekNumber: currentWeek,
    moduleTitle: module.title,
  };
};
```

**roadmap.json (mock):** Create a full MERN Stack roadmap with 4 modules × 1 week × 7 days each. Days 1–5 are Learning type with lesson content and task. Day 6 is Revision. Day 7 is Exam with 5 MCQ questions. Write realistic content for at least Module 1 Week 1 in full — remaining modules can have placeholder titles.

**Test checklist:**
- [ ] Import `loginUser` from auth.api.js in App.jsx temporarily, call it, verify mock data returns in console
- [ ] Import `generateRoadmap`, verify it returns roadmapJson after 1500ms delay
- [ ] Import `validateEmail`, verify it returns null for valid email and error string for invalid
- [ ] Import `parseDayId("m1-w1-d3")`, verify it returns correct object
- [ ] Remove all test imports after verification

---

### Milestone 2 — Auth Context and Routing Shell

**Goal:** All routes work, protected routes redirect, auth state persists on refresh.

**Files — CREATE:**
- client/src/context/AuthContext.jsx — full implementation from Section 5
- client/src/context/AppContext.jsx — full implementation from Section 5
- client/src/hooks/useAuth.js
- client/src/hooks/useApp.js
- client/src/hooks/useTheme.js
- client/src/routes/ProtectedRoute.jsx
- client/src/App.jsx — full routes from Section 4
- Stub files for every page (just return `<div className="text-white p-8">PageName</div>`)

**hooks:**
```js
// useAuth.js
export { useAuth } from "../context/AuthContext";

// useApp.js
export { useApp } from "../context/AppContext";
```

**ProtectedRoute.jsx:**
```jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}
```

**Test checklist:**
- [ ] Navigating to /learn without auth redirects to /auth
- [ ] Navigating to /setup without auth redirects to /auth
- [ ] Navigating to /roadmap without auth redirects to /auth
- [ ] /auth loads the stub AuthPage
- [ ] /* loads NotFoundPage stub
- [ ] No full page reload when navigating between routes (React Router working)
- [ ] Manually set localStorage sm_token="test" and sm_user={"name":"Test"} → refresh → /learn now loads without redirect

---

### Milestone 3 — UI Component Library

**Goal:** All reusable components built with Tailwind before any page uses them.

**Files — CREATE:**
- client/src/components/ui/Button.jsx
- client/src/components/ui/Badge.jsx
- client/src/components/ui/Card.jsx
- client/src/components/ui/StatCard.jsx
- client/src/components/ui/PillOption.jsx
- client/src/components/ui/LoadingSpinner.jsx

**Button.jsx — reference design-reference/auth-login-dark-desktop.html for style:**
```jsx
const variants = {
  primary:   "bg-accent text-navy hover:bg-accent-dk font-semibold",
  secondary: "bg-transparent border border-divider text-muted hover:text-slate",
  ghost:     "bg-transparent border border-divider text-muted",
  danger:    "bg-fail text-white hover:opacity-90 font-semibold",
};

const sizes = {
  sm: "h-7 px-3 text-xs rounded-md",
  md: "h-10 px-6 text-sm rounded-lg",
  lg: "h-11 px-7 text-sm rounded-lg",
};

export default function Button({
  variant = "primary", size = "md", fullWidth = false,
  loading = false, disabled = false, onClick, children, type = "button"
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 transition-all duration-150
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}
      `}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}
```

**Badge.jsx:**
```jsx
const variants = {
  learning:      "bg-accent/10 text-accent",
  revision:      "bg-warn/10 text-warn",
  exam:          "bg-fail/10 text-fail",
  current:       "bg-accent/10 text-accent",
  locked:        "bg-divider text-muted",
  passed:        "bg-pass/10 text-pass",
  failed:        "bg-fail/10 text-fail",
  "needs-revision": "bg-warn/10 text-warn",
};

export default function Badge({ variant = "locked", children }) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${variants[variant] || variants.locked}
    `}>
      {children}
    </span>
  );
}
```

**StatCard.jsx:**
```jsx
export default function StatCard({ label, value, valueColor }) {
  return (
    <div className="bg-navy-mid light:bg-white border border-navy-light light:border-gray-200 rounded-xl p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted light:text-gray-400 mb-2">
        {label}
      </p>
      <p className={`text-2xl font-semibold ${valueColor || "text-white light:text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
```

**PillOption.jsx:**
```jsx
export default function PillOption({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        h-9 px-5 rounded-full border text-sm font-medium transition-all duration-150
        ${selected
          ? "bg-accent border-accent text-navy"
          : "bg-transparent border-divider text-muted hover:border-slate hover:text-slate"
        }
      `}
    >
      {label}
    </button>
  );
}
```

**LoadingSpinner.jsx:**
```jsx
export default function LoadingSpinner({ size = "md" }) {
  const sizes = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-8 h-8" };
  return (
    <div className={`${sizes[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
  );
}
```

**Test checklist:**
- [ ] Render Button in all variants in App.jsx temporarily — verify colors correct
- [ ] Render Badge in all variants — verify colors correct
- [ ] StatCard renders with label and value
- [ ] PillOption shows selected vs unselected state
- [ ] LoadingSpinner animates
- [ ] All components switch correctly when html class changes dark ↔ light

---

### Milestone 4 — AppShell and Navbar

**Goal:** Authenticated layout with functional navbar before any protected page is built.

**Files — CREATE:**
- client/src/components/layout/AppShell.jsx
- client/src/components/layout/Navbar.jsx
- client/src/components/layout/ProfileDropdown.jsx

**Reference:** design-reference/dashboard-dark-desktop.html for navbar layout

**Navbar.jsx — key requirements:**
- Logo SVG (node-path icon) + "Skill Master" text on left
- Three nav links center: Home (/learn), Roadmap (/roadmap), Progress (/progress)
- Active link detected via `useLocation()` — accent bottom border on active
- Right side: theme toggle icon (calls toggleTheme from useTheme) + ProfileDropdown
- Height: 56px (h-14)
- Background: bg-navy-mid
- Border bottom: border-b border-navy-light
- Mobile: hide center nav links below md breakpoint

**ProfileDropdown.jsx:**
- Trigger: pill with user initials (first letter of first + last name)
- Dropdown panel: user name, email, logout button
- Click outside closes (use useEffect + document listener)
- Logout calls `logout()` from useAuth then navigate("/auth")

**AppShell.jsx:**
```jsx
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-navy light:bg-gray-50">
      <Navbar />
      <main className="pt-14">  {/* 56px = h-14 */}
        <Outlet />
      </main>
    </div>
  );
}
```

**Test checklist:**
- [ ] Navbar renders on /learn, /roadmap, /progress, /session/test
- [ ] Navbar does NOT render on /auth (no AppShell on public routes)
- [ ] Active link highlighted correctly per route (check all three)
- [ ] Theme toggle switches dark ↔ light, persists on reload
- [ ] Profile dropdown opens and closes correctly
- [ ] Click outside closes dropdown
- [ ] Logout clears token and redirects to /auth
- [ ] Mobile (< 768px): center nav links hidden

---

### Milestone 5 — Auth Page

**Goal:** Login and signup forms with all states, connected to auth.api.js.

**Files — MODIFY:**
- client/src/pages/AuthPage/AuthPage.jsx

**Reference:** 
- design-reference/auth-login-dark-desktop.html
- design-reference/auth-login-light-desktop.html
- design-reference/auth-login-dark-mobile.html
- design-reference/auth-signup-dark-desktop.html

**Requirements:**
- Desktop: two-panel layout (40% branding left, 60% form right)
- Mobile: two-zone layout (35% branding top, 65% form bottom)
- Tab switching between "Log In" and "Sign Up" — tab text never changes
- No forgot password, no social login, no footer links

**Login flow:**
1. Call `validateEmail` and `validatePassword` on submit
2. Show field-level errors if invalid
3. Call `login(email, password)` from useAuth
4. On success: navigate to /learn (returning user — for now all users go to /learn)
5. Loading state: button shows spinner and "Logging in..."

**Signup flow:**
1. Validate all 4 fields including confirm password
2. Call `signup(name, email, password)` from useAuth
3. On success: navigate to /setup (new user)
4. Loading state: button shows spinner and "Creating account..."

**Tab text — exact strings:**
- Active tab: underline in accent color, font-semibold
- "Log In" tab button text
- "Sign Up" tab button text
- Login button: "Log In"
- Signup button: "Create Account"
- Login helper: "Don't have an account? Sign Up"
- Signup helper: "Already have an account? Log In"

**Redirect logic:**
```jsx
// In AuthPage, on load:
const { user } = useAuth();
if (user) return <Navigate to="/learn" replace />;
```

**Test checklist:**
- [ ] Already logged-in user visiting /auth redirects to /learn
- [ ] "Log In" tab active by default
- [ ] Tab text never changes to "Join", "Register", or any other word
- [ ] Empty form submit shows errors on all required fields
- [ ] Invalid email shows email error only
- [ ] Passwords not matching shows confirm password error
- [ ] Login loading state shows for ~500ms
- [ ] Successful login navigates to /learn
- [ ] Successful signup navigates to /setup
- [ ] No console.log of password value anywhere
- [ ] Light mode renders correctly (all surfaces white/light)

---

### Milestone 6 — Setup Page

**Goal:** Setup form connected to createRoadmap from AppContext.

**Files — MODIFY:**
- client/src/pages/SetupPage/SetupPage.jsx

**Reference:**
- design-reference/setup-dark-desktop.html
- design-reference/setup-light-desktop.html
- design-reference/setup-dark-mobile.html

**Requirements:**
- No Navbar (standalone page, no AppShell)
- Page title: "Set Up Your Learning Profile"
- Subtitle: `Welcome, ${user.firstName}. Tell us your goal and preferences...`
- NO Full Name field — name known from auth
- Three sections: LEARNER INFORMATION, LEARNING GOAL, LEARNING PREFERENCES
- All fields feed into the AI prompt via createRoadmap

**Form state (single object):**
```js
const [form, setForm] = useState({
  role: "Student",
  level: "Beginner",
  skillName: "",
  motivation: "",
  dailyTime: "30 – 60 minutes",
  pace: "Steady",
  learningStyle: "Examples",
});
```

**On "Generate Roadmap" click:**
1. Validate skillName not empty
2. Set loading state
3. Call `createRoadmap(form)` from useApp
4. On success: navigate to /roadmap
5. On error: show error message, re-enable button

**Buttons:**
- "Back": navigate(-1) from useNavigate
- "Generate Roadmap": primary, shows "Generating your roadmap..." when loading

**Test checklist:**
- [ ] No navbar visible on this page
- [ ] User firstName appears in subtitle — not hardcoded
- [ ] No Full Name field exists on the page
- [ ] Role pills toggle correctly (one selected at a time)
- [ ] Level pills toggle correctly
- [ ] Learning Style pills toggle correctly
- [ ] Empty skill name shows validation error
- [ ] "Generate Roadmap" shows loading state for ~1500ms
- [ ] After generation, navigates to /roadmap
- [ ] Mobile: buttons stack full width

---

### Milestone 7 — Roadmap Page

**Goal:** Roadmap orientation screen with module → week → day hierarchy.

**Files — MODIFY:**
- client/src/pages/RoadmapPage/RoadmapPage.jsx

**Reference:**
- design-reference/roadmap-dark-desktop.html
- design-reference/roadmap-light-desktop.html
- design-reference/roadmap-dark-mobile.html

**Requirements:**
- Read `roadmapJson` and `progress` from useApp
- Local state: `activeModuleIndex`, `activeWeekIndex`
- Modules: horizontal row of 4 cards — NOT accordion
- Clicking a module card → updates activeModuleIndex, resets activeWeekIndex to 0
- Weeks: horizontal row showing weeks of active module only
- Clicking a week → updates activeWeekIndex
- Days: readonly list rows of active week — no click action
- CTA: "Get Started" → navigate to /learn

**Empty state (no roadmap):**
```jsx
if (!roadmapJson) return (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <p className="text-slate">No roadmap available yet.</p>
    <Button onClick={() => navigate("/setup")}>Create Roadmap</Button>
  </div>
);
```

**Test checklist:**
- [ ] Clicking Module 2 card updates weeks section to Module 2's weeks
- [ ] Clicking Week 2 updates days section to Week 2's days
- [ ] Module 1 active on load with accent border
- [ ] Week 1 active on load with accent background
- [ ] Day rows not clickable
- [ ] All 7 days show correct type badges
- [ ] Current day shows accent dot
- [ ] "Get Started" navigates to /learn
- [ ] Empty state shows when roadmapJson is null

---

### Milestone 8 — Learn (Dashboard) Page

**Goal:** Main home screen with current session card and revision queue.

**Files — MODIFY:**
- client/src/pages/LearnPage/LearnPage.jsx

**Reference:**
- design-reference/dashboard-dark-desktop.html
- design-reference/dashboard-light-desktop.html
- design-reference/dashboard-dark-mobile.html

**Requirements:**
- Read roadmapJson and progress from useApp
- Use `getCurrentSession(roadmapJson, progress)` from sessionHelpers
- "Continue Session" navigates to `/session/${session.dayId}`

**Sections:**
1. Page header: "Dashboard" / "Pick up where you left off." / "Current Skill: [skillName]"
2. 4 stat cards: Current Module, Current Week, Current Day, Revision Queue count
3. Current Session card (most prominent element)
4. Revision Queue: list of progress.weakTopics — if empty show "No revision topics yet"

**Test checklist:**
- [ ] Stat cards show correct values from progress
- [ ] Session card title matches current day from roadmapJson
- [ ] Session type badge correct
- [ ] "Continue Session" navigates to correct /session/:dayId
- [ ] Empty revision queue shows helper text
- [ ] No roadmap shows empty state

---

### Milestone 9 — Progress Page

**Goal:** Learning record screen.

**Files — MODIFY:**
- client/src/pages/ProgressPage/ProgressPage.jsx

**Reference:**
- design-reference/progress-dark-desktop.html
- design-reference/progress-light-desktop.html

**Requirements:**
- Derive all stats from `progress` object in useApp
- No CTA button — informational only
- Desktop: Learning Summary + Recent Outcomes side by side
- Mobile: stacked vertically

**Derived stats:**
```js
const completedSessions = progress?.completedTasks?.length || 0;
const modulesCompleted  = /* count distinct completed modules */;
const latestResult      = progress?.examScores?.slice(-1)[0]?.passed ? "Passed" : "—";
const revisionCount     = progress?.weakTopics?.length || 0;
```

**Test checklist:**
- [ ] All 4 stat cards derive from progress (not hardcoded)
- [ ] "Passed" value shows in green color
- [ ] Revision topics list matches progress.weakTopics
- [ ] No "Continue Session" button anywhere on this page
- [ ] Desktop: two panels side by side; Mobile: stacked

---

### Milestone 10 — Session Page (Phase Engine)

**Goal:** Phase-based learning arena. Build state machine first, then each phase.

**Files — CREATE:**
- client/src/pages/SessionPage/SessionPage.jsx
- client/src/pages/SessionPage/phases/LessonPhase.jsx
- client/src/pages/SessionPage/phases/TaskPhase.jsx
- client/src/pages/SessionPage/phases/FeedbackPhase.jsx
- client/src/pages/SessionPage/phases/ExamPhase.jsx
- client/src/pages/SessionPage/ExamResult.jsx

**Reference:**
- design-reference/session-lesson-dark-desktop.html
- design-reference/session-task-dark-desktop.html
- design-reference/session-feedback-dark-desktop.html
- design-reference/session-exam-dark-desktop.html

**Build in this exact sub-order:**

**Step 10.1 — Phase state machine:**
```jsx
// SessionPage.jsx — build this first, no phase UI yet
const PHASES = { LESSON: "lesson", TASK: "task", FEEDBACK: "feedback", EXAM: "exam", RESULT: "result" };

export default function SessionPage() {
  const { dayId } = useParams();
  const { roadmapJson, progress, advanceProgress, addWeakTopics } = useApp();
  const navigate = useNavigate();

  const session = useMemo(() => {
    if (!roadmapJson || !progress) return null;
    const { moduleNumber, weekNumber, dayNumber } = parseDayId(dayId);
    const module = roadmapJson.modules.find(m => m.moduleNumber === moduleNumber);
    const week   = module?.weeks.find(w => w.weekNumber === weekNumber);
    return week?.days.find(d => d.dayNumber === dayNumber) || null;
  }, [dayId, roadmapJson]);

  const [phase, setPhase]         = useState(null);
  const [taskAnswer, setTaskAnswer] = useState("");
  const [feedbackText, setFeedback] = useState("");
  const [examAnswers, setAnswers]   = useState([]);
  const [examResult, setResult]     = useState(null);

  useEffect(() => {
    if (session) setPhase(session.type === "Exam" ? PHASES.EXAM : PHASES.LESSON);
  }, [session]);

  if (!session) return <div className="text-white p-8">Loading session...</div>;

  // Render correct phase based on state
  return (
    <div className="min-h-screen bg-navy light:bg-gray-50">
      {phase === PHASES.LESSON   && <LessonPhase session={session} onComplete={() => setPhase(PHASES.TASK)} />}
      {phase === PHASES.TASK     && <TaskPhase session={session} onSubmit={(ans) => { setTaskAnswer(ans); setPhase(PHASES.FEEDBACK); }} />}
      {phase === PHASES.FEEDBACK && <FeedbackPhase session={session} feedback={feedbackText} taskAnswer={taskAnswer} onContinue={async () => { await advanceProgress(dayId, "passed"); navigate("/learn"); }} />}
      {phase === PHASES.EXAM     && <ExamPhase session={session} onComplete={(result) => { setResult(result); if (!result.passed) addWeakTopics(result.weakTopics); setPhase(PHASES.RESULT); }} />}
      {phase === PHASES.RESULT   && <ExamResult result={examResult} onContinue={async () => { await advanceProgress(dayId, examResult.passed ? "passed" : "failed"); navigate("/learn"); }} />}
    </div>
  );
}
```

**Step 10.2 — LessonPhase:**
- Split lessonContent by `\n\n` into parts array
- Local state: `partIndex` starting at 0
- "Next Part" button advances partIndex
- When partIndex reaches last part, button text changes to "I've Finished the Lesson" and calls onComplete

**Step 10.3 — TaskPhase:**
- Shows session.task.description
- Textarea for answer, min 20 chars validation
- "Submit Task" calls `getAIFeedback` from feedback.api.js then calls onSubmit

**Step 10.4 — FeedbackPhase:**
- Shows feedback prop (AI response text)
- Outcome indicator (positive/needs_improvement)
- "Continue to Next Session" calls onContinue

**Step 10.5 — ExamPhase:**
- Shows session.examQuestions one at a time
- Local state: `currentQ` index, `answers` array
- "Next" / "Previous" navigation
- "Submit Exam" → calculate score → pass ≥ 80% → identify weak topics from wrong answers
- Calls onComplete({ passed, score, weakTopics })

**Step 10.6 — ExamResult:**
- Pass: green result + "Continue to Next Week" button
- Fail: red result + weak topics list + "Back to Revision" button

**Test checklist:**
- [ ] /session/m1-w1-d1 loads with lesson phase
- [ ] Lesson parts advance correctly
- [ ] Last part shows "I've Finished the Lesson" button
- [ ] Task phase shows task description
- [ ] Empty answer shows validation error
- [ ] Submit Task shows loading ~1500ms then shows feedback phase
- [ ] Feedback phase shows text and outcome indicator
- [ ] "Continue to Next Session" updates progress and goes to /learn
- [ ] /session/m1-w1-d7 (Sunday) loads with exam phase directly
- [ ] 8/10 correct = 80% = passes
- [ ] Failed exam adds wrong topics to weakTopics
- [ ] Passed exam result navigates to /learn

---

### Milestone 11 — Full Flow Polish

**Goal:** Complete end-to-end flow works, no visual inconsistencies.

**Steps:**
1. Full flow test: /auth → login → /learn → Continue Session → /session → all phases → /learn
2. Full flow test: /auth → signup → /setup → Generate → /roadmap → Get Started → /learn
3. Verify theme toggle persists across ALL pages after reload
4. Verify mobile layout (390px) on all pages — no overflow
5. Verify desktop layout (1440px) on all pages
6. Run `npm run build` — fix all errors
7. Check browser console on every page — zero errors

**Test checklist:**
- [ ] Both user flows complete without errors
- [ ] Theme persists after reload on every route
- [ ] All pages correct at 390px
- [ ] All pages correct at 1440px
- [ ] No hardcoded colors anywhere
- [ ] `npm run build` succeeds with zero errors
- [ ] Zero console errors on every page in build preview

---

## 9. API Integration Checklist (For When Backend Is Ready)

When backend is built, this is all that changes:

| File | Change |
|---|---|
| auth.api.js | Uncomment real axios calls, delete mock returns |
| roadmap.api.js | Uncomment real axios calls, delete mock import |
| progress.api.js | Uncomment real axios calls |
| feedback.api.js | Uncomment real axios calls |
| AuthContext.jsx | Replace localStorage user restore with GET /auth/me |
| axiosInstance.js | Update baseURL in .env if different |

**Environment variable:**
```
# client/.env
VITE_API_URL=http://localhost:5000/api
```

Zero component files need to change. Only the api/ folder changes.

---

## 10. Security Notes

| Concern | Status | Note |
|---|---|---|
| JWT in localStorage | Acceptable for FYP MVP | httpOnly cookies in production |
| Passwords logged | Must not happen | Never console.log password param |
| XSS via rendered content | Handled | All user content rendered as text, never dangerouslySetInnerHTML |
| AI response rendered | Handled | Feedback shown as plain text string only |
| Protected routes | Handled | ProtectedRoute redirects to /auth |
| Token cleared on logout | Handled | AuthContext logout clears all localStorage keys |

---

## 11. Exact Commands Reference

```bash
# Initial setup
mkdir skill-master && cd skill-master
git init
npm create vite@latest client -- --template react
cd client
npm install
npm install react-router-dom axios
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p

# Development
npm run dev

# Build check
npm run build
npm run preview

# Add to .gitignore (root)
echo "node_modules\n.env\nclient/.env\n.claude/settings.json" > .gitignore
```

---
```
Implementing Milestone [N] — [Name].

Read the milestone section in this plan.
Reference design file: design-reference/[filename].html

Implement only this milestone.
Do not work ahead.
Use Tailwind CSS v3 classes only — no arbitrary values, use the custom color names from tailwind.config.js.
Show me each file before writing it.
Ask if anything is ambiguous.
```
---

*End of Plan — Skill Master Frontend Build Guide v2.0*
