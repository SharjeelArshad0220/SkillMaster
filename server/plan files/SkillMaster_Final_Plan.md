# Skill Master — Complete Final Execution Plan
## Backend Hardening + Frontend Rewrite + Production Deploy
**Version:** Final MVP
**Stack:** Node.js + Express + MongoDB + Gemini 2.5 Flash + React 18 + Vite + Tailwind CSS v3
**Generated:** April 2026
**Rule:** One milestone per Antigravity session. Test every checklist item before moving forward. Never batch milestones.

---

## 0. CONFIRMED DECISIONS

| Decision | Choice | Reason |
|----------|--------|--------|
| Backend runtime | Node.js ES Modules | Already in place, locked |
| AI provider | Gemini 2.5 Flash | Working, token fix confirmed |
| Max output tokens | 65536 for JSON, 512 for text | Prevents truncation |
| Frontend framework | React 18 + Vite + Tailwind v3 | Already scaffolded |
| State management | React Context API | MVP scope, sufficient |
| Auth storage | localStorage (sm_token) | Acceptable for MVP demo |
| Session rewrite scope | Full rewrite of data layer + SessionPage only | Visual components preserved |
| Hosting | Vercel (frontend) + Railway (backend) + Atlas M0 (DB) | Cost-efficient |
| Domain | .ai TLD preferred | Brand signal for AI product |
| AI billing | Google AI Studio pay-as-you-go with $5 cap | Eliminates 503 rate limit errors |

---

## PART A — BACKEND HARDENING (5 Milestones)

---

## MILESTONE B1 — Gemini Structural Validation
**Goal:** Prevent malformed AI output from ever being parsed as valid or saved to the database.
**Time estimate:** 1 hour
**File:** server/src/services/gemini.service.js (MODIFY)

### Why This Exists
Gemini 2.5 Flash passes JSON.parse even when internal structure is corrupt —
parts missing cards, partTitles containing 400-word hallucinations, duplicate
part objects with no content. JSON.parse succeeding is not enough validation.
We need semantic validation of the lesson shape.

### Exact Code Changes

#### Step 1 — Add validateLessonStructure function

Add this function BEFORE the generateContent function in gemini.service.js:

```js
/**
 * Validates that a parsed lesson object has the correct semantic structure.
 * Throws JSON_PARSE_FAILURE if structure is invalid — triggering retry logic.
 * Called after JSON.parse succeeds, before returning to caller.
 */
const validateLessonStructure = (parsed) => {
  // Must have parts array that is non-empty
  if (!parsed.parts || !Array.isArray(parsed.parts) || parsed.parts.length === 0) {
    console.error('[Gemini Validation] FAIL: parts array missing or empty');
    throw new Error('JSON_PARSE_FAILURE');
  }

  for (const part of parsed.parts) {
    // Each part must have a non-empty cards array
    if (!part.cards || !Array.isArray(part.cards) || part.cards.length === 0) {
      console.error(`[Gemini Validation] FAIL: part ${part.partNumber} has no cards`);
      throw new Error('JSON_PARSE_FAILURE');
    }

    // Each card must have meaningful content (minimum 50 chars)
    for (const card of part.cards) {
      if (
        !card.content ||
        typeof card.content !== 'string' ||
        card.content.trim().length < 50
      ) {
        console.error(`[Gemini Validation] FAIL: card ${card.cardNumber} in part ${part.partNumber} has no content`);
        throw new Error('JSON_PARSE_FAILURE');
      }
    }
  }

  // Validation passed
  return true;
};
```

#### Step 2 — Add validatePartTitle function

Add this function AFTER validateLessonStructure and BEFORE generateContent:

```js
/**
 * Cleans and validates a partTitle string.
 * Detects Gemini's repetitive hallucination pattern and replaces with fallback.
 * Strips trailing JSON artifacts like `, "` that appear when Gemini splits objects.
 */
