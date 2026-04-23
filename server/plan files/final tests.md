# Skill Master Final Flow Check:
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
# tests
## test no . 1 
```
req :
[
Method: POST
URL: {{base_url}}/auth/signup
Headers: Content-Type: application/json
Body (raw → JSON):

{
  "name": "Sharjeel Arshad",
  "email": "shargeelarshad619@gmail.com", 
  "password": "12345678"
}
]
res:
[
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWRmOGFiMWU2ZjNmNzJjMjliZmMzYjIiLCJpYXQiOjE3NzYyNTc3MTMsImV4cCI6MTc3Njg2MjUxM30._uuS1JVmIo0GUuwqFmFndBmCG2M55RZ2Vq2UVltY5o8",
    "user": {
        "_id": "69df8ab1e6f3f72c29bfc3b2",
        "name": "Sharjeel Arshad",
        "firstName": "Sharjeel",
        "email": "shargeelarshad619@gmail.com"
    }
}
]
```
## test no . 2
```
req:
[
Method: POST
URL: {{base_url}}/auth/login
Headers: Content-Type: application/json
Body:

{
  "email": "shargeelarshad619@gmail.com",
  "password": "12345678"
}
]
res:
[
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWRmOGFiMWU2ZjNmNzJjMjliZmMzYjIiLCJpYXQiOjE3NzYyNTgwMDEsImV4cCI6MTc3Njg2MjgwMX0.BLjwoWbcwjX61cTelO5I_ta_HEYl4CdoU_VGQmdYxEA",
    "user": {
        "_id": "69df8ab1e6f3f72c29bfc3b2",
        "name": "Sharjeel Arshad",
        "firstName": "Sharjeel",
        "email": "shargeelarshad619@gmail.com"
    },
    "hasRoadmap": false
}
]
```
## test no . 3
```
req:
[
Method: GET
URL: {{base_url}}/auth/me
Headers: Authorization: Bearer {{token}}
Body: None
]
res:
[
{
    "user": {
        "_id": "69df8ab1e6f3f72c29bfc3b2",
        "name": "Sharjeel Arshad",
        "firstName": "Sharjeel",
        "email": "shargeelarshad619@gmail.com"
    },
    "hasRoadmap": false
}
]
```
## test no . 4
```
req:
[
{
    "skillInput": "Mern Stack product engineer",
    "motivation": "Founder-level architect building globally scalable, AI-powered enterprise products through rigorous system design and product engineering",
    "dailyTime": "3 hours +",
    "role": "Student",
    "currentLevel": "Beginner",
    "learningStyle": "Practice",
    "goalClarity": "Clear"
}
]
res:
[
{
    "roadmapId": "69dfa9512ed4d9c9b4957625",
    "roadmapJson": {
        "skillName": "MERN Stack Product Engineering",
        "targetLevel": "Founder-level Architect",
        "totalModules": 10,
        "estimatedWeeks": 18,
        "modules": [
            {
                "moduleNumber": 1,
                "title": "MERN Stack Fundamentals - Frontend Core (React)",
                "weeks": [...........details are removed to keep context concise so i wont waste claude's token but all the roadmap was valid and response was almost about 2430 lines]
            }
        ]
    }
}
]
```
## test no . 5
```
req:
[
Method: GET
URL: {{base_url}}/roadmap/active
Headers: Authorization: Bearer {{token}}
]
res:
[
{
    "roadmapId": "69dfa9512ed4d9c9b4957625",
    "roadmapJson": {
        "skillName": "MERN Stack Product Engineering",
        "targetLevel": "Founder-level Architect",
        "totalModules": 10,
        "estimatedWeeks": 18,
        "modules": [
            {
                "moduleNumber": 1,
                "title": "MERN Stack Fundamentals - Frontend Core (React)",
                ..........., and more modules are also present  
            }
        ]
    },
    "progress": {
        "_id": "69dfa9512ed4d9c9b4957626",
        "userId": "69df8ab1e6f3f72c29bfc3b2",
        "roadmapId": "69dfa9512ed4d9c9b4957625",
        "currentModule": 1,
        "currentWeek": 1,
        "currentDay": "Monday",
        "allWeakTopics": [],
        "completedDays": [],
        "examAttempts": [],
        "createdAt": "2026-04-15T15:05:53.598Z",
        "updatedAt": "2026-04-15T15:05:53.598Z",
        "__v": 0
    },
    "stats": null
}
]
```
## test no . 6
```
req:
[
Method: GET
URL: {{base_url}}/session/m1-w1-d1?roadmapId={{roadmapId}}
Headers: Authorization: Bearer {{token}}
Body: None
]
res:
[ got this after errors below
    {
        {
    "session": {
        "userId": "69df8ab1e6f3f72c29bfc3b2",
        "roadmapId": "69dfa9512ed4d9c9b4957625",
        "dayId": "m1-w1-d1",
        "type": "Learning",
        "content": {
            "parts": [
                {
                    "cards": [
                        {
                            "cardNumber": 1,
                            "content": "React is a JavaScript library for ..... so on .
                        },
                        {
                            "cardNumber": 2,
                            "content": "A key innovation of React is the ..... so on .
                        },
                        {
                            "cardNumber": 3,
                            "content": "React's declarative paradigm is...... so on 
                        }
                    ],
                    "miniExercise": {
                        "correctIndex": 0,
                        "explanation": "The Virtual DOM is React's mechanism for optimizing UI updates by comparing a memory representation of the UI and applying only necessary changes to the actual browser DOM.",
                        "options": [
                            "It's an in-memory representation of the UI that React uses to optimize updates.",
                            "It's a way to directly manipulate the browser's HTML elements.",
                            "It's a server-side rendering technique for faster page loads.",
                            "It's a database for storing component state."
                        ],
                        "question": "What is the primary purpose of React's Virtual DOM?"
                    },
                    "partNumber": 1,
                    "partTitle": "Understanding React's Core Principles"
                },
                {
                    "cards": [
                        {
                            "cardNumber": 1,
                            "content": "Setting up a React project requires ...... so on.
                        },
                        {
                            "cardNumber": 2,
                            "content": "Vite is a next-generation frontend ...... so on .
                        },
                        {
                            "cardNumber": 3,
                            "content": "When choosing between CRA and ...... so on .
                        }
                    ],
                    "miniExercise": {
                        "correctIndex": 2,
                        "explanation": "Vite's primary advantage during development is its use of native ES Modules, which allows it to start the development server much faster and provide quicker Hot Module Replacement compared to traditional bundlers like Webpack (used by CRA).",
                        "options": [
                            "It integrates directly with AI models.",
                            "It exclusively uses TypeScript.",
                            "It leverages native ES Modules for faster development server startup.",
                            "It only supports server-side rendering."
                        ],
                        "question": "What is a key advantage of Vite for setting up a modern React project, especially for large applications?"
                    },
                    "partNumber": 2,
                    "partTitle": "Setting Up React Projects: CRA vs. Vite"
                },
                {
                    "cards": [
                        {
                            "cardNumber": 1,
                            "content": "JSX (JavaScript XML) is a syntax extension for ...... so on.
                        },
                        {
                            "cardNumber": 2,
                            "content": "When writing JSX, remember a few key ...... so on.
                        },
                        {
                            "cardNumber": 3,
                            "content": "Since browsers don't natively understand ...... so on.
                        }
                    ],
                    "miniExercise": {
                        "correctIndex": 0,
                        "explanation": "JSX requires a single root element. Wrapping multiple sibling elements in a `div` or `React.Fragment` satisfies this requirement. The other options either contain syntax errors or violate the single root element rule.",
                        "options": [
                            "<div><h1>Hello</h1><p>World</p></div>",
                            "<h1>Hello</h1><p>World</p>",
                            "<h1 class='title'>Hello</h1>",
                            "const message = <p>Hello World</p>;"
                        ],
                        "question": "Which of the following is a correctly formed JSX expression?"
                    },
                    "partNumber": 3,
                    "partTitle": "JSX Syntax and Babel's Role"
                }
            ],
            "task": {
                "description": "As a founder architect, you are tasked with initiating the frontend development for a new, AI-powered enterprise product that will handle complex data visualizations and real-time interactions across a global user..........so on..................Additionally, explain how React's core principles (component-based architecture, Virtual DOM, declarative UI) will guide your approach to structuring the product's frontend, emphasizing how these principles contribute to a robust, maintainable, and performant system capable of evolving with AI integration.",
                "questions": [],
                "type": "text"
            }
        },
        "userSubmission": null,
        "aiFeedback": "",
        "status": "pending",
        "completedAt": null,
        "_id": "69dfb9b95363781b04c78bd5",
        "generatedAt": "2026-04-15T16:15:53.480Z",
        "createdAt": "2026-04-15T16:15:53.497Z",
        "updatedAt": "2026-04-15T16:15:53.497Z",
        "__v": 0
    }
}
    }
errors for m1-w1-d1 
{
    Gemini attempt 1 failed: {"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}
getSession error: Error: GEMINI_FAILURE: {"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}
    at generateContent (file:///C:/Users/Ad/OneDrive/Desktop/Skill%20Master/server/src/services/gemini.service.js:995:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async getSession (file:///C:/Users/Ad/OneDrive/Desktop/Skill%20Master/server/src/controllers/session.controller.js:93:17)
Failed to parse Gemini response: {
  "parts": [
    {
      "partNumber": 1,
      "partTitle": "Introduction to React: Core Concepts and Scalability Advantages for Founders & Architects overseeing AI-Powered Enterprise Products, focusing on its component-based architecture and Virtual DOM for performance and maintainability in com
  "parts": [
    {
      "partNumber": 1,
      "partTitle": "Introduction to React: Core Concepts and Scalability Advantages for Founders & Architects overseeing AI-Powered Enterprise Products, focusing on its component-based architecture and Virtual DOM for performance and maintainability in com
    {
      "partNumber": 1,
      "partTitle": "Introduction to React: Core Concepts and Scalability Advantages for Founders & Architects overseeing AI-Powered Enterprise Products, focusing on its component-based architecture and Virtual DOM for performance and maintainability in com
      "partTitle": "Introduction to React: Core Concepts and Scalability Advantages for Founders & Architects overseeing AI-Powered Enterprise Products, focusing on its component-based architecture and Virtual DOM for performance and maintainability in com
Gemini attempt 1 failed: JSON_PARSE_FAILURE
oducts, focusing on its component-based architecture and Virtual DOM for performance and maintainability in com
Gemini attempt 1 failed: JSON_PARSE_FAILURE
Gemini attempt 1 failed: JSON_PARSE_FAILURE
getSession error: Error: JSON_PARSE_FAILURE
    at parseResponse (file:///C:/Users/Ad/OneDrive/Desktop/Skill%20Master/server/src/services/gemini.service.js:861:11)
    at generateContent (file:///C:/Users/Ad/OneDrive/Desktop/Skill%20Master/server/src/services/gemini.service.js:962:29)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async getSession (file:///C:/Users/Ad/OneDrive/Desktop/Skill%20Master/server/src/controllers/session.controller.js:93:17)
[Session Guard] PASS: Learning session structure valid

}
]
```
## test no . 7
```
req:
[
requested same as test 6
]
res:
[
got instant response in 42ms
]
```
## test no . 8
```
req:
[
Method: POST
URL: {{base_url}}/session/m1-w1-d1/submit
Headers:

Content-Type: application/json
Authorization: Bearer {{token}}
Body:
{
  "roadmapId": "{{roadmapId}}",
  "type": "text",
  "taskAnswer": "Python is a high-level interpreted language. I understand variables are containers that store data values. I practiced creating variables and assigning string, integer and float values to them using the assignment operator."
}
]
res:
[
{
    "feedback": "The learner accurately demonstrated an understanding of basic programming concepts, specifically defining variables and assigning different data types (",
    "outcome": "needs_improvement"
}
]
```
## test no . 9
```
req:
[
Method: POST
URL: {{base_url}}/progress/advance
Headers:

Content-Type: application/json
Authorization: Bearer {{token}}
Body:

{
  "roadmapId": "{{roadmapId}}",
  "dayId": "m1-w1-d1",
  "status": "completed"
}
]
res:
[
{
    "success": true,
    "newDay": "Tuesday",
    "newWeek": 1,
    "newModule": 1,
    "roadmapComplete": false
}
]   
```
## test no . 10
```
req:
[
Method: GET
URL: {{base_url}}/roadmap/active
Headers: Authorization: Bearer {{token}}
Body: None
]
res:
[
{
    "roadmapId": "69dfa9512ed4d9c9b4957625",
    "roadmapJson": {
        "skillName": "MERN Stack Product Engineering",
        "targetLevel": "Founder-level Architect",
        "totalModules": 10,
        "estimatedWeeks": 18,
        "modules": [
            {
                "moduleNumber": 1,
                "title": "MERN Stack Fundamentals - Frontend Core (React)",
                "weeks": [and so on.....]
            }
        ]
    },
    "progress": {
        "_id": "69dfa9512ed4d9c9b4957626",
        "userId": "69df8ab1e6f3f72c29bfc3b2",
        "roadmapId": "69dfa9512ed4d9c9b4957625",
        "currentModule": 1,
        "currentWeek": 1,
        "currentDay": "Tuesday",
        "allWeakTopics": [],
        "completedDays": [
            {
                "dayId": "m1-w1-d1",
                "type": "Learning",
                "status": "completed",
                "completedAt": "2026-04-15T16:32:09.275Z"
            }
        ],
        "examAttempts": [],
        "createdAt": "2026-04-15T15:05:53.598Z",
        "updatedAt": "2026-04-15T16:32:09.286Z",
        "__v": 1
    },
    "stats": null
}
]
```
## test no . 11
```
req:
[
Method: GET
URL: {{base_url}}/session/m1-w1-d6?roadmapId={{roadmapId}}
Headers: Authorization: Bearer {{token}}
]
res:(13s delay,1st try)
[
{
    "session": {
        "userId": "69df8ab1e6f3f72c29bfc3b2",
        "roadmapId": "69dfa9512ed4d9c9b4957625",
        "dayId": "m1-w1-d6",
        "type": "Revision",
        "content": {
            "parts": [
                {
                    "cards": [
                        {
                            "cardNumber": 1,
                            "content": "React is a powerful JavaScript library ..... so on .
                        },
                        {
                            "cardNumber": 2,
                            "content": "In modern React development, functional components are .... so on.
                        },
                        {
                            "cardNumber": 3,
                            "content": "Handling user interaction is crucial in web ..... so on.
                        }
                    ],
                    "miniExercise": {
                        "correctIndex": 2,
                        "explanation": "The `useState` hook is specifically designed to add state management capabilities to functional components, allowing them to track and update internal data that affects their rendering.",
                        "options": [
                            "useEffect",
                            "useContext",
                            "useState",
                            "useReducer"
                        ],
                        "question": "Which React hook is used to add local state to a functional component?"
                    },
                    "partNumber": 1,
                    "partTitle": "Module 1 Week 1: Core React Concepts Revision"
                }
            ]
        },
        "userSubmission": null,
        "aiFeedback": "",
        "status": "pending",
        "completedAt": null,
        "_id": "69dfc17f5363781b04c78bd6",
        "generatedAt": "2026-04-15T16:49:03.507Z",
        "createdAt": "2026-04-15T16:49:03.507Z",
        "updatedAt": "2026-04-15T16:49:03.507Z",
        "__v": 0
    }
}
]
```
## test no . 12 
```
req:
[
same as previous just with d7 session id to get exam
]
res:
[
{
    "session": {
        "userId": "69df8ab1e6f3f72c29bfc3b2",
        "roadmapId": "69dfa9512ed4d9c9b4957625",
        "dayId": "m1-w1-d7",
        "type": "Exam",
        "content": {
            "examQuestions": [
                {
                    "correctIndex": 1,
                    "options": [
                        "React XML",
                        "JavaScript XML",
                        "Joint XML",
                        "JSON eXtension"
                    ],
                    "question": "What does JSX stand for in React?",
                    "topicTag": "JSX"
                },
                {
                    "correctIndex": 0,
                    "options": [
                        "Props are immutable, State is mutable",
                        "Props are mutable, State is immutable",
                        "Both are mutable",
                        "Both are immutable"
                    ],
                    "question": "What is the key difference between Props and State in React?",
                    "topicTag": "Props and State"
                },
                {
                    "correctIndex": 2,
                    "options": [
                        "`setState()`",
                        "`modifyState()`",
                        "`useState()`",
                        "`changeState()`"
                    ],
                    "question": "Which React Hook is used to add state to functional components?",
                    "topicTag": "React Hooks"
                },
                {
                    "correctIndex": 3,
                    "options": [
                        "`for` loop",
                        "`while` loop",
                        "`forEach` method",
                        "`map` method"
                    ],
                    "question": "Which array method is commonly used to render a list of items in React?",
                    "topicTag": "Lists"
                },
                {
                    "correctIndex": 0,
                    "options": [
                        "`className`",
                        "`class`",
                        "`cssClass`",
                        "`htmlClass`"
                    ],
                    "question": "When applying CSS classes in JSX, which attribute should be used instead of `class`?",
                    "topicTag": "Styling"
                }
            ]
        },
        "userSubmission": null,
        "aiFeedback": "",
        "status": "pending",
        "completedAt": null,
        "_id": "69dfc2015363781b04c78bd7",
        "generatedAt": "2026-04-15T16:51:13.224Z",
        "createdAt": "2026-04-15T16:51:13.225Z",
        "updatedAt": "2026-04-15T16:51:13.225Z",
        "__v": 0
    }
}
]
```
## test no . 13
```
req : 
[
Method: POST
URL: {{base_url}}/session/m1-w1-d7/exam
Headers:
Content-Type: application/json
Authorization: Bearer {{token}}
Body:
{
  "roadmapId": "{{roadmapId}}",
  "answers": [
    { "questionIndex": 0, "selectedIndex": 1 },
    { "questionIndex": 1, "selectedIndex": 0 },
    { "questionIndex": 2, "selectedIndex": 2 },
    { "questionIndex": 3, "selectedIndex": 3 },
    { "questionIndex": 4, "selectedIndex": 0 }
  ]
}
]
res: 
[
{
    "score": 100,
    "passed": true,
    "feedback": "Outstanding! You've passed the exam and demonstrated mastery of this week's topics. You are ready to move forward.",
    "weakTopics": [],
    "nextAction": "advance"
}
]
```
## test no . 14 
```
req:
[
Method: POST
URL: {{base_url}}/progress/advance
Headers:

Content-Type: application/json
Authorization: Bearer {{token}}
Body:

{
  "roadmapId": "{{roadmapId}}",
  "dayId": "m1-w1-d1",
  "status": "completed"
}
]
res;
[
{
    "success": true,
    "newDay": "Monday",
    "newWeek": 2,
    "newModule": 1,
    "roadmapComplete": false
}
]
```
## test no . 15 
```
req:
[
    Method: POST
URL: {{base_url}}/session/m1-w1-d7/exam
Headers:
Content-Type: application/json
Authorization: Bearer {{token}}
Body:
{
  "roadmapId": "{{roadmapId}}",
  "answers": [
    { "questionIndex": 0, "selectedIndex": 3 },
    { "questionIndex": 1, "selectedIndex": 2 },
    { "questionIndex": 2, "selectedIndex": 0 },
    { "questionIndex": 3, "selectedIndex": 1 },
    { "questionIndex": 4, "selectedIndex": 2 }
  ]
}
]
res: 
[
    {
    "score": 0,
    "passed": false,
    "feedback": "You scored below 80%. We've prepared a targeted revision session for you. Review the weak topics and try the exam again.",
    "weakTopics": [
        "JSX",
        "Props and State",
        "React Hooks",
        "Lists",
        "Styling"
    ],
    "nextAction": "revision"
}
]
```
## test no . 16 
```
req:
[
Method: GET
URL: {{base_url}}/progress/stats?roadmapId={{roadmapId}}
Headers: Authorization: Bearer {{token}}
]
res:
[
{
    "completedSessions": 4,
    "modulesCompleted": "0/10",
    "latestResult": "Failed",
    "revisionTopicsCount": 5,
    "lessonsCompleted": 1,
    "revisionSessions": 0,
    "examsAttempted": 2,
    "examsPassed": 1,
    "lastCompletedTitle": "Exam: Sunday Week 1",
    "lastSessionOutcome": "failed",
    "latestExamScore": 0,
    "latestExamPassed": false,
    "revisionQueue": [
        "JSX",
        "Props and State",
        "React Hooks",
        "Lists",
        "Styling"
    ]
}
]
```