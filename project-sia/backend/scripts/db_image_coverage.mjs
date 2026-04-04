import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const spareRes = await supabase.from('spare_parts').select('id, image_url').eq('is_active', true);
  const accessoryRes = await supabase.from('accessories').select('id, image_url').eq('is_active', true);

  const spareRows = Array.isArray(spareRes.data) ? spareRes.data : [];
  const accessoryRows = Array.isArray(accessoryRes.data) ? accessoryRes.data : [];

  const spareWithImage = spareRows.filter((row) => row.image_url).length;
  const accessoryWithImage = accessoryRows.filter((row) => row.image_url).length;

  console.log(`spare_parts with image_url: ${spareWithImage}/${spareRows.length}`);
  console.log(`accessories with image_url: ${accessoryWithImage}/${accessoryRows.length}`);
}

run();
