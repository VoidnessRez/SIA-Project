# Backend

This backend is a minimal Express server for the SIA-Project.

Quick start:

```powershell
cd backend
npm install
# create backend/.env from backend/.env.example and fill keys
npm run dev
```

APIs:
- GET /api/products — list products
- POST /api/products — create a product (requires server-side auth middleware)

Notes:
- The backend listens on port 5174 by default (compatible with your frontend dev server port). If you change `PORT` in `.env`, update accordingly.
- CORS is enabled for local development. Configure origins in production.

Supabase integration is handled in `supabaseClient.js`.

Deployment to Vercel
--------------------

Quick steps to deploy this backend to Vercel as a serverless API:

1. Ensure environment variables are set in the Vercel Project Settings (e.g., `SUPABASE_URL`, `SUPABASE_KEY`, `RECAPTCHA_SECRET`, SMTP settings).
2. From the `backend` folder run:

```powershell
npm install
vercel login
vercel --prod
```

3. Vercel will use `vercel.json` and `api/index.js` as the serverless entry point. Routes are forwarded to Express under `/api/*`.

Notes:
- Keep file uploads small or use Supabase storage/direct client uploads because serverless functions have execution and size limits.
- If you need to run the server locally, use `npm start` or `npm run dev` (the app still starts when run directly).

