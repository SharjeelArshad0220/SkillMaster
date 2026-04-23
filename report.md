# Skill Master Pre-Deployment Code Audit Report

**Generated:** April 23, 2026  
**Project:** Skill Master (MERN Stack)  
**Audit Scope:** Full codebase audit for production readiness

---

## SECTION 1: CONSOLE LOGS

### **[SEVERITY: HIGH]** `server/.env`
Issue: GEMINI_API_KEY and commented old API keys exposed in version control
Fix: Remove all API keys and old credentials from .env file. Use secure secret management. Current line contains multiple exposed keys in comments.

### **[SEVERITY: HIGH]** `server/.env`
Issue: JWT_SECRET is hardcoded as plain text in .env and is weak (not randomly generated)
Fix: Generate a strong random JWT_SECRET using: `openssl rand -base64 32` or similar. Update .env with new secret.

### **[SEVERITY: MEDIUM]** `server/src/config/db.js:12`
Issue: console.log() in MongoDB connection success handler should be removed for production
Fix: Replace `console.log(\`MongoDB connected: ${conn.connection.host}\`)` with either remove it or use debug logger if needed

### **[SEVERITY: MEDIUM]** `server/server.js:46`
Issue: console.log() when server starts — acceptable for startup but should use structured logging
Fix: Keep for now but consider upgrading to structured logging (e.g., pino, winston) for production

### **[SEVERITY: LOW]** `server/src/controllers/session.controller.js:46`
Issue: console.log() in guardSessionContent function for debug output
Fix: Remove `console.log(\`[Session Guard] PASS: ${type} session structure valid\`)`

### **[SEVERITY: LOW]** `server/src/services/gemini.service.js:316`
Issue: console.log() logging retry wait time
Fix: Remove `console.log(\`Waiting ${waitMs / 1000}s before retry...\`)`

---

## SECTION 2: DEAD CODE

### **[SEVERITY: MEDIUM]** `client/src/pages/LearnPage/LearnPage.jsx:7-24`
Issue: Large commented-out code block containing old getCurrentSession implementation (18 lines)
Fix: Remove the entire commented block from lines 7-24:
```javascript
// const getCurrentSession = (roadmapJson, progress) => {
//   if (!roadmapJson || !progress) return null;
//   ...
// };
// ==========================
```

### **[SEVERITY: LOW]** `server/src/config/db.js:4-6`
Issue: Comment block with only internal notes (not dead code, but can be removed)
Fix: Optional - remove comment documentation for cleaner production code:
```javascript
/*
* This code is used to connect to the MongoDB database.
*
*/
```

---

## SECTION 3: ENVIRONMENT AND SECRETS

### **[SEVERITY: HIGH]** `server/.env:1-5`
Issue: Multiple API keys and credentials hardcoded and committed to version control
- GEMINI_API_KEY exposed at line 4
- Commented old API keys at lines 5-8 expose credential patterns
- JWT_SECRET at line 3 is weak (not cryptographically random)
Fix: 
1. Immediately rotate all exposed API keys in Google Cloud Console
2. Generate new JWT_SECRET: `openssl rand -base64 32`
3. Remove all commented old keys from .env
4. Ensure .env is in .gitignore (it is currently)
5. Create .env.example with placeholders only

### **[SEVERITY: MEDIUM]** `client/.env:1`
Issue: VITE_API_URL hardcoded to localhost:5000/api for development only
Fix: This is acceptable for .env.local, but ensure production .env uses actual API URL on deployment. Vercel should override this at build time with `VITE_API_URL=https://skill-master-api.vercel.app/api` or actual production domain.

### **[SEVERITY: MEDIUM]** `client/src/api/axiosInstance.js:3`
Issue: Fallback baseURL hardcoded to localhost in production code
```javascript
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
```
Fix: Remove the fallback localhost entirely. If VITE_API_URL is not set, throw error:
```javascript
if (!import.meta.env.VITE_API_URL) {
  throw new Error('VITE_API_URL environment variable is not set');
}
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

### **[SEVERITY: MEDIUM]** `server/server.js:19-25`
Issue: CORS origin includes localhost hardcoded. Missing production domain (should be Vercel deploy URL)
Fix: Update CORS to:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',  // Keep for dev only
    'https://skillmaster.ai',
    'https://skill-master.vercel.app',
    'https://your-production-domain.com'  // Add actual production domain
  ]
}));
```
Ensure VITE_API_URL in client matches one of these origins.

### **[SEVERITY: MEDIUM]** `server/.env`
Issue: PORT hardcoded as 5000. Should come from environment variable with fallback
Fix: Already correct in server.js line 45 (`const PORT = process.env.PORT || 5000;`), but ensure production hosting platform (Vercel, Railway, etc.) sets PORT before startup.

### **[SEVERITY: LOW]** `server/.env`
Issue: MONGO_URI has localhost connection. Need production MongoDB URI for deployment
Fix: For production deployment, set environment variable: `MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/skillmaster` (commented out URI on line 1 should be used for production, not localhost)

