# Deployment Guide: Frontend on Vercel + Backend on Render

This guide is tailored to this repository:
- Frontend: Vite + React app in `frontend`
- Backend: Express API in `backend`
- Database/Auth/Storage: Supabase

## 1) Pre-Deployment Scan Summary

The project was scanned before writing this guide.

Checks run:
- Frontend lint (`npm run lint`): passed
- Frontend production build (`npm run build`): passed
- Backend syntax check (`node --check` on JS/MJS files): passed
- VS Code diagnostics scan: no errors

Notes found during scan:
- Frontend build warns about large chunk size (~6.3 MB). This does not block deployment, but can affect first-load performance.
- Backend `test` script is a placeholder and not a real test suite.

## 2) Recommended Deployment Order

Deploy in this order:
1. Backend on Render
2. Frontend on Vercel

Reason:
- Frontend needs the deployed backend URL for `VITE_API_URL`.

---

## 3) Backend Deployment (Render)

### 3.1 Create Render Web Service

1. Push your latest code to GitHub.
2. In Render dashboard, click `New +` -> `Web Service`.
3. Connect your GitHub repository.
4. Configure service:
- Name: `project-sia-backend` (or your preferred name)
- Root Directory: `backend`
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Plan: choose your preferred tier

Backend listens to `process.env.PORT`, so Render port wiring is compatible.

### 3.2 Backend Environment Variables (Render)

Set these in Render -> Environment:

Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `RECAPTCHA_SECRET`

Recommended (email features):
- `EMAIL_ADMIN_USER`
- `EMAIL_ADMIN_PASS`
- `EMAIL_ORDERS_USER`
- `EMAIL_ORDERS_PASS`

Fallback aliases used in code:
- `EMAIL_USER`
- `EMAIL_PASS`

Do not set `PORT` manually unless needed. Render injects it.

### 3.3 Verify Backend After Deploy

Once deployed, test:
- `GET https://<your-render-service>.onrender.com/api/health`

Expected:
- JSON response with `status: "ok"`

Also test key endpoints quickly:
- `GET /api/products`
- `POST /api/recaptcha/verify` (with test token flow)

### 3.4 Render Backend Troubleshooting

If backend fails to boot:
- Check Render logs for missing env vars (especially Supabase keys).
- Confirm Supabase credentials are valid and not swapped.
- Check that service root is set to `backend`.

If emails fail:
- Check Gmail app-password and sender credentials.
- Verify `EMAIL_*` vars are set exactly.

---

## 4) Frontend Deployment (Vercel)

### 4.1 Create Vercel Project

1. In Vercel dashboard, click `Add New` -> `Project`.
2. Import your GitHub repository.
3. Set project config:
- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 4.2 Frontend Environment Variables (Vercel)

Set these in Vercel -> Settings -> Environment Variables:

Required:
- `VITE_API_URL` = `https://<your-render-service>.onrender.com`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If reCAPTCHA is used on signup:
- `VITE_RECAPTCHA_SITE_KEY`

Important:
- `VITE_API_URL` should not include a trailing slash.
- Frontend calls use `${VITE_API_URL}/api/...`.

### 4.3 SPA Route Rewrites (React Router)

For direct navigation to routes like `/products` or `/orders`, ensure SPA rewrite is enabled.

If your frontend project has no `frontend/vercel.json`, create one with:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This prevents 404 on page refresh for client-side routes.

### 4.4 Verify Frontend After Deploy

Check:
- Home page loads
- Login/signup pages load
- API-powered pages can fetch data
- Checkout/orders flow can reach backend
- Browser console has no `VITE_*` missing warnings

---

## 5) CORS and Security Hardening

Current backend uses broad CORS (`app.use(cors())`). This works for deployment but is permissive.

For production, restrict origin to your Vercel domain:

- Allow only:
  - `https://<your-vercel-domain>.vercel.app`
  - your custom domain if any

Also recommended:
- Rotate Supabase service keys if they were ever exposed.
- Never put `SUPABASE_SERVICE_KEY` in frontend.

---

## 6) Supabase Dashboard Checklist

In Supabase:
- Confirm tables and RLS policies are applied.
- Confirm storage buckets exist (if avatar/image upload is used).
- Confirm Auth settings and allowed redirect URLs include your frontend URL.

For redirect URLs, include:
- `https://<your-vercel-domain>.vercel.app`
- your custom domain if configured

---

## 7) Post-Deploy Smoke Test Checklist

Run this quick flow:
1. Open frontend deployed URL.
2. Register or log in user.
3. Load products list.
4. Add item to cart and open checkout.
5. Place test order (if non-production mode).
6. Visit backend `/api/health`.
7. Test admin auth/OTP flow if enabled.

If all pass, deployment is healthy.

---

## 8) Optional CLI Deploy Commands

### Vercel (frontend)

From repo root:

```powershell
cd frontend
npm install
npm run build
npx vercel
npx vercel --prod
```

### Render (backend)

Render deploy is usually dashboard/Git-based. For local sanity check first:

```powershell
cd backend
npm install
npm start
```

Then push to GitHub branch connected to Render.

---

## 9) Known Production Considerations

- Large frontend chunk warning appears during build. Consider route-based code splitting later for faster first paint.
- Backend has no automated tests yet; consider adding smoke/integration tests for auth, orders, and recaptcha routes.

---

## 10) Quick Reference Values

- Frontend root: `frontend`
- Frontend output: `frontend/dist`
- Backend root: `backend`
- Backend health endpoint: `/api/health`
- Backend default local port: `5174`
- Frontend default local port: `5173`

Deployment architecture target:
- Frontend URL: `https://<vercel-app>.vercel.app`
- Backend URL: `https://<render-service>.onrender.com`
- Frontend env `VITE_API_URL`: backend URL above