const validatePartTitle = (title) => {
  if (typeof title !== 'string' || title.trim().length === 0) {
    return 'Topic Overview';
  }

  // Detect repetitive hallucination: e.g. "Revieweristive Foundationsistive Revieweristive..."
  // Pattern: if any word appears 3+ times in first 60 chars, it is hallucinated
  const sample = title.substring(0, 80).toLowerCase();
  const words = sample.split(/\s+/).filter(w => w.length > 3);
  const wordCounts = {};
  for (const word of words) {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
    if (wordCounts[word] >= 3) {
      console.warn('[Gemini Validation] Hallucinated partTitle detected, replacing with fallback');
      return 'Topic Overview';
    }
  }

  // Strip trailing JSON artifacts: `, "` or `",` or trailing whitespace
  const cleaned = title
    .replace(/[,"\s]+$/, '')  // trailing comma, quote, space
    .replace(/^[,"\s]+/, '')  // leading artifacts
    .trim();

  // Hard length cap
  return cleaned.substring(0, 80);
};
```

#### Step 3 — Replace the existing safety pass inside generateContent

Find this block in generateContent (the one that currently only truncates long partTitles):

```js
// Safety Pass: Truncate partTitle if it got corrupted into a massive string
if (isJson && parsed.parts && Array.isArray(parsed.parts)) {
  parsed.parts = parsed.parts.map(part => ({
    ...part,
    partTitle: typeof part.partTitle === 'string' 
      ? (part.partTitle.length > 100 ? part.partTitle.substring(0, 100) + "..." : part.partTitle)
      : "Topic Overview"
  }));
}
```

Replace it entirely with:

```js
// Structural validation + title cleaning for lesson responses
if (isJson && parsed.parts !== undefined) {
  // 1. Validate semantic structure — throws JSON_PARSE_FAILURE on bad shape
  validateLessonStructure(parsed);

  // 2. Clean all partTitles
  parsed.parts = parsed.parts.map(part => ({
    ...part,
    partTitle: validatePartTitle(part.partTitle)
  }));
}
```

#### Step 4 — Raise maxOutputTokens

In generateContent config, find:
```js
maxOutputTokens: isJson ? 8192 : 512,
```

Replace with:
```js
maxOutputTokens: isJson ? 65536 : 512,
```

### Test Checklist B1
- [ ] DELETE all existing sessions from MongoDB sessions collection
- [ ] GET /api/session/m1-w1-d1 — response has exactly 3 parts
- [ ] Each part has cards array with 2+ items
- [ ] Each card.content is a string of 100+ characters
- [ ] Each part has miniExercise with question, options (4 items), correctIndex, explanation
- [ ] partTitle on all parts is a clean string under 80 chars with no trailing `, "`
- [ ] GET /api/session/m1-w1-d1 again — same _id returned (cached, no re-generation)
- [ ] Terminal shows no [Gemini Validation] FAIL messages for clean responses

---

## MILESTONE B2 — Revision Prompt Hardening
**Goal:** Revision sessions always return exactly 1 part with 3 cards and a miniExercise.
**Time estimate:** 45 minutes
**File:** server/src/services/gemini.service.js (MODIFY)

### Why This Exists
Test 7 showed 7 duplicate `partNumber: 1` objects with no cards. The revision
prompt was ambiguous — "1 part only" was in the prompt body but the system
instruction didn't reinforce it. Gemini interpreted "1 part" as permission to
generate skeleton part headers without filling them. The fix is both a
stricter prompt AND updating the system instruction.

### Exact Code Changes

#### Step 1 — Update LESSON_SYSTEM_INSTRUCTION

Find the current LESSON_SYSTEM_INSTRUCTION constant. At the END of it, add:

```js
const LESSON_SYSTEM_INSTRUCTION = `...your existing instruction text...

ABSOLUTE CONSTRAINT FOR REVISION SESSIONS:
When the prompt asks for a revision session, the parts array must contain
EXACTLY ONE part object. Not two, not seven. ONE. That single part object
must contain: partNumber (1), partTitle (short string), cards (array of
exactly 3 card objects each with cardNumber and content of 120+ words),
and miniExercise (with question, 4 options, correctIndex integer 0-3,
explanation). Never return empty cards arrays. Never return a part without
cards. If you cannot generate cards, still generate 3 placeholder cards
with real content.`;
```

#### Step 2 — Rewrite the isRevision prompt branch in generateLessonContent

Find the current revision prompt (the `else if (data.isRevision)` block).
Replace the entire prompt string with:

```js
prompt = `Generate a focused revision lesson for a learner who needs to review weak topics.

LEARNER CONTEXT:
Skill: ${data.skillName}
Topics the learner struggled with: ${data.weakTopicsStr || 'General review of the week'}
All topics from this week (fallback if no weak topics): ${data.allWeekTopics || 'Week topics'}
Learner level: ${data.currentLevel || 'Beginner'}

OUTPUT REQUIREMENTS (these are non-negotiable):
- The parts array must contain EXACTLY 1 part object
- That part must have partNumber: 1
- That part must have partTitle: a short descriptive string like "Week Revision: Core Concepts"
- That part must have cards: an array of EXACTLY 3 card objects
  - card 1: cardNumber: 1, content: 120-200 words re-explaining the first weak topic from a new angle
  - card 2: cardNumber: 2, content: 120-200 words re-explaining the second weak topic (or connecting concepts)
  - card 3: cardNumber: 3, content: 120-200 words showing practical application with a new example
- That part must have miniExercise: an object with question, options (4 strings), correctIndex (0-3), explanation
- task must be null — revision sessions have no task

Do not add more than 1 part. Do not return empty cards arrays.`;
```

### Test Checklist B2
- [ ] DELETE session for m1-w1-d6 from MongoDB
- [ ] GET /api/session/m1-w1-d6
- [ ] Response has content.parts array with EXACTLY 1 item
- [ ] That 1 part has partNumber: 1
- [ ] That 1 part has cards array with EXACTLY 3 items
- [ ] Each card has cardNumber and content (100+ chars)
- [ ] That 1 part has miniExercise with question, 4 options, correctIndex, explanation
- [ ] content.task is null
- [ ] GET /api/session/m1-w1-d6 again — same _id (cached)
- [ ] Terminal shows no validation errors

---

## MILESTONE B3 — Session Save Guard
**Goal:** Malformed content never reaches MongoDB. Database always contains valid sessions.
**Time estimate:** 30 minutes
**File:** server/src/controllers/session.controller.js (MODIFY)

### Why This Exists
Even with Gemini validation in the service layer, a defensive guard at
the controller level is required. If generateContent somehow returns
without throwing but with corrupt data, the broken session would be
cached permanently in MongoDB — every subsequent request would return
the broken cached version forever with no recovery path except manual DB deletion.

### Exact Code Changes

#### Step 1 — Add guardSessionContent function

Add this function at the TOP of session.controller.js, before all exports:

```js
/**
 * Final guard before saving a session to the database.
 * If content fails this check, throw INVALID_SESSION_CONTENT.
 * This prevents permanently caching broken sessions in MongoDB.
 * 
 * @param {string} type - "Learning" | "Revision" | "Exam"
 * @param {object} content - The content object to validate
 */
const guardSessionContent = (type, content) => {
  if (type === 'Exam') {
    // Exam sessions only need examQuestions
    if (
      !content.examQuestions ||
      !Array.isArray(content.examQuestions) ||
      content.examQuestions.length === 0
    ) {
      console.error('[Session Guard] FAIL: Exam session has no examQuestions');
      throw new Error('INVALID_SESSION_CONTENT');
    }
    return;
  }

  // Learning and Revision must have parts with cards
  if (
    !content.parts ||
    !Array.isArray(content.parts) ||
    content.parts.length === 0
  ) {
    console.error(`[Session Guard] FAIL: ${type} session has no parts`);
    throw new Error('INVALID_SESSION_CONTENT');
  }

  for (const part of content.parts) {
    if (
      !part.cards ||
      !Array.isArray(part.cards) ||
      part.cards.length === 0
    ) {
      console.error(`[Session Guard] FAIL: Part ${part.partNumber} has no cards`);
      throw new Error('INVALID_SESSION_CONTENT');
    }
  }

  console.log(`[Session Guard] PASS: ${type} session structure valid`);
};
```

#### Step 2 — Call the guard before Session.create()

In getSession controller, find the line:
```js
session = await Session.create({
```

IMMEDIATELY BEFORE that line, add:
```js
// Final guard: never save a structurally invalid session to MongoDB
guardSessionContent(type, content);
```

#### Step 3 — Add INVALID_SESSION_CONTENT to catch block

In the catch block of getSession, find:
```js
if (error.message === 'GEMINI_FAILURE' || error.message === 'JSON_PARSE_FAILURE') {
```

Replace with:
```js
if (
  error.message === 'GEMINI_FAILURE' ||
  error.message === 'JSON_PARSE_FAILURE' ||
  error.message === 'INVALID_SESSION_CONTENT'
) {
```

### Test Checklist B3

This test requires temporarily breaking the AI to verify the guard works:

- [ ] Temporarily set maxOutputTokens to 5 in generateContent (forces truncation)
- [ ] DELETE any session for m1-w1-d2 from MongoDB
- [ ] GET /api/session/m1-w1-d2 — expect 500 response, NOT 200 with empty parts
- [ ] Check MongoDB sessions collection — confirm NO new document was created for m1-w1-d2
- [ ] Terminal shows [Session Guard] FAIL log message
- [ ] Restore maxOutputTokens to 65536
- [ ] GET /api/session/m1-w1-d2 — expect 200 with valid session now generated and saved
- [ ] Terminal shows [Session Guard] PASS log message

---

## MILESTONE B4 — Stats and weeklyWeakTopics Fix
**Goal:** latestExamScore returns real values. weeklyWeakTopics stored and accessed consistently.
**Time estimate:** 45 minutes
**Files:** server/src/services/stats.service.js (MODIFY), server/src/controllers/progress.controller.js (MODIFY), server/src/controllers/session.controller.js (MODIFY)

### Why This Exists
Two separate bugs:
1. stats.service.js receives a Mongoose document object where .slice() on
   examAttempts may not behave like a plain array. Using .lean() on the
   query returns a plain JS object and fixes this.
2. weeklyWeakTopics is stored as a plain JS object `{}` in MongoDB (because
   Mongoose Mixed type) but the session controller accesses it with Map
   syntax `.get()` in some places and object syntax `[]` in others.
   This inconsistency causes weak topics to be silently lost.

### Exact Code Changes

#### stats.service.js — Fix lastAttempt reading

Find the current lastAttempt derivation. Replace with:

```js
// Defensive array access — works on both Mongoose doc arrays and plain arrays
const examAttempts = Array.isArray(progress.examAttempts)
  ? progress.examAttempts
  : [];

const lastAttempt = examAttempts.length > 0
  ? examAttempts[examAttempts.length - 1]
  : null;

// Explicit type coercion to prevent null/undefined slipping through
const latestExamScore = lastAttempt && lastAttempt.score !== undefined
  ? Number(lastAttempt.score)
  : null;

const latestExamPassed = lastAttempt && lastAttempt.passed !== undefined
  ? Boolean(lastAttempt.passed)
  : null;

const latestResult = lastAttempt
  ? (lastAttempt.passed ? 'Passed' : 'Failed')
  : null;
```

Then use these variables in the returned object instead of inline expressions.

#### progress.controller.js — Use .lean() in getStats

Find the getStats controller. Replace the DB queries with:

```js
export const getStats = async (req, res) => {
  try {
    const { roadmapId } = req.query;
    if (!roadmapId) {
      return res.status(400).json({ error: "roadmapId query param is required" });
    }

    // .lean() returns plain JS objects — fixes Mongoose getter issues on Mixed fields
    const progress = await Progress.findOne({
      userId: req.userId,
      roadmapId
    }).lean();

    if (!progress) {
      return res.status(404).json({ error: "Progress not found" });
    }

    const roadmap = await Roadmap.findOne({
      _id: roadmapId,
      userId: req.userId
    }).lean();

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    const stats = calculateStats(progress, roadmap.roadmapJson);
    return res.status(200).json(stats);

  } catch (error) {
    console.error("getStats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
```

#### session.controller.js — Fix weeklyWeakTopics access in revision branch

Find this line in the Revision branch of getSession:
```js
const weakTopics = progress.weeklyWeakTopics?.[currentWeekKey] || [];
```

Replace with:
```js
// weeklyWeakTopics is stored as a plain JS object in MongoDB (Mongoose Mixed type)
// Always use bracket notation [] — never Map.get() — for consistency
const weeklyWeakTopics = progress.weeklyWeakTopics || {};
const weakTopics = Array.isArray(weeklyWeakTopics[currentWeekKey])
  ? weeklyWeakTopics[currentWeekKey]
  : [];
```

Also in submitExam, find any Map-style access like `.get()` or `.set()` on
weeklyWeakTopics and replace with plain object access:

```js
// CORRECT — always use plain object syntax
if (!progress.weeklyWeakTopics) progress.weeklyWeakTopics = {};
if (!progress.weeklyWeakTopics[currentWeekKey]) {
  progress.weeklyWeakTopics[currentWeekKey] = [];
}
const existing = progress.weeklyWeakTopics[currentWeekKey];
const combined = Array.from(new Set([...existing, ...weakTopics]));
progress.weeklyWeakTopics[currentWeekKey] = combined;
progress.markModified('weeklyWeakTopics'); // Required for Mongoose Mixed type
```

### Test Checklist B4

- [ ] Submit exam with all correct answers
- [ ] GET /api/progress/stats — latestExamScore is 100, latestExamPassed is true
- [ ] Submit exam with all wrong answers (new exam day or delete attempt from DB)
- [ ] GET /api/progress/stats — latestExamScore is 0, latestExamPassed is false, latestResult is "Failed"
- [ ] GET /api/progress/stats — revisionQueue contains the 5 weak topics from wrong answers
- [ ] Check MongoDB progress document — weeklyWeakTopics has correct key "m1-w1" with array of topic strings
- [ ] GET /api/session/m1-w1-d6 (delete first) — revision session prompt receives weak topics correctly
- [ ] Terminal shows no "Cannot read property of undefined" errors

---

## MILESTONE B5 — Progress Advancement Audit and calculateNextPosition Wire-up
**Goal:** advanceProgress uses calculateNextPosition from dayHelpers.js as single source of truth.
**Time estimate:** 45 minutes
**Files:** server/src/utils/dayHelpers.js (MODIFY), server/src/controllers/progress.controller.js (MODIFY)

### Why This Exists
calculateNextPosition is defined in dayHelpers.js but the advanceProgress
controller was doing its own manual day arithmetic. Two separate arithmetic
paths will diverge — one gets updated, the other doesn't. Single source
of truth prevents this entire class of bug.

### Exact Code Changes

#### Step 1 — Harden calculateNextPosition in dayHelpers.js

Replace the entire calculateNextPosition function with:

```js
/**
 * Given current position, returns the next learning position.
 * This is the SINGLE SOURCE OF TRUTH for day advancement.
 * Used by: advanceProgress controller, submitExam controller (on pass).
 * 
 * @param {number} moduleNumber - Current module (1-indexed)
 * @param {number} weekNumber - Current week (1-indexed within module)
 * @param {number} dayNumber - Current day (1-7, where 1=Monday, 7=Sunday)
 * @param {object} roadmapJson - Full roadmap JSON from DB
 * @returns {{ newModule, newWeek, newDay, roadmapComplete }}
 */
export const calculateNextPosition = (moduleNumber, weekNumber, dayNumber, roadmapJson) => {
  const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  // dayNumber is 1-indexed. DAY_NAMES is 0-indexed.
  // Current day name: DAY_NAMES[dayNumber - 1]
  // Next day name: DAY_NAMES[dayNumber] (which is dayNumber+1 but 0-indexed)

  // Case 1: Not Sunday yet — advance to next day in same week
  if (dayNumber < 7) {
    return {
      newModule: moduleNumber,
      newWeek: weekNumber,
      newDay: DAY_NAMES[dayNumber], // dayNumber is 1-6, so dayNumber index = next day
      roadmapComplete: false
    };
  }

  // Case 2: Sunday done — try next week in current module
  const currentMod = roadmapJson.modules.find(m => m.moduleNumber === moduleNumber);
  if (!currentMod) {
    console.error(`calculateNextPosition: module ${moduleNumber} not found in roadmap`);
    return { newModule: moduleNumber, newWeek: weekNumber, newDay: 'Monday', roadmapComplete: false };
  }

  const nextWeek = currentMod.weeks.find(w => w.weekNumber === weekNumber + 1);
  if (nextWeek) {
    return {
      newModule: moduleNumber,
      newWeek: weekNumber + 1,
      newDay: 'Monday',
      roadmapComplete: false
    };
  }

  // Case 3: Last week of module done — try next module
  const nextModule = roadmapJson.modules.find(m => m.moduleNumber === moduleNumber + 1);
  if (nextModule) {
    return {
      newModule: moduleNumber + 1,
      newWeek: 1,
      newDay: 'Monday',
      roadmapComplete: false
    };
  }

  // Case 4: Last module, last week, Sunday done — roadmap complete
  return {
    newModule: moduleNumber,
    newWeek: weekNumber,
    newDay: 'Monday', // Doesn't matter — frontend checks roadmapComplete flag
    roadmapComplete: true
  };
};
```

#### Step 2 — Rewrite advanceProgress in progress.controller.js

Replace the entire advanceProgress export with:

```js
export const advanceProgress = async (req, res) => {
  try {
    const { roadmapId, dayId, status } = req.body;
    const userId = req.userId;

    if (!roadmapId || !dayId || !status) {
      return res.status(400).json({ error: "roadmapId, dayId, and status are required" });
    }

    const progress = await Progress.findOne({ userId, roadmapId });
    if (!progress) {
      return res.status(404).json({ error: "Progress record not found" });
    }

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId }).lean();
    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    // Parse dayId to get numeric positions
    const { moduleNumber, weekNumber, dayNumber } = parseDayId(dayId);

    // Determine day type from roadmap structure
    const dayData = getDayFromRoadmap(roadmap.roadmapJson, moduleNumber, weekNumber, dayNumber);
    const dayType = dayData?.type || 'Learning';

    // Push to completedDays — only push if not already there
    const alreadyCompleted = progress.completedDays.some(d => d.dayId === dayId);
    if (!alreadyCompleted) {
      progress.completedDays.push({
        dayId,
        type: dayType,
        status,
        completedAt: new Date()
      });
    }

    // Use shared utility — single source of truth for day arithmetic
    const { newModule, newWeek, newDay, roadmapComplete } = calculateNextPosition(
      moduleNumber,
      weekNumber,
      dayNumber,
      roadmap.roadmapJson
    );

    if (!roadmapComplete) {
      progress.currentModule = newModule;
      progress.currentWeek = newWeek;
      progress.currentDay = newDay;
    }

    await progress.save();

    return res.status(200).json({
      success: true,
      newDay,
      newWeek,
      newModule,
      roadmapComplete: roadmapComplete || false
    });

  } catch (error) {
    console.error("advanceProgress error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
```

### Test Checklist B5

Run these four POST /progress/advance calls in order and verify each response:

- [ ] dayId: m1-w1-d1, status: completed → newDay: Tuesday, newWeek: 1, newModule: 1
- [ ] dayId: m1-w1-d6, status: completed → newDay: Sunday, newWeek: 1, newModule: 1
- [ ] dayId: m1-w1-d7, status: completed → newDay: Monday, newWeek: 2, newModule: 1
- [ ] dayId: m1-w2-d7, status: completed → newDay: Monday, newWeek: 1, newModule: 2
- [ ] GET /roadmap/active after each advance — progress.currentDay matches expected
- [ ] Calling advance with same dayId twice — completedDays does NOT have duplicates
- [ ] roadmapComplete: true when advancing past the last module's last week's Sunday

---

## BACKEND FINAL INTEGRATION TEST (Run After All 5 Milestones)

Clean state: create a fresh test user. Run this full sequence:

```
1.  POST /auth/signup                       → 201, token + user
2.  POST /auth/login                        → 200, token + hasRoadmap: false
3.  GET  /auth/me                           → 200, user + hasRoadmap: false
4.  POST /roadmap/generate (simple skill)   → 201, roadmapId + roadmapJson (no truncation)
5.  GET  /roadmap/active                    → 200, roadmapId + progress + stats: null
6.  GET  /session/m1-w1-d1?roadmapId=X     → 200, 3 parts, clean structure, ~10s first call
7.  GET  /session/m1-w1-d1?roadmapId=X     → 200, same _id, instant (cached)
8.  POST /session/m1-w1-d1/submit (text)   → 200, feedback + outcome
9.  POST /progress/advance (m1-w1-d1)      → 200, newDay: Tuesday
10. GET  /roadmap/active                    → 200, progress.currentDay: Tuesday
11. GET  /session/m1-w1-d6?roadmapId=X     → 200, EXACTLY 1 part, 3 cards
12. GET  /session/m1-w1-d7?roadmapId=X     → 200, examQuestions array, no parts
13. POST /session/m1-w1-d7/exam (all correct) → 200, score: 100, passed: true
14. POST /progress/advance (m1-w1-d7)      → 200, newDay: Monday, newWeek: 2
15. POST /session/m1-w1-d7/exam (all wrong)  → 200, score: 0, passed: false, weakTopics: [5 items]
16. GET  /progress/stats?roadmapId=X        → 200, all 12 fields populated, no nulls
```

Final checklist:
- [ ] All 16 requests return expected status codes
- [ ] No malformed sessions in MongoDB
- [ ] Stats latestExamScore and latestExamPassed have real values
- [ ] weeklyWeakTopics in progress document has correct structure
- [ ] No console errors of any kind
- [ ] mongodb sessions collection: every saved session has parts with cards

---

## PART B — FRONTEND REWRITE (4 Sessions)

### Pre-Requisite Backend Fix (Do This Before Starting Frontend)

There is a bug in session.controller.js getSession that passes wrong field
names to generateLessonContent. Fix this before starting the frontend:

In getSession, find the Learning branch:
```js
// WRONG (these fields don't exist in roadmapJson):
moduleTitle: mod.moduleTitle,
weekTitle: week.weekTitle,

// CORRECT (real field names in your roadmapJson schema):
moduleTitle: mod.title,
weekTitle: week.title,
```

Make this fix and confirm GET /session/m1-w1-d2 still works before proceeding.

---

## MILESTONE F1 — API Layer + Context Rewrite
**Goal:** All API calls hit real backend. AuthContext and AppContext restore from server, not localStorage.
**Time estimate:** 3-4 hours (Antigravity Session 1)

### Files to Modify
```
MODIFY: src/api/auth.api.js
MODIFY: src/api/roadmap.api.js
MODIFY: src/api/session.api.js       (was feedback.api.js or combined — unify)
MODIFY: src/api/progress.api.js
MODIFY: src/context/AuthContext.jsx
MODIFY: src/context/AppContext.jsx
MODIFY: .env (or .env.local)
```

### Environment Setup

Create/update client/.env:
```
VITE_API_URL=http://localhost:5000/api
```

Ensure axios base instance (already in src/api/index.js or similar) reads:
```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### auth.api.js — Complete Replacement

```js
import api from './index.js';

/**
 * Creates a new user account.
 * POST /auth/signup
 * @returns { token, user: { _id, name, firstName, email } }
 */
export const signupUser = async (name, email, password) => {
  const res = await api.post('/auth/signup', { name, email, password });
  return res.data;
};

/**
 * Authenticates existing user.
 * POST /auth/login
 * @returns { token, user: { _id, name, firstName, email }, hasRoadmap: boolean }
 */
export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

/**
 * Validates current token and returns user state.
 * GET /auth/me
 * @returns { user: { _id, name, firstName, email }, hasRoadmap: boolean }
 */
export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};
```

### roadmap.api.js — Complete Replacement

```js
import api from './index.js';

/**
 * Sends setup form data to AI to generate a personalised roadmap.
 * POST /roadmap/generate
 * @param {object} setupData - { skillInput, motivation, dailyTime, role, currentLevel, learningStyle, goalClarity }
 * @returns { roadmapId: string, roadmapJson: object }
 */
export const generateRoadmap = async (setupData) => {
  const res = await api.post('/roadmap/generate', setupData);
  return res.data;
};

/**
 * Fetches the most recent roadmap and its current progress for the logged-in user.
 * GET /roadmap/active
 * @returns { roadmapId: string|null, roadmapJson: object|null, progress: object|null, stats: null }
 */
export const getActiveRoadmap = async () => {
  const res = await api.get('/roadmap/active');
  return res.data;
};
```

### session.api.js — Complete New File

```js
import api from './index.js';

/**
 * Fetches or generates session content for a given day.
 * GET /session/:dayId?roadmapId=X
 * First call: ~10 seconds (AI generation). Subsequent calls: instant (cached).
 * @returns { session: { _id, dayId, type, content, status, ... } }
 */
export const getSession = async (dayId, roadmapId) => {
  const res = await api.get(`/session/${dayId}`, {
    params: { roadmapId }
  });
  return res.data;
};

/**
 * Submits a task answer and receives AI feedback.
 * POST /session/:dayId/submit
 * 
 * For text tasks: pass taskType="text", taskAnswer="string", mcqAnswers=null
 * For mcq tasks: pass taskType="mcq", taskAnswer=null, mcqAnswers=[{questionIndex, selectedIndex}]
 * 
 * @returns { feedback: string, outcome: "positive"|"needs_improvement", score?: number, passed?: boolean }
 */
export const submitTask = async (dayId, { roadmapId, type, taskAnswer, mcqAnswers }) => {
  const body = { roadmapId, type, taskAnswer, mcqAnswers };
  const res = await api.post(`/session/${dayId}/submit`, body);
  return res.data;
};

/**
 * Submits exam answers and receives scored result.
 * POST /session/:dayId/exam
 * 
 * answers format: [{ questionIndex: 0, selectedIndex: 2 }, ...]
 * 
 * @returns { score: number, passed: boolean, feedback: string, weakTopics: string[], nextAction: "advance"|"revision" }
 */
export const submitExam = async (dayId, { roadmapId, answers }) => {
  const res = await api.post(`/session/${dayId}/exam`, { roadmapId, answers });
  return res.data;
};
```

### progress.api.js — Complete Replacement

```js
import api from './index.js';

/**
 * Advances learner to next day after completing current session.
 * POST /progress/advance
 * Call this after: task submission feedback shown, exam pass, revision completion.
 * Do NOT call after exam fail — backend sets Saturday automatically.
 * 
 * @returns { success: boolean, newDay: string, newWeek: number, newModule: number, roadmapComplete: boolean }
 */
export const advanceProgress = async (roadmapId, dayId, status = 'completed') => {
  const res = await api.post('/progress/advance', { roadmapId, dayId, status });
  return res.data;
};

/**
 * Fetches all calculated progress stats for the Progress page.
 * GET /progress/stats?roadmapId=X
 * Never calculate stats in the frontend — always use this endpoint.
 * 
 * @returns {
 *   completedSessions, modulesCompleted, latestResult, revisionTopicsCount,
 *   lessonsCompleted, revisionSessions, examsAttempted, examsPassed,
 *   lastCompletedTitle, lastSessionOutcome, latestExamScore, latestExamPassed,
 *   revisionQueue
 * }
 */
export const getStats = async (roadmapId) => {
  const res = await api.get('/progress/stats', { params: { roadmapId } });
  return res.data;
};
```

### AuthContext.jsx — Rewrite Data Flow

The existing file has mock auth. Replace only the data flow logic, preserving
the JSX structure and context shape:

```jsx
// Token helpers — keep using existing tokenHelpers.js if it exists
const TOKEN_KEY = 'sm_token';
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Inside AuthProvider:
const [user, setUser] = useState(null);
const [hasRoadmap, setHasRoadmap] = useState(false);
const [loading, setLoading] = useState(true);

// On mount: validate token via server
useEffect(() => {
  const token = getToken();
  if (!token) {
    setLoading(false);
    return;
  }
  getMe()
    .then((data) => {
      setUser(data.user);
      setHasRoadmap(data.hasRoadmap);
    })
    .catch(() => {
      // Token invalid or expired — clear it
      clearToken();
      setUser(null);
      setHasRoadmap(false);
    })
    .finally(() => setLoading(false));
}, []);

// Login handler
const login = async (email, password) => {
  const data = await loginUser(email, password);
  setToken(data.token);
  setUser(data.user);
  setHasRoadmap(data.hasRoadmap);
  return data; // return so AuthPage can navigate based on hasRoadmap
};

// Signup handler
const signup = async (name, email, password) => {
  const data = await signupUser(name, email, password);
  setToken(data.token);
  setUser(data.user);
  setHasRoadmap(false); // New users never have a roadmap yet
  return data;
};

// Logout handler
const logout = () => {
  clearToken();
  setUser(null);
  setHasRoadmap(false);
};
```

### AppContext.jsx — Rewrite Data Flow

```jsx
// Inside AppProvider:
const [roadmapId, setRoadmapId] = useState(null);
const [roadmapJson, setRoadmapJson] = useState(null);
const [progress, setProgress] = useState(null);

// Load from server when user becomes available
useEffect(() => {
  if (!user) {
    // User logged out — clear app state
    setRoadmapId(null);
    setRoadmapJson(null);
    setProgress(null);
    return;
  }
  
  getActiveRoadmap()
    .then((data) => {
      if (data.roadmapId) {
        setRoadmapId(data.roadmapId);
        setRoadmapJson(data.roadmapJson);
        setProgress(data.progress);
      }
    })
    .catch((err) => {
      console.error('Failed to load active roadmap:', err);
    });
}, [user]);

// refreshProgress — call this after every advance to sync state
const refreshProgress = async () => {
  if (!roadmapId) return;
  try {
    const data = await getActiveRoadmap();
    if (data.progress) setProgress(data.progress);
  } catch (err) {
    console.error('refreshProgress failed:', err);
  }
};

// setRoadmapData — called by SetupPage after successful roadmap generation
const setRoadmapData = (id, json, prog) => {
  setRoadmapId(id);
  setRoadmapJson(json);
  setProgress(prog);
};
```

### Test Checklist F1

- [ ] Signup from UI → MongoDB has new user document, token in localStorage
- [ ] Login with correct credentials → redirected to /learn (has roadmap) or /setup (no roadmap)
- [ ] Login with wrong password → error message shown, no navigation
- [ ] Refresh browser on /learn while logged in → stays on /learn, user state restored
- [ ] Refresh browser on /learn while NOT logged in → redirected to /auth
- [ ] Logout → token cleared, redirected to /auth, AppContext state cleared
- [ ] Network tab: every protected API call has Authorization: Bearer header
- [ ] No localStorage keys other than sm_token and sm-theme

---

## MILESTONE F2 — Setup Page + Learn Page + Progress Page Data Wiring
**Goal:** These three pages consume real server data with no hardcoded values and no undefined errors.
**Time estimate:** 3-4 hours (Antigravity Session 2)

### Files to Modify
```
MODIFY: src/pages/SetupPage/SetupPage.jsx
MODIFY: src/pages/LearnPage/LearnPage.jsx
MODIFY: src/pages/ProgressPage/ProgressPage.jsx
MODIFY: src/pages/RoadmapPage/RoadmapPage.jsx
```

### SetupPage.jsx Changes

#### Add goalClarity field to form state
```js
const [form, setForm] = useState({
  skillInput: '',
  motivation: '',
  dailyTime: '',
  learningStyle: '',
  goalClarity: '',   // ADD THIS — was missing
  role: '',
  currentLevel: '',
});
```

#### Add goalClarity pill group to the JSX

After the learningStyle section, add:
```jsx
{/* Goal Clarity */}
<div className="mt-6">
  <p className="text-[10px] font-bold uppercase tracking-[0.12em]
                text-accent-dk dark:text-accent mb-2">
    HOW CLEAR IS YOUR GOAL?
  </p>
  <div className="flex flex-wrap gap-2.5 mt-2">
    {["Clear", "General", "Exploring"].map(option => (
      <PillOption
        key={option}
        label={option}
        selected={form.goalClarity === option}
        onClick={() => setForm(f => ({ ...f, goalClarity: option }))}
      />
    ))}
  </div>
  {errors.goalClarity && (
    <p className="text-xs text-fail mt-1">{errors.goalClarity}</p>
  )}
</div>
```

#### Update validation to include goalClarity
```js
const validate = () => {
  const errs = {};
  if (!form.skillInput.trim()) errs.skillInput = 'Please enter a skill to learn';
  if (!form.role) errs.role = 'Please select your role';
  if (!form.currentLevel) errs.currentLevel = 'Please select your level';
  if (!form.dailyTime) errs.dailyTime = 'Please select your daily time';
  if (!form.learningStyle) errs.learningStyle = 'Please select your learning style';
  if (!form.goalClarity) errs.goalClarity = 'Please select your goal clarity';
  return errs;
};
```

#### Update handleSubmit to include goalClarity and set AppContext
```js
const handleSubmit = async () => {
  const errs = validate();
  if (Object.keys(errs).length > 0) { setErrors(errs); return; }
  
  setIsGenerating(true);
  try {
    const data = await generateRoadmap({
      skillInput: form.skillInput,
      motivation: form.motivation || '',
      dailyTime: form.dailyTime,
      role: form.role,
      currentLevel: form.currentLevel,
      learningStyle: form.learningStyle,
      goalClarity: form.goalClarity,
    });
    
    // Update AppContext with fresh roadmap data
    // Backend returns { roadmapId, roadmapJson }
    // Progress is created server-side — fetch it via getActiveRoadmap
    const active = await getActiveRoadmap();
    setRoadmapData(active.roadmapId, active.roadmapJson, active.progress);
    
    navigate('/roadmap');
  } catch (err) {
    setErrors({ general: 'Failed to generate roadmap. Please try again.' });
  } finally {
    setIsGenerating(false);
  }
};
```

### LearnPage.jsx — getCurrentSession utility

Add this utility inside or above the LearnPage component:

```js
/**
 * Derives the current session info from progress and roadmapJson.
 * Returns null if progress is missing or position is invalid.
 * Uses real field names: mod.title (not mod.moduleTitle), week.title (not week.weekTitle).
 */
const getCurrentSession = (roadmapJson, progress) => {
  if (!roadmapJson || !progress) return null;

  const DAY_MAP = {
    Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7
  };

  const dayNumber = DAY_MAP[progress.currentDay];
  if (!dayNumber) return null;

  const mod = roadmapJson.modules?.find(m => m.moduleNumber === progress.currentModule);
  if (!mod) return null;

  const week = mod.weeks?.find(w => w.weekNumber === progress.currentWeek);
  if (!week) return null;

  const day = week.days?.find(d => d.dayNumber === dayNumber);
  if (!day) return null;

  return {
    dayId: `m${progress.currentModule}-w${progress.currentWeek}-d${dayNumber}`,
    title: day.title,
    type: day.type,           // "Learning" | "Revision" | "Exam"
    dayName: day.dayName,
    dayNumber,
    moduleNumber: progress.currentModule,
    weekNumber: progress.currentWeek,
    moduleTitle: mod.title,   // real field name in backend schema
    weekTitle: week.title,    // real field name in backend schema
  };
};
```

Update stat cards to read from progress:
```jsx
const currentSession = getCurrentSession(roadmapJson, progress);

// Stat cards
<StatCard label="CURRENT MODULE" value={progress ? `Module ${progress.currentModule}` : '—'} />
<StatCard label="CURRENT WEEK"   value={progress ? `Week ${progress.currentWeek}` : '—'} />
<StatCard label="CURRENT DAY"    value={progress?.currentDay ?? '—'} />
<StatCard label="REVISION QUEUE" value={`${progress?.allWeakTopics?.length ?? 0} Topics`} />
```

Update session card to use currentSession:
```jsx
{currentSession ? (
  <div className="...session card classes...">
    <Badge variant={currentSession.type.toLowerCase()}>{currentSession.type}</Badge>
    <h2>{currentSession.title}</h2>
    <p>Day {currentSession.dayNumber} — {currentSession.dayName}</p>
    <Button onClick={() => navigate(`/session/${currentSession.dayId}`)}>
      Continue Session
    </Button>
  </div>
) : roadmapJson ? (
  // Roadmap exists but getCurrentSession returned null → roadmap might be complete
  <div className="...empty state...">
    <p>All sessions complete — great work!</p>
  </div>
) : (
  // No roadmap at all
  <div className="...empty state...">
    <p>No roadmap yet.</p>
    <Button onClick={() => navigate('/setup')}>Create Roadmap</Button>
  </div>
)}
```

Revision queue from progress.allWeakTopics:
```jsx
{(progress?.allWeakTopics || []).length === 0 ? (
  <p className="px-5 py-4 text-sm text-gray-400 dark:text-muted">
    No revision topics yet
  </p>
) : (
  progress.allWeakTopics.map((topic, i) => (
    <div key={i} className="...row classes...">
      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-divider" />
      <span className="text-sm font-medium text-gray-700 dark:text-slate">{topic}</span>
    </div>
  ))
)}
```

### ProgressPage.jsx — All Stats From Server

```jsx
const { roadmapId } = useApp(); // from AppContext
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!roadmapId) { setLoading(false); return; }
  getStats(roadmapId)
    .then(setStats)
    .catch(err => console.error('Failed to load stats:', err))
    .finally(() => setLoading(false));
}, [roadmapId]);

