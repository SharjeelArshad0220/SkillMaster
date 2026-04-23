# Skill Master — Postman API Testing Guide

## Setup (Do This First)

1. Download Postman from https://www.postman.com/downloads/
2. Open Postman → Click **Environments** (top right) → **New Environment** → name it `SkillMaster Local`
3. Add these variables:

| Variable | Initial Value | Current Value |
|---|---|---|
| `base_url` | `http://localhost:5000/api` | `http://localhost:5000/api` |
| `token` | (leave empty) | (leave empty) |
| `roadmapId` | (leave empty) | (leave empty) |

4. Select this environment from the dropdown (top right corner of Postman)
5. Start your backend: `cd server && npm run dev`
6. Confirm terminal shows: **MongoDB connected** and **Server running on port 5000**

---

## TEST 1 — Health Check

**Method:** GET  
**URL:** `{{base_url}}/health`  
**Headers:** None  
**Body:** None

**Expected Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-04-11T..."
}
```

✅ Pass = server is running  
❌ Fail = backend is not started, check terminal

---

## TEST 2 — Sign Up (Create Account)

**Method:** POST  
**URL:** `{{base_url}}/auth/signup`  
**Headers:** `Content-Type: application/json`  
**Body (raw → JSON):**
```json
{
  "name": "Test User",
  "email": "test@skillmaster.com",
  "password": "12345678"
}
```

**Expected Response (201):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "_id": "...",
    "name": "Test User",
    "firstName": "Test",
    "email": "test@skillmaster.com"
  }
}
```

✅ Copy the token value → go to your Environment → paste into `token` Current Value → Save

**Failure Tests (run these too):**
- Same email again → expect **409** "email already exists"
- Password only 5 chars → expect **400**
- Missing email field → expect **400**

---

## TEST 3 — Login

**Method:** POST  
**URL:** `{{base_url}}/auth/login`  
**Headers:** `Content-Type: application/json`  
**Body:**
```json
{
  "email": "test@skillmaster.com",
  "password": "12345678"
}
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGc...",
  "user": { "_id": "...", "name": "Test User", "firstName": "Test", "email": "..." },
  "hasRoadmap": false
}
```

✅ Copy new token → paste into environment  
✅ `hasRoadmap: false` is correct (no roadmap yet)

**Failure Tests:**
- Wrong password → expect **401** "Invalid email or password"
- Wrong email → expect **401** (SAME message — this is intentional for security)

---

## TEST 4 — Get Me (Token Validation)

**Method:** GET  
**URL:** `{{base_url}}/auth/me`  
**Headers:** `Authorization: Bearer {{token}}`  
**Body:** None

**Expected Response (200):**
```json
{
  "user": { "_id": "...", "name": "Test User", "email": "..." },
  "hasRoadmap": false
}
```

**Failure Tests:**
- No Authorization header → expect **401**
- Type random text as token → expect **401**

---

## TEST 5 — Generate Roadmap (SLOW — Takes 10-20 seconds)

**Method:** POST  
**URL:** `{{base_url}}/roadmap/generate`  
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{token}}`

**Body:**
```json
{
  "skillInput": "Python basics",
  "motivation": "I want to get a data science job",
  "dailyTime": "30 – 60 minutes",
  "role": "Student",
  "currentLevel": "Beginner",
  "learningStyle": "Examples",
  "goalClarity": "Clear"
}
```

**Expected Response (201) — arrives after ~15 seconds:**
```json
{
  "roadmapId": "64abc123...",
  "roadmapJson": {
    "skillName": "Python Programming",
    "totalModules": 4,
    "modules": [...]
  }
}
```

✅ Copy the `roadmapId` value → paste into environment variable `roadmapId` → Save  
✅ Open MongoDB Compass → check `roadmaps` collection → document should exist  
✅ Check `progress` collection → a matching document should also exist

**Failure Test:**
- Send request without `skillInput` → expect **400**

---

## TEST 6 — Get Active Roadmap

**Method:** GET  
**URL:** `{{base_url}}/roadmap/active`  
**Headers:** `Authorization: Bearer {{token}}`  
**Body:** None

**Expected Response (200):**
```json
{
  "roadmapId": "64abc123...",
  "roadmapJson": { ... },
  "progress": {
    "currentModule": 1,
    "currentWeek": 1,
    "currentDay": "Monday",
    "completedDays": [],
    "examAttempts": []
  },
  "stats": null
}
```

---

## TEST 7 — Get Session (SLOW — Takes 10-15 seconds first time)

**Method:** GET  
**URL:** `{{base_url}}/session/m1-w1-d1?roadmapId={{roadmapId}}`  
**Headers:** `Authorization: Bearer {{token}}`  
**Body:** None

**Expected Response (200):**
```json
{
  "session": {
    "_id": "...",
    "dayId": "m1-w1-d1",
    "type": "Learning",
    "content": {
      "parts": [
        {
          "partNumber": 1,
          "partTitle": "...",
          "cards": [
            { "cardNumber": 1, "content": "..." }
          ],
          "miniExercise": {
            "question": "...",
            "options": ["A", "B", "C", "D"],
            "correctIndex": 0,
            "explanation": "..."
          }
        }
      ],
      "task": {
        "type": "text or mcq",
        "description": "..."
      }
    },
    "status": "pending"
  }
}
```

✅ Run the SAME request again → should return instantly (cached — no AI call)

**Failure Test:**
- Use `m99-w99-d99` → expect **404**

---

## TEST 8 — Get Revision Session

**Method:** GET  
**URL:** `{{base_url}}/session/m1-w1-d6?roadmapId={{roadmapId}}`  
**Headers:** `Authorization: Bearer {{token}}`

**Expected:** Returns session with `"type": "Revision"`, content has 1 part, `task: null`

---

## TEST 9 — Get Exam Session

**Method:** GET  
**URL:** `{{base_url}}/session/m1-w1-d7?roadmapId={{roadmapId}}`  
**Headers:** `Authorization: Bearer {{token}}`

**Expected:** Returns IMMEDIATELY (no AI call), content has `examQuestions` array with 5 questions

---

## TEST 10 — Submit Text Task

**Method:** POST  
**URL:** `{{base_url}}/session/m1-w1-d1/submit`  
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{token}}`

