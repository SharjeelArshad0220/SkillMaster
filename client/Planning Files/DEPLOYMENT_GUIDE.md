# Complete Vercel Deployment Guide for Vite + React SPA (Skill Master)

This guide provides step-by-step instructions for deploying your Vite + React single-page application (SPA) to Vercel, specifically configured for a project where the frontend is in the `client/` subdirectory.

---

## Step 1: Push Your Code to GitHub
Ensure all your local changes (including the `client/vercel.json` file) are committed and pushed to your GitHub repository.

1. Open your terminal in the project root.
2. Run:
   ```bash
   git add .
   git commit -m "Add Vercel configuration for SPA routing"
   git push origin main
   ```

---

## Step 2: Connect GitHub Repo to Vercel
1. Open [vercel.com](https://vercel.com) in your browser.
2. **Log in**: Click **Login** and select **Continue with GitHub**.
3. **Add New Project**: On the Vercel Dashboard, click the **Add New...** button in the top right and select **Project**.
4. **Import Repository**:
   - You will see a list of your GitHub repositories.
   - Find your **Skill Master** repo and click **Import**.
   - *Note: If you don't see it, ensure Vercel has permissions to access that repository in your GitHub settings.*

---

## Step 3: Configure the Project (The Most Important Part)
Once imported, you will be on the **Configure Project** screen. **Wait!** Do not click Deploy yet.

1. **Project Name**: You can leave this as-is (e.g., `skill-master-frontend`).
2. **Framework Preset**: Vercel should automatically detect **Vite**. If it says "Other", click the dropdown and select **Vite**.
3. **Root Directory**:
   - Click the **Edit** button next to the "Root Directory" (currently set to `./`).
   - A folder picker will appear. Select the `client` folder.
   - Click **Continue**.
4. **Build and Output Settings**:
   - Click the "Build and Output Settings" section to expand it.
   - **Build Command**: Ensure it says `npm run build` (this matches your `package.json`).
   - **Output Directory**: Ensure it says `dist` (default for Vite).
   - **Install Command**: `npm install` or `npm ci` (leave as default).

---

## Step 4: Add Environment Variables (Optional but Recommended)
Even if you haven't built the backend yet, here is how you set them up for the future:

1. Expand the **Environment Variables** section on the same configuration page.
2. **Key**: Type `VITE_API_URL`.
3. **Value**: For now, you can put a placeholder like `https://api.example.com` or leave it blank if not used.
4. Click **Add**.
5. **Warning**: For Vite, all environment variables **MUST** start with `VITE_` or they will be ignored by the browser for security reasons.

---

## Step 5: Deploy
1. Click the **Deploy** button.
2. Vercel will start building your project. You can click on the "Build Logs" to watch the progress.
3. Once finished, you will see a "Congratulations!" screen with a preview image of your app.
4. Click the preview image to open your live URL!

---

## Step 6: Handling SPA Routing (No 404 on Refresh)
We have already added a `vercel.json` file in the `client/` directory with the following content:

**File Path**: `client/vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Why is this needed?
In a Single Page Application (SPA) like yours:
- React Router handles "routes" like `/dashboard` or `/setup` entirely in the browser.
- When you click a link in the app, it works because JavaScript updates the URL.
- **BUT**, if you refresh the page or type `your-app.vercel.app/dashboard` into a new tab, the browser asks the Vercel server for a file named `/dashboard`.
- Since `/dashboard` doesn't exist on the server (only `index.html` does), the server returns a **404 error**.

### How to test it:
1. Open your Vercel URL (e.g., `https://skill-master-xyz.vercel.app`).
2. Navigate to a route within the app (e.g., `/auth` or `/setup`).
3. **Press the Refresh button** on your browser.
4. If it reloads correctly without a 404, the `vercel.json` rewrite is working perfectly!

---

## Step 7: Local Development Environment Variables
When working locally, you should use a `.env` file.

1. Create a file named `.env` inside the `client/` folder.
2. Add your variables:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_FEATURE_FLAG=true
   ```
3. **How to use them in your React code**:
   ```javascript
   const apiUrl = import.meta.env.VITE_API_URL;
   console.log("Current API URL:", apiUrl);
   ```
4. **Security Note**: Never commit your `.env` file to GitHub if it contains secrets. Your `.gitignore` is already configured to ignore `.env`.

---

## Troubleshooting: Common Problems and Fixes

### 1. Vercel Deploy Fails
*   **Check Build Logs**: Read the last few lines of the error message on Vercel.
*   **Wrong Root Directory**: Make sure you selected the `client` folder as the Root Directory in Vercel settings.
*   **Missing Dependencies**: Ensure all libraries you are using are listed in `client/package.json`.

### 2. "Undefined" Environment Variables
*   **Name Prefix**: Does the variable name start with `VITE_`? If it's just `API_URL`, Vite will not expose it to your React code.
*   **Missing Redeploy**: If you update environment variables in the Vercel Dashboard settings, you **must** trigger a new deployment for the changes to take effect (Vite injects these at build time).

### 3. SPA 404 on Refresh
*   **Check File Location**: Ensure `vercel.json` is inside the `client/` folder.
*   **Check Syntax**: Ensure the JSON is valid (use double quotes and proper brackets).