// Stat cards — never derive, always use server values
<StatCard label="COMPLETED SESSIONS" value={stats?.completedSessions ?? '—'} />
<StatCard label="MODULES COMPLETED"  value={stats?.modulesCompleted ?? '—'} />
<StatCard label="LATEST RESULT"      value={stats?.latestResult ?? 'None yet'} />
<StatCard label="REVISION TOPICS"    value={stats?.revisionTopicsCount ?? 0} />

// Learning Summary rows
const summaryRows = [
  { label: 'Lessons Completed',    value: stats?.lessonsCompleted ?? 0 },
  { label: 'Revision Sessions',    value: stats?.revisionSessions ?? 0 },
  { label: 'Exams Attempted',      value: stats?.examsAttempted ?? 0 },
  { label: 'Exams Passed',         value: stats?.examsPassed ?? 0 },
];

// Recent Outcomes
const latestExamDisplay = stats?.latestExamScore !== null && stats?.latestExamScore !== undefined
  ? `${stats.latestExamScore}% — ${stats.latestExamPassed ? 'Passed' : 'Needs Revision'}`
  : 'No exam yet';

// Revision queue
{(stats?.revisionQueue || []).map((topic, i) => (
  <div key={i} className="...">
    <div className="w-1.5 h-1.5 rounded-full bg-warn" />
    <span>{topic}</span>
  </div>
))}
```

### RoadmapPage.jsx — Remove Hardcoded Module Count

Find any reference to `4` as a hardcoded module count. Replace with:
```jsx
const totalModules = roadmapJson?.modules?.length ?? 0;
```

Use `mod.title` not `mod.moduleTitle`. Use `week.title` not `week.weekTitle`.

### Test Checklist F2

- [ ] SetupPage submits all 7 fields including goalClarity to backend
- [ ] SetupPage validation: empty goalClarity shows error, blocks submit
- [ ] After generate: navigated to /roadmap with real roadmap data visible
- [ ] LearnPage: stat cards show real Module/Week/Day from server progress
- [ ] LearnPage: session card title matches actual day title in roadmapJson
- [ ] LearnPage: revision queue renders real allWeakTopics from progress
- [ ] LearnPage: "Continue Session" generates correct dayId (m1-w1-d2 after Monday complete)
- [ ] LearnPage: no roadmap → shows Create Roadmap button
- [ ] ProgressPage: all 12 stats show real values from /progress/stats endpoint
- [ ] ProgressPage: no [object Object], no undefined, no NaN anywhere
- [ ] RoadmapPage: module count matches actual roadmapJson.modules.length (not hardcoded 4)
- [ ] RoadmapPage: module and week titles use .title field (not .moduleTitle)

---

## MILESTONE F3 — Session Page Complete Rebuild
**Goal:** SessionPage handles all 4 phases (Lesson, Task, Feedback, Exam) against real backend data shapes.
**Time estimate:** 6-8 hours (Antigravity Session 3 — longest session)

### Files to Create / Modify
```
MODIFY: src/pages/SessionPage/SessionPage.jsx
MODIFY: src/pages/SessionPage/phases/LessonPhase.jsx      (full rewrite)
CREATE: src/pages/SessionPage/phases/PartCard.jsx          (new)
MODIFY: src/pages/SessionPage/phases/MiniExercise.jsx      (data shape fix)
MODIFY: src/pages/SessionPage/phases/TaskPhase.jsx         (data shape fix)
MODIFY: src/pages/SessionPage/phases/FeedbackPhase.jsx     (add advance call)
MODIFY: src/pages/SessionPage/phases/ExamPhase.jsx         (answer format fix)
MODIFY: src/pages/SessionPage/ExamResult.jsx               (navigation fix)
```

### SessionPage.jsx — Orchestrator

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getSession } from '../../api/session.api';
import LessonPhase from './phases/LessonPhase';
import TaskPhase from './phases/TaskPhase';
import FeedbackPhase from './phases/FeedbackPhase';
import ExamPhase from './phases/ExamPhase';
import ExamResult from './ExamResult';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PHASES = {
  LOADING: 'loading',
  LESSON: 'lesson',
  TASK: 'task',
  FEEDBACK: 'feedback',
  EXAM: 'exam',
  RESULT: 'result',
  ERROR: 'error',
};

export default function SessionPage() {
  const { dayId } = useParams();
  const navigate = useNavigate();
  const { roadmapId } = useApp();

  const [phase, setPhase] = useState(PHASES.LOADING);
  const [session, setSession] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);   // { feedback, outcome, score }
  const [examResult, setExamResult] = useState(null);       // { score, passed, weakTopics, feedback }
  const [error, setError] = useState(null);

  // Load session on mount
  useEffect(() => {
    if (!dayId || !roadmapId) return;
    setPhase(PHASES.LOADING);

    getSession(dayId, roadmapId)
      .then((data) => {
        setSession(data.session);
        // Determine starting phase from session type
        if (data.session.type === 'Exam') {
          setPhase(PHASES.EXAM);
        } else {
          setPhase(PHASES.LESSON);
        }
      })
      .catch((err) => {
        console.error('Failed to load session:', err);
        setError('Failed to load session. Please try again.');
        setPhase(PHASES.ERROR);
      });
  }, [dayId, roadmapId]);

  // Phase transition handlers — passed as props to child phases
  const handleLessonComplete = () => setPhase(PHASES.TASK);

  const handleTaskComplete = (feedbackPayload) => {
    // feedbackPayload: { feedback, outcome, score?, passed? }
    setFeedbackData(feedbackPayload);
    setPhase(PHASES.FEEDBACK);
  };

  const handleExamComplete = (resultPayload) => {
    // resultPayload: { score, passed, feedback, weakTopics, nextAction }
    setExamResult(resultPayload);
    setPhase(PHASES.RESULT);
  };

  // Session header — minimal, shown during all phases
  const phaseLabels = {
    [PHASES.LESSON]: 'LESSON',
    [PHASES.TASK]: 'TASK',
    [PHASES.FEEDBACK]: 'FEEDBACK',
    [PHASES.EXAM]: 'EXAM',
    [PHASES.RESULT]: 'RESULT',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy font-sans">
      {/* Minimal session header */}
      {session && phase !== PHASES.LOADING && phase !== PHASES.ERROR && (
        <div className="sticky top-0 md:top-14 z-40
                        bg-white dark:bg-navy-mid
                        border-b border-gray-200 dark:border-navy-light
                        px-5 py-3">
          <div className="max-w-[760px] mx-auto flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]
                          text-accent-dk dark:text-accent">
              {phaseLabels[phase] || ''}
            </p>
            <p className="text-sm font-medium text-gray-700 dark:text-slate hidden md:block">
              {session.title || session.content?.parts?.[0]?.partTitle || 'Session'}
            </p>
            <Badge variant={session.type?.toLowerCase()}>{session.type}</Badge>
          </div>
        </div>
      )}

      {/* Phase content */}
      <div className="max-w-[760px] mx-auto px-5 py-8">
        {phase === PHASES.LOADING && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-400 dark:text-muted">
              Preparing your session...
            </p>
          </div>
        )}

        {phase === PHASES.ERROR && (
          <div className="text-center py-24">
            <p className="text-sm text-fail mb-4">{error}</p>
            <Button variant="primary" onClick={() => navigate('/learn')}>
              Back to Dashboard
            </Button>
          </div>
        )}

        {phase === PHASES.LESSON && session && (
          <LessonPhase
            parts={session.content.parts}
            onComplete={handleLessonComplete}
          />
        )}

        {phase === PHASES.TASK && session && (
          <TaskPhase
            task={session.content.task}
            dayId={dayId}
            roadmapId={roadmapId}
            onComplete={handleTaskComplete}
          />
        )}

        {phase === PHASES.FEEDBACK && feedbackData && (
          <FeedbackPhase
            feedback={feedbackData.feedback}
            outcome={feedbackData.outcome}
            dayId={dayId}
            roadmapId={roadmapId}
          />
        )}

        {phase === PHASES.EXAM && session && (
          <ExamPhase
            questions={session.content.examQuestions}
            dayId={dayId}
            roadmapId={roadmapId}
            onComplete={handleExamComplete}
          />
        )}

        {phase === PHASES.RESULT && examResult && (
          <ExamResult
            result={examResult}
            dayId={dayId}
            roadmapId={roadmapId}
          />
        )}
      </div>
    </div>
  );
}
```

