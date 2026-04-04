import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('accessories')
    .select('id, sku, image_url')
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (error) {
    console.error(error.message);
    return;
  }

  console.log(JSON.stringify((data || []).slice(0, 8), null, 2));
}

run();
