# Skill Master Backend Server

## Purpose

This is an Express.js backend that powers Skill Master, an AI-driven learning platform. It orchestrates AI-generated learning roadmaps, generates personalized lesson content and exam questions using Google Gemini, tracks user progress through structured learning paths, and manages authentication with JWT tokens. The server acts as the single source of truth for all user data, learning content, and progress tracking.

## Directory Structure

```
server/
├── server.js                 # Entry point; initializes Express, connects DB, mounts routes
├── package.json              # Dependencies: Express, Mongoose, Gemini AI, JWT, bcrypt
├── .env                      # Environment variables (MongoDB URI, JWT secret, Gemini API key)
├── .gitignore                # Version control exclusions
│
└── src/
    ├── config/
    │   └── db.js            # MongoDB connection setup via Mongoose
    │
    ├── middleware/
    │   └── auth.middleware.js # JWT token validation (requireAuth guard)
    │
    ├── models/
    │   ├── User.model.js     # User schema: auth, profile preferences, timestamps
    │   ├── Roadmap.model.js  # Roadmap schema: AI-generated learning path structure
    │   ├── Session.model.js  # Session schema: lesson/revision/exam content & submissions
    │   └── Progress.model.js # Progress schema: current position, completed days, exam attempts
    │
    ├── controllers/
    │   ├── auth.controller.js      # Signup, login, JWT creation, user info
    │   ├── roadmap.controller.js   # Generate, retrieve, and manage learning roadmaps
    │   ├── session.controller.js   # Fetch lesson content, submit task, submit exam, feedback
    │   └── progress.controller.js  # Advance position, retrieve stats
    │
    ├── routes/
    │   ├── auth.routes.js          # /api/auth endpoints
    │   ├── roadmap.routes.js       # /api/roadmap endpoints
    │   ├── session.routes.js       # /api/session endpoints
    │   └── progress.routes.js      # /api/progress endpoints
    │
    ├── services/
    │   ├── gemini.service.js       # AI content generation (roadmaps, lessons, feedback)
    │   └── stats.service.js        # Analytics and performance calculations
    │
    └── utils/
        └── dayHelpers.js           # Date parsing, position calculation, token utilities
```

## Architecture Overview

### Request Flow (High Level)

```
CLIENT REQUEST
      ↓
   CORS Check
      ↓
  Routes (Express Router)
      ↓
JWT Middleware (requireAuth) — validates Bearer token
      ↓
   Controller
      ↓
   [Business Logic Split]
      │
      ├─→ Database Query (Mongoose)     └─→ External Service
      │    (User, Roadmap,                  (Gemini API for
      │     Session, Progress)              AI content)
      │
      └─→ Database Write (if needed)    └─→ Cache Check
           (save/update session,            (only fetch from
            progress, feedback)             Gemini if not cached)
      ↓
  Response (JSON)
      ↓
   CLIENT
```

### Data Flow: Generating a Learning Session

```
Client requests: GET /api/session/m1-w1-d1

[Session Controller]
  │
  ├─→ Parse dayId (m1-w1-d1) → module 1, week 1, day 1
  │
  ├─→ Fetch Roadmap for user
  │    └─→ Extract day type (Learning/Revision/Exam) from roadmap structure
  │
  ├─→ Check Session collection for cached content
  │    │
  │    ├─ If found → return immediately (DB serves cached AI content)
  │    │
  │    └─ If NOT found:
  │         │
  │         ├─→ Call Gemini Service to generate content
  │         │    (two-call pipeline for lessons: Pro thinks → Flash formats)
  │         │
  │         ├─→ Validate content with guardSessionContent()
  │         │    (ensure structure matches expected schema)
  │         │
  │         └─→ Save to Session collection (permanent cache)
  │
  └─→ Return session with content

Response: { session: { content, type, status, ... } }
```

### Data Flow: Submitting an Exam and Getting Feedback

```
Client submits: POST /api/session/m1-w1-d1/exam
  Body: { userSubmission: { answers: [...], ... } }

[Session Controller → submitExam]
  │
  ├─→ Fetch session, extract exam questions
  │
  ├─→ Grade exam (calculate score, identify weak topics)
  │
  ├─→ Call Gemini to generate personalized feedback
  │
  ├─→ Save feedback to Session.aiFeedback
  │
  ├─→ Call Progress.advance() to:
  │    ├─→ Record completion (completedDays array)
  │    ├─→ Store exam attempt (examAttempts array)
  │    ├─→ Calculate next position (calculateNextPosition utility)
  │    └─→ Update currentModule, currentWeek, currentDay
  │
  └─→ Return { feedback, score, passed, nextDay }
```