### LessonPhase.jsx — Full Rewrite

Real data shape received:
```js
parts = [
  {
    partNumber: 1,
    partTitle: "string",
    cards: [
      { cardNumber: 1, content: "100-200 word string" },
      { cardNumber: 2, content: "100-200 word string" }
    ],
    miniExercise: {
      question: "string",
      options: ["A", "B", "C", "D"],
      correctIndex: 0,
      explanation: "string"
    }
  },
  // ...2 more parts
]
```

State machine:
```jsx
export default function LessonPhase({ parts, onComplete }) {
  const [partIndex, setPartIndex] = useState(0);    // which part (0, 1, 2)
  const [cardIndex, setCardIndex] = useState(0);    // which card within part
  const [showMini, setShowMini] = useState(false);  // show mini exercise after last card
  const [miniDone, setMiniDone] = useState(false);  // mini exercise answered

  const activePart = parts[partIndex];
  const activeCard = activePart.cards[cardIndex];
  const isLastCard = cardIndex === activePart.cards.length - 1;
  const isLastPart = partIndex === parts.length - 1;

  // Progress calculation
  const totalCards = parts.reduce((sum, p) => sum + p.cards.length, 0);
  const completedCards = parts
    .slice(0, partIndex)
    .reduce((sum, p) => sum + p.cards.length, 0) + cardIndex;
  const overallProgress = Math.round((completedCards / totalCards) * 100);

  const handleNextCard = () => {
    if (!isLastCard) {
      setCardIndex(c => c + 1);
    } else {
      // Last card of this part — show mini exercise
      setShowMini(true);
    }
  };

  const handleMiniComplete = () => {
    setMiniDone(true);
    // Wait for user to click "Next Part" or "Proceed to Task"
  };

  const handleAdvance = () => {
    if (!isLastPart) {
      // Move to next part
      setPartIndex(p => p + 1);
      setCardIndex(0);
      setShowMini(false);
      setMiniDone(false);
    } else {
      // All 3 parts done — go to task
      onComplete();
    }
  };

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-medium
                        text-gray-400 dark:text-muted mb-2">
          <span>Part {partIndex + 1} of {parts.length}</span>
          <span>{overallProgress}% complete</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-divider rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-dk dark:bg-accent rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {!showMini ? (
        /* Card display */
        <div className="bg-white dark:bg-navy-mid
                        border border-gray-200 dark:border-navy-light
                        rounded-xl p-8 md:p-10 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]
                        text-accent-dk dark:text-accent mb-4">
            {activePart.partTitle}
          </p>
          <p className="text-[15px] text-gray-600 dark:text-slate leading-[1.75]">
            {activeCard.content}
          </p>
          <div className="flex justify-between mt-8">
            {cardIndex > 0 && (
              <Button variant="secondary" onClick={() => setCardIndex(c => c - 1)}>
                ← Previous
              </Button>
            )}
            <div className="ml-auto">
              <Button variant="primary" onClick={handleNextCard}>
                {isLastCard ? 'Continue to Exercise →' : 'Next Card →'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Mini Exercise */
        <MiniExercise
          exercise={activePart.miniExercise}
          onComplete={handleMiniComplete}
          onAdvance={handleAdvance}
          isLastPart={isLastPart}
          miniDone={miniDone}
        />
      )}
    </div>
  );
}
```

