# Skill Master — Complete API Contract
**Version:** 1.0 — Final  
**Scope:** Frontend ↔ Server ↔ Database ↔ AI (Gemini)  
**Status:** Locked — no vague decisions remain  
**Rule:** Every action in this application maps to exactly one entry in this document.  
If an action is not here, it does not exist in the MVP.

---

## HOW TO READ THIS DOCUMENT

Each contract entry follows this structure:

```
ACTION NAME
  Trigger:    what causes this call to happen in the UI
  Frontend:   HTTP method + URL + exact request body shape
  Auth:       whether JWT is required
  Server:     what the server does step by step
  DB:         what MongoDB read/write/update happens
  AI:         whether Gemini is called and what prompt shape
  Response:   exact response body shape on success
  Errors:     every possible error response
```

---

## BASE URL

```
Development:  http://localhost:5000/api
Production:   https://your-domain.com/api  (set later)
```

All frontend calls use `axiosInstance.js` which reads `VITE_API_URL` from `.env`.  
All protected routes require header: `Authorization: Bearer <jwt_token>`

---

## SECTION 1 — AUTHENTICATION

---

### 1.1 SIGNUP

```
Trigger:     User fills Sign Up form and clicks "Create Account"
Frontend:    POST /api/auth/signup
Auth:        None — public endpoint

Request body:
{
  "name":     "string — full name, required, min 2 chars",
  "email":    "string — valid email format, required, unique",
  "password": "string — min 8 chars, required"
}

Server steps:
  1. Validate name, email, password — return 400 if invalid
  2. Check if email already exists in users collection — return 409 if taken
  3. Hash password using bcrypt (saltRounds: 10)
  4. Insert new user document into users collection
  5. Generate JWT using user._id as payload (expires: 7 days)
  6. Return token + user object

DB action:
  Collection: users
  Operation:  insertOne
  Document:
  {
    "_id":        ObjectId (auto),
    "name":       "string",
    "firstName":  "string — first word of name",
    "email":      "string — lowercase, trimmed",
    "password":   "string — bcrypt hash",
    "createdAt":  Date (Date.now())
  }

AI:  None

Success response — 201:
{
  "token": "string — JWT",
  "user": {
    "_id":       "string",
    "name":      "string",
    "firstName": "string",
    "email":     "string"
  }
}

Error responses:
  400 — { "error": "All fields are required" }
  400 — { "error": "Password must be at least 8 characters" }
  409 — { "error": "An account with this email already exists" }
  500 — { "error": "Server error" }
```

---

### 1.2 LOGIN

```
Trigger:     User fills Login form and clicks "Log In"
Frontend:    POST /api/auth/login
Auth:        None — public endpoint

Request body:
{
  "email":    "string — required",
  "password": "string — required"
}

Server steps:
  1. Validate email and password present — return 400 if missing
  2. Find user by email in users collection — return 401 if not found
  3. Compare password with bcrypt hash — return 401 if wrong
  4. Check if user has an existing roadmap (roadmaps collection, query by userId)
  5. Generate JWT (expires: 7 days)
  6. Return token + user + hasRoadmap flag
     (frontend uses hasRoadmap to decide: /learn vs /setup redirect)

DB action:
  Collection: users
  Operation:  findOne — { email: req.body.email }
  
  Collection: roadmaps
  Operation:  findOne — { userId: user._id }
  Read only — no write

AI:  None

Success response — 200:
{
  "token": "string — JWT",
  "user": {
    "_id":       "string",
    "name":      "string",
    "firstName": "string",
    "email":     "string"
  },
  "hasRoadmap": "boolean"
}

Error responses:
  400 — { "error": "Email and password are required" }
  401 — { "error": "Invalid email or password" }
  500 — { "error": "Server error" }

Frontend behavior on success:
  if (hasRoadmap) navigate("/learn")
  else navigate("/setup")
```

---

### 1.3 GET CURRENT USER (Token Validation on Refresh)

