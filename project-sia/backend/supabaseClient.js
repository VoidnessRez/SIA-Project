// Server-side Supabase client (use service_role key only on the server)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ override: true });
//supabase client for server side, Configuration for backend supabase client.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  const missingVars = [];
  if (!SUPABASE_URL) missingVars.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missingVars.push('SUPABASE_SERVICE_KEY');
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}. Check backend/.env file.`);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientNetworkError = (error) => {
  const code = error?.cause?.code || error?.code;
  return ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENETUNREACH', 'UND_ERR_CONNECT_TIMEOUT'].includes(code);
};

const resilientFetch = async (input, init = {}) => {
  const controller = new AbortController();
  const timeoutMs = 15000;
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  const requestInit = { ...init, signal: controller.signal };

  try {
    const response = await fetch(input, requestInit);
    clearTimeout(timeoutHandle);
    return response;
  } catch (error) {
    clearTimeout(timeoutHandle);

    if (!isTransientNetworkError(error)) {
      throw error;
    }

    await wait(250);
    return fetch(input, init);
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
  },
  global: {
    fetch: resilientFetch,
  },
});
