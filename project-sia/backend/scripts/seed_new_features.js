import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Helper function to get random item from array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function to get random number between min and max
const randomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to get random date within last N days
const randomDate = (days) => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - (Math.random() * days * 24 * 60 * 60 * 1000));
  return pastDate.toISOString();
};

async function seedNewFeatures() {
  try {
    console.log('🌱 Starting to seed new features with dynamic data...\n');

    // =====================================================
    // 1. FETCH EXISTING PRODUCTS FROM DATABASE
    // =====================================================
    
    console.log('📦 Fetching existing spare parts...');
    const { data: spareParts, error: spError } = await supabase
      .from('spare_parts')
      .select('*')
      .eq('is_active', true)
      .limit(30);

    if (spError) throw spError;
    console.log(`   ✅ Found ${spareParts?.length || 0} spare parts`);

    console.log('📦 Fetching existing accessories...');
    const { data: accessories, error: accError } = await supabase
      .from('accessories')
      .select('*')
      .eq('is_active', true)
      .limit(20);

    if (accError) throw accError;
    console.log(`   ✅ Found ${accessories?.length || 0} accessories\n`);

    if ((!spareParts || spareParts.length === 0) && (!accessories || accessories.length === 0)) {
      console.log('❌ No products found! Please run seed_products.js first.');
      return;
    }

    // =====================================================
    // 2. UPDATE MAX STOCK LEVELS (for Overstock feature)
    // =====================================================
    
    console.log('🔧 Setting up max stock levels...');
    
    // Update spare parts with realistic max stock levels
    if (spareParts && spareParts.length > 0) {
      for (const sp of spareParts) {
        const maxStock = sp.stock_quantity > 100 ? 150 : 
                        sp.stock_quantity > 50 ? 100 : 80;
        
        await supabase
          .from('spare_parts')
          .update({ max_stock_level: maxStock })
          .eq('id', sp.id);
      }
      console.log(`   ✅ Updated ${spareParts.length} spare parts with max stock levels`);
    }

    // Update accessories with realistic max stock levels
    if (accessories && accessories.length > 0) {
      for (const acc of accessories) {
        const maxStock = acc.stock_quantity > 80 ? 120 : 
                        acc.stock_quantity > 40 ? 80 : 60;
        
        await supabase
          .from('accessories')
          .update({ max_stock_level: maxStock })
          .eq('id', acc.id);
      }
      console.log(`   ✅ Updated ${accessories.length} accessories with max stock levels`);
    }

    // Create some intentional overstocked items (for testing)
    if (spareParts && spareParts.length >= 3) {
      const overstockItems = spareParts.slice(0, 3);
      for (const item of overstockItems) {
        const newMaxStock = Math.max(item.max_stock_level || 100, 80);
        const newStockQty = newMaxStock + randomNum(30, 60);
        
        await supabase
          .from('spare_parts')
          .update({ 
            stock_quantity: newStockQty,
            max_stock_level: newMaxStock
          })
          .eq('id', item.id);
      }
      console.log(`   ✅ Created 3 overstocked spare parts for testing\n`);
    }

    // =====================================================
    // 3. GENERATE PRICE HISTORY (dynamic from real products)
    // =====================================================
    
    console.log('💰 Generating price history entries...');
    
    const priceChangeReasons = [
      'Supplier cost increase',
      'Market price adjustment',
      'Inventory revaluation',
      'Promotional discount',
      'Clearance sale',
      'Competitor price matching',
      'Seasonal adjustment',
      'Regular price update'
    ];

    let priceHistoryCount = 0;

    // Generate price increases for spare parts
    if (spareParts && spareParts.length > 0) {
      const itemsForIncrease = spareParts.slice(0, Math.min(8, spareParts.length));
      
      for (const sp of itemsForIncrease) {
        const oldPrice = sp.selling_price - randomNum(50, 150);
        const priceDiff = sp.selling_price - oldPrice;
        const percentChange = ((priceDiff / oldPrice) * 100).toFixed(2);

        const { error } = await supabase
          .from('price_history')
          .insert({
            product_type: 'spare_part',
            product_id: sp.id,
            product_sku: sp.sku,
            product_name: sp.name,
            old_cost_price: sp.cost_price ? sp.cost_price - randomNum(20, 50) : null,
            new_cost_price: sp.cost_price,
            old_selling_price: oldPrice,
            new_selling_price: sp.selling_price,
            price_difference: priceDiff,
            percentage_change: parseFloat(percentChange),
            change_type: 'increase',
            change_reason: random(priceChangeReasons),
            change_date: randomDate(60)
          });

        if (!error) priceHistoryCount++;
      }
    }

    // Generate price decreases for some spare parts
    if (spareParts && spareParts.length > 5) {
      const itemsForDecrease = spareParts.slice(8, Math.min(13, spareParts.length));
      
      for (const sp of itemsForDecrease) {
        const oldPrice = sp.selling_price + randomNum(40, 120);
        const priceDiff = sp.selling_price - oldPrice;
        const percentChange = ((priceDiff / oldPrice) * 100).toFixed(2);

        const { error } = await supabase
          .from('price_history')
          .insert({
            product_type: 'spare_part',
            product_id: sp.id,
            product_sku: sp.sku,
            product_name: sp.name,
            old_cost_price: sp.cost_price ? sp.cost_price + randomNum(15, 40) : null,
            new_cost_price: sp.cost_price,
            old_selling_price: oldPrice,
            new_selling_price: sp.selling_price,
            price_difference: priceDiff,
            percentage_change: parseFloat(percentChange),
            change_type: 'decrease',
            change_reason: random(['Promotional discount', 'Clearance sale', 'Competitor price matching']),
            change_date: randomDate(45)
          });

        if (!error) priceHistoryCount++;
      }
    }

    // Generate price history for accessories
    if (accessories && accessories.length > 0) {
      const itemsForHistory = accessories.slice(0, Math.min(7, accessories.length));
      
      for (const acc of itemsForHistory) {
        const isIncrease = Math.random() > 0.4;
        const oldPrice = isIncrease ? 
          acc.selling_price - randomNum(30, 100) : 
          acc.selling_price + randomNum(30, 100);
        const priceDiff = acc.selling_price - oldPrice;
        const percentChange = ((priceDiff / oldPrice) * 100).toFixed(2);

        const { error } = await supabase
          .from('price_history')
          .insert({
            product_type: 'accessory',
            product_id: acc.id,
            product_sku: acc.sku,
            product_name: acc.name,
            old_cost_price: acc.cost_price ? (isIncrease ? acc.cost_price - randomNum(15, 35) : acc.cost_price + randomNum(15, 35)) : null,
            new_cost_price: acc.cost_price,
            old_selling_price: oldPrice,
            new_selling_price: acc.selling_price,
            price_difference: priceDiff,
            percentage_change: parseFloat(percentChange),
            change_type: isIncrease ? 'increase' : 'decrease',
            change_reason: random(priceChangeReasons),
            change_date: randomDate(30)
          });

        if (!error) priceHistoryCount++;
      }
    }

    console.log(`   ✅ Generated ${priceHistoryCount} price history entries\n`);

    // =====================================================
    // 4. GENERATE STOCK RELEASES (dynamic from real products)
    // =====================================================
    
    console.log('📤 Generating stock releases...');
    
    const releaseTypes = ['damage', 'return_to_supplier', 'internal_use', 'sample', 'transfer'];
    const releaseReasons = [
      'Defective units found during inspection',
      'Used for testing and quality control',
      'Wrong specification received',
      'Quality inspection - Sample units',
      'Internal testing and demonstration',
      'Warranty return to manufacturer'
    ];
    const departments = ['Warehouse - Quality Control', 'Service Center', 'QC Department', 'Testing Lab', 'Sales Department'];
    const statuses = ['pending', 'approved', 'released'];

    let stockReleaseCount = 0;

    // Generate stock releases for spare parts
    if (spareParts && spareParts.length > 0) {
      const itemsForRelease = spareParts.slice(0, Math.min(8, spareParts.length));
      
      for (const sp of itemsForRelease) {
        const quantity = randomNum(3, 12);
        const status = random(statuses);

        const { error } = await supabase
          .from('stock_releases')
          .insert({
            product_type: 'spare_part',
            product_id: sp.id,
            product_sku: sp.sku,
            product_name: sp.name,
            quantity_released: quantity,
            release_type: random(releaseTypes),
            release_reason: random(releaseReasons),
            released_to: random(departments),
            destination: 'Main Warehouse Bay ' + randomNum(1, 5),
            unit_cost: sp.cost_price,
            total_cost: sp.cost_price ? sp.cost_price * quantity : null,
            status: status,
            requested_at: randomDate(14),
            approved_at: status !== 'pending' ? randomDate(10) : null,
            released_at: status === 'released' ? randomDate(7) : null,
            notes: 'Auto-generated sample data for testing'
          });

        if (!error) stockReleaseCount++;
      }
    }

    // Generate stock releases for accessories
    if (accessories && accessories.length > 0) {
      const itemsForRelease = accessories.slice(0, Math.min(5, accessories.length));
      
      for (const acc of itemsForRelease) {
        const quantity = randomNum(2, 8);
        const status = random(statuses);

        const { error } = await supabase
          .from('stock_releases')
          .insert({
            product_type: 'accessory',
            product_id: acc.id,
            product_sku: acc.sku,
            product_name: acc.name,
            quantity_released: quantity,
            release_type: random(['damage', 'sample', 'internal_use']),
            release_reason: random(releaseReasons),
            released_to: random(departments),
            destination: 'Testing Lab',
            unit_cost: acc.cost_price,
            total_cost: acc.cost_price ? acc.cost_price * quantity : null,
            status: status,
            requested_at: randomDate(7),
            approved_at: status !== 'pending' ? randomDate(5) : null,
            released_at: status === 'released' ? randomDate(3) : null,
            notes: 'Sample for product review'
          });

        if (!error) stockReleaseCount++;
      }
    }

    console.log(`   ✅ Generated ${stockReleaseCount} stock releases\n`);

    // =====================================================
    // 5. GENERATE INVENTORY TRANSACTIONS (dynamic from real products)
    // =====================================================
    
    console.log('📊 Generating inventory transactions...');
    
    let transactionCount = 0;

    try {
      // Check if inventory_transactions table exists by trying a simple query
      const { error: checkError } = await supabase
        .from('inventory_transactions')
        .select('id')
        .limit(1);

      if (checkError && checkError.message.includes('does not exist')) {
        console.log('   ⚠️  Inventory transactions table not found. Skipping...');
        console.log('   💡 Run this SQL first to create the table:');
        console.log('      CREATE TABLE inventory_transactions (...) -- See POPULATE_SAMPLE_DATA.sql\n');
      } else {
        // Generate INCOMING transactions (purchases/deliveries) for spare parts
        if (spareParts && spareParts.length > 0) {
          const itemsForIncoming = spareParts.slice(0, Math.min(12, spareParts.length));
          
          for (const sp of itemsForIncoming) {
            const quantity = randomNum(20, 60);
            const prevQty = sp.stock_quantity - quantity;

            const { error } = await supabase
              .from('inventory_transactions')
              .insert({
                product_type: 'spare_part',
                product_id: sp.id,
                product_sku: sp.sku,
                product_name: sp.name,
                transaction_type: 'incoming',
                quantity: quantity,
                transaction_reason: 'purchase',
                reference_number: `PO-${String(randomNum(1000, 9999)).padStart(4, '0')}`,
                unit_cost: sp.cost_price,
                total_cost: sp.cost_price ? sp.cost_price * quantity : null,
                previous_quantity: Math.max(0, prevQty),
                new_quantity: sp.stock_quantity,
                notes: 'Regular stock replenishment',
                created_at: randomDate(30)
              });

            if (!error) transactionCount++;
          }
        }

        // Generate OUTGOING transactions (sales/usage) for spare parts
        if (spareParts && spareParts.length > 5) {
          const itemsForOutgoing = spareParts.slice(5, Math.min(15, spareParts.length));
          
          for (const sp of itemsForOutgoing) {
            const quantity = randomNum(5, 20);
            const prevQty = sp.stock_quantity + quantity;
            const transReason = random(['sale', 'internal_use', 'adjustment']);

            const { error } = await supabase
              .from('inventory_transactions')
              .insert({
                product_type: 'spare_part',
                product_id: sp.id,
                product_sku: sp.sku,
                product_name: sp.name,
                transaction_type: 'outgoing',
                quantity: quantity,
                transaction_reason: transReason,
                reference_number: transReason === 'sale' ? 
                  `ORD-${String(randomNum(1000, 9999)).padStart(4, '0')}` : 
                  `ADJ-${String(randomNum(100, 999)).padStart(3, '0')}`,
                unit_cost: sp.cost_price,
                total_cost: sp.cost_price ? sp.cost_price * quantity : null,
                previous_quantity: prevQty,
                new_quantity: sp.stock_quantity,
                notes: transReason === 'sale' ? 'Customer order fulfillment' : 'Internal usage',
                created_at: randomDate(20)
              });

            if (!error) transactionCount++;
          }
        }

        // Generate mixed transactions for accessories
        if (accessories && accessories.length > 0) {
          const itemsForTransactions = accessories.slice(0, Math.min(10, accessories.length));
          
          for (const acc of itemsForTransactions) {
            const isIncoming = Math.random() > 0.5;
            const quantity = randomNum(10, 35);
            const transType = isIncoming ? 'incoming' : 'outgoing';
            const transReason = isIncoming ? 'purchase' : random(['sale', 'adjustment']);
            const prevQty = isIncoming ? acc.stock_quantity - quantity : acc.stock_quantity + quantity;

            const { error } = await supabase
              .from('inventory_transactions')
              .insert({
                product_type: 'accessory',
                product_id: acc.id,
                product_sku: acc.sku,
                product_name: acc.name,
                transaction_type: transType,
                quantity: quantity,
                transaction_reason: transReason,
                reference_number: `TXN-${String(randomNum(1000, 9999)).padStart(4, '0')}`,
                unit_cost: acc.cost_price,
                total_cost: acc.cost_price ? acc.cost_price * quantity : null,
                previous_quantity: Math.max(0, prevQty),
                new_quantity: acc.stock_quantity,
                notes: 'Regular inventory movement',
                created_at: randomDate(25)
              });

            if (!error) transactionCount++;
          }
        }

        console.log(`   ✅ Generated ${transactionCount} inventory transactions\n`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not generate inventory transactions: ${error.message}`);
      console.log(`   💡 This is optional - other features will still work\n`);
    }

    // =====================================================
    // 6. VERIFICATION - Show what was created
    // =====================================================
    
    console.log('📊 VERIFICATION SUMMARY:\n');
    console.log('═══════════════════════════════════════════');

    // Check overstocked items
    const { data: allSpareParts } = await supabase
      .from('spare_parts')
      .select('id, name, stock_quantity, max_stock_level')
      .not('max_stock_level', 'is', null);
    
    // Filter overstocked items in JavaScript
    const overstock = allSpareParts?.filter(item => 
      item.stock_quantity > (item.max_stock_level || 0)
    ) || [];
    
    console.log(`🔴 Overstocked Items: ${overstock.length}`);
    if (overstock.length > 0) {
      overstock.slice(0, 3).forEach(item => {
        console.log(`   • ${item.name}: ${item.stock_quantity}/${item.max_stock_level} units (${item.stock_quantity - item.max_stock_level} excess)`);
      });
    }

    // Check price history
    const { count: priceCount } = await supabase
      .from('price_history')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n💰 Price History Records: ${priceCount || 0}`);

    // Check stock releases
    const { data: releases } = await supabase
      .from('stock_releases')
      .select('status')
      .order('requested_at', { ascending: false });
    
    const releasesByStatus = releases?.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\n📤 Stock Releases: ${releases?.length || 0}`);
    if (releasesByStatus) {
      Object.entries(releasesByStatus).forEach(([status, count]) => {
        console.log(`   • ${status}: ${count}`);
      });
    }

    // Check inventory transactions
    try {
      const { data: transactions } = await supabase
        .from('inventory_transactions')
        .select('transaction_type, quantity')
        .order('created_at', { ascending: false });
      
      const transByType = transactions?.reduce((acc, t) => {
        if (!acc[t.transaction_type]) {
          acc[t.transaction_type] = { count: 0, totalQty: 0 };
        }
        acc[t.transaction_type].count++;
        acc[t.transaction_type].totalQty += t.quantity;
        return acc;
      }, {});
      
      console.log(`\n📊 Inventory Transactions: ${transactions?.length || 0}`);
      if (transByType && Object.keys(transByType).length > 0) {
        Object.entries(transByType).forEach(([type, data]) => {
          console.log(`   • ${type}: ${data.count} transactions (${data.totalQty} total units)`);
        });
      }
    } catch (transError) {
      console.log(`\n📊 Inventory Transactions: Not available (table not created)`);
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ Seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your backend: npm start');
    console.log('   2. Visit admin panel: http://localhost:5173/admin/overstock');
    console.log('   3. Check Price History: http://localhost:5173/admin/priceHistory');
    console.log('   4. All features are now populated with real data!\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the seeder
seedNewFeatures()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