```
Trigger:     App loads — AuthContext checks if stored token is still valid
Frontend:    GET /api/auth/me
Auth:        Required — JWT in Authorization header

Request body:  None

Server steps:
  1. JWT middleware extracts userId from token
  2. Find user by _id in users collection
  3. Return user object (no password field)

DB action:
  Collection: users
  Operation:  findOne — { _id: req.userId }
  Projection: { password: 0 }  — never return password hash

AI:  None

Success response — 200:
{
  "user": {
    "_id":       "string",
    "name":      "string",
    "firstName": "string",
    "email":     "string"
  },
  "hasRoadmap": "boolean"
}

Error responses:
  401 — { "error": "Unauthorized — token missing or invalid" }
  401 — { "error": "Unauthorized — token expired" }
  404 — { "error": "User not found" }
  500 — { "error": "Server error" }

Frontend behavior:
  On 401: clear localStorage, redirect to /auth
  On success: restore user state, proceed to app
```

---

## SECTION 2 — SETUP AND ROADMAP GENERATION

---

### 2.1 GENERATE ROADMAP (AI Call)

```
Trigger:     User completes setup form and clicks "Generate Roadmap"
Frontend:    POST /api/roadmap/generate
Auth:        Required

Request body:
{
  "skillName":     "string — what user wants to learn, required, max 150 chars",
  "level":         "Beginner | Intermediate | Advanced",
  "role":          "Student | Job Seeker | Other",
  "dailyTime":     "Less than 30 minutes | 30 – 60 minutes | 1 – 2 hours | 2+ hours",
  "pace":          "Relaxed | Steady | Intensive",
  "learningStyle": "Reading | Examples | Practice",
  "motivation":    "string — optional, max 300 chars, can be empty string"
}

Server steps:
  1. Validate required fields — return 400 if missing
  2. Check if user already has a roadmap for this skillName — return 409 if exists
  3. Build Gemini prompt from request body (see AI section below)
  4. Call Gemini API — await response
  5. Parse roadmapJson from Gemini response
  6. Validate roadmapJson structure — return 500 if malformed
  7. Insert roadmap document into roadmaps collection
  8. Insert initial progress document into progress collection
  9. Return roadmapId + roadmapJson

DB action:
  Collection: roadmaps
  Operation:  insertOne
  Document:
  {
    "_id":         ObjectId (auto),
    "userId":      ObjectId (from JWT),
    "skillName":   "string",
    "setupData":   { role, level, dailyTime, pace, learningStyle, motivation },
    "roadmapJson": { ...full roadmap object from Gemini },
    "createdAt":   Date (Date.now())
  }
  Index: { userId: 1 }

  Collection: progress
  Operation:  insertOne
  Document:
  {
    "_id":            ObjectId (auto),
    "userId":         ObjectId (from JWT),
    "roadmapId":      ObjectId (new roadmap _id),
    "currentModule":  1,
    "currentWeek":    1,
    "currentDay":     "Monday",
    "completedTasks": [],
    "weakTopics":     [],
    "examScores":     []
  }
  Index: { userId: 1, roadmapId: 1 }

AI call — Gemini:
  Model: gemini-1.5-flash
  
  Prompt template:
  """
  You are an expert curriculum designer. Generate a complete structured learning roadmap.
  
  Learner profile:
  - Skill to learn: {skillName}
  - Current level: {level}
  - Role: {role}
  - Daily available time: {dailyTime}
  - Preferred pace: {pace}
  - Learning style: {learningStyle}
  - Motivation: {motivation}
  
  Generate a roadmap with exactly 4 modules. Each module has exactly 1 week.
  Each week has exactly 7 days:
  - Days 1–5 (Monday–Friday): type "Learning" — lesson content + task
  - Day 6 (Saturday): type "Revision" — lesson only, no task
  - Day 7 (Sunday): type "Exam" — 5 MCQ questions, no lesson/task
  
  Return ONLY valid JSON matching this exact structure — no explanation, no markdown:
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
                "title": "string — short lesson title",
                "lessonContent": "string — detailed lesson text, min 300 words",
                "task": {
                  "description": "string — clear task instructions",
                  "expectedOutput": "string — what a correct answer looks like"
                },
                "examQuestions": null
              },
              ... days 2-5 same shape as day 1 ...
              {
                "dayNumber": 6,
                "dayName": "Saturday",
                "type": "Revision",
                "title": "Week N Revision",
                "lessonContent": "string — revision summary of the week",
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
                    "options": ["string", "string", "string", "string"],
                    "correctIndex": 0
                  }
                ]
              }
            ]
          }
        ]
      },
      ... modules 2, 3, 4 same shape ...
    ]
  }
  """

Success response — 201:
{
  "roadmapId":  "string — MongoDB _id of roadmap document",
  "roadmapJson": { ...full roadmap object }
}

Error responses:
  400 — { "error": "skillName is required" }
  400 — { "error": "Invalid level value" }
  409 — { "error": "You already have a roadmap for this skill" }
  500 — { "error": "Failed to generate roadmap — AI service error" }
  500 — { "error": "Server error" }

Frontend behavior:
  Loading state: ~15 seconds (AI call takes time — show progress indicator)
  On success: store roadmapId in AppContext, navigate to /roadmap
  On 500 AI error: show retry button — do not navigate away
```

