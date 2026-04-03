# Skill Master — Technical Documentation

This document provides a comprehensive breakdown of the Skill Master frontend codebase, detailing the role, type, dependencies, and responsibilities of every file in the `/client/src/` directory.

---

## [main.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/main.jsx)

**Role:** Application entry point.

**Type:** Config

**Depends on:** [App.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/App.jsx), [index.css](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/index.css)

**Consumed by:** Browser (index.html)

**Key responsibilities:**
- Initializes the React root element.
- Wraps the entire application in `StrictMode`.
- Renders the `App` component.

---

## [App.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/App.jsx)

**Role:** Root component for routing and global context providers.

**Type:** Component

**Depends on:** [AuthContext.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/context/AuthContext.jsx), [AppContext.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/context/AppContext.jsx), [ProtectedRoute.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/routes/ProtectedRoute.jsx), [AppShell.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/AppShell.jsx), and all Page components.

**Consumed by:** [main.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/main.jsx)

**Key responsibilities:**
- Defines the application's route structure using `react-router-dom`.
- Orchestrates global state providers (`AuthProvider`, `AppProvider`).
- Implements `ProtectedRoute` for authenticated zones.
- Configuration for public vs private routes.

---

## [index.css](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/index.css)

**Role:** Global styling and design system configuration.

**Type:** Config

**Depends on:** None (Tailwind directives)

**Consumed by:** [main.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/main.jsx)

**Key responsibilities:**
- Defines the custom color palette (navy, accent, pass, fail, warn).
- Sets up Tailwind CSS layers (`base`, `components`, `utilities`).
- Configures default typography and global layout styles.
- Implements the "Blueprint Grid" background pattern.

---

## [sessionHelpers.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/utils/sessionHelpers.js)

**Role:** Logical utilities for session and roadmap navigation.

**Type:** Utility

**Depends on:** None

**Consumed by:** [ProgressPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/ProgressPage/ProgressPage.jsx), [LearnPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/LearnPage/LearnPage.jsx)

**Key responsibilities:**
- ID parsing for composite session identifiers.
- Logic for calculating progress percentages.
- Helpers for retrieving specific roadmap items by ID.

---

## [tokenHelpers.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/utils/tokenHelpers.js)

**Role:** Management of authentication tokens.

**Type:** Utility

**Depends on:** None

**Consumed by:** [AuthContext.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/context/AuthContext.jsx), [axiosInstance.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/axiosInstance.js)

**Key responsibilities:**
- Saving, retrieving, and clearing JWT tokens from `localStorage`.
- Abstracts storage mechanism from the rest of the app.

---

## [validators.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/utils/validators.js)

**Role:** Reusable form validation logic.

**Type:** Utility

**Depends on:** None

**Consumed by:** [AuthPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/AuthPage/AuthPage.jsx)

**Key responsibilities:**
- Email format validation (Regex).
- Password strength/length checks.
- Form field presence validation.

---

## [auth.api.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/auth.api.js)

**Role:** API layer for authentication.

**Type:** API Function

**Depends on:** [axiosInstance.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/axiosInstance.js)

**Consumed by:** [AuthContext.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/context/AuthContext.jsx)

**Key responsibilities:**
- Mocks login and signup network requests.
- Simulates server latency for loading states.
- Fetches "me" (current user) data on refresh.

---

## [axiosInstance.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/axiosInstance.js)

**Role:** Centralized HTTP client configuration.

**Type:** Config

**Depends on:** [tokenHelpers.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/utils/tokenHelpers.js)

**Consumed by:** All `.api.js` files.

**Key responsibilities:**
- Configures base URL and default headers.
- Implements **Request Interceptor** to attach Bearer tokens.
- Implements **Response Interceptor** for global error handling (e.g., 401 redirect to login).

---

## [feedback.api.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/feedback.api.js)

**Role:** API layer for AI feedback generation.

**Type:** API Function

**Depends on:** [axiosInstance.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/axiosInstance.js)

**Consumed by:** [TaskPhase.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/phases/TaskPhase.jsx)

**Key responsibilities:**
- Mocks the POST request to the AI feedback engine.
- Returns simulated feedback strings and pass/fail outcomes.