### MiniExercise.jsx — Data Shape Fix

The miniExercise from real backend has: question, options[], correctIndex, explanation.
Ensure the component reads exactly these field names:

```jsx
export default function MiniExercise({ exercise, onComplete, onAdvance, isLastPart, miniDone }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  const handleCheck = () => {
    setAnswered(true);
    onComplete(); // notify parent that mini is answered
  };

  return (
    <div className="bg-white dark:bg-navy-mid
                    border border-gray-200 dark:border-navy-light
                    rounded-xl p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-accent-dk dark:bg-accent" />
        <p className="text-xs font-bold uppercase tracking-[0.1em]
                      text-accent-dk dark:text-accent">
          Mini Exercise
        </p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 leading-snug">
        {exercise.question}
      </h3>

      <div className="flex flex-col gap-3">
        {exercise.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !answered && setSelected(i)}
            disabled={answered}
            className={`flex items-center gap-4 h-14 px-5 rounded-[10px]
                        border-[1.5px] text-sm font-medium text-left transition-all
              ${answered && i === exercise.correctIndex
                ? 'bg-pass/10 border-pass text-pass'
                : answered && i === selected && i !== exercise.correctIndex
                ? 'bg-fail/10 border-fail text-fail'
                : selected === i && !answered
                ? 'bg-sky-50 dark:bg-accent/10 border-accent-dk dark:border-accent text-gray-900 dark:text-white'
                : 'bg-white dark:bg-navy border-gray-200 dark:border-divider text-gray-700 dark:text-slate'
              }`}>
            <div className={`w-5 h-5 rounded-full border-[1.5px] flex-shrink-0
                             flex items-center justify-center
              ${selected === i
                ? 'border-accent-dk dark:border-accent'
                : 'border-gray-300 dark:border-divider'
              }`}>
              {selected === i && (
                <div className="w-2.5 h-2.5 rounded-full bg-accent-dk dark:bg-accent" />
              )}
            </div>
            {opt}
          </button>
        ))}
      </div>

      {answered && (
        <div className="mt-5 p-4 rounded-lg bg-gray-50 dark:bg-navy
                        border border-gray-200 dark:border-divider">
          <p className="text-sm text-gray-600 dark:text-slate leading-relaxed">
            {exercise.explanation}
          </p>
        </div>
      )}

      <div className="mt-6">
        {!answered ? (
          <Button
            variant="primary"
            disabled={selected === null}
            onClick={handleCheck}>
            Check Answer
          </Button>
        ) : (
          <Button variant="primary" onClick={onAdvance}>
            {isLastPart ? 'Proceed to Task →' : 'Next Part →'}
          </Button>
        )}
      </div>
    </div>
  );
}
```

