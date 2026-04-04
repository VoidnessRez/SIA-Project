import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const tables = ['auth_users', 'profiles', 'orders'];

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log(`${table}: ERROR -> ${error.message}`);
      continue;
    }

    const keys = data && data[0] ? Object.keys(data[0]) : [];
    console.log(`${table} count: ${count}`);
    console.log(`${table} keys: ${keys.join(', ')}`);
  }
}

run();
