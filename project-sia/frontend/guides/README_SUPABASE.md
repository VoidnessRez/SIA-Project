# Frontend Supabase Quick Notes

- Copy `frontend/.env.example` to `frontend/.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Use `frontend/src/lib/supabaseClient.js` to query Supabase from React components.
- For auth flows, consider using Supabase Auth and hooking session changes into `AuthContext`.

Example usage:
```javascript
import { supabase } from './lib/supabaseClient';

const { data, error } = await supabase.from('products').select('*');
```