## Key Design Decisions

| Decision | Why | Alternative |
|----------|-----|-------------|
| **Two-call Gemini pipeline for lessons only** | Lessons need deep cognition (Pro thinks deeply), then Flash formats. Other content (roadmaps, MCQs, feedback) is fast and clear—Flash handles it alone. Saves cost and latency. | Single call for all → slower, more expensive, lower quality for complex lessons |
| **Session caching in MongoDB** | AI is called once per day per user. Content is generated, validated, saved, then served from DB forever. Fast and cheap. | Regenerate on every request → 10x API calls, 10x cost, high latency |
| **guardSessionContent before every DB write** | If Gemini returns malformed content, we catch it before caching. Prevents MongoDB from storing broken lessons that corrupt the user journey. | Trust Gemini output → cached corrupt data breaks lesson flow permanently |
| **calculateNextPosition as single source of truth** | One utility function, used everywhere progress advances. Ensures all code paths (learning → revision → exam → next module) follow the same logic. No drift. | Inline position logic in each controller → inconsistent state, skip days, loop logic |
| **.lean() on stats queries** | Progress stats don't need full Mongoose document features (virtuals, methods, hooks). Return plain JS objects fast. | Full documents → waste memory and CPU parsing |
| **JWT in Bearer tokens via Authorization header** | Standard HTTP practice. Easy CORS-safe, no cookies needed, stateless. | Cookies → CORS complexity; session tokens → server-side state burden |
| **User passwords selected: false** | Passwords excluded from all queries unless explicitly requested with `.select('+password')`. Prevents accidental data leaks. | Include password in all queries → risk of returning hashed password in API responses |
| **Roadmap.userId index + Session.userId, dayId index** | Queries like "find all sessions for user on day X" are instant. User-isolation is enforced at query time. | No indexes → full table scans on every progress check, slow at scale |

## Scripts

### Development
```bash
npm run dev
```
Starts the server with `nodemon` watching for file changes. Restarts automatically on save. Use this while developing.

### Production
```bash
npm start
```
Starts the server with `node` directly. No auto-restart. Use in deployed environments.

## API Surface

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/signup` | No | Create new user account, return JWT token and user object |
| POST | `/login` | No | Authenticate user, return JWT token and roadmap status |
| GET | `/me` | Yes | Retrieve authenticated user's profile |

### Roadmap Routes (`/api/roadmap`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/generate` | Yes | Generate AI roadmap from user preferences (skill, level, learning style, motivation) |
| GET | `/active` | Yes | Fetch the most recent (active) roadmap for authenticated user |
| GET | `/:roadmapId` | Yes | Fetch specific roadmap by ID |

**Roadmap Body (POST /generate):**
```json
{
  "skillInput": "React.js fundamentals",
  "currentLevel": "Beginner",
  "learningStyle": "Examples",
  "motivation": "Build web apps",
  "role": "Student",
  "goalClarity": "Clear",
  "dailyTime": "1 hour"
}
```

### Session Routes (`/api/session`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/:dayId` | Yes | Fetch session content (lesson, revision, or exam) for a specific day. Returns cached content or generates new content via Gemini. |
| POST | `/:dayId/submit` | Yes | Submit task response, receive AI feedback (non-exam) |
| POST | `/:dayId/exam` | Yes | Submit exam answers, receive grade, feedback, and weak topics |

**Session Response Example (GET /:dayId):**
```json
{
  "session": {
    "_id": "...",
    "userId": "...",
    "dayId": "m1-w1-d1",
    "type": "Learning",
    "content": {
      "parts": [
        {
          "partNumber": 1,
          "partTitle": "Intro to React",
          "cards": [
            { "cardNumber": 1, "type": "text", "content": "..." }
          ]
        }
      ]
    },
    "status": "pending"
  }
}
```

### Progress Routes (`/api/progress`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/advance` | Yes | Advance user position in roadmap after completing a day (learning, revision, or exam pass) |
| GET | `/stats` | Yes | Retrieve user's learning statistics (completion rate, weak topics, exam scores) |

**Advance Progress Body (POST /advance):**
```json
{
  "roadmapId": "...",
  "dayId": "m1-w1-d1",
  "status": "completed"
}
```

## Common Mistakes & Gotchas

### ❌ Caching Issues
- **Problem:** Gemini generates new content for the same day on every request.
- **Cause:** Session collection query failed silently; content was generated but not saved to DB.
- **Fix:** Always call `guardSessionContent()` before `Session.create()`. Log errors during generation.