---

## [progress.api.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/progress.api.js)

**Role:** API layer for tracking learning progress.

**Type:** API Function

**Depends on:** [axiosInstance.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/axiosInstance.js)

**Consumed by:** [AppContext.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/context/AppContext.jsx)

**Key responsibilities:**
- Manages the `sm_user_progress` object in `localStorage`.
- Logic for advancing days and weeks.
- Logic for recording exam scores and weak topics.

---

## [roadmap.api.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/roadmap.api.js)

**Role:** API layer for roadmap structure management.

**Type:** API Function

**Depends on:** [axiosInstance.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/axiosInstance.js), [roadmap.json](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/mocks/roadmap.json)

**Consumed by:** [AppContext.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/context/AppContext.jsx)

**Key responsibilities:**
- Fetches the curriculum structure.
- Mocks the roadmap generation process from user setup data.

---

## [AppContext.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/context/AppContext.jsx)

**Role:** Global state for curriculum and progress data.

**Type:** Context

**Depends on:** [roadmap.api.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/roadmap.api.js), [progress.api.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/progress.api.js), [AuthContext.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/context/AuthContext.jsx)

**Consumed by:** `useApp` hook, [App.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/App.jsx)

**Key responsibilities:**
- Orchestrates the loading and persistence of roadmap and progress state.
- Exposes `advanceProgress` and `completeExamProgress` actions.
- Handles "State Restoration" on page reloads.

---

## [AuthContext.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/context/AuthContext.jsx)

**Role:** Global state for user session management.

**Type:** Context

**Depends on:** [auth.api.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/auth.api.js), [tokenHelpers.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/utils/tokenHelpers.js)

**Consumed by:** `useAuth` hook, [App.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/App.jsx)

**Key responsibilities:**
- Manages `user` state and `loading` flags.
- Provides `login`, `signup`, and `logout` functions.
- Ensures authentication persists across sessions via `localStorage`.

---

## [useApp.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useApp.js)

**Role:** Access hook for AppContext.

**Type:** Hook

**Depends on:** [AppContext.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/context/AppContext.jsx)

**Consumed by:** Almost all Page and Phase components.

**Key responsibilities:**
- Simple export for consumer clarity.

---

## [useAuth.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useAuth.js)

**Role:** Access hook for AuthContext.

**Type:** Hook

**Depends on:** [AuthContext.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/context/AuthContext.jsx)

**Consumed by:** [Navbar.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/Navbar.jsx), [AuthPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/AuthPage/AuthPage.jsx), [ProtectedRoute.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/routes/ProtectedRoute.jsx).

**Key responsibilities:**
- Simple export for consumer clarity.

---

## [useTheme.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useTheme.js)

**Role:** UI theme management (Dark/Light).

**Type:** Hook

**Depends on:** None

**Consumed by:** [Navbar.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/Navbar.jsx)

**Key responsibilities:**
- Toggles `dark` class on the HTML root.
- Persists theme preference in `localStorage`.

---

## [ProtectedRoute.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/routes/ProtectedRoute.jsx)

**Role:** Routing guard for private application areas.

**Type:** Route

**Depends on:** [useAuth.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useAuth.js), [useApp.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useApp.js), [LoadingSpinner.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/ui/LoadingSpinner.jsx)

**Consumed by:** [App.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/App.jsx)

**Key responsibilities:**
- Redirects unauthenticated users to `/auth`.
- Blocks rendering while state is being restored from `localStorage`.
- Renders `LoadingSpinner` during initialization.

---

## [Badge.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/ui/Badge.jsx)

**Role:** Visual status indicator.

**Type:** Component

**Depends on:** None

**Consumed by:** [RoadmapPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/RoadmapPage/RoadmapPage.jsx), [LearnPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/LearnPage/LearnPage.jsx), [SessionPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/SessionPage.jsx).

**Key responsibilities:**
- Renders colored badges based on variant (Learning, Revision, Passed, etc.).
- Maps semantic variants to Tailwind color tokens.

---

## [Button.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/ui/Button.jsx)

**Role:** Core action component.

**Type:** Component

**Depends on:** [LoadingSpinner.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/ui/LoadingSpinner.jsx)

