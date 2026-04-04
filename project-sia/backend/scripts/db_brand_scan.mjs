import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function mapCounts(rows, key) {
  const map = new Map();

  if (!Array.isArray(rows)) {
    return [];
  }

  for (const row of rows) {
    let code = 'UNK';
    let name = 'Unknown';

    const brand = row[key];
    if (brand) {
      if (typeof brand === 'object') {
        if (brand.code) code = brand.code;
        if (brand.name) name = brand.name;
      }
    }

    const label = `${code} - ${name}`;
    const prev = map.has(label) ? map.get(label) : 0;
    map.set(label, prev + 1);
  }

  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function summarizeStock(rows) {
  const summary = {
    low: 0,
    healthy: 0,
    high: 0
  };

  for (const row of rows) {
    const stock = Number(row.stock_quantity || 0);
    const reorder = Number(row.reorder_level || 0);

    if (stock <= reorder) {
      summary.low += 1;
    } else if (stock >= reorder + 50) {
      summary.high += 1;
    } else {
      summary.healthy += 1;
    }
  }

  return summary;
}

async function run() {
  const spareRes = await supabase
    .from('spare_parts')
    .select('id, stock_quantity, reorder_level, sparepart_brand_id, sparepart_brands(name, code)')
    .eq('is_active', true);

  const accessoryRes = await supabase
    .from('accessories')
    .select('id, stock_quantity, reorder_level, accessory_brand_id, accessory_brands(name, code)')
    .eq('is_active', true);

  if (spareRes.error) {
    console.error('spare_parts error:', spareRes.error.message);
  }
  if (accessoryRes.error) {
    console.error('accessories error:', accessoryRes.error.message);
  }

  const spareRows = Array.isArray(spareRes.data) ? spareRes.data : [];
  const accessoryRows = Array.isArray(accessoryRes.data) ? accessoryRes.data : [];

  const spareCounts = mapCounts(spareRows, 'sparepart_brands');
  const accessoryCounts = mapCounts(accessoryRows, 'accessory_brands');
  const spareStockSummary = summarizeStock(spareRows);
  const accessoryStockSummary = summarizeStock(accessoryRows);

  console.log('ACTIVE SPARE PARTS TOTAL:', spareRows.length);
  for (const [label, count] of spareCounts) {
    console.log(`  ${label}: ${count}`);
  }
  console.log('  stock status:', spareStockSummary);

  console.log('ACTIVE ACCESSORIES TOTAL:', accessoryRows.length);
  for (const [label, count] of accessoryCounts) {
    console.log(`  ${label}: ${count}`);
  }
  console.log('  stock status:', accessoryStockSummary);
}

run();
