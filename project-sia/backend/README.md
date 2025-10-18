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