**Consumed by:** Almost every file.

**Key responsibilities:**
- Supports multiple variants (primary, secondary, ghost, danger).
- Handles internal loading states and disabling.
- Standardizes button styling across the app.

---

## [Card.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/ui/Card.jsx)

**Role:** Stylized content container.

**Type:** Component

**Depends on:** None

**Consumed by:** Various layout-heavy pages.

**Key responsibilities:**
- Standardizes corner rounding, shadows, and dark mode backgrounds.
- Optional hover/click animation for interactive cards.

---

## [LoadingSpinner.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/ui/LoadingSpinner.jsx)

**Role:** Global loading indicator.

**Type:** Component

**Depends on:** None

**Consumed by:** [Button.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/ui/Button.jsx), [ProtectedRoute.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/routes/ProtectedRoute.jsx).

**Key responsibilities:**
- Renders an animated CSS spinner.
- Supports small, medium, and large sizes.

---

## [PillOption.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/ui/PillOption.jsx)

**Role:** Selection component for form options.

**Type:** Component

**Depends on:** None

**Consumed by:** [SetupPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SetupPage/SetupPage.jsx)

**Key responsibilities:**
- Renders a selectable rounded button for setup choices.
- Handles active/inactive styling based on current choice.

---

## [StatCard.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/ui/StatCard.jsx)

**Role:** Data visualization card.

**Type:** Component

**Depends on:** None

**Consumed by:** [LearnPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/LearnPage/LearnPage.jsx), [ProgressPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/ProgressPage/ProgressPage.jsx).

**Key responsibilities:**
- Displays a label and a large value string.
- Standardizes typography and hierarchy for dashboard metrics.

---

## [AppShell.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/AppShell.jsx)

**Role:** Main application layout container.

**Type:** Layout

**Depends on:** [Navbar.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/Navbar.jsx), [Footer.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/Footer.jsx), [BottomTabBar.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/BottomTabBar.jsx).

**Consumed by:** [App.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/App.jsx)

**Key responsibilities:**
- Assembles the sticky header (Navbar) and footer.
- Manages the scrollable inner content area via `<Outlet />`.
- Handles dark mode background persistence.

---

## [BottomTabBar.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/BottomTabBar.jsx)

**Role:** Mobile-specific navigation bar.

**Type:** Layout

**Depends on:** `react-icons/hi2`

**Consumed by:** [AppShell.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/AppShell.jsx)

**Key responsibilities:**
- Renders a tabbed interface at the bottom for small screens.
- Highlights active routes.
- Uses semantic icons for Core routes (Learn, Roadmap, Progress).

---

## [Footer.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/Footer.jsx)

**Role:** Desktop-only status bar.

**Type:** Layout

**Depends on:** [useApp.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useApp.js)

**Consumed by:** [AppShell.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/AppShell.jsx)

**Key responsibilities:**
- Displays version info and current skill/progress in real-time.
- Hidden on mobile to avoid clutter.

---

## [Navbar.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/Navbar.jsx)

**Role:** Global navigation header.

**Type:** Layout

**Depends on:** [useTheme.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useTheme.js), [ProfileDropdown.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/ProfileDropdown.jsx).

**Consumed by:** [AppShell.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/AppShell.jsx)

**Key responsibilities:**
- Provides desktop navigation links.
- Includes the logo and theme toggle.
- Houses the user profile dropdown.

---

## [ProfileDropdown.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/ProfileDropdown.jsx)

**Role:** User session menu.

**Type:** Layout

**Depends on:** [useAuth.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useAuth.js)

**Consumed by:** [Navbar.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/layout/Navbar.jsx)

**Key responsibilities:**
- Displays current user name and email.
- Triggers the `logout` action.
- Uses click-outside logic to close.

---

## [AuthPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/AuthPage/AuthPage.jsx)

**Role:** User authentication gateway.

**Type:** Page

**Depends on:** [useAuth.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useAuth.js)

**Key responsibilities:**
- Handles Login and Signup form states.
- Client-side validation for emails and passwords.
- Desktop vs Mobile layout switching for different aesthetics.
- Redirects authenticated users.

---