---

### 2.2 GET ROADMAP

```
Trigger:     App loads on /roadmap, /learn, /session — restore roadmap from server
Frontend:    GET /api/roadmap/:roadmapId
Auth:        Required

Request params: roadmapId — string (MongoDB _id)
Request body:   None

Server steps:
  1. Find roadmap by _id AND userId (security: user can only access own roadmap)
  2. Return roadmap document

DB action:
  Collection: roadmaps
  Operation:  findOne — { _id: roadmapId, userId: req.userId }

AI:  None

Success response — 200:
{
  "roadmapId":  "string",
  "roadmapJson": { ...full roadmap object },
  "skillName":  "string",
  "createdAt":  "ISO date string"
}

Error responses:
  401 — { "error": "Unauthorized" }
  404 — { "error": "Roadmap not found" }
  500 — { "error": "Server error" }
```

---

### 2.3 GET USER'S ACTIVE ROADMAP (Used on app load)

```
Trigger:     After login — app needs to check if user has a roadmap without knowing roadmapId
Frontend:    GET /api/roadmap/active
Auth:        Required

Request body: None

Server steps:
  1. Find most recent roadmap for this userId
  2. Also fetch matching progress document
  3. Return both

DB action:
  Collection: roadmaps
  Operation:  findOne — { userId: req.userId } — sort by createdAt descending (most recent)

  Collection: progress
  Operation:  findOne — { userId: req.userId, roadmapId: roadmap._id }

AI:  None

Success response — 200:
{
  "roadmapId":   "string",
  "roadmapJson": { ...full roadmap object },
  "progress":    { ...full progress object }
}

  If no roadmap exists:
  200 — { "roadmapId": null, "roadmapJson": null, "progress": null }

Error responses:
  401 — { "error": "Unauthorized" }
  500 — { "error": "Server error" }

Frontend behavior:
  If roadmapId is null: user needs to go to /setup
  If roadmapId exists: restore roadmapJson + progress in AppContext
```

---

## SECTION 3 — PROGRESS TRACKING

---

### 3.1 UPDATE PROGRESS (Task or Lesson Completion)

