import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const nowISO = () => new Date().toISOString();

async function tableExists(tableName) {
  const { error } = await supabase.from(tableName).select('id').limit(1);
  return !error;
}

async function getProfiles(limit = 20) {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .limit(limit);
  return data || [];
}

async function getOrders(limit = 20) {
  const { data } = await supabase
    .from('orders')
    .select('id, user_id, total_amount')
    .limit(limit);
  return data || [];
}

async function getOrderItems(limit = 40) {
  const { data } = await supabase
    .from('order_items')
    .select('id, order_id, product_id')
    .limit(limit);
  return data || [];
}

async function getProducts(limit = 30) {
  const { data } = await supabase
    .from('products')
    .select('id, name, sku')
    .limit(limit);
  return data || [];
}

async function getInventoryProducts(limit = 200) {
  const { data: spareParts } = await supabase
    .from('spare_parts')
    .select('id, name, sku, stock_quantity, selling_price, image_url')
    .eq('is_active', true)
    .limit(limit);

  const { data: accessories } = await supabase
    .from('accessories')
    .select('id, name, sku, stock_quantity, selling_price, image_url')
    .eq('is_active', true)
    .limit(limit);

  const rows = [
    ...(spareParts || []).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: 'spare-parts',
      brand: 'N/A',
      price: Number(p.selling_price || 0),
      stock_quantity: Number(p.stock_quantity || 0),
      low_stock_threshold: 10,
      image_url: p.image_url || null,
      updated_at: nowISO(),
    })),
    ...(accessories || []).map((p) => ({
      id: p.id + 100000, // avoid collision with spare part ids in merged table
      name: p.name,
      sku: p.sku,
      category: 'accessories',
      brand: 'N/A',
      price: Number(p.selling_price || 0),
      stock_quantity: Number(p.stock_quantity || 0),
      low_stock_threshold: 10,
      image_url: p.image_url || null,
      updated_at: nowISO(),
    })),
  ];

  return rows;
}

async function seedIfEmpty(tableName, buildRows) {
  const exists = await tableExists(tableName);
  if (!exists) {
    console.log(`⚠️  Table ${tableName} not found, skipping.`);
    return;
  }

  const { count, error: countError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log(`⚠️  Could not count ${tableName}, skipping.`);
    return;
  }

  if ((count || 0) > 0) {
    console.log(`✅ ${tableName} already has data (${count}), skip seeding.`);
    return;
  }

  const rows = await buildRows();
  if (!rows.length) {
    console.log(`⚠️  No rows generated for ${tableName}, skipping.`);
    return;
  }

  const { error: insertError } = await supabase.from(tableName).insert(rows);
  if (insertError) {
    console.log(`⚠️  Insert failed for ${tableName}: ${insertError.message}`);
    return;
  }

  console.log(`🌱 Seeded ${rows.length} rows into ${tableName}`);
}

async function run() {
  console.log('🌱 Seeding admin page data (feedback/messages/reviews/returns)...');

  const profiles = await getProfiles();
  const orders = await getOrders();
  const orderItems = await getOrderItems();

  await seedIfEmpty('products', async () => {
    const inventoryRows = await getInventoryProducts();
    return inventoryRows;
  });

  const products = await getProducts();

  await seedIfEmpty('messages', async () => {
    const base = profiles.slice(0, 6);
    return base.map((p, i) => ({
      profile_id: p.id,
      subject: `Order concern #${i + 1}`,
      message: `Hi admin, may concern po ako sa order ko. Kindly assist please.`,
      is_read: i % 2 === 0,
      created_at: nowISO(),
    }));
  });

  await seedIfEmpty('feedback', async () => {
    const types = ['bug', 'feature', 'suggestion', 'complaint', 'praise'];
    const base = profiles.slice(0, 8);
    return base.map((p, i) => ({
      profile_id: p.id,
      type: types[i % types.length],
      subject: `Feedback #${i + 1}`,
      message: `This is seeded feedback entry for admin report visibility.`,
      is_read: i % 3 === 0,
      created_at: nowISO(),
    }));
  });

  await seedIfEmpty('reviews', async () => {
    if (!profiles.length || !products.length) return [];
    return products.slice(0, 10).map((prod, i) => ({
      product_id: prod.id,
      user_id: profiles[i % profiles.length].id,
      rating: (i % 5) + 1,
      comment: `Seeded review for ${prod.name}. Quality and fit are good.`,
      is_approved: i % 2 === 0,
      created_at: nowISO(),
    }));
  });

  await seedIfEmpty('return_requests', async () => {
    if (!orders.length || !orderItems.length) return [];
    const reasons = ['defective', 'wrong-item', 'changed-mind', 'other'];
    return orderItems.slice(0, 8).map((item, i) => ({
      order_id: item.order_id,
      order_item_id: item.id,
      reason: reasons[i % reasons.length],
      details: 'Seeded return request for admin testing and visibility.',
      status: i % 3 === 0 ? 'pending' : (i % 3 === 1 ? 'approved' : 'rejected'),
      rejection_reason: i % 3 === 2 ? 'Item not eligible under return policy.' : null,
      created_at: nowISO(),
      updated_at: nowISO(),
    }));
  });

  console.log('✅ Admin page seeding completed.');
}

run().catch((err) => {
  console.error('❌ seed_admin_pages failed:', err.message);
  process.exit(1);
});