### TaskPhase.jsx — Backend Integration

```jsx
import { useState } from 'react';
import { submitTask } from '../../../api/session.api';

export default function TaskPhase({ task, dayId, roadmapId, onComplete }) {
  const [textAnswer, setTextAnswer] = useState('');
  const [mcqAnswers, setMcqAnswers] = useState({});   // { questionIndex: selectedIndex }
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Text task submit
  const handleTextSubmit = async () => {
    if (textAnswer.trim().length < 20) {
      setError('Answer must be at least 20 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await submitTask(dayId, {
        roadmapId,
        type: 'text',
        taskAnswer: textAnswer,
        mcqAnswers: null,
      });
      onComplete({ feedback: result.feedback, outcome: result.outcome });
    } catch (err) {
      setError('Failed to submit task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // MCQ task submit — called after all questions answered
  const handleMcqSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Convert { questionIndex: selectedIndex } to array format
      const answersArray = task.questions.map((_, idx) => ({
        questionIndex: idx,
        selectedIndex: mcqAnswers[idx] ?? -1,
      }));
      const result = await submitTask(dayId, {
        roadmapId,
        type: 'mcq',
        taskAnswer: null,
        mcqAnswers: answersArray,
      });
      onComplete({
        feedback: result.feedback,
        outcome: result.outcome,
        score: result.score,
        passed: result.passed,
      });
    } catch (err) {
      setError('Failed to submit task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (task.type === 'text') {
    return (
      <div className="bg-white dark:bg-navy-mid
                      border border-gray-200 dark:border-navy-light
                      rounded-xl p-8 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em]
                      text-accent-dk dark:text-accent mb-3">TASK</p>
        <p className="text-[15px] text-gray-700 dark:text-slate leading-[1.65] mb-6">
          {task.description}
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
            placeholder="Write your answer here. Minimum 20 characters."
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
          />
          <div className="flex justify-between items-center mt-2 mb-6">
            <span />
            <span className={`text-xs ${textAnswer.length < 20
              ? 'text-fail'
              : 'text-gray-400 dark:text-muted'}`}>
              {textAnswer.length} / 1000
            </span>
          </div>
          {error && <p className="text-xs text-fail mb-4">{error}</p>}
          <Button
            variant="primary"
            loading={loading}
            disabled={textAnswer.trim().length < 20}
            onClick={handleTextSubmit}>
            {loading ? 'Getting Feedback...' : 'Submit Task'}
          </Button>
        </div>
      </div>
    );
  }

  // MCQ task — questions one at a time
  if (task.type === 'mcq') {
    const question = task.questions[currentQ];
    const allAnswered = Object.keys(mcqAnswers).length === task.questions.length;

    return (
      <div className="bg-white dark:bg-navy-mid
                      border border-gray-200 dark:border-navy-light
                      rounded-xl p-8 shadow-sm">
        <div className="flex justify-between text-xs text-gray-400 dark:text-muted mb-6">
          <span>Question {currentQ + 1} of {task.questions.length}</span>
          <span>{Object.keys(mcqAnswers).length} answered</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {question.question}
        </h3>

        <div className="flex flex-col gap-3 mb-8">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setMcqAnswers(prev => ({ ...prev, [currentQ]: i }))}
              className={`flex items-center gap-4 h-14 px-5 rounded-[10px]
                          border-[1.5px] text-sm font-medium text-left transition-all
                ${mcqAnswers[currentQ] === i
                  ? 'bg-sky-50 dark:bg-accent/10 border-accent-dk dark:border-accent text-gray-900 dark:text-white'
                  : 'bg-white dark:bg-navy border-gray-200 dark:border-divider text-gray-700 dark:text-slate'
                }`}>
              {opt}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          {currentQ > 0 && (
            <Button variant="secondary" onClick={() => setCurrentQ(q => q - 1)}>
              ← Previous
            </Button>
          )}
          {currentQ < task.questions.length - 1 ? (
            <Button
              variant="primary"
              disabled={mcqAnswers[currentQ] === undefined}
              onClick={() => setCurrentQ(q => q + 1)}>
              Next Question →
            </Button>
          ) : (
            <Button
              variant="primary"
              loading={loading}
              disabled={!allAnswered}
              onClick={handleMcqSubmit}>
              {loading ? 'Submitting...' : 'Submit All Answers'}
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-fail mt-4">{error}</p>}
      </div>
    );
  }

  return null;
}
```