```
Trigger:     User clicks "Continue to Next Session" in FeedbackPhase
             (after lesson + task + feedback complete for that day)
Frontend:    POST /api/progress/update
Auth:        Required

Request body:
{
  "roadmapId": "string — MongoDB _id of roadmap",
  "dayId":     "string — format: m1-w1-d3 (module-week-day)",
  "status":    "passed | failed"
}

Server steps:
  1. Find progress document by userId + roadmapId — return 404 if not found
  2. Append to completedTasks array: { dayId, status, completedAt: Date.now() }
  3. Parse dayId to get moduleNumber, weekNumber, dayNumber
  4. Calculate next day:
     - dayNumber 1→2→3→4→5→6→7→1 (cycling Mon–Sun)
     - If moving to day 1 (Monday): increment weekNumber
     - If weekNumber exceeds module's total weeks: increment moduleNumber, reset weekNumber to 1
     - If moduleNumber exceeds totalModules: set a "completed" flag on progress
  5. Update progress document:
     - currentDay: next dayName
     - currentWeek: next weekNumber
     - currentModule: next moduleNumber
     - push to completedTasks
  6. Return new current position

DB action:
  Collection: progress
  Operation:  findOneAndUpdate
  Query:      { userId: req.userId, roadmapId: roadmapId }
  Update:
  {
    "$push": {
      "completedTasks": { "dayId": dayId, "status": status, "completedAt": new Date() }
    },
    "$set": {
      "currentModule": newModule,
      "currentWeek":   newWeek,
      "currentDay":    newDay
    }
  }

AI:  None

Success response — 200:
{
  "success":       true,
  "newDay":        "Tuesday",
  "newWeek":       1,
  "newModule":     1,
  "roadmapComplete": false
}

Error responses:
  400 — { "error": "roadmapId, dayId, and status are required" }
  400 — { "error": "Invalid dayId format" }
  400 — { "error": "Invalid status — must be passed or failed" }
  404 — { "error": "Progress record not found" }
  500 — { "error": "Server error" }
```

---

### 3.2 UPDATE EXAM SCORE AND WEAK TOPICS

```
Trigger:     User submits Sunday exam and result is calculated
Frontend:    POST /api/progress/exam
Auth:        Required

Request body:
{
  "roadmapId":    "string",
  "dayId":        "string — format: m1-w1-d7 (must be day 7 / Sunday)",
  "score":        "number — percentage 0 to 100",
  "passed":       "boolean — true if score >= 80",
  "weakTopics":   "array of strings — titles of lessons where answer was wrong, can be empty"
}

Server steps:
  1. Find progress by userId + roadmapId
  2. Push exam score to examScores array
  3. If passed:
     - Add weak topics to weakTopics (deduplicated)
     - Call POST /api/progress/update with status "passed" to advance to next week
  4. If failed:
     - Add weak topics to weakTopics (deduplicated)
     - Reset currentDay to "Saturday" (learner goes back to revision)
     - Do NOT advance week
  5. Return result + updated progress position

DB action:
  Collection: progress
  Operation:  findOneAndUpdate
  Query:      { userId: req.userId, roadmapId: roadmapId }

  If passed:
  {
    "$push": {
      "examScores": { moduleNumber, weekNumber, score, passed: true, attemptedAt: new Date() }
    },
    "$addToSet": { "weakTopics": { "$each": weakTopics } },
    "$set": { "currentDay": "Monday", "currentWeek": newWeek, "currentModule": newModule }
  }

  If failed:
  {
    "$push": {
      "examScores": { moduleNumber, weekNumber, score, passed: false, attemptedAt: new Date() }
    },
    "$addToSet": { "weakTopics": { "$each": weakTopics } },
    "$set": { "currentDay": "Saturday" }
  }

AI:  None

Success response — 200:
{
  "success":    true,
  "passed":     "boolean",
  "score":      "number",
  "newDay":     "Monday (if passed) | Saturday (if failed)",
  "newWeek":    "number",
  "newModule":  "number",
  "weakTopics": ["array of all accumulated weak topics"]
}

Error responses:
  400 — { "error": "Required fields missing" }
  400 — { "error": "Score must be between 0 and 100" }
  400 — { "error": "dayId must be a Sunday (day 7)" }
  404 — { "error": "Progress record not found" }
  500 — { "error": "Server error" }
```

---

### 3.3 GET PROGRESS

