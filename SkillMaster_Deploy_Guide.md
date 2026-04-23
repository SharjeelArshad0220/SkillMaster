# Skill Master — A to Z Deployment Guide
## From local machine to live on the internet

**Stack:** React 18 + Vite (Frontend) · Node.js + Express (Backend) · MongoDB Atlas (Database)
**Hosting:** Vercel (Frontend) · Railway (Backend) · MongoDB Atlas M0 (Free DB)
**Domain:** Optional — GitHub Student Pack (.me free) or Namecheap/Porkbun (.pro ~$1–3/year)

---

# PHASE 1 — Code Fixes Before Deploying

These are things you must fix in your code before touching any hosting platform. Do them in this order.

---

## Task 1.1 — Fix CORS in server.js

Right now your CORS only allows localhost. In production your frontend will be at a Vercel URL, not localhost. If you don't fix this, every API call from Vercel will be blocked with a CORS error.

**Step 1:** Open `server/server.js`

**Step 2:** Find this line (or similar):
```js
app.use(cors({ origin: "http://localhost:5173" }));
```

**Step 3:** Replace with:
```js
const allowedOrigins = [
  "http://localhost:5173",
  "https://skillmaster.vercel.app",      // your Vercel URL — update after deploy
  "https://skillmaster.ai",              // your custom domain — add when you have it
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
```

**Note:** You will come back and add your real Vercel URL here after Phase 3. For now, put a placeholder — it doesn't break the backend, it just means the frontend won't connect until you update it.

---

## Task 1.2 — Fix server.js start script

Railway runs `npm start` — not `npm run dev`. Nodemon must not run in production.

**Step 1:** Open `server/package.json`

**Step 2:** Find the scripts section. Make sure it looks exactly like this:
```json
"scripts": {
  "dev": "nodemon server.js",
  "start": "node server.js"
}
```

If "start" is missing, add it. If "start" still uses nodemon, change it to `node server.js`.

---

## Task 1.3 — Fix frontend API URL

Your frontend must not have `http://localhost:5000` hardcoded anywhere. It must use an environment variable so it points to Railway in production.

**Step 1:** Open `client/src/api/index.js` (your axios base instance)

**Step 2:** Confirm it reads the base URL like this:
```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

If you have `http://localhost:5000/api` hardcoded anywhere, replace it with `import.meta.env.VITE_API_URL`.

**Step 3:** Create `client/.env.local` (this file is for local dev only — never committed):
```
VITE_API_URL=http://localhost:5000/api
```

**Step 4:** Create `client/.env.production` (this is used when Vercel builds):
```
VITE_API_URL=https://your-app.up.railway.app/api
```

You will fill in the Railway URL after Phase 3. For now, create the file with a placeholder.

---

## Task 1.4 — Fix .gitignore files

**Step 1:** Make sure `server/.gitignore` contains at minimum:
```
node_modules
.env
```

**Step 2:** Make sure `client/.gitignore` contains at minimum:
```
node_modules
dist
.env.local
```

Note: `.env.production` CAN be committed because it contains no secrets — just the Railway URL. But `.env.local` must NOT be committed because it's your personal local setup.

---

## Task 1.5 — Test local build

Before deploying, verify your code actually builds without errors.

**Step 1:** Open your terminal. Go to the client folder:
```bash
cd client
npm run build
```

**Step 2:** Watch for errors. A successful build ends with something like:
```
✓ built in 4.21s
dist/index.html              0.46 kB
dist/assets/index-abc123.js  312.45 kB
```

**Step 3:** If there are errors — fix them before continuing. Do not deploy a broken build.

**Step 4:** Test the backend starts cleanly:
```bash
cd server
npm start
```

If it says `MongoDB connected` and `Server running on port 5000` — you are good.

---

# PHASE 2 — MongoDB Atlas Setup

Your MongoDB is currently running locally. In production, it must be on Atlas (cloud MongoDB). This is free.

---

## Task 2.1 — Create Atlas Account and Cluster

