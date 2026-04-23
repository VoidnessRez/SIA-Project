import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DRY_RUN = String(process.env.DRY_RUN || '').toLowerCase() === '1' ||
  String(process.env.DRY_RUN || '').toLowerCase() === 'true';

function makeCode(prefix) {
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

async function tableExists(table) {
  const { error } = await supabase.from(table).select('id').limit(1);
  if (!error) return true;
  const msg = String(error.message || '').toLowerCase();
  if (msg.includes('does not exist') || msg.includes('could not find the table')) {
    return false;
  }
  throw error;
}

async function seedWholesale() {
  try {
    console.log('🌱 Wholesale seeder starting...');
    if (DRY_RUN) {
      console.log('🧪 DRY_RUN mode enabled. No writes will be executed.');
    }

    const requiredTables = [
      'wholesale_profiles',
      'wholesale_applications',
      'wholesale_tier_rules',
      'wholesale_quotes',
      'wholesale_quote_items'
    ];

    for (const table of requiredTables) {
      const exists = await tableExists(table);
      if (!exists) {
        console.log(`❌ Missing table: ${table}`);
        console.log('   Run migration first: backend/migrations/005_create_wholesale_tables.sql');
        return;
      }
    }

    console.log('✅ Required wholesale tables found.');

    if (DRY_RUN) {
      console.log('✅ DRY_RUN validation completed.');
      return;
    }

    const { data: users, error: userErr } = await supabase
      .from('auth_users')
      .select('id, email, username')
      .limit(1);

    if (userErr) throw userErr;
    if (!users || users.length === 0) {
      console.log('⚠️ No auth_users records found. Skipping wholesale sample inserts.');
      return;
    }

    const user = users[0];

    const profilePayload = {
      user_id: user.id,
      business_name: 'Sample Wholesale Partner',
      business_type: 'motorcycle_parts_retailer',
      tax_id: 'TIN-000-000-000',
      contact_person: user.username || 'Wholesale Contact',
      contact_phone: '09123456789',
      contact_email: user.email || 'wholesale@example.com',
      business_address: 'Sample Address, Antipolo City',
      expected_monthly_volume: 120,
      status: 'pending_review',
      notes: 'Seeded wholesale profile sample',
      updated_at: new Date().toISOString()
    };

    const { data: profile, error: profileErr } = await supabase
      .from('wholesale_profiles')
      .upsert(profilePayload, { onConflict: 'user_id' })
      .select('id, user_id')
      .single();

    if (profileErr) throw profileErr;
    console.log(`✅ Wholesale profile ready (id=${profile.id})`);

    const tierRows = [
      { code: 'WHOLESALE_BRONZE', name: 'Wholesale Bronze', min_items: 10, min_order_amount: 5000, discount_percentage: 5.0, priority: 10, is_active: true },
      { code: 'WHOLESALE_SILVER', name: 'Wholesale Silver', min_items: 25, min_order_amount: 12000, discount_percentage: 10.0, priority: 20, is_active: true },
      { code: 'WHOLESALE_GOLD', name: 'Wholesale Gold', min_items: 50, min_order_amount: 25000, discount_percentage: 15.0, priority: 30, is_active: true },
      { code: 'WHOLESALE_PLATINUM', name: 'Wholesale Platinum', min_items: 100, min_order_amount: 50000, discount_percentage: 20.0, priority: 40, is_active: true }
    ];

    const { error: tierErr } = await supabase
      .from('wholesale_tier_rules')
      .upsert(tierRows, { onConflict: 'code' });

    if (tierErr) throw tierErr;
    console.log('✅ Wholesale tier rules upserted');

    const appNumber = makeCode('WAPP');
    const { data: application, error: appErr } = await supabase
      .from('wholesale_applications')
      .insert({
        wholesale_profile_id: profile.id,
        application_number: appNumber,
        status: 'pending_review',
        notes: 'Seeded wholesale application sample'
      })
      .select('id')
      .single();

    if (appErr) throw appErr;
    console.log(`✅ Wholesale application inserted (id=${application.id})`);

    const { data: product, error: productErr } = await supabase
      .from('spare_parts')
      .select('id, sku, name, selling_price')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (productErr || !product) {
      console.log('⚠️ No active spare_parts product found. Skipping quote item seed.');
      return;
    }

    const quoteNumber = makeCode('WQ');
    const quantity = 12;
    const baseUnit = Number(product.selling_price || 0);
    const discountRate = 0.05;
    const discountAmount = Number((baseUnit * quantity * discountRate).toFixed(2));
    const subtotal = Number((baseUnit * quantity).toFixed(2));
    const total = Number((subtotal - discountAmount).toFixed(2));

    const { data: quote, error: quoteErr } = await supabase
      .from('wholesale_quotes')
      .insert({
        quote_number: quoteNumber,
        wholesale_profile_id: profile.id,
        user_id: user.id,
        status: 'draft',
        valid_until: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
        subtotal,
        discount_amount: discountAmount,
        total_amount: total,
        downpayment_required_amount: Number((total * 0.30).toFixed(2)),
        downpayment_paid_amount: 0,
        payment_policy_snapshot: 'Seeded sample: 30% minimum downpayment, non-refundable once verified.'
      })
      .select('id')
      .single();

    if (quoteErr) throw quoteErr;

    const { data: bronzeTier } = await supabase
      .from('wholesale_tier_rules')
      .select('id')
      .eq('code', 'WHOLESALE_BRONZE')
      .single();

    const finalUnit = Number((baseUnit * (1 - discountRate)).toFixed(2));

    const { error: quoteItemErr } = await supabase
      .from('wholesale_quote_items')
      .insert({
        quote_id: quote.id,
        product_type: 'sparepart',
        product_id: product.id,
        product_sku: product.sku,
        product_name: product.name,
        quantity,
        base_unit_price: baseUnit,
        applied_tier_rule_id: bronzeTier?.id || null,
        discount_percentage: 5,
        discount_amount: discountAmount,
        final_unit_price: finalUnit,
        subtotal: total
      });

    if (quoteItemErr) throw quoteItemErr;

    console.log(`✅ Wholesale quote inserted (id=${quote.id}, number=${quoteNumber})`);
    console.log('🎉 Wholesale seed completed successfully.');
  } catch (error) {
    console.error('❌ Wholesale seed failed:', error.message);
    process.exit(1);
  }
}

seedWholesale();