```
Trigger:     App loads — restore progress from server after login
             Also called by /progress page to show stats
Frontend:    GET /api/progress/:roadmapId
Auth:        Required

Request params: roadmapId
Request body:   None

Server steps:
  1. Find progress by userId + roadmapId — security: userId must match JWT
  2. Return full progress document

DB action:
  Collection: progress
  Operation:  findOne — { userId: req.userId, roadmapId: roadmapId }

AI:  None

Success response — 200:
{
  "progress": {
    "_id":            "string",
    "userId":         "string",
    "roadmapId":      "string",
    "currentModule":  "number",
    "currentWeek":    "number",
    "currentDay":     "string",
    "completedTasks": [
      { "dayId": "string", "status": "passed|failed", "completedAt": "ISO date" }
    ],
    "weakTopics":  ["string"],
    "examScores":  [
      { "moduleNumber": "number", "weekNumber": "number", "score": "number", "passed": "boolean", "attemptedAt": "ISO date" }
    ]
  }
}

Error responses:
  401 — { "error": "Unauthorized" }
  404 — { "error": "Progress not found" }
  500 — { "error": "Server error" }
```

---

## SECTION 4 — AI FEEDBACK

---

### 4.1 GET TASK FEEDBACK (AI Call)

```
Trigger:     User submits task answer in TaskPhase and clicks "Submit Task"
Frontend:    POST /api/feedback
Auth:        Required

Request body:
{
  "roadmapId":  "string",
  "dayId":      "string — format: m1-w1-d3",
  "userAnswer": "string — user's submitted answer, min 20 chars"
}

Server steps:
  1. Validate all fields present and userAnswer length >= 20
  2. Fetch roadmap from roadmaps collection to get task description
  3. Parse dayId to locate correct day in roadmapJson
  4. Extract task.description and task.expectedOutput from that day
  5. Build Gemini prompt
  6. Call Gemini API — await response
  7. Parse feedback and outcome from response
  8. Return feedback text + outcome — DO NOT save to database
  9. (Feedback is session-scoped only — never persisted)

DB action:
  Collection: roadmaps
  Operation:  findOne — { _id: roadmapId, userId: req.userId }
  Read only — fetches task context
  
  NO write to any collection — feedback is never stored

AI call — Gemini:
  Model: gemini-1.5-flash
  
  Prompt template:
  """
  You are a helpful programming tutor evaluating a student's task submission.
  
  Task description: {task.description}
  Expected output: {task.expectedOutput}
  Student's answer: {userAnswer}
  
  Provide constructive feedback in 3 short paragraphs:
  1. What the student did correctly
  2. What could be improved or is missing
  3. One specific next step or tip
  
  End your response with a single line:
  OUTCOME: positive   (if the answer demonstrates understanding of the core concept)
  OUTCOME: needs_improvement   (if the answer is missing key elements)
  
  Keep the total response under 200 words. Use simple, encouraging language.
  """

Success response — 200:
{
  "feedback": "string — AI-generated feedback text (3 paragraphs)",
  "outcome":  "positive | needs_improvement"
}

Error responses:
  400 — { "error": "userAnswer must be at least 20 characters" }
  400 — { "error": "roadmapId and dayId are required" }
  404 — { "error": "Roadmap or day not found" }
  500 — { "error": "Failed to get feedback — AI service error" }
  500 — { "error": "Server error" }

Frontend behavior:
  Loading state: ~5–10 seconds (show spinner on Submit Task button)
  On success: advance to FeedbackPhase with feedback text and outcome
  On 500 AI error: show inline error — "Could not get feedback. Continue anyway?" with a skip button
```

---

## SECTION 5 — DATABASE SCHEMAS (MongoDB)

Complete document shapes for all three collections.

---

### Collection: users

```js
// Index: { email: 1 } — unique
{
  _id:       ObjectId,          // auto-generated
  name:      String,            // "Sharjeel Arshad"
  firstName: String,            // "Sharjeel" — derived on insert, first word of name
  email:     String,            // lowercase, trimmed, unique
  password:  String,            // bcrypt hash — NEVER returned in API responses
  createdAt: Date               // Date.now() on insert
}

// Operations:
// INSERT: on signup
// READ:   on login (findOne by email), on /auth/me (findOne by _id)
// UPDATE: none in MVP
// DELETE: none in MVP
```

---

### Collection: roadmaps