**Step 1:** Go to [cloud.mongodb.com](https://cloud.mongodb.com)

**Step 2:** Click **Try Free** → Sign up with your Google account or email

**Step 3:** After login, you land on the Organization page. Click **Create a project** → name it `skillmaster` → click **Create Project**

**Step 4:** Click **Create a deployment** (big green button or in the left sidebar under Database)

**Step 5:** Choose **M0 Free** (the free tier). It will be selected by default. Make sure it says **FREE** before continuing.

**Step 6:** Under Provider, choose **AWS**. Under Region, choose the closest to your users. For Pakistan, choose **Mumbai (ap-south-1)** or **Singapore (ap-southeast-1)**.

**Step 7:** Name your cluster `skillmaster-cluster`. Click **Create Deployment**.

**Step 8:** A popup will ask you to create a database user. Fill in:
- Username: `skillmaster-admin`
- Password: Click **Autogenerate Secure Password** → copy the password immediately → save it in Notepad. You will never see it again.

**Step 9:** Click **Create Database User**.

**Step 10:** On the next screen it asks about IP Access. Click **Add My Current IP Address** to add your laptop for local testing. Then also click **Add IP Address** and type `0.0.0.0/0` — this allows Railway (which has dynamic IPs) to connect. Click **Confirm**.

**Step 11:** Click **Finish and Close**.

---

## Task 2.2 — Get Your Connection String

**Step 1:** In the Atlas dashboard, click **Database** in the left sidebar.

**Step 2:** Find your `skillmaster-cluster`. Click **Connect**.

**Step 3:** A modal opens. Click **Drivers**.

**Step 4:** Under Driver, select **Node.js**. Under Version, select **5.5 or later**.

**Step 5:** You will see a connection string like:
```
mongodb+srv://skillmaster-admin:<password>@skillmaster-cluster.abc12.mongodb.net/?retryWrites=true&w=majority
```

**Step 6:** Copy this string. Replace `<password>` with the password you saved in Task 2.1.

**Step 7:** Add your database name at the end before the `?`:
```
mongodb+srv://skillmaster-admin:YOURPASSWORD@skillmaster-cluster.abc12.mongodb.net/skillmaster?retryWrites=true&w=majority
```

**Step 8:** Save this full string. This is your `MONGO_URI`. You will use it in Phase 3.

---

## Task 2.3 — Test Atlas Connection Locally

**Step 1:** Open `server/.env`

**Step 2:** Replace your local `MONGO_URI`:
```
MONGO_URI=mongodb://localhost:27017/skillmaster
```

With your Atlas URI:
```
MONGO_URI=mongodb+srv://skillmaster-admin:YOURPASSWORD@skillmaster-cluster.abc12.mongodb.net/skillmaster?retryWrites=true&w=majority
```

**Step 3:** Restart your backend:
```bash
cd server
npm start
```

**Step 4:** Terminal should say `MongoDB connected` — now connecting to Atlas, not local. If it fails, double-check your password has no special characters that need URL-encoding (replace `@` with `%40`, `#` with `%23` if present in password).

---

# PHASE 3 — Backend on Railway

Railway hosts your Node.js + Express server.

---

## Task 3.1 — Push Code to GitHub

Railway deploys from GitHub. Your code must be on GitHub first.

**Step 1:** Go to [github.com](https://github.com) → click **New repository** (the green button or the + icon top right)

**Step 2:** Name it `skill-master`. Set it to **Private**. Do NOT initialize with README (your code already has files). Click **Create repository**.

**Step 3:** GitHub shows you commands. In your terminal, go to your project root (the folder containing both `/client` and `/server`):
```bash
git init
git add .
git commit -m "Initial commit — Skill Master MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/skill-master.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

**Step 4:** Refresh GitHub — your code should be there. Confirm `/server` and `/client` folders are visible.

---

## Task 3.2 — Create Railway Account

**Step 1:** Go to [railway.app](https://railway.app)

**Step 2:** Click **Login** → **Login with GitHub** → Authorize Railway

**Step 3:** You land on a dashboard. Click **New Project** (top right or center of screen)

---

## Task 3.3 — Deploy Backend on Railway

**Step 1:** In the New Project modal, click **Deploy from GitHub repo**

**Step 2:** If it asks to install Railway GitHub App — click **Configure GitHub App** → select your `skill-master` repo → click **Save**

**Step 3:** Back in Railway, your `skill-master` repo should appear in the list. Click it.

**Step 4:** Railway will ask: what do you want to deploy? It will show you the root of the repo. You need to tell it to only deploy the `/server` folder.

Click on the service that was created. Then click **Settings** tab.

**Step 5:** Under **Source**, find **Root Directory**. Click it and type: `server`

**Step 6:** Under **Build**, find **Build Command**. Type: `npm install`

**Step 7:** Under **Build**, find **Start Command**. Type: `npm start`

**Step 8:** Click **Deploy** (or it may deploy automatically after saving).

**Step 9:** Click the **Deploy** tab to watch the logs. Wait for it to say `Server running on port XXXX` and `MongoDB connected`. If it fails, read the error in the logs.

---

## Task 3.4 — Add Environment Variables to Railway

Your backend needs its secrets. Railway stores these safely.

**Step 1:** Click on your service in Railway. Click the **Variables** tab.

**Step 2:** Click **New Variable** for each of these. Type the name exactly as shown:

| Variable Name | Value |
|---------------|-------|
| `MONGO_URI` | Your full Atlas connection string from Task 2.2 |
| `JWT_SECRET` | A random 40+ character string — generate one at random.org or type random characters |
| `GEMINI_API_KEY` | Your key from Google AI Studio |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |

**Step 3:** After adding all variables, Railway will automatically redeploy. Watch the logs — confirm `MongoDB connected` appears.

---

## Task 3.5 — Get Your Railway Backend URL

**Step 1:** Click on your service. Click the **Settings** tab.

**Step 2:** Scroll to **Networking**. Click **Generate Domain**.

**Step 3:** Railway gives you a URL like `skill-master-production.up.railway.app`. Copy it.

**Step 4:** Test it: open your browser and go to:
```
https://skill-master-production.up.railway.app/api/health
```

You should see: `{"status":"ok","timestamp":"..."}`

If you see this — your backend is live. If not, check the logs in Railway.

**Step 5:** Now go back to Task 1.1 in your code. Update the CORS allowed origins with your Railway URL. Commit and push:
```bash
git add .
git commit -m "Add Railway URL to CORS"
git push
```

Railway will auto-redeploy on push.

---

# PHASE 4 — Frontend on Vercel

Vercel hosts your React + Vite frontend.

---

## Task 4.1 — Create Vercel Account

**Step 1:** Go to [vercel.com](https://vercel.com)

**Step 2:** Click **Sign Up** → **Continue with GitHub** → Authorize Vercel

**Step 3:** Vercel asks to install on GitHub. Click **Install** → select your `skill-master` repo → click **Save**

---

## Task 4.2 — Import and Deploy Frontend

**Step 1:** In Vercel dashboard, click **Add New** → **Project**

**Step 2:** Find your `skill-master` repo in the list. Click **Import**.

**Step 3:** Vercel detects the project. You need to configure it for the `/client` subfolder:

- Under **Framework Preset**: Select **Vite** (it may auto-detect it)
- Under **Root Directory**: Click **Edit** → type `client` → click **Continue**

**Step 4:** Under **Build and Output Settings**:
- Build Command: `npm run build` (should be auto-filled)
- Output Directory: `dist` (should be auto-filled)
- Install Command: `npm install` (should be auto-filled)

**Step 5:** Under **Environment Variables**, click **Add** for each:

| Variable Name | Value |
|---------------|-------|
| `VITE_API_URL` | `https://skill-master-production.up.railway.app/api` (your Railway URL + /api) |

**Step 6:** Click **Deploy**. Vercel builds your app. Wait 1–2 minutes.

**Step 7:** When it says **Congratulations!**, click **Visit** to see your live app.

**Step 8:** Test the full flow: Sign up → Generate roadmap → Enter session. If the frontend loads but API calls fail, check CORS in server.js and confirm your Vercel URL is in the allowed origins.

---

## Task 4.3 — Get Your Vercel URL and Update CORS

**Step 1:** In Vercel dashboard, click your project → click **Settings** → click **Domains**. You will see your domain like `skill-master-xyz.vercel.app`.

**Step 2:** Go back to your code. Open `server/server.js`. Add this Vercel URL to your CORS allowed origins:
```js
"https://skill-master-xyz.vercel.app",
```

**Step 3:** Commit and push:
```bash
git add .
git commit -m "Add Vercel URL to CORS"
git push
```

Railway auto-redeploys. Then re-test the full app flow.

---

# PHASE 5 — Custom Domain (Optional)

A custom domain makes skillmaster.ai or skillmaster.pro instead of skill-master-xyz.vercel.app. This is optional for FYP submission but good practice.

---

## Task 5.1 — Get a Free Domain (GitHub Student Pack)

**Step 1:** Go to [education.github.com/pack](https://education.github.com/pack)

**Step 2:** Click **Get student benefits**. You need to verify with your university email or student ID photo.

**Step 3:** After approval (can take 1–3 days), look for the **name.com** or **namecheap** benefit. GitHub Student Pack includes a free `.me` domain for 1 year via name.com.

**Step 4:** Go to [name.com/github-students](https://name.com/github-students) → search for `skillmaster.me` → claim it for free.

**Alternatively — buy a cheap domain (skip student pack):**

**Step 1:** Go to [porkbun.com](https://porkbun.com)

**Step 2:** Search for `skillmaster.pro` or `skillmaster.app` — usually $1–5/year first year

**Step 3:** Add to cart → checkout (no upsells needed — decline domain privacy, it's optional)

---

## Task 5.2 — Connect Domain to Vercel

**Step 1:** In Vercel dashboard → your project → **Settings** → **Domains**

**Step 2:** Click **Add Domain**. Type your domain: `skillmaster.me` (or whatever you bought). Click **Add**.

**Step 3:** Vercel shows you DNS records to add. There are two types:

**Option A (Recommended — if your domain has no subdomain):**
Vercel shows an **A record**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**Option B (For www subdomain):**
Vercel shows a **CNAME record**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## Task 5.3 — Add DNS Records at Your Registrar

This is where you tell your domain where to point.

**If using Porkbun:**

**Step 1:** Go to [porkbun.com](https://porkbun.com) → Login → click **Domain Management** → find your domain → click **DNS**

**Step 2:** You see a table of DNS records. Delete any existing A records for `@` (the root).

**Step 3:** Click **Add Record**:
- Type: `A`
- Host: leave blank (or type `@`)
- Answer: `76.76.21.21`
- TTL: `600`
- Click **Add**

**Step 4:** Click **Add Record** again:
- Type: `CNAME`
- Host: `www`
- Answer: `cname.vercel-dns.com`
- TTL: `600`
- Click **Add**

**If using name.com:**

**Step 1:** Go to [name.com](https://name.com) → Login → click **My Domains** → click your domain → click **DNS Records**

**Step 2:** Click **Add Record**:
- Type: `A`
- Host: leave blank
- Answer: `76.76.21.21`
- TTL: `300`
- Click **Add Record**

**Step 3:** Click **Add Record** again:
- Type: `CNAME`
- Host: `www`
- Answer: `cname.vercel-dns.com`
- TTL: `300`
- Click **Add Record**

---

## Task 5.4 — Wait for DNS Propagation and Verify SSL

**What DNS propagation means:** After you add DNS records, the internet needs time to update. This takes 5 minutes to 48 hours. Usually under 30 minutes.

**Step 1:** Go back to Vercel → your project → **Settings** → **Domains**. Watch the status next to your domain. It will say **Invalid Configuration** at first, then switch to **Valid Configuration** when propagation completes.

**Step 2:** Once valid, Vercel automatically provisions an **SSL certificate** (this is the `https://` that makes your site secure). You do not need to do anything. It uses Let's Encrypt and does it automatically within 5–10 minutes of DNS going valid.

**What SSL/HTTPS means:** SSL (or TLS — the modern name) encrypts traffic between your user's browser and Vercel's servers. Without it, data is sent in plain text. Vercel handles this completely. You just need to confirm your domain shows `https://` not `http://` when you visit it.

**Step 3:** Visit `https://skillmaster.me` (or your domain). If it loads your app with the padlock icon in the browser — you are done.

**Step 4:** Update CORS in server.js one more time to include your custom domain:
```js
"https://skillmaster.me",
"https://www.skillmaster.me",
```

Commit, push, Railway redeploys.

---

## Task 5.5 — Optional: Set Custom Domain as Primary in Vercel

**Step 1:** In Vercel → your project → **Settings** → **Domains**

**Step 2:** Next to your custom domain, click the three dots → **Set as Primary Domain**

This makes `skillmaster.me` the canonical URL. The `skill-master-xyz.vercel.app` URL still works but redirects to your custom domain.

---

# PHASE 6 — Final Verification Checklist

Run this after everything is live. Check each one in your browser (not localhost).

## Full Flow Test

| Test | Expected Result |
|------|----------------|
| Visit `https://yourdomain.com` | App loads, no white screen |
| Visit `https://yourdomain.com/auth` | Auth page renders correctly |
| Sign up with a new email | Account created, navigated to /setup |
| Generate a roadmap | Roadmap appears after ~15 seconds |
| Click Get Started → session loads | Lesson content appears (not loading spinner) |
| Complete all 3 parts + task | Feedback shown, advance works |
| Go to /progress | Stats show real numbers |
| Open in incognito | Not logged in → redirected to /auth |
| Refresh the page while logged in | Stays on current page, not kicked to /auth |
| Open on mobile browser | Layout looks correct, no horizontal overflow |
| Check browser padlock | Shows `https://` and no certificate warnings |

## Backend Health Checks

Open these URLs in your browser:

| URL | Expected |
|-----|----------|
| `https://your-railway-url.up.railway.app/api/health` | `{"status":"ok"}` |
| `https://your-railway-url.up.railway.app/api/auth/me` (no token) | `{"error":"Unauthorized — token missing"}` |

If health check returns anything other than status ok, your Railway deployment has an issue.

---

# QUICK REFERENCE — Platform URLs

| Platform | Purpose | URL |
|----------|---------|-----|
| MongoDB Atlas | Database dashboard | cloud.mongodb.com |
| Railway | Backend hosting + logs | railway.app |
| Vercel | Frontend hosting + deployments | vercel.com |
| Porkbun | Cheap domain registrar | porkbun.com |
| GitHub Student Pack | Free domain + tools | education.github.com/pack |
| Google AI Studio | Gemini API key + billing | aistudio.google.com |

---

# ENVIRONMENT VARIABLES MASTER LIST

**server/.env (local only — never commit):**
```
PORT=5000
MONGO_URI=mongodb+srv://skillmaster-admin:PASSWORD@cluster.mongodb.net/skillmaster?retryWrites=true&w=majority
JWT_SECRET=your_40_plus_character_random_string_here
GEMINI_API_KEY=your_key_from_google_ai_studio
NODE_ENV=development
```

**Railway Variables (add via dashboard):**
```
PORT=5000
MONGO_URI=same atlas URI as above
JWT_SECRET=same as local
GEMINI_API_KEY=same as local
NODE_ENV=production
```

**client/.env.local (local only — never commit):**
```
VITE_API_URL=http://localhost:5000/api
```

**client/.env.production (committed to git — no secrets):**
```
VITE_API_URL=https://your-railway-url.up.railway.app/api
```

**Vercel Environment Variables (add via dashboard):**
```
VITE_API_URL=https://your-railway-url.up.railway.app/api
```

---

# WHAT HAPPENS WHEN YOU PUSH TO GITHUB

After setup, your deployment pipeline is automatic:

1. You push code to GitHub main branch
2. Railway detects the push → automatically rebuilds and redeploys the backend (2–3 minutes)
3. Vercel detects the push → automatically rebuilds and redeploys the frontend (1–2 minutes)
4. Your live site updates with no manual steps

This means every `git push` = updated live app. Do not push broken code to main.

---

# COSTS SUMMARY

| Service | Cost |
|---------|------|
| MongoDB Atlas M0 | Free forever |
| Railway Hobby plan | $5/month (includes $5 free usage credit — may be free for low-traffic MVP) |
| Vercel Hobby plan | Free forever for personal projects |
| Gemini API (pay-as-you-go) | ~$0–5/month with $5 cap set |
| Domain (.me via student pack) | Free 1 year |
| Domain (.pro via Porkbun) | ~$1–3 first year |
| **Total** | **~$0–10/month** |