### FeedbackPhase.jsx — Add Progress Advance

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { advanceProgress } from '../../../api/progress.api';
import { useApp } from '../../../context/AppContext';

export default function FeedbackPhase({ feedback, outcome, dayId, roadmapId }) {
  const navigate = useNavigate();
  const { refreshProgress } = useApp();
  const [advancing, setAdvancing] = useState(false);

  const handleContinue = async () => {
    setAdvancing(true);
    try {
      await advanceProgress(roadmapId, dayId, 'completed');
      await refreshProgress(); // update AppContext with new currentDay
    } catch (err) {
      console.error('Failed to advance progress:', err);
      // Non-fatal — still navigate
    } finally {
      navigate('/learn');
    }
  };

  const isPositive = outcome === 'positive';

  return (
    <div className="bg-white dark:bg-navy-mid
                    border border-gray-200 dark:border-navy-light
                    rounded-xl p-8 shadow-sm">
      {/* Outcome indicator */}
      <div className={`flex items-center gap-3 p-4 rounded-[10px] mb-6 border
        ${isPositive
          ? 'bg-pass/10 border-pass/30'
          : 'bg-warn/10 border-warn/30'
        }`}>
        <p className={`text-sm font-semibold ${isPositive ? 'text-pass' : 'text-warn'}`}>
          {isPositive
            ? 'Good work — your answer demonstrates understanding.'
            : 'Keep going — some areas need more attention.'}
        </p>
      </div>

      {/* AI Feedback */}
      <p className="text-[11px] font-bold uppercase tracking-[0.06em]
                    text-accent-dk dark:text-accent mb-4">AI FEEDBACK</p>
      <div className="space-y-4 mb-8">
        {feedback.split('\n\n').filter(Boolean).map((para, i) => (
          <p key={i} className="text-[15px] text-gray-600 dark:text-slate leading-[1.7]">
            {para}
          </p>
        ))}
      </div>

      <Button variant="primary" loading={advancing} onClick={handleContinue}>
        Continue to Next Session
      </Button>
    </div>
  );
}
```

### ExamPhase.jsx — Correct Answer Format

The backend expects: `answers: [{ questionIndex: 0, selectedIndex: 2 }, ...]`

```jsx
import { useState } from 'react';
import { submitExam } from '../../../api/session.api';

export default function ExamPhase({ questions, dayId, roadmapId, onComplete }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});   // { questionIndex: selectedIndex }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const allAnswered = Object.keys(answers).length === questions.length;

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setLoading(true);
    setError(null);
    try {
      // Convert to array format backend expects
      const answersArray = questions.map((_, idx) => ({
        questionIndex: idx,
        selectedIndex: answers[idx] ?? -1,
      }));

      const result = await submitExam(dayId, { roadmapId, answers: answersArray });
      onComplete(result); // { score, passed, feedback, weakTopics, nextAction }
    } catch (err) {
      setError('Failed to submit exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const question = questions[currentQ];

  return (
    <div className="bg-white dark:bg-navy-mid
                    border border-gray-200 dark:border-navy-light
                    rounded-xl p-8 shadow-sm">
      {/* Exam progress bar — red */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 dark:text-muted mb-2">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>{Object.keys(answers).length} answered</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-divider rounded-full overflow-hidden">
          <div
            className="h-full bg-fail rounded-full transition-all"
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 leading-snug">
        {question.question}
      </h3>

      <div className="flex flex-col gap-3 mb-8">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: i }))}
            className={`flex items-center gap-4 h-14 px-5 rounded-[10px]
                        border-[1.5px] text-sm font-medium text-left transition-all
              ${answers[currentQ] === i
                ? 'bg-red-50 dark:bg-fail/10 border-fail text-fail'
                : 'bg-white dark:bg-navy border-gray-200 dark:border-divider text-gray-700 dark:text-slate'
              }`}>
            {opt}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        {currentQ > 0 && (
          <Button variant="secondary" onClick={() => setCurrentQ(q => q - 1)}>
            ← Previous
          </Button>
        )}
        {currentQ < questions.length - 1 ? (
          <Button
            variant="primary"
            disabled={answers[currentQ] === undefined}
            onClick={() => setCurrentQ(q => q + 1)}>
            Next Question →
          </Button>
        ) : (
          <Button
            className="bg-fail text-white hover:bg-red-600 border-0"
            loading={loading}
            disabled={!allAnswered}
            onClick={handleSubmit}>
            {loading ? 'Submitting...' : 'Submit Exam'}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-fail mt-4">{error}</p>}
    </div>
  );
}
```

### ExamResult.jsx — Navigation Fix

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { advanceProgress } from '../../../api/progress.api';
import { useApp } from '../../../context/AppContext';

export default function ExamResult({ result, dayId, roadmapId }) {
  const navigate = useNavigate();
  const { refreshProgress } = useApp();
  const [advancing, setAdvancing] = useState(false);

  const handleContinue = async () => {
    setAdvancing(true);
    if (result.passed) {
      // Advance to next week
      try {
        await advanceProgress(roadmapId, dayId, 'completed');
        await refreshProgress();
      } catch (err) {
        console.error('Advance failed:', err);
      }
    }
    // For fail: backend already set Saturday, just navigate
    navigate('/learn');
  };

  return (
    <div className="bg-white dark:bg-navy-mid
                    border border-gray-200 dark:border-navy-light
                    rounded-xl p-8 shadow-sm text-center">
      {result.passed ? (
        <>
          <div className="w-16 h-16 rounded-full bg-pass/10 border-2 border-pass
                          flex items-center justify-center mx-auto mb-4">
            {/* Checkmark SVG */}
            <svg className="w-8 h-8 text-pass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{result.score}%</p>
          <p className="text-pass font-semibold mt-1">Passed</p>
          <p className="text-sm text-gray-500 dark:text-muted mt-2 mb-8">
            Advancing to next week
          </p>
        </>
      ) : (
        <>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{result.score}%</p>
          <p className="text-fail font-semibold mt-1">Needs Revision</p>
          <p className="text-sm text-gray-500 dark:text-muted mt-2 mb-6">
            Review the topics below and take the exam again after revision.
          </p>
          {result.weakTopics?.length > 0 && (
            <div className="text-left mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-fail mb-3">
                Topics to Review
              </p>
              {result.weakTopics.map((topic, i) => (
                <div key={i} className="flex items-center gap-2 py-2
                                        border-b border-gray-100 dark:border-divider">
                  <div className="w-1.5 h-1.5 rounded-full bg-fail flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-slate">{topic}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Button variant="primary" loading={advancing} onClick={handleContinue}>
        {result.passed ? 'Continue to Next Week' : 'Back to Revision'}
      </Button>
    </div>
  );
}
```