```js
// Index: { userId: 1 }
{
  _id:       ObjectId,          // auto-generated
  userId:    ObjectId,          // ref to users._id
  skillName: String,            // "MERN Stack"
  setupData: {                  // stores what user entered in setup form
    role:          String,      // "Student"
    level:         String,      // "Beginner"
    dailyTime:     String,      // "1 – 2 hours"
    pace:          String,      // "Steady"
    learningStyle: String,      // "Examples"
    motivation:    String       // optional
  },
  roadmapJson: {                // full AI-generated roadmap — see shape below
    skillName:     String,
    level:         String,
    totalModules:  Number,      // always 4
    estimatedWeeks:Number,      // always 4
    dailyTime:     String,
    modules: [
      {
        moduleNumber: Number,   // 1-based
        title:        String,
        weeks: [
          {
            weekNumber: Number, // 1-based
            days: [
              {
                dayNumber:     Number,  // 1–7
                dayName:       String,  // "Monday"–"Sunday"
                type:          String,  // "Learning" | "Revision" | "Exam"
                title:         String,
                lessonContent: String,  // null for Exam days
                task: {
                  description:    String,
                  expectedOutput: String
                },                      // null for Revision and Exam days
                examQuestions: [
                  {
                    question:     String,
                    options:      [String, String, String, String],
                    correctIndex: Number  // 0-based
                  }
                ]                       // null for Learning and Revision days
              }
            ]
          }
        ]
      }
    ]
  },
  createdAt: Date               // Date.now() on insert
}

// Operations:
// INSERT: on POST /api/roadmap/generate
// READ:   on GET /api/roadmap/:roadmapId
//         on GET /api/roadmap/active
//         on POST /api/feedback (to get task context)
// UPDATE: none in MVP
// DELETE: none in MVP
```

---

### Collection: progress

```js
// Index: { userId: 1, roadmapId: 1 } — compound
{
  _id:           ObjectId,      // auto-generated
  userId:        ObjectId,      // ref to users._id
  roadmapId:     ObjectId,      // ref to roadmaps._id
  currentModule: Number,        // 1-based, starts at 1
  currentWeek:   Number,        // 1-based, starts at 1
  currentDay:    String,        // "Monday"–"Sunday", starts at "Monday"
  completedTasks: [
    {
      dayId:       String,      // "m1-w1-d1" format
      status:      String,      // "passed" | "failed"
      completedAt: Date
    }
  ],                            // empty array on init
  weakTopics: [String],         // lesson titles where exam answer was wrong, empty on init
  examScores: [
    {
      moduleNumber: Number,
      weekNumber:   Number,
      score:        Number,     // percentage 0–100
      passed:       Boolean,    // true if score >= 80
      attemptedAt:  Date
    }
  ]                             // empty array on init
}

// Operations:
// INSERT: on POST /api/roadmap/generate (init with currentDay "Monday")
// READ:   on GET /api/progress/:roadmapId
//         on GET /api/roadmap/active (joined with roadmap)
// UPDATE — POST /api/progress/update:
//   $push completedTasks
//   $set currentDay, currentWeek, currentModule
// UPDATE — POST /api/progress/exam:
//   $push examScores
//   $addToSet weakTopics (prevents duplicates)
//   $set currentDay (to Monday if passed, Saturday if failed)
// DELETE: none in MVP
```

---

## SECTION 6 — GEMINI API INTEGRATION (Server-Side)

---

### Setup in server/.env

```
GEMINI_API_KEY=your_key_from_ai_studio
```

### Server-side Gemini service file (server/src/services/gemini.service.js)

```js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateRoadmapFromPrompt = async (promptText) => {
  const result = await model.generateContent(promptText);
  const text = result.response.text();
  // Strip markdown code fences if Gemini wraps JSON in ```json ... ```
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

export const generateFeedbackFromPrompt = async (promptText) => {
  const result = await model.generateContent(promptText);
  return result.response.text();
};
```

### Server package for Gemini

```bash
# In /server folder:
npm install @google/generative-ai
```

---

