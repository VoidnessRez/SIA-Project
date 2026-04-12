# Deployment Guide (Detailed): Frontend on Vercel + Backend on Render

This guide is tailored for this repository structure:
- Frontend: `frontend` (Vite + React)
- Backend: `backend` (Express)
- DB/Auth/Storage: Supabase

Recommended architecture:
- Frontend URL: `https://<your-vercel-app>.vercel.app`
- Backend URL: `https://<your-render-service>.onrender.com`
- Frontend env `VITE_API_URL` should point to the Render backend URL

## 1) Deployment Readiness Checklist

Before deploying, confirm these are true:
- `frontend` builds locally (`npm run build`)
- `backend` starts locally (`npm start`)
- Supabase project is active and accessible
- You have production values for all required environment variables
- You have a GitHub repo connected to both Vercel and Render

Optional but recommended:
- Create a new Git branch for deploy changes (example: `deploy/setup`)
- Tag stable commit before deploying (example: `v1-defense-ready`)

## 2) Important Reality Check for This Codebase

This project can be deployed now for demo/defense, but note:
- Backend test script is placeholder (`backend/package.json`)
- Security hardening is incomplete for real production traffic
- Several frontend files still use hardcoded backend URL patterns in code

For defense/demo this is acceptable. For public launch, hardening is required.

## 3) One-Time Code Preparation

### 3.1 Frontend SPA rewrite for Vercel

React Router routes like `/products` and `/orders` need rewrite to `index.html`.

Create `frontend/vercel.json` if missing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 3.2 Replace hardcoded backend URL usage (important)

Many files currently use:
- `const BACKEND_URL = 'http://localhost:5174'`

For deployed frontend, those files should use:
- `const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174'`

If not updated, deployed frontend may still call localhost and fail in browser.

### 3.3 Optional CORS tightening for backend

Current backend uses permissive CORS (`app.use(cors())`).
For public release, restrict to Vercel origin(s).

## 4) Deploy Backend to Render (First)

Deploy backend first so frontend can point to it.

### 4.1 Create Render Web Service

In Render dashboard:
1. `New +` -> `Web Service`
2. Connect your GitHub repository
3. Configure:
- Name: `project-sia-backend` (or preferred)
- Root Directory: `backend` (or `project-sia/backend` if your GitHub repo has `project-sia` as top-level folder)
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Auto Deploy: ON (recommended)

Do not manually set `PORT` unless needed. Render injects this automatically.

### 4.2 Backend environment variables in Render

Set these in `Render -> Service -> Environment`.

Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `RECAPTCHA_SECRET`

Email-related (if used):
- `EMAIL_ADMIN_USER`
- `EMAIL_ADMIN_PASS`
- `EMAIL_ORDERS_USER`
- `EMAIL_ORDERS_PASS`

Recommended on Render (avoids SMTP timeout issues):
- `EMAIL_TRANSPORT=api`
- `EMAIL_FROM=<verified-sender-email>`
- `EMAIL_FROM_NAME=Mejia Spareparts`
- Optional separate senders:
  - `EMAIL_ADMIN_FROM=<verified-admin-sender-email>`
  - `EMAIL_ORDERS_FROM=<verified-orders-sender-email>`
- Use one API provider:
  - `RESEND_API_KEY=<your-resend-api-key>`
  - or `BREVO_API_KEY=<your-brevo-api-key>`

Fallback aliases found in code:
- `EMAIL_USER`
- `EMAIL_PASS`

### 4.3 Verify backend deployment

After deploy succeeds, test:
- `GET https://<your-render-service>.onrender.com/api/health`

Expected response includes:
- `status: "ok"`

Quick API checks:
- `GET /api/products`
- `GET /api/inventory/products`

PowerShell quick check:

```powershell
Invoke-RestMethod "https://<your-render-service>.onrender.com/api/health"
```

### 4.4 Render issues and fixes

If build fails:
- Confirm Root Directory matches your repository layout:
  - use `backend` if folders are directly at repo root
  - use `project-sia/backend` if repo root contains `project-sia/`
- Confirm Node service type (not static)

If runtime fails on start:
- Check logs for missing env vars
- Confirm Supabase keys are valid and not swapped

If first request is slow:
- Free tier cold-start is normal on Render

## 5) Deploy Frontend to Vercel (Second)

### 5.1 Create Vercel project

In Vercel dashboard:
1. `Add New` -> `Project`
2. Import same GitHub repository
3. Configure:
- Framework Preset: `Vite`
- Root Directory: `frontend`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

### 5.2 Frontend environment variables in Vercel

Set these in `Vercel -> Project -> Settings -> Environment Variables`.

Required:
- `VITE_API_URL=https://<your-render-service>.onrender.com`
- `VITE_SUPABASE_URL=<your-supabase-url>`
- `VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>`

If signup uses reCAPTCHA:
- `VITE_RECAPTCHA_SITE_KEY=<your-site-key>`

