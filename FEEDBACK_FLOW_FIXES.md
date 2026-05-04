# Feedback Flow - Complete Audit & Fixes ✅

## Bugs Identified and Fixed

### Bug 1: gemini.service.js — RESOURCES generation reliability
**Status**: ✅ FIXED
**File**: `server/src/services/gemini.service.js`
**Function**: `generateFeedback()`

**What was wrong**:
- MCQ prompt had pre-inserted outcome: `OUTCOME: ${data.outcome}` (not AI-generated)
- Text prompt made RESOURCES optional: "skip if not relevant"
- No format specification for RESOURCES output

**What was fixed**:
- MCQ outcome now AI-generated: `"OUTCOME: positive OR OUTCOME: needs_improvement (based on your evaluation)"`
- Both MCQ and text tasks now have mandatory RESOURCES section
- Explicit markdown format requirement: `RESOURCES:\n- [URL Title](https://...) — description\n- ...`
- Enforced official docs only: MDN, React, Node.js, MongoDB, Python docs

**Prompt outcome** (MCQ):
```
After the 3 paragraphs, you MUST include:
OUTCOME: positive OR OUTCOME: needs_improvement (based on your evaluation of their understanding)

Then you MUST include a RESOURCES section with exactly this format:
RESOURCES:
- [URL 1 Title](https://...) — brief description of what this covers
- [URL 2 Title](https://...) — brief description of what this covers

Use ONLY official documentation URLs: MDN, React docs, Node.js docs, MongoDB docs, Python docs, etc.
```

---

### Bug 2: session.controller.js — RESOURCES parsing robustness
**Status**: ✅ FIXED
**File**: `server/src/controllers/session.controller.js`
**Function**: `submitTask()` (both text and MCQ branches)

**What was wrong**:
- Regex required newline: `/RESOURCES:\n([\s\S]*?)$/im` (strict format dependency)
- Would fail if Gemini output: `RESOURCES: - [Title](url)`
- No content length validation

**What was fixed**:
- Regex now flexible: `/RESOURCES:\s*([\s\S]*?)$/im` (handles space or newline)
- Added content validation: `if (resourcesContent.length > 0)`
- Resources now reliably extracted in multiple formats

**Text task extraction (line ~169-177)**:
```javascript
const resourcesMatch = aiResponse.match(/RESOURCES:\s*([\s\S]*?)$/im);
if (resourcesMatch) {
  const resourcesContent = resourcesMatch[1].trim();
  resources = resourcesContent.length > 0 ? resourcesContent : null;
}
```

**MCQ task extraction (line ~275-283)** — same pattern applied

**API Response** (both text and MCQ):
```json
{
  "feedback": "string of 3 feedback paragraphs (OUTCOME and RESOURCES stripped)",
  "outcome": "positive|needs_improvement",
  "resources": "- [MDN](https://...) — description\n- [React](https://...) — description",
  "score": 85,
  "passed": true
}
```

---

### Bug 3: TaskPhase.jsx — Resources data flow
**Status**: ✅ FIXED
**File**: `client/src/pages/SessionPage/phases/TaskPhase.jsx`
**Functions**: `handleTextSubmit()`, `handleMcqSubmit()`

**What was wrong**:
- Text task: `onComplete({ feedback, outcome })` — resources dropped
- MCQ task: `onComplete({ feedback, outcome, score, passed })` — resources dropped
- Resources never passed up component tree

**What was fixed**:
- Text task: `onComplete({ feedback, outcome, resources: result.resources })`
- MCQ task: `onComplete({ feedback, outcome, score, passed, resources: result.resources })`
- Resources data now flows to SessionPage → FeedbackPhase

---

### Bug 4: FeedbackPhase.jsx — URL rendering
**Status**: ✅ FIXED
**File**: `client/src/pages/SessionPage/phases/FeedbackPhase.jsx`
**Component**: `FeedbackPhase`