## SECTION 7 — JWT MIDDLEWARE (Server-Side)

```js
// server/src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized — token missing" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;  // available in all protected route handlers
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized — token invalid or expired" });
  }
};
```

### server/.env additions

```
JWT_SECRET=your_random_secret_string_min_32_chars
MONGO_URI=mongodb://localhost:27017/skillmaster
PORT=5000
```

---

## SECTION 8 — FRONTEND API INTEGRATION POINTS

This table shows exactly which frontend file calls which endpoint.  
When switching from mock to real — only the `/api/` files change, zero component changes.

| Frontend File | Endpoint Called | When |
|---|---|---|
| auth.api.js — loginUser | POST /api/auth/login | Login form submit |
| auth.api.js — signupUser | POST /api/auth/signup | Signup form submit |
| auth.api.js — getMe | GET /api/auth/me | App load — token validation |
| roadmap.api.js — generateRoadmap | POST /api/roadmap/generate | Setup form submit |
| roadmap.api.js — getActiveRoadmap | GET /api/roadmap/active | After login — restore state |
| roadmap.api.js — getRoadmap | GET /api/roadmap/:id | Direct roadmap fetch if needed |
| progress.api.js — updateProgress | POST /api/progress/update | FeedbackPhase "Continue" click |
| progress.api.js — updateExam | POST /api/progress/exam | ExamPhase "Submit Exam" click |
| progress.api.js — getProgress | GET /api/progress/:id | After login — restore state |
| feedback.api.js — getAIFeedback | POST /api/feedback | TaskPhase "Submit Task" click |

---

## SECTION 9 — SWITCHING FROM MOCK TO REAL (When Backend Is Ready)

The mock-to-real switch is designed to be zero-risk because all API calls are isolated.

**Step 1:** Set `VITE_API_URL=http://localhost:5000/api` in `client/.env`

**Step 2:** In each api/ file, uncomment the real axios call and delete the mock return.

**Example — auth.api.js:**
```js
export const loginUser = async (email, password) => {
  // DELETE THIS MOCK BLOCK:
  // await new Promise(r => setTimeout(r, 500));
  // return { token: "mock_jwt_token_123", user: { ... } };

  // UNCOMMENT THIS:
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};
```

**Step 3:** In AuthContext.jsx, replace mock user restore with:
```js
// Replace this:
const stored = localStorage.getItem("sm_user");
if (stored) setUser(JSON.parse(stored));

// With this:
const data = await getMe();
setUser(data.user);
// Also restore roadmap + progress using getActiveRoadmap() here
```

**That is all.** Every component works identically. No page file changes needed.

---

## SECTION 10 — ERROR HANDLING RULES

**Frontend rules:**
- All API calls are wrapped in try/catch
- `axiosInstance.js` handles 401 globally — redirects to /auth
- Every form that makes an API call shows a loading state on submit
- On API error: show inline error message in the relevant UI area — never a browser alert
- On AI timeout (>15s): show "This is taking longer than expected..." message with retry option

**Server rules:**
- All route handlers wrapped in try/catch
- Errors logged to console on server — never returned in response body in production
- 500 errors return generic message only: `{ "error": "Server error" }`
- Specific error messages (400, 401, 404, 409) are safe to return to client
- Never return password hash, JWT secret, or API key in any response

---

## SECTION 11 — COMPLETE ENDPOINT LIST

```
POST   /api/auth/signup              — public
POST   /api/auth/login               — public
GET    /api/auth/me                  — protected

POST   /api/roadmap/generate         — protected — AI call
GET    /api/roadmap/active           — protected
GET    /api/roadmap/:roadmapId       — protected

POST   /api/progress/update          — protected
POST   /api/progress/exam            — protected
GET    /api/progress/:roadmapId      — protected

POST   /api/feedback                 — protected — AI call
```

**Total endpoints: 10**  
**AI calls: 2** (roadmap generation, task feedback)  
**Public endpoints: 2** (signup, login)  
**Protected endpoints: 8**

---

*End of Contract — Skill Master API v1.0*