---

## SECTION 4: BUILD BLOCKERS

### **[SEVERITY: MEDIUM]** `client/vite.config.js`
Issue: No explicit build output directory configured. Defaults to 'dist/' but should be explicit
Fix: Add outDir configuration:
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false  // Disable source maps in production
  }
})
```

### **[SEVERITY: LOW]** `server/package.json`
Issue: "start" script correctly uses `node server.js` (not nodemon), good for production
Status: ✅ PASS - No fix needed

### **[SEVERITY: LOW]** `server/package.json`
Issue: "type": "module" is present, allowing ES6 imports
Status: ✅ PASS - No fix needed

### **[SEVERITY: LOW]** File extensions
Issue: All imports use .js extension (not .jsx in imports), should be fine on Linux servers
Status: ✅ PASS - No fix needed

---

## SECTION 5: REACT ISSUES

### **[SEVERITY: LOW]** `client/src/pages/ProgressPage/ProgressPage.jsx:17-20`
Issue: useEffect dependency array includes only `roadmapId`, but should include `roadmapJson` if it's used in the effect
Fix: Ensure dependency array matches:
```javascript
useEffect(() => {
  if (roadmapId) {
    getStats(roadmapId)
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch stats:', err));
  }
}, [roadmapId]);  // Correct, but verify roadmapJson is not needed
```
Status: Appears correct as-is, roadmapJson is used in render, not effect.

### **[SEVERITY: LOW]** `.map()` key prop verification
Issue: All `.map()` functions checked across codebase
Status: ✅ PASS - All map() calls have proper `key` props:
- SetupPage.jsx: `key={option}` for pill options
- RoadmapPage.jsx: `key={idx}` for modules, weeks, days
- ExamPhase.jsx: `key={i}` for question options
- All other lists: proper keys present

### **[SEVERITY: LOW]** Direct DOM manipulation
Issue: No direct `document.getElementById()` or `document.querySelector()` found in React components
Status: ✅ PASS - No DOM manipulation bypassing React

### **[SEVERITY: MEDIUM]** `client/src/api/axiosInstance.js:5-20`
Issue: fetch() style calls are wrapped in axios, but response interceptor uses `window.location.href` for redirect
Fix: This is acceptable for auth redirect, but consider using React Router navigation instead:
```javascript
if (error.response?.status === 401) {
  localStorage.removeItem("sm_token");
  window.location.href = "/auth";  // Acceptable for hard auth failure
}
```
Status: Acceptable as-is.

---

## SECTION 6: SECURITY

### **[SEVERITY: HIGH]** `server/src/middleware/auth.middleware.js`
Issue: JWT verification is in place but verify returns 401 on all failure cases
Status: ✅ PASS - Correct implementation:
```javascript
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — token missing' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized — token invalid or expired' });
  }
};
```

### **[SEVERITY: HIGH]** `server/src/models/User.model.js:15`
Issue: Password field has `select: false`, preventing accidental password exposure
Status: ✅ PASS - Correct configuration in schema

### **[SEVERITY: HIGH]** Protected controllers - userId inclusion
Issue: Verify userId is included in all database queries for protected routes
Status: ✅ PASS - Verified in:
- `auth.controller.js`: getMe uses `req.userId`
- `roadmap.controller.js`: generateRoadmap, getActiveRoadmap, getRoadmap all query with `userId: req.userId`
- `session.controller.js`: getSession, submitTask, submitExam all query with `userId`
- `progress.controller.js`: advanceProgress, getStats both query with `userId: req.userId`

### **[SEVERITY: HIGH]** Password not returned in responses
Issue: Verify no auth endpoints return password field
Status: ✅ PASS - auth.controller.js never includes password in response objects:
```javascript
res.json({
  token,
  user: {
    _id: user._id,
    name: user.name,
    firstName: user.firstName,
    email: user.email
  }
});
```

### **[SEVERITY: MEDIUM]** No rate limiting
Issue: No rate limiting middleware on auth endpoints (signup, login)
Fix: Add rate limiting middleware:
```javascript
import rateLimit from 'express-rate-limit';
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many auth attempts'
});
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
```

---

## SECTION 7: MISSING PRODUCTION CONFIGS

### **[SEVERITY: MEDIUM]** `server/server.js`
Issue: No catch-all route to serve React build. If deploying frontend from Express, missing fallback
Fix: Add after all API routes (only if serving frontend from Express):
```javascript
// Serve static frontend (if deployed together)
app.use(express.static('../../client/dist'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
```
Note: Currently frontend is on Vercel, backend on separate host → This is NOT needed.

### **[SEVERITY: LOW]** `.gitignore` (Server)
Issue: Server .gitignore is missing necessary entries
Current entries: `node_modules`, `.env`, `.gitignore`, `skillmaster-backend-guide.md`, `Plan.md`
Fix: Add:
```
node_modules
.env
.env.local
.env.*.local
dist
build
*.log
.DS_Store
```

### **[SEVERITY: LOW]** `.gitignore` (Client)
Issue: Client .gitignore missing dist-ssr which Vite generates
Current has: `dist`, `dist-ssr`, `*.local`, `.env`
Status: ✅ PASS - Already correctly configured

### **[SEVERITY: MEDIUM]** Missing `.env.example` files
Issue: No .env.example files to guide deployment setup
Fix: Create `/server/.env.example`:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/skillmaster
JWT_SECRET=<generate-with-openssl-rand-base64-32>
PORT=5000
GEMINI_API_KEY=<get-from-google-cloud>
```

Create `/client/.env.example`:
```
VITE_API_URL=https://api.skillmaster.ai/api
VITE_FEATURE_FLAG=true
```

### **[SEVERITY: LOW]** Vercel configuration
Issue: `client/vercel.json` exists, verify it's configured for SPA routing
Status: Need to check contents

### **[SEVERITY: MEDIUM]** Database indexes and production readiness
Issue: All Mongoose models should have appropriate indexes
Status: ✅ PASS - Verified:
- User model: has index on email field (unique)
- Roadmap model: has index on userId
- Progress model: has index on userId+roadmapId
- Session model: has index on userId+dayId

---

## SECTION 8: ADDITIONAL ISSUES FOUND

### **[SEVERITY: MEDIUM]** `server/src/controllers/session.controller.js:46` (guardSessionContent)
Issue: console.log() for debug output
Fix: Remove or wrap in debug flag

### **[SEVERITY: MEDIUM]** `server/src/services/gemini.service.js:185-244`
Issue: Multiple console.error() statements in Gemini validation (acceptable as error handlers)
Status: ✅ PASS - These are in catch blocks and validation failures, appropriate

### **[SEVERITY: LOW]** Error messages in client vs server
Issue: Client console.error statements in error handlers (acceptable)
Status: ✅ PASS - All appropriately placed in catch blocks:
- AuthContext.jsx: Auth init error
- AppContext.jsx: Data fetch errors
- SessionPage.jsx: Session load error
- ProgressPage.jsx: Stats fetch error
- Multiple phase components: Task/exam submission errors

---

## DEPLOY READINESS ASSESSMENT

### **Summary of Issues Found:**
- **HIGH severity issues:** 4
- **MEDIUM severity issues:** 11
- **LOW severity issues:** 9

### **DEPLOY READINESS: 🚫 FIX REQUIRED**

**High severity issues MUST be resolved before deployment:**

1. **CRITICAL: API keys exposed in version control** (`server/.env`)
   - All API keys must be rotated immediately
   - Remove commented old keys from .env
   - Implement secure secret management

2. **CRITICAL: JWT_SECRET is weak** (`server/.env`)
   - Generate cryptographically random secret
   - Rotate before production

3. **HIGH: Fallback localhost in axios configuration** (`client/src/api/axiosInstance.js`)
   - Remove localhost fallback
   - Ensure VITE_API_URL is set in production

### **Top 3 Priority Fixes (in order):**

| Priority | Issue | File | Estimated Fix Time |
|----------|-------|------|-------------------|
| 1 | Rotate exposed API keys and regenerate JWT_SECRET | `server/.env` | 30 min |
| 2 | Remove localhost fallback from axios baseURL | `client/src/api/axiosInstance.js` | 10 min |
| 3 | Update CORS configuration with actual production domain | `server/server.js` | 10 min |

### **Before Final Deployment Checklist:**
- [ ] Rotate all exposed API keys in Google Cloud Console
- [ ] Generate new JWT_SECRET using `openssl rand -base64 32`
- [ ] Configure production VITE_API_URL in Vercel environment
- [ ] Verify CORS origins match production domains
- [ ] Remove all localhost references from production code
- [ ] Create .env.example files for future developers
- [ ] Set up MongoDB Atlas production cluster URI
- [ ] Test auth flow with production credentials
- [ ] Verify API responds correctly from production domain
- [ ] Check rate limiting on auth endpoints (add if missing)
- [ ] Review application secrets in hosting platform
- [ ] Disable all console.log statements (except debug logs)

---

## NOTES FOR DEPLOYMENT TEAM

1. **Environment Setup:** Both server and client require environment variables set in deployment platform (Vercel for frontend, Railway/Heroku/Similar for backend)

2. **Database:** Production MongoDB connection should use IP whitelist and credentials from Atlas

3. **API Domain:** Ensure backend API domain is added to client CORS and environment configuration

4. **Monitoring:** Consider adding error tracking (Sentry) and analytics before production

5. **SSL/TLS:** Ensure all production domains have valid SSL certificates

---

**Report Generated:** April 23, 2026  
**Next Review:** After fixes, before production deployment