### Test Checklist F3

- [ ] Navigate to /session/m1-w1-d1 — loading spinner shown, then lesson appears
- [ ] Part 1, Card 1 content visible (100+ word real text, not "Lorem ipsum")
- [ ] "Next Card" advances to Card 2 within Part 1
- [ ] After last card: "Continue to Exercise" appears
- [ ] Mini exercise shows question with 4 options
- [ ] Selecting wrong answer shows red + correct answer green + explanation
- [ ] "Next Part" loads Part 2, Card 1, progress bar advances
- [ ] After Part 3 mini exercise: "Proceed to Task" appears
- [ ] Text task: textarea visible, min 20 chars enforced
- [ ] Text task submit: loading ~2-5 seconds, then FeedbackPhase renders
- [ ] FeedbackPhase: green banner for positive, amber for needs_improvement
- [ ] "Continue to Next Session" calls advance, navigates to /learn
- [ ] /learn shows updated currentDay (Tuesday if was Monday)
- [ ] Navigate to /session/m1-w1-d7 — exam loads directly (no lesson)
- [ ] Exam: red progress bar, red selected option highlight
- [ ] All 5 questions answered → Submit Exam enabled
- [ ] Submit all correct → ExamResult shows green + score 100% + Continue button
- [ ] Submit all wrong → ExamResult shows red + score 0% + weak topics list
- [ ] Fail → Back to Revision → /learn shows Saturday
- [ ] No console errors during any phase transition

---

## MILESTONE F4 — Polish, Build Verification, and Deployment Prep
**Goal:** Zero build errors, no undefined values visible to user, mobile + desktop verified.
**Time estimate:** 2-3 hours (Antigravity Session 4)

### Files to Review
```
MODIFY: src/pages/RoadmapPage/RoadmapPage.jsx  (remove hardcoded 4 modules)
MODIFY: src/pages/AuthPage/AuthPage.jsx         (verify navigation logic)
MODIFY: src/App.jsx                             (verify route protection)
VERIFY: All pages for undefined/null rendering
```

### Polish Tasks

#### Task 1 — AuthPage navigation
After login: `if (data.hasRoadmap) navigate('/learn') else navigate('/setup')`
After signup: always navigate('/setup')
If already logged in and visiting /auth: redirect to /learn

#### Task 2 — RoadmapPage field names
Replace every `mod.moduleTitle` → `mod.title`
Replace every `week.weekTitle` → `week.title`
Replace hardcoded `4` module count → `roadmapJson.modules.length`

#### Task 3 — Null safety across all pages
Every place that renders progress or roadmapJson must have null guards:
```jsx
// Pattern for all optional chaining:
{progress?.currentDay ?? '—'}
{roadmapJson?.skillName ?? 'Loading...'}
{stats?.completedSessions ?? 0}
```

#### Task 4 — Theme toggle persistence
Verify useTheme.js reads from localStorage on mount and sets dark class on html element.
Theme must persist across page refresh and navigation.

#### Task 5 — CORS update for production
Before deploying, update server.js:
```js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://skillmaster.ai',            // your domain
    'https://skill-master.vercel.app'    // vercel preview URL
  ]
}));
```

#### Task 6 — Environment variables
client/.env.production:
```
VITE_API_URL=https://your-app.railway.app/api
```

Railway environment variables (set in Railway dashboard):
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/skillmaster
JWT_SECRET=<32+ char random string>
GEMINI_API_KEY=<from Google AI Studio>
PORT=5000
```

### Build Verification
```bash
# In client/ folder:
npm run build
# Must complete with ZERO errors and ZERO warnings about undefined

# Check bundle size — should be under 500KB gzipped
npx vite-bundle-visualizer
```

### Test Checklist F4

- [ ] npm run build completes with zero errors
- [ ] Dark mode: every page renders correctly (no white flash, no wrong colors)
- [ ] Light mode: every page renders correctly (no dark colors showing)
- [ ] Theme toggle in navbar changes mode, persists on reload
- [ ] Mobile (390px): bottom tab bar visible, top navbar hidden
- [ ] Mobile: no horizontal overflow on any page
- [ ] Desktop (1440px): no stretched elements, max-width containers correct
- [ ] /auth with valid token in localStorage → redirected to /learn
- [ ] /setup protected — without token → redirected to /auth
- [ ] /session/invalid-day → 404 page shown
- [ ] Profile dropdown: shows real user name and email from server
- [ ] Profile dropdown logout: clears token, redirects /auth, AppContext cleared
- [ ] Footer (desktop): shows current skill name from roadmapJson
- [ ] RoadmapPage accordion: module titles use real .title field
- [ ] No "undefined" or "[object Object]" anywhere in the UI under any state

---

## FINAL FULL FLOW TEST (After All Frontend Milestones)

Run this complete flow on localhost before deploying:

```
1. Sign up with new account → MongoDB user created → redirected to /setup
2. Complete setup form (all 7 fields) → roadmap generated → /roadmap visible
3. /roadmap: modules, weeks, days all show correctly with real data
4. Click Get Started → /learn
5. /learn: stat cards show Module 1, Week 1, Monday
6. Session card shows Day 1 title from roadmapJson
7. Click Continue Session → /session/m1-w1-d1
8. Complete all 3 lesson parts + mini exercises
9. Complete task → feedback shown → Continue → /learn
10. /learn: stat cards now show Tuesday
11. Navigate to /progress → all stats populated from server
12. Navigate back → /session/m1-w1-d6 (Saturday revision)
13. Revision session loads: 1 part, 3 cards, no task
14. Complete → /learn shows Sunday
15. /session/m1-w1-d7 → exam loads
16. Submit exam with correct answers → pass → next week
17. /learn shows Week 2, Monday
18. Logout → /auth → all state cleared
19. Login again → /learn shows correct position (Week 2 persisted)
```

---

## DEPLOYMENT SEQUENCE

### Step 1 — MongoDB Atlas (15 minutes)
1. Go to cloud.mongodb.com → Create free M0 cluster
2. Create database user with username/password
3. Whitelist IP: 0.0.0.0/0 (allow all — Railway uses dynamic IPs)
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/skillmaster`

### Step 2 — Google AI Studio Billing (10 minutes)
1. Go to aistudio.google.com → Settings → Billing
2. Enable pay-as-you-go (requires Google Cloud billing account)
3. Set monthly spend cap: $5
4. Verify same API key works — no changes to code needed

### Step 3 — Railway Backend (20 minutes)
1. Go to railway.app → New Project → Deploy from GitHub
2. Select your repo → select /server as root directory
3. Set environment variables in Railway dashboard:
   - MONGO_URI (from Atlas)
   - JWT_SECRET (generate: `openssl rand -base64 32`)
   - GEMINI_API_KEY
   - PORT=5000 (Railway sets this automatically — override not needed)
4. Note the Railway public URL: `https://your-app.railway.app`
5. Test: GET https://your-app.railway.app/api/health → { status: "ok" }

### Step 4 — Vercel Frontend (15 minutes)
1. Go to vercel.com → Import Git Repository
2. Select your repo → set root directory to /client
3. Add environment variable: VITE_API_URL = https://your-app.railway.app/api
4. Deploy → note Vercel URL
5. Test: all 3 pages load, auth works

### Step 5 — Domain (30 minutes)
1. Buy skillmaster.ai from Namecheap or Porkbun (~$70-90/year)
2. In Vercel: Project Settings → Domains → Add skillmaster.ai
3. At domain registrar: add Vercel's A record and CNAME as instructed
4. SSL auto-provisioned by Vercel (5-15 minutes propagation)
5. Update CORS in server.js to include https://skillmaster.ai → redeploy backend

---

## SECURITY FINAL CHECKLIST

| Concern | Location | Status |
|---------|----------|--------|
| Password never in response | auth.service.js | select: false + safe user shape |
| Same 401 for wrong email/password | auth.service.js | Confirmed in tests |
| JWT secret min 32 chars | .env / Railway | Generate with openssl |
| All DB queries include userId | Every controller | Confirmed in code review |
| CORS restricted to known origins | server.js | Update before deploy |
| Token stored safely | client localStorage | Acceptable for MVP |
| Gemini API key never in responses | gemini.service.js | Only in process.env |
| Sessions never saved if malformed | session.controller.js | guardSessionContent() |
| .env never committed | .gitignore | Verify before first push |
| MongoDB Atlas IP whitelist | Atlas dashboard | 0.0.0.0/0 for Railway |

---

## COMPLETION CRITERIA

Backend complete when:
- [ ] All 16 integration test requests return correct responses
- [ ] No malformed sessions in MongoDB
- [ ] Revision sessions always return exactly 1 part with 3 cards
- [ ] latestExamScore reflects actual exam results
- [ ] calculateNextPosition used exclusively in advanceProgress

Frontend complete when:
- [ ] npm run build returns zero errors
- [ ] Full 19-step user flow completes without errors
- [ ] No undefined, null, [object Object] visible in any state
- [ ] Mobile and desktop layouts verified
- [ ] Dark and light mode verified on all pages

Deployed and live when:
- [ ] GET https://skillmaster.ai returns the app
- [ ] GET https://your-app.railway.app/api/health returns { status: "ok" }
- [ ] Full signup→learn flow works on production URL
- [ ] Google AI Studio billing enabled with $5 cap
- [ ] MongoDB Atlas M0 cluster connected to Railway
```
