import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedData() {
  try {
    console.log('🌱 Starting to seed products...\n');

    // 1. Get or create brands
    console.log('📋 Setting up brands...');
    const { data: brands, error: brandError } = await supabase
      .from('sparepart_brands')
      .select('id, name, code')
      .limit(1);

    let brandId;
    if (!brands || brands.length === 0) {
      const { data: newBrand } = await supabase
        .from('sparepart_brands')
        .insert([
          { name: 'Bosch', code: 'BOSCH' },
          { name: 'Brembo', code: 'BREMBO' },
          { name: 'Denso', code: 'DENSO' },
          { name: 'NGK', code: 'NGK' }
        ])
        .select();
      brandId = newBrand?.[0]?.id;
      console.log('✅ Created brands');
    } else {
      brandId = brands[0].id;
      console.log('✅ Brands already exist');
    }

    // 2. Get or create part types
    console.log('📋 Setting up part types...');
    const { data: partTypes, error: ptError } = await supabase
      .from('part_types')
      .select('id, name, code')
      .limit(1);

    let partTypeId;
    if (!partTypes || partTypes.length === 0) {
      const { data: newPT } = await supabase
        .from('part_types')
        .insert([
          { name: 'Brake Pads', code: 'BRAKE_PAD', category: 'sparepart' },
          { name: 'Air Filter', code: 'AIR_FILTER', category: 'sparepart' },
          { name: 'Spark Plug', code: 'SPARK_PLUG', category: 'sparepart' },
          { name: 'Battery', code: 'BATTERY', category: 'sparepart' },
          { name: 'Oil Filter', code: 'OIL_FILTER', category: 'sparepart' }
        ])
        .select();
      partTypeId = newPT?.[0]?.id;
      console.log('✅ Created part types');
    } else {
      partTypeId = partTypes[0].id;
      console.log('✅ Part types already exist');
    }

    // 3. Check if spare parts exist
    console.log('📋 Checking spare parts...');
    const { data: existingSpareParts } = await supabase
      .from('spare_parts')
      .select('id')
      .limit(1);

    if (!existingSpareParts || existingSpareParts.length === 0) {
      console.log('📝 Creating spare parts...');
      const { data: createdParts, error: spError } = await supabase
        .from('spare_parts')
        .insert([
          {
            sku: 'BP-001',
            name: 'Premium Brake Pads Set',
            description: 'High-quality brake pads for smooth braking performance',
            selling_price: 2500.00,
            cost_price: 1500.00,
            stock_quantity: 50,
            reorder_level: 10,
            part_type_id: partTypeId,
            sparepart_brand_id: brandId,
            is_active: true
          },
          {
            sku: 'AF-002',
            name: 'Engine Air Filter',
            description: 'Original equipment quality air filter for better engine performance',
            selling_price: 1200.00,
            cost_price: 600.00,
            stock_quantity: 75,
            reorder_level: 15,
            part_type_id: partTypeId,
            sparepart_brand_id: brandId,
            is_active: true
          },
          {
            sku: 'SP-003',
            name: 'Spark Plug Set (4pcs)',
            description: 'Premium spark plugs for improved ignition and fuel efficiency',
            selling_price: 3200.00,
            cost_price: 1600.00,
            stock_quantity: 120,
            reorder_level: 20,
            part_type_id: partTypeId,
            sparepart_brand_id: brandId,
            is_active: true
          },
          {
            sku: 'BAT-004',
            name: 'Car Battery 12V 100Ah',
            description: 'Long-lasting car battery with superior starting power',
            selling_price: 8500.00,
            cost_price: 5000.00,
            stock_quantity: 30,
            reorder_level: 5,
            part_type_id: partTypeId,
            sparepart_brand_id: brandId,
            is_active: true
          },
          {
            sku: 'OF-005',
            name: 'Oil Filter',
            description: 'Premium oil filter for engine protection',
            selling_price: 800.00,
            cost_price: 400.00,
            stock_quantity: 100,
            reorder_level: 25,
            part_type_id: partTypeId,
            sparepart_brand_id: brandId,
            is_active: true
          }
        ])
        .select();

      if (spError) throw spError;
      console.log(`✅ Created ${createdParts.length} spare parts`);
    } else {
      console.log('✅ Spare parts already exist');
    }

    // 4. Check if accessories exist
    console.log('📋 Checking accessories...');
    const { data: existingAccessories } = await supabase
      .from('accessories')
      .select('id')
      .limit(1);

    if (!existingAccessories || existingAccessories.length === 0) {
      console.log('📝 Creating accessories...');
      const { data: createdAcc, error: accError } = await supabase
        .from('accessories')
        .insert([
          {
            sku: 'ACC-001',
            name: 'Car Air Freshener',
            description: 'Refreshing car interior with long-lasting fragrance',
            selling_price: 250.00,
            cost_price: 100.00,
            stock_quantity: 200,
            reorder_level: 50,
            part_type_id: partTypeId,
            accessory_brand_id: brandId,
            is_active: true
          },
          {
            sku: 'ACC-002',
            name: 'Car Floor Mats Set',
            description: 'Premium rubber floor mats with anti-slip backing',
            selling_price: 1800.00,
            cost_price: 800.00,
            stock_quantity: 60,
            reorder_level: 10,
            part_type_id: partTypeId,
            accessory_brand_id: brandId,
            is_active: true
          },
          {
            sku: 'ACC-003',
            name: 'Steering Wheel Cover',
            description: 'Comfortable steering wheel cover with leather finish',
            selling_price: 650.00,
            cost_price: 250.00,
            stock_quantity: 100,
            reorder_level: 20,
            part_type_id: partTypeId,
            accessory_brand_id: brandId,
            is_active: true
          }
        ])
        .select();

      if (accError) throw accError;
      console.log(`✅ Created ${createdAcc.length} accessories`);
    } else {
      console.log('✅ Accessories already exist');
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('📊 You can now access the products from http://localhost:5174/api/inventory/products');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

seedData();