**Body:**
```json
{
  "roadmapId": "{{roadmapId}}",
  "type": "text",
  "taskAnswer": "Python is a high-level interpreted language. I understand variables are containers that store data values. I practiced creating variables and assigning string, integer and float values to them using the assignment operator."
}
```

**Expected Response (200):**
```json
{
  "feedback": "Your answer demonstrates a solid understanding...",
  "outcome": "positive"
}
```

**Failure Test:**
- Send `taskAnswer` with less than 20 characters → expect **400**

---

## TEST 11 — Submit Exam (Pass Case)

**Method:** POST  
**URL:** `{{base_url}}/session/m1-w1-d7/exam`  
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{token}}`

**Body:** (use the actual correctIndex values from your exam session response in Test 9)
```json
{
  "roadmapId": "{{roadmapId}}",
  "answers": [
    { "questionIndex": 0, "selectedIndex": 1 },
    { "questionIndex": 1, "selectedIndex": 2 },
    { "questionIndex": 2, "selectedIndex": 0 },
    { "questionIndex": 3, "selectedIndex": 3 },
    { "questionIndex": 4, "selectedIndex": 2 }
  ]
}
```

> **How to get correct answers:** Look at the exam session response from Test 9. Each question has a `correctIndex`. Use those values as `selectedIndex` to simulate a pass.

**Expected Response (200) — Pass:**
```json
{
  "score": 100,
  "passed": true,
  "weakTopics": [],
  "nextAction": "advance"
}
```

---

## TEST 12 — Submit Exam (Fail Case)

Same as Test 11 but use **wrong** selectedIndex values for all answers.

**Expected Response (200) — Fail:**
```json
{
  "score": 0,
  "passed": false,
  "weakTopics": ["topic1", "topic2"],
  "nextAction": "revision"
}
```

✅ Open MongoDB Compass → `progress` collection → `currentDay` should now be `"Saturday"`

---

## TEST 13 — Advance Progress

**Method:** POST  
**URL:** `{{base_url}}/progress/advance`  
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {{token}}`

**Body:**
```json
{
  "roadmapId": "{{roadmapId}}",
  "dayId": "m1-w1-d1",
  "status": "completed"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "newDay": "Tuesday",
  "newWeek": 1,
  "newModule": 1,
  "roadmapComplete": false
}
```

✅ Call again with `"dayId": "m1-w1-d7"` → `newDay` should become `"Monday"`, `newWeek` becomes 2

---

## TEST 14 — Get Stats

**Method:** GET  
**URL:** `{{base_url}}/progress/stats?roadmapId={{roadmapId}}`  
**Headers:** `Authorization: Bearer {{token}}`

**Expected Response (200):**
```json
{
  "completedSessions": 2,
  "modulesCompleted": "0/4",
  "latestResult": null,
  "revisionTopicsCount": 0,
  "lessonsCompleted": 1,
  "revisionSessions": 0,
  "examsAttempted": 1,
  "examsPassed": 1,
  "lastCompletedTitle": "...",
  "lastSessionOutcome": "completed",
  "latestExamScore": 100,
  "latestExamPassed": true,
  "revisionQueue": []
}
```

---

## Security Tests (Run These Before Deployment)

### Cross-User Access Test
1. Sign up a second user with a different email
2. Login as second user, get their token
3. Try to GET `{{base_url}}/roadmap/active` with their token
4. They should see their OWN roadmap (null if none generated), NOT the first user's

### Tampered Token Test
1. Take your token
2. Change one character in the middle
3. Send any protected request
4. Expected: **401 Unauthorized**

---

## Quick Test Order Summary

```
1. Health Check        → server alive
2. Signup              → create account, save token
3. Login               → verify login works
4. Get Me              → token validation works
5. Generate Roadmap    → AI works, save roadmapId
6. Get Active Roadmap  → state restore works
7. Get Session d1      → AI lesson generation, check cache on 2nd call
8. Get Session d6      → revision session
9. Get Session d7      → exam session (fast)
10. Submit Task        → AI feedback works
11. Submit Exam Pass   → score >= 80 flow
12. Submit Exam Fail   → score < 80, weakTopics, Saturday reset
13. Advance Progress   → day pointer moves correctly
14. Get Stats          → analytics correct
```