**What was wrong**:
- Old section title: "EXPLORE FURTHER" (didn't match backend "RESOURCES:")
- Only ReactMarkdown rendering (plain URLs wouldn't be clickable)
- No manual URL extraction or link creation
- Component received `resources` prop but it was never passed by TaskPhase

**What was fixed**:
- Section label: "RESOURCES" (matches backend format)
- Condition: Only render if `resources && resources.trim() && !noResourcesNeeded`
- Smart URL parsing: extracts both markdown `[title](url)` and plain `https://...` formats
- Renders as clickable `<a>` tags with:
  - `href={extractedUrl}`
  - `target="_blank" rel="noopener noreferrer"`
  - Styling: `text-accent-dk dark:text-accent hover:underline`
- Fallback: non-URL text lines render as plain text

**Parsing logic**:
```javascript
const markdownMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
const plainUrlMatch = line.match(/(https?:\/\/[^\s]+)/);

if (markdownMatch) {
  // Render markdown link as clickable <a>
} else if (plainUrlMatch) {
  // Render plain URL as clickable <a>
} else {
  // Render text as <p>
}
```

---

## Complete Data Flow (Fixed)

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER SUBMITS TASK                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ TaskPhase: handleTextSubmit() OR handleMcqSubmit()                  │
│ → submitTask(dayId, {taskAnswer or mcqAnswers})                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ [BACKEND] POST /api/session/:dayId/submit                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ session.controller.submitTask()                                     │
│ → Extract: {description, topicsList, userAnswer}                   │
│ → OR: {score, report, questions}                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ gemini.service.generateFeedback()                                   │
│ → Send prompt to Gemini Flash                                      │
│ → Prompt REQUIRES: OUTCOME + RESOURCES sections                    │
│ → Format: markdown with [Title](URL) — description                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Gemini API Response:                                                │
│                                                                     │
│ [3 feedback paragraphs about the submission]                        │
│                                                                     │
│ OUTCOME: positive                                                   │
│                                                                     │
│ RESOURCES:                                                          │
│ - [MDN Web Docs](https://...) — reference docs                    │
│ - [React Official](https://...) — framework guide                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ session.controller: Parse aiResponse                                │
│                                                                     │
│ 1. Extract OUTCOME with regex: /OUTCOME:\s*(positive|needs_..)/i  │
│ 2. Extract RESOURCES with regex: /RESOURCES:\s*([\s\S]*?)$/im     │
│ 3. Strip OUTCOME & RESOURCES from feedback text                    │
│ 4. Return: {feedback, outcome, resources, score?, passed?}        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ [FRONTEND] TaskPhase.handleTextSubmit() / handleMcqSubmit()        │
│ → Receive result: {feedback, outcome, resources, ...}             │
│ → Call: onComplete({feedback, outcome, resources, ...})           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ SessionPage.handleTaskComplete()                                    │
│ → setFeedbackData({feedback, outcome, resources, ...})             │
│ → setPhase(PHASES.FEEDBACK)                                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ FeedbackPhase Component Renders                                     │
│                                                                     │
│ Props: {feedback, outcome, resources, dayId, roadmapId}            │
│                                                                     │
│ 1. Outcome indicator (green/amber banner)                          │
│ 2. "AI FEEDBACK" section with feedback text                        │
│ 3. "RESOURCES" section (if resources exist):                       │
│    - Parse each line for URLs                                      │
│    - Render markdown: [title](url) as clickable <a>               │
│    - Render plain URLs: https://... as clickable <a>              │
│    - Render description text as <p>                                │
│    - All links open in new tab with noreferrer                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ USER SEES:                                                          │
│                                                                     │
│ ✅ Outcome indicator (green: "Excellent", amber: "Keep Working")   │
│ ✅ Feedback paragraphs in readable format                           │
│ ✅ RESOURCES section with clickable hyperlinks                     │
│ ✅ Links styled in accent color with underline on hover            │
│ ✅ Links open in new tab (safe)                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

### Backend (server/)
- [x] `gemini.service.js` - generateFeedback() uses mandatory RESOURCES format
- [x] `session.controller.js` - Both text and MCQ submit flows parse RESOURCES correctly
- [x] No compilation errors
- [x] API returns: `{ feedback, outcome, resources, score?, passed? }`

### Frontend (client/)
- [x] `TaskPhase.jsx` - Text and MCQ handlers extract and pass resources
- [x] `SessionPage.jsx` - FeedbackData state includes resources
- [x] `FeedbackPhase.jsx` - Renders resources as clickable links
- [x] No compilation errors
- [x] URL parsing handles both markdown and plain formats
- [x] Links open in new tab safely

### Data Flow
- [x] Backend generates RESOURCES in markdown format
- [x] Controller extracts RESOURCES reliably with flexible regex
- [x] TaskPhase passes resources to FeedbackPhase
- [x] FeedbackPhase renders as clickable links

---

## Testing Instructions

### Manual Test via Browser

1. **Start the application**:
   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```

2. **Authenticate and navigate to a learning session**:
   - Go to `/auth` and log in
   - Navigate to a learning or revision day
   - Complete the lesson phase

3. **Submit a text task**:
   - Write an answer (20+ characters)
   - Click "Submit Task"
   - Wait for AI feedback generation (~2-5 seconds)

4. **Verify RESOURCES section**:
   - ✅ FeedbackPhase should display
   - ✅ "RESOURCES" section visible below feedback
   - ✅ Each resource is a clickable blue link
   - ✅ Links open in new tab when clicked
   - ✅ No plain text URLs (all are clickable)

5. **Test MCQ task**:
   - Answer all MCQ questions
   - Submit task
   - Verify RESOURCES render as clickable links

### Postman Test (API Level)

1. **Get a session**:
   ```
   GET /api/session/m1-w1-d1?roadmapId=<roadmapId>
   Headers: Authorization: Bearer <token>
   ```

2. **Submit text task**:
   ```
   POST /api/session/m1-w1-d1/submit
   Headers: Authorization: Bearer <token>
   Content-Type: application/json
   
   {
     "taskAnswer": "Here is my detailed answer to this complex problem. I believe..."
   }
   ```

3. **Verify response** contains:
   ```json
   {
     "feedback": "[3 paragraphs without OUTCOME or RESOURCES]",
     "outcome": "positive",
     "resources": "- [MDN](https://...) — ...\n- [React](https://...) — ..."
   }
   ```

4. **Check resources field**:
   - Should NOT be null or undefined
   - Should contain newline-separated markdown links
   - Each line should start with `- [Title](URL)`

---

## Files Changed

1. ✅ `server/src/services/gemini.service.js` — generateFeedback() prompts
2. ✅ `server/src/controllers/session.controller.js` — RESOURCES parsing (text & MCQ)
3. ✅ `client/src/pages/SessionPage/phases/TaskPhase.jsx` — resources data flow
4. ✅ `client/src/pages/SessionPage/phases/FeedbackPhase.jsx` — URL rendering

---

## Status: ALL BUGS FIXED ✅

The feedback flow now works end-to-end:
- Backend generates RESOURCES in predictable markdown format
- Controller parses flexibly and returns to frontend
- TaskPhase passes resources through component tree
- FeedbackPhase renders as clickable hyperlinks with proper styling
- Users can now access resource links directly from feedback

