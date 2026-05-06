# Skill Master

Learn smarter with personalized learning paths powered by AI.

## Live Demo
[https://skill-master-xi.vercel.app/](https://skill-master-xi.vercel.app/)

## Tech Stack
![React 18](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Groq](https://img.shields.io/badge/Groq%20API-000000?style=flat-square)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)

## What It Does
- **Get a personalized learning path** — AI creates a custom roadmap just for your goals and pace.
- **Learn through interactive lessons** — Read content, complete exercises, and get instant AI feedback.
- **Track your progress** — See your learning streaks, completed lessons, and exam scores at a glance.
- **Test your knowledge** — Take full exams, get detailed results, and identify areas to improve.

> 📸 **Screenshot** — [Replace this line with a screenshot of the dashboard after running the app]

## Getting Started

### Prerequisites
- Node.js >= 20
- MongoDB Atlas account (free M0 tier)
- Groq API key (free tier, no billing required)

### Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/skill-master.git
cd skill-master
```

```bash
cd server && npm install
```

```bash
cd ../client && npm install
```

### Environment Setup

Create a `.env` file in the `server/` directory with the following keys:

```
MONGO_URI=mongodb+srv://your-user:your-pass@cluster.mongodb.net/skillmaster
JWT_SECRET=your-32-char-random-secret
GROQ_API_KEY=your-api-key-from-console.groq.com
PORT=5000
```

Create a `.env` file in the `client/` directory:

```
VITE_API_URL=http://localhost:5000/api
```

### Running Locally

Open two terminal windows and run:

**Terminal 1** (Backend):
```bash
cd server && npm run dev
```

**Terminal 2** (Frontend):
```bash
cd client && npm run dev
```

### Health Check
The backend is ready when this endpoint returns a running status:
```
GET http://localhost:5000/api/health
```

Expected response:
```json
{"status":"running"}
```

## Purpose
Skill Master is an AI-powered adaptive learning platform that generates personalized learning roadmaps using Groq's Llama models, guiding users through structured lessons, interactive tasks, feedback loops, and assessments—all coordinated between a React frontend and Express.js backend.

## Responsibility Boundary

**This monorepo is responsible for:**
- Complete end-to-end learning experience (auth → roadmap creation → session completion → progress tracking)
- AI-driven content generation and adaptive feedback
- Real-time session coordination with stateful phase transitions
- User data persistence and learning progress analytics

**This monorepo is NOT responsible for:**
- Third-party LMS integrations
- Video hosting or streaming infrastructure
- User notification systems (email, SMS, push)
- Mobile-native applications (web-based only)

## Contents

| Directory | Type | Responsibility |
|-----------|------|-----------------|
| `client/` | React SPA | Frontend UI, routing, session phases, API communication |
| `server/` | Express API | Authentication, session generation, Gemini integration, data persistence |
| `FEEDBACK_FLOW_FIXES.md` | Documentation | Bug audit and fixes for feedback generation pipeline |

## How It Works

### User Journey (High Level)
```
1. USER AUTHENTICATES
   → Signup/Login → Server validates → JWT token issued → stored in localStorage
   
2. USER CREATES ROADMAP
   → Gemini generates: modules, weeks, days, lesson titles, MCQ exam questions
   → Stored in MongoDB → User can now start learning
   
3. USER STARTS SESSION (one day)
   → Load lesson content (text + interactive cards)
   → Complete task (text or MCQ)
   → Submit to server → Gemini evaluates + generates feedback
   → View feedback with resources
   → (OR on exam day: take full exam → get scored result)
   
4. PROGRESS TRACKED
   → Completions, scores, streak counts aggregated
   → User can revisit roadmap and progress page anytime
```

### Session Phase Flow (Detailed)
```
LOADING
  ↓ [fetch session by dayId + roadmapId]
  ↓
LESSON (if not exam day)
  ↓ [user reads + clicks through lesson parts/cards]
  ↓ [onLessonComplete triggered]
  ↓
TASK (if not exam day)
  ↓ [user submits text answer OR selects MCQ]
  ↓ [server calls Gemini for feedback]
  ↓ [feedback + outcome + resources returned]
  ↓ [onTaskComplete triggered with feedback data]
  ↓
FEEDBACK (if not exam day)
  ↓ [display AI feedback + clickable resources]
  ↓ [user can review or exit]
  ↓ [progress updated]
  ↓
— OR —

EXAM (if exam day)
  ↓ [user takes full MCQ exam]
  ↓ [all answers collected]
  ↓ [onExamComplete triggered]
  ↓
RESULT
  ↓ [display score, pass/fail, weak topics, feedback]
```

## Key Design Decisions

- **Two-Model Gemini Strategy** (Pro + Flash)
  - **Why**: Gemini Pro has superior reasoning (for lesson thinking phase), Flash is faster and cheaper (for formatting and feedback)
  - **Alternative**: Single model for everything—slower, more expensive, lower quality for thinking-intensive tasks
  - **Where**: `server/src/services/gemini.service.js`

- **AI Provider Migration (Gemini → Groq)**
  - **Why**: Google Gemini billing setup is geographically restricted in Pakistan. Free tier produced persistent 503 errors during demos.
  - **What**: Migrated to Groq API using Meta's Llama 3.3 and Llama 3.1 models.
  - **How**: Single file change (gemini.service.js → ai.service.js). Zero controller changes. Error codes preserved for backward compatibility.
  - **Result**: Sub-3-second inference, no rate limit errors on free tier, Pakistan-compatible billing.

- **Flexible Resource Parsing**
  - **Why**: Gemini output format varies; strict regex patterns fail. Relaxed pattern `/RESOURCES:\s*([\s\S]*?)$/im` handles space or newline
  - **Alternative**: Strict format enforcement—would cause parsing failures and lost resources
  - **Where**: `server/src/controllers/session.controller.js` lines 169–177 and 275–283

- **Context API for Global State** (Auth + App)
  - **Why**: Lightweight state management for user identity and roadmap context, no external dependency overhead
  - **Alternative**: Redux—overkill for two context objects, adds complexity
  - **Where**: `client/src/context/AuthContext.jsx`, `AppContext.jsx`

- **JWT Tokens in localStorage**
  - **Why**: Stateless auth, survives page refresh, simple to implement
  - **Alternative**: Server-side sessions—requires session store, more complex CORS
  - **Trade-off**: localStorage is XSS-vulnerable; only safe because no sensitive data beyond token

- **Monorepo Structure** (client/ + server/ at root)
  - **Why**: Shared context, easier to coordinate features, single CI/CD pipeline
  - **Alternative**: Separate repos—harder to keep sync, separate deployments
  - **Gotcha**: Both need separate `package.json`, build steps, and deployment targets

- **Protected Routes with Middleware**
  - **Why**: Auth check at route level (Express middleware) and component level (React wrapper)
  - **Why double-check**: Defense in depth—backend rejects invalid tokens, frontend prevents unauthorized navigation
  - **Where**: `server/src/middleware/auth.middleware.js`, `client/src/routes/ProtectedRoute.jsx`

- **API Abstraction Layer** (api/ folder)
  - **Why**: Centralize Axios config, error handling, token injection
  - **Alternative**: Fetch or direct calls in components—no consistency, repeated token logic
  - **Where**: `client/src/api/auth.api.js`, `session.api.js`, etc.

## Data Flow

### Authentication Flow
```
[Browser] 
  signup(name, email, password)
  ↓ POST /api/auth/signup
[Express] → validate → bcrypt hash password → save User → sign JWT → return token + user
  ↓
[Browser] store token in localStorage → set AuthContext.user → redirect to /setup
```

### Roadmap Generation Flow
```
[Browser: SetupPage]
  createRoadmap(skillName, targetLevel, ...)
  ↓ POST /api/roadmap/create (with JWT in header)
[Express] 
  → validate JWT + user
  → call gemini.service.generateRoadmap()
  → Gemini returns structured roadmap JSON (modules → weeks → days → lessons/exams)
  → save Roadmap doc to MongoDB
  → set AppContext.roadmapId
  ↓
[Browser] redirect to /roadmap (view) or /learn (start first day)
```

### Session & Feedback Flow
```
[Browser: SessionPage]
  dayId = URL param (e.g., dayId=5)
  roadmapId = from AppContext
  ↓ GET /api/session/dayId/roadmapId (with JWT)
[Express]
  → validate JWT + fetch Roadmap + get specific day
  → return { type, title, lesson, task } (lesson or exam)
  ↓
[Browser] 
  Phase 1: LESSON — render lesson cards (no submission yet)
  Phase 2: TASK — user submits text or MCQ answer
  ↓ POST /api/session/submit-task (with JWT + dayId + answer)
[Express]
  → validate JWT
  → call gemini.service.generateFeedback(answer, type)
  → Gemini evaluates + generates outcome + feedback + resources
  → parse resources from Gemini output (regex extraction)
  → save to Session document
  → return { feedback, outcome, resources, score?, passed? }
  ↓
[Browser]
  Phase 3: FEEDBACK — display feedback + clickable resource links
  Phase 4: Done, update progress
```

### Progress Tracking Flow
```
[Browser: ProgressPage]
  → GET /api/progress/stats (with JWT)
[Express]
  → fetch user's Sessions collection
  → aggregate: completions, score averages, streak count
  → return stats object
  ↓
[Browser] render charts / stats cards
```

## Dependencies

### Depends On:
- **Groq API** — AI content generation, feedback, evaluation (critical path)
- **MongoDB** — persistent storage for Users, Roadmaps, Sessions, Progress
- **Express.js** — HTTP server, routing, middleware
- **React** — UI framework, component lifecycle
- **Axios** — HTTP client for frontend API calls
- **JWT (jsonwebtoken)** — token encoding/decoding
- **bcryptjs** — password hashing (security)
- **Tailwind CSS** — utility-first styling
- **Vite** — fast build tool for React SPA

### Depended On By:
- External clients (browsers, potentially mobile apps in future)
- External services consuming `/api/health` endpoint

## Common Mistakes / Gotchas

1. **Forgotten CORS Configuration** — Backend allows specific origins only (localhost:5173, Vercel domains). Adding new frontend URL without updating `allowedOrigins` in `server.js` will fail with CORS errors.

2. **Gemini Output Parsing Failures** — Gemini sometimes omits `OUTCOME:` or `RESOURCES:` sections. Parsers must check for existence before `.split()` or `.match()`. Strict regex will silently fail and return null feedback.

3. **JWT Token Expiration Not Handled** — Token is set in localStorage but never refreshed. If user session expires, API calls will return 401. Frontend must detect and redirect to login.

4. **Phase Transition State Bugs** — SessionPage uses `useState()` for `phase`. If Gemini takes >15 seconds, UI may timeout or component unmount mid-request. Error handling needed.

5. **Roadmap Not Preloaded in AppContext** — If user navigates to `/learn` before roadmap is set, dayId lookup will fail. Always check `AppContext.roadmapId` before calling `getSession()`.

6. **Resources Parsing Drops Data** — If backend fails to parse resources, they are silently dropped (set to null). Frontend receives `{ feedback, outcome }` but no resources. Check server logs for Gemini response format.

7. **Multiple Gemini Calls Per Session** — Each lesson generation + each task feedback = 1–2 Gemini API calls. High user concurrency = high API costs. No caching of repeated roadmaps or feedback.

## Extension Points

### Adding a New Learning Phase (e.g., "Quiz")
1. **Backend**: Add `QuizPhase` type to Roadmap schema in `gemini.service.js`
2. **Backend**: Add controller method `submitQuiz()` in `session.controller.js` that calls Gemini evaluation
3. **Frontend**: Create `QuizPhase.jsx` component in `client/src/pages/SessionPage/phases/`
4. **Frontend**: Add phase case to SessionPage state machine (add `QUIZ: 'quiz'` to PHASES object, add route handler `handleQuizComplete()`)
5. **Frontend**: Add phase transition logic in phase switch/if chain

### Adding a New User Stat (e.g., "Time Spent")
1. **Database**: Add `timeSpent: Number` field to Session schema in `server/src/models/Session.model.js`
2. **Backend**: Track time in session controller (start time on `getSession()`, end time on submit)
3. **Backend**: Add aggregation logic in `stats.service.js` to compute total time across sessions
4. **Frontend**: Add stat card to ProgressPage consuming the new field from `/api/progress/stats`

### Adding a New API Route (e.g., "Retry Session")
1. **Backend**: Create `retry.routes.js` or add method to existing route file
2. **Backend**: Add controller method `retrySession()` that fetches session, resets state, preserves previous attempts
3. **Backend**: Mount route in `server.js`: `app.use('/api/retry', retryRoutes);`
4. **Frontend**: Create API method in `client/src/api/session.api.js`
5. **Frontend**: Call from SessionPage on user retry action

### Customizing Gemini Prompts
1. **Roadmap prompts**: Edit `server/src/services/gemini.service.js` — `generateRoadmap()` function, find the `content:` array with system message
2. **Lesson prompts**: Edit same file — `generateLesson()` function, edit thinking + structure prompts
3. **Feedback prompts**: Edit `generateFeedback()` — MCQ and text task prompts are separate sections
4. **Schema tuning**: Modify `*_SCHEMA` objects at top of gemini.service.js to adjust output structure (add/remove fields, change types)

### Monitoring & Observability
- Health check: `GET /api/health` returns `{ status, timestamp, service }`
- Error handling: All routes have try/catch → return meaningful error messages
- Add logging: Wrap Gemini calls with `console.log(timestamp, modelName, tokensUsed)` for cost tracking
- Add metrics: Track completion rates, average feedback generation time, API error rates

## Team

| Name | Role | Primary Contribution |
|------|------|----------------------|
| Sharjeel Arshad | Lead Backend & AI Engineer | System architecture, Gemini integration, session engine, backend hardening, deployment |
| Nida Javaid | Frontend & Design | Figma designs, UI/UX implementation, component development |
| Laraib Imran | Project Manager | Team management, financials, project coordination |
| Noor Anwar | Technical Documentation | Documentation, technical writing |

> Supervised by Prof. Hafiz Muhammad Mudassir, Superior University, Lahore.