Rules:
- No trailing slash on `VITE_API_URL`
- Set for `Production` (and optionally `Preview`, `Development`)

### 5.3 Redeploy after env setup

If env vars are added after first deploy:
- Trigger `Redeploy` in Vercel so vars are baked into build

## 6) Supabase Production Configuration

In Supabase dashboard, verify:
- Required tables and schema migrations are applied
- Storage buckets exist (if image uploads are needed)
- Auth settings have correct site URL and redirect URLs

Recommended Auth URLs:
- `https://<your-vercel-app>.vercel.app`
- Custom domain URL (if you use one)

## 7) End-to-End Smoke Test (Post-Deploy)

Run this in order:
1. Open Vercel frontend URL
2. Navigate to `/products` and ensure data loads
3. Register/login user
4. Add item to cart
5. Open checkout and place test order
6. Confirm backend receives order (`/api/orders`)
7. Check backend health endpoint
8. Check browser console for CORS or env errors

What success looks like:
- No `localhost:5174` calls in deployed browser network tab
- No CORS errors
- API responses are from Render domain

## 8) Common Failure Patterns

### A) Frontend deployed, but no product data
Likely causes:
- `VITE_API_URL` missing/wrong
- Hardcoded localhost URL still in code
- Render backend sleeping/cold start

### B) Refresh on `/products` returns 404 on Vercel
Likely cause:
- Missing `frontend/vercel.json` rewrite

### C) CORS blocked in browser
Likely causes:
- Backend CORS too restrictive or misconfigured
- Frontend using different unexpected domain

### D) Backend starts, but API returns 500
Likely causes:
- Missing Supabase env vars
- Invalid service key
- Supabase schema mismatch/missing migrations

### E) OTP/Receipt email timeout on Render (`ETIMEDOUT`, `CONN`)
Likely cause:
- SMTP ports are blocked or timing out from runtime environment.

Fix:
1. Set `EMAIL_TRANSPORT=api` in Render.
2. Configure `RESEND_API_KEY` or `BREVO_API_KEY`.
3. Set `EMAIL_FROM` to a verified sender in your provider.
4. Redeploy backend and test `/api/auth/send-otp` and order checkout.

## 9) Recommended Production Hardening (After Defense)

Priority items:
1. Replace plaintext auth with password hashing
2. Add proper route auth/role guards for admin endpoints
3. Remove OTP value from API response
4. Restrict CORS to trusted frontend origins
5. Remove hardcoded backend URLs from frontend files
6. Add real tests for auth/orders/inventory flows

## 10) Optional CLI Commands

### Local pre-deploy checks

```powershell
# Frontend
Set-Location frontend
npm install
npm run build

# Backend
Set-Location ..\backend
npm install
npm start
```

### Vercel CLI (frontend)

```powershell
Set-Location frontend
npx vercel
npx vercel --prod
```

Render is usually Git-based via dashboard and auto-deploy on push.

## 11) Rollback Plan

If deployment breaks:
- Vercel: use `Project -> Deployments -> Promote previous stable deployment`
- Render: redeploy previous known-good commit
- Restore previous env values if changed

Keep a known-good tag in Git to speed rollback.

## 12) Quick Reference

- Frontend root: `frontend`
- Frontend output: `frontend/dist`
- Backend root: `backend`
- Backend health: `/api/health`
- Local frontend port: `5173`
- Local backend port: `5174`

Target setup:
- Frontend on Vercel
- Backend on Render
- Supabase as managed backend services

## 13) Copy-Paste Values for This Current Deployment

Use these values exactly for your current live setup.

### 13.1 Render backend URL (confirmed healthy)

Health endpoint tested:
- `https://sia-project-qu9k.onrender.com/api/health`

Expected response includes:
- `"status":"ok"`

Note:
- `Cannot GET /` on `https://sia-project-qu9k.onrender.com/` is normal for this backend.
- Use `/api/...` routes, not `/`.

### 13.2 Vercel environment variables (copy-paste)

Set in `Vercel -> Settings -> Environment Variables`:

```env
VITE_API_URL=https://sia-project-qu9k.onrender.com
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>
```

Rules:
- No trailing slash in `VITE_API_URL`
- Set for `Production` (and optionally `Preview`)
- Redeploy after saving env vars

### 13.3 Frontend API pattern to keep

In frontend source files, use this pattern:

```js
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
```

This keeps local development working while using Render URL in production.

### 13.4 If login shows "Network error. Please try again."

Check these in order:
1. Confirm backend health URL works (`/api/health`).
2. Confirm Vercel `VITE_API_URL` is set correctly.
3. Redeploy Vercel project (env changes require rebuild).
4. Hard refresh browser (`Ctrl + F5`).
5. In browser DevTools -> Network, inspect login request URL:
  - should be `https://sia-project-qu9k.onrender.com/api/auth/login`
  - if it still points to `localhost`, frontend deployment is outdated.