### ❌ Progress Position Mismatch
- **Problem:** User advances to a day that doesn't exist in the roadmap structure.
- **Cause:** Position calculation logic was done inline in the controller instead of using `calculateNextPosition()`.
- **Fix:** Use `calculateNextPosition()` from `dayHelpers.js`—it's the single source of truth. Never compute module/week/day math inline.

### ❌ Authenticated Requests Fail with 401
- **Problem:** Valid JWT token returns "Unauthorized — token invalid or expired".
- **Cause:** Token was signed with one `JWT_SECRET`, but server is running with a different secret.
- **Fix:** Ensure `JWT_SECRET` in `.env` matches the one used to sign tokens. This is especially critical in staging/production deployments.

### ❌ Gemini Generation Timeouts
- **Problem:** Session endpoint hangs for 30+ seconds, then returns 500 error.
- **Cause:** Gemini API is slow or unreachable. Pro model (used for lessons) can take 5-10 seconds.
- **Fix:** Add timeout middleware (`express-timeout-handler` or similar). Return partial content or cached fallback if generation fails.

### ❌ User Isolation Breaches
- **Problem:** One user accidentally sees another user's sessions/roadmaps.
- **Cause:** Controller forgot to filter queries by `userId` (e.g., `Session.findOne({ dayId })` instead of `Session.findOne({ userId, dayId })`).
- **Fix:** Every database query for user-specific data MUST include `{ userId: req.userId, ... }`. Use TypeScript or JSDoc `@param` comments to enforce this pattern.

### ❌ Password Exposed in API Response
- **Problem:** Login returns the user object including password hash.
- **Cause:** Password field was selected in query: `User.findOne(...).select('+password')` → then returned in JSON.
- **Fix:** Never include password in API responses. Query with `.select('+password')` only for bcrypt comparison, then exclude it before `res.json()`.

## Extension Points

### Adding a New Route

1. **Create controller** in `src/controllers/newfeature.controller.js`:
   ```javascript
   export const getFeature = async (req, res) => {
     const userId = req.userId; // from auth middleware
     // ...
   };
   ```

2. **Create route** in `src/routes/newfeature.routes.js`:
   ```javascript
   import { getFeature } from '../controllers/newfeature.controller.js';
   import { requireAuth } from '../middleware/auth.middleware.js';
   
   const router = express.Router();
   router.get('/', requireAuth, getFeature);
   export default router;
   ```

3. **Mount route** in `server.js`:
   ```javascript
   import newfeatureRoutes from './src/routes/newfeature.routes.js';
   app.use('/api/newfeature', newfeatureRoutes);
   ```

### Adding a New Model

1. **Create schema** in `src/models/Feature.model.js`:
   ```javascript
   import mongoose from 'mongoose';
   
   const schema = new mongoose.Schema({
     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     data: { type: String }
   }, { timestamps: true });
   
   schema.index({ userId: 1 }); // for fast user-scoped queries
   export default mongoose.model('Feature', schema);
   ```

2. **Use in controller**:
   ```javascript
   import Feature from '../models/Feature.model.js';
   
   const feature = await Feature.findOne({ userId });
   ```

### Adding a New Gemini Service

1. **Create method** in `src/services/gemini.service.js`:
   ```javascript
   export const generateMyContent = async (params) => {
     const response = await ai.models.generateContent({
       model: STRUCTURE_MODEL, // Flash for most content
       contents: [{ role: 'user', parts: [{ text: prompt }] }],
       generationConfig: { responseSchema: MY_SCHEMA, ... }
     });
     
     // Always validate before returning
     return response.candidates[0].content.parts[0].text;
   };
   ```

2. **Import and use in controller**:
   ```javascript
   import { generateMyContent } from '../services/gemini.service.js';
   
   const content = await generateMyContent({ ... });
   guardSessionContent(type, content); // validate
   ```

### Adding Environment Variables

1. **Update `.env`**: Add the new variable and a comment explaining it.
2. **Reference in code**: `process.env.NEW_VAR`
3. **Document in this README**: Add row to Environment Variables table above.
4. **Add to deployment checklist**: Ensure CI/CD systems set the variable (Vercel, Railway, etc.).

### Enforcing User Isolation in New Code

Every query for user-specific data must include the `userId` check:

```javascript
// ✅ Good
const session = await Session.findOne({ userId, dayId });
const progress = await Progress.findOne({ userId, roadmapId });

// ❌ Bad (user isolation breach)
const session = await Session.findOne({ dayId });
const progress = await Progress.findOne({ roadmapId });
```

Use linting rules or TypeScript to catch this at development time, not production time.

---

**Last Updated:** May 2026  
**Stack:** Node.js ES Modules, Express 5, MongoDB/Mongoose, JWT, bcrypt, Google Gemini 2.5 (Pro + Flash)