## [LearnPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/LearnPage/LearnPage.jsx)

**Role:** Main learning dashboard.

**Type:** Page

**Depends on:** [useApp.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useApp.js), [StatCard.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/ui/StatCard.jsx), [Badge.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/components/ui/Badge.jsx).

**Key responsibilities:**
- Finds and displays the "Current Active Session" from the roadmap.
- Shows key stats (Completed module, revision queue).
- Renders the revision queue list.
- Fallback for users without roadmaps.

---

## [NotFoundPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/NotFoundPage/NotFoundPage.jsx)

**Role:** 404 error page.

**Type:** Page

**Key responsibilities:**
- Displays a branded 404 message.
- Redirects lost users back to the dashboard.

---

## [ProgressPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/ProgressPage/ProgressPage.jsx)

**Role:** Detailed learning records and statistics.

**Type:** Page

**Depends on:** [useApp.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useApp.js), [sessionHelpers.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/utils/sessionHelpers.js).

**Key responsibilities:**
- Calculates completion percentages and counts.
- Displays "Recent Outcomes" for sessions and exams.
- Shows the full revision history.
- Aggregates module and week-level progress.

---

## [RoadmapPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/RoadmapPage/RoadmapPage.jsx)

**Role:** Visual curriculum browser.

**Type:** Page

**Depends on:** [useApp.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useApp.js).

**Key responsibilities:**
- Module and Week navigation interface.
- Displays locked vs unlocked days in the timeline.
- Detailed daily title and type (Learning/Exam/Revision) listing.
- Roadmap overview stats.

---

## [SessionPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/SessionPage.jsx)

**Role:** Core learning engine phase-machine.

**Type:** Page

**Depends on:** [LessonPhase.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/phases/LessonPhase.jsx), [TaskPhase.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/phases/TaskPhase.jsx), [FeedbackPhase.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/phases/FeedbackPhase.jsx), [ExamPhase.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/phases/ExamPhase.jsx), [ExamResult.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/ExamResult.jsx).

**Key responsibilities:**
- Manages phase transitions (Lesson -> Task -> Feedback).
- Fetches specific session data based on URL parameters.
- Triggers global progress updates upon session completion.
- Handles smooth scroll-to-top on state changes.

---

## [ExamPhase.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/phases/ExamPhase.jsx)

**Role:** MCQ Exam rendering and logic.

**Type:** Phase Component

**Key responsibilities:**
- Paginated MCQ interface.
- Calculates final scores and pass/fail state.
- Identifies "Weak Topics" from incorrect answers.

---

## [LessonPhase.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/phases/LessonPhase.jsx)

**Role:** Educational content delivery.

**Type:** Phase Component

**Depends on:** [PartCard.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/phases/PartCard.jsx), [MiniExercise.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/phases/MiniExercise.jsx).

**Key responsibilities:**
- Iterates through lesson "Parts" and "Cards".
- Switches to `MiniExercise` after a part finishes.
- Calculates lesson-specific progress bar.

---

## [TaskPhase.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SessionPage/phases/TaskPhase.jsx)

**Role:** Practical work interface.

**Type:** Phase Component

**Depends on:** [feedback.api.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/api/feedback.api.js).

**Key responsibilities:**
- Handles text-based exercise submissions.
- Manages AI feedback loading states.
- Also supports MCQ "Theory" tasks.

---

## [SetupPage.jsx](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/pages/SetupPage/SetupPage.jsx)

**Role:** Onboarding and roadmap generation.

**Type:** Page

**Depends on:** [useApp.js](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/hooks/useApp.js).

**Key responsibilities:**
- Captures user's target skill, role, and time goal.
- Dispatches the generation action to the API.
- Redirects to the roadmap upon successful creation.

---

## [roadmap.json](file:///c:/Users/Ad/OneDrive/Desktop/Skill%20Master/client/src/mocks/roadmap.json)

**Role:** Primary curriculum data source.

**Type:** Mock Data

**Key responsibilities:**
- Defines the hierarchical structure of the MERN course (Modules -> Weeks -> Days).
- Contains thousands of lines of lesson cards, MCQ questions, and task descriptions.
- Acts as the "Source of Truth" for the mock API layer.
