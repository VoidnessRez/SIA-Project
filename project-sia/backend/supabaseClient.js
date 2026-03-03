// Server-side Supabase client (use service_role key only on the server)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  const missingVars = [];
  if (!SUPABASE_URL) missingVars.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missingVars.push('SUPABASE_SERVICE_KEY');
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}. Check backend/.env file.`);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
  },
});
