import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Helper functions
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Popular PH motorcycle models & brands (Thai-Indo concept trend)
const PH_MOTORCYCLES = {
  'Yamaha': ['Sniper 150', 'Sniper R', 'Raider', 'Raider Fi', 'Aerox 155', 'N-Max 155'],
  'Honda': ['CB150R', 'CB160R', 'Mio 125', 'Mio i 125', 'Mio 156', 'PCX 150', 'Vario 150'],
  'Suzuki': ['Raider 150', 'Smash 115', 'Satria 120', 'GSX-R150'],
  'Hero': ['Dash 110', 'Splendor Plus 100', 'Super Splendor 125'],
  'Bajaj': ['Pulsar 150', 'Pulsar 220', 'CT 100'],
  'TVS': ['Apache RTR 160', 'Ntorq 125'],
};

// Spare parts data (with motorcycle compatibility)
const SPARE_PARTS_DATA = [
  // Piston & Ring Sets
  {
    name: 'Piston Ring Set 150cc',
    sku: 'PR-150-001',
    description: 'High quality piston ring set for 150cc motorcycles',
    type: 'Engine Parts',
    cost_price: 800,
    selling_price: 1500,
    stock_qty: randomNum(15, 40),
    compatibility: ['Sniper 150', 'Sniper R', 'Raider 150', 'CB150R', 'Aerox 155'],
    brands: {
      'genuine': ['OEM', 'RCB', 'CNC'],
      'aftermarket': ['RCB Performance', 'CNC Top Performance', 'JVT Racing']
    }
  },
  // Gasket Sets
  {
    name: 'Gasket Set Complete 150cc',
    sku: 'GS-150-002',
    description: 'Complete gasket set for engine overhaul',
    type: 'Engine Parts',
    cost_price: 400,
    selling_price: 899,
    stock_qty: randomNum(20, 50),
    compatibility: ['Sniper 150', 'Sniper R', 'Raider', 'Aerox 155', 'N-Max 155'],
    brands: {
      'genuine': ['OEM', 'Bosch'],
      'aftermarket': ['RCB', 'JVT']
    }
  },
  // CVT Belts
  {
    name: 'CVT Belt Automatic 150cc',
    sku: 'CB-150-003',
    description: 'Original quality CVT belt for automatic transmission motorcycles',
    type: 'Drivetrain',
    cost_price: 450,
    selling_price: 1199,
    stock_qty: randomNum(25, 60),
    compatibility: ['Aerox 155', 'N-Max 155', 'Mio 156', 'PCX 150'],
    brands: {
      'genuine': ['OEM', 'Gates'],
      'aftermarket': ['RCB CVT', 'CNC Belt Racing', 'Performance CVT']
    }
  },
  // Clutch Plates
  {
    name: 'Clutch Plate Set Manual 150cc',
    sku: 'CP-150-004',
    description: 'High friction clutch plates for manual transmission',
    type: 'Drivetrain',
    cost_price: 350,
    selling_price: 899,
    stock_qty: randomNum(30, 70),
    compatibility: ['Sniper 150', 'Raider', 'CB150R', 'Pulsar 150'],
    brands: {
      'genuine': ['OEM'],
      'aftermarket': ['RCB Performance', 'CNC Racing', 'JVT Pro']
    }
  },
  // Brake Pads
  {
    name: 'Brake Pad Set Sintered 150cc',
    sku: 'BP-150-005',
    description: 'Sintered metal brake pads for better stopping power',
    type: 'Brake System',
    cost_price: 250,
    selling_price: 649,
    stock_qty: randomNum(40, 80),
    compatibility: ['Sniper 150', 'Raider', 'Aerox 155', 'CB150R', 'Pulsar 150'],
    brands: {
      'genuine': ['OEM', 'Brembo'],
      'aftermarket': ['RCB Sintered', 'CNC High Performance', 'Koso Racing']
    }
  },
  // Brake Discs
  {
    name: 'Brake Disc Rotor 260mm Front',
    sku: 'BD-260-006',
    description: 'High performance brake disc rotor for front wheel',
    type: 'Brake System',
    cost_price: 400,
    selling_price: 999,
    stock_qty: randomNum(15, 35),
    compatibility: ['Raider', 'Pulsar 150', 'CB150R', 'GSX-R150'],
    brands: {
      'genuine': ['OEM'],
      'aftermarket': ['RCB Racing', 'CNC Lightweight', 'Koso Sport']
    }
  },
  // Air Filters
  {
    name: 'Air Filter Performance 150cc',
    sku: 'AF-150-007',
    description: 'High flow performance air filter for better engine breathing',
    type: 'Engine Parts',
    cost_price: 180,
    selling_price: 449,
    stock_qty: randomNum(50, 100),
    compatibility: ['Sniper 150', 'Sniper R', 'Raider', 'Aerox 155', 'CB150R', 'Pulsar 150'],
    brands: {
      'genuine': ['OEM'],
      'aftermarket': ['RCB Performance', 'K&N Style', 'CNC Air Flow']
    }
  },
  // Spark Plugs
  {
    name: 'Spark Plug Racing NGK',
    sku: 'SP-NGK-008',
    description: 'High performance spark plug for better combustion',
    type: 'Ignition System',
    cost_price: 120,
    selling_price: 299,
    stock_qty: randomNum(60, 120),
    compatibility: ['Sniper 150', 'Raider', 'Aerox 155', 'CB150R', 'N-Max 155', 'Mio 156'],
    brands: {
      'genuine': ['NGK', 'Denso'],
      'aftermarket': ['RCB Racing', 'CNC Premium']
    }
  },
  // Carburetor Kits
  {
    name: 'Carb Overhaul Kit 150cc',
    sku: 'CK-150-009',
    description: 'Complete carburetor overhaul kit with gaskets and jets',
    type: 'Fuel System',
    cost_price: 280,
    selling_price: 699,
    stock_qty: randomNum(10, 25),
    compatibility: ['Sniper 150', 'Raider', 'CB150R', 'Pulsar 150'],
    brands: {
      'genuine': ['OEM'],
      'aftermarket': ['RCB Racing', 'CNC Performance']
    }
  },
  // Exhaust Systems
  {
    name: 'Exhaust Pipe Racing Full System',
    sku: 'EX-150-010',
    description: 'Full racing exhaust system with muffler and pipes',
    type: 'Exhaust System',
    cost_price: 800,
    selling_price: 2499,
    stock_qty: randomNum(5, 15),
    compatibility: ['Sniper 150', 'Raider', 'Pulsar 150'],
    brands: {
      'genuine': [],
      'aftermarket': ['RCB Racing', 'CNC Pro', 'JVT Performance']
    }
  },
  // Chain & Sprockets
  {
    name: 'Chain & Sprocket Set 150cc',
    sku: 'CS-150-011',
    description: 'Premium motorcycle chain with front and rear sprockets',
    type: 'Drivetrain',
    cost_price: 600,
    selling_price: 1599,
    stock_qty: randomNum(12, 28),
    compatibility: ['Sniper 150', 'Raider', 'CB150R', 'Pulsar 150', 'GSX-R150'],
    brands: {
      'genuine': ['OEM'],
      'aftermarket': ['RCB Racing', 'CNC Japan', 'JVT Pro Chain']
    }
  },
  // Ignition Coil
  {
    name: 'Ignition Coil 12V 150cc',
    sku: 'IC-150-012',
    description: 'High output ignition coil for better spark',
    type: 'Ignition System',
    cost_price: 320,
    selling_price: 799,
    stock_qty: randomNum(20, 45),
    compatibility: ['Sniper 150', 'Raider', 'Aerox 155', 'CB150R', 'N-Max 155'],
    brands: {
      'genuine': ['OEM', 'Bosch'],
      'aftermarket': ['RCB Racing', 'CNC Performance']
    }
  },
  // Carburetor (specific brands)
  {
    name: '24MM PE Carburettor',
    sku: 'CB-24MM-013',
    description: 'Performance carburetor for racing and tuning',
    type: 'Fuel System',
    cost_price: 450,
    selling_price: 1299,
    stock_qty: randomNum(8, 18),
    compatibility: ['Sniper 150', 'Raider', 'CB150R'],
    brands: {
      'genuine': [],
      'aftermarket': ['Koso Racing', 'RCB Performance', 'CNC Pro Carb']
    }
  },
  // Clutch Cable
  {
    name: 'Braided Steel Clutch Cable',
    sku: 'CL-CABLE-014',
    description: 'Braided steel reinforced clutch cable for durability',
    type: 'Controls',
    cost_price: 120,
    selling_price: 349,
    stock_qty: randomNum(35, 70),
    compatibility: ['Sniper 150', 'Raider', 'CB150R', 'Pulsar 150', 'GSX-R150'],
    brands: {
      'genuine': ['OEM'],
      'aftermarket': ['RCB Racing', 'CNC Premium']
    }
  },
  // Throttle Cable
  {
    name: 'Braided Throttle Cable Kit',
    sku: 'TH-CABLE-015',
    description: 'High quality throttle cable kit with braided sheath',
    type: 'Controls',
    cost_price: 130,
    selling_price: 379,
    stock_qty: randomNum(40, 75),
    compatibility: ['Sniper 150', 'Raider', 'Aerox 155', 'CB150R', 'N-Max 155'],
    brands: {
      'genuine': ['OEM'],
      'aftermarket': ['RCB Pro Cable', 'CNC Racing']
    }
  },
];

// Accessories Data
const ACCESSORIES_DATA = [
  // LED Lights
  {
    name: 'LED Headlight Bulb 6000K',
    sku: 'LED-HL-001',
    description: 'Bright white LED headlight conversion bulb',
    type: 'Lighting',
    cost_price: 180,
    selling_price: 549,
    stock_qty: randomNum(40, 80),
    compatibility: ['All'],
    brands: {
      'genuine': [],
      'aftermarket': ['RCB LED', 'CNC Bright', 'JVT 6000K']
    }
  },
  // LED Taillight
  {
    name: 'LED Tail Light Sequential',
    sku: 'LED-TL-002',
    description: 'Sequential LED tail light with resistor',
    type: 'Lighting',
    cost_price: 220,
    selling_price: 649,
    stock_qty: randomNum(30, 60),
    compatibility: ['All'],
    brands: {
      'genuine': [],
      'aftermarket': ['RCB Sequential', 'CNC Pro LED', 'Koso LED Tail']
    }
  },
  // Handlebar Grips
  {
    name: 'Anti-Vibration Handlebar Grips',
    sku: 'HG-AV-003',
    description: 'Ergonomic grips with vibration dampening gel',
    type: 'Controls',
    cost_price: 150,
    selling_price: 449,
    stock_qty: randomNum(50, 100),
    compatibility: ['All'],
    brands: {
      'genuine': ['OEM'],
      'aftermarket': ['RCB Comfort', 'CNC Pro Grip', 'JVT Gel Grip']
    }
  },
  // Seat Cover
  {
    name: 'Gel Cushion Seat Cover',
    sku: 'SC-GEL-004',
    description: 'High density gel seat cover for comfort',
    type: 'Seating',
    cost_price: 280,
    selling_price: 799,
    stock_qty: randomNum(20, 50),
    compatibility: ['All'],
    brands: {
      'genuine': [],
      'aftermarket': ['RCB Comfort Plus', 'CNC Gel Seat', 'Comfort Pro']
    }
  },
  // Windscreen
  {
    name: 'Touring Windscreen 40cm',
    sku: 'WS-40-005',
    description: 'High quality polycarbonate windscreen for touring',
    type: 'Windscreen',
    cost_price: 350,
    selling_price: 1099,
    stock_qty: randomNum(15, 35),
    compatibility: ['Raider', 'Aerox 155', 'CB150R', 'Pulsar 150'],
    brands: {
      'genuine': ['OEM'],
      'aftermarket': ['RCB Racing', 'CNC Pro Shield']
    }
  },
  // Chain Lock
  {
    name: 'Heavy Duty Chain Lock 12mm',
    sku: 'LOCK-12-006',
    description: 'Anti-theft heavy duty chain lock with padlock',
    type: 'Security',
    cost_price: 280,
    selling_price: 799,
    stock_qty: randomNum(30, 70),
    compatibility: ['All'],
    brands: {
      'genuine': [],
      'aftermarket': ['RCB Security', 'CNC Pro Lock', 'Master Lock']
    }
  },
  // Rearview Mirror
  {
    name: 'Universal Rearview Mirror',
    sku: 'MIR-UNV-007',
    description: 'Adjustable universal rearview mirror',
    type: 'Mirrors',
    cost_price: 120,
    selling_price: 349,
    stock_qty: randomNum(60, 120),
    compatibility: ['All'],
    brands: {
      'genuine': ['OEM'],
      'aftermarket': ['RCB Pro Angle', 'CNC Clear View']
    }
  },
  // Indicators
  {
    name: 'LED Turn Signal Indicators',
    sku: 'IND-LED-008',
    description: 'Bright LED turn signal indicators set',
    type: 'Lighting',
    cost_price: 200,
    selling_price: 549,
    stock_qty: randomNum(45, 90),
    compatibility: ['All'],
    brands: {
      'genuine': [],
      'aftermarket': ['RCB Bright', 'CNC LED Signal', 'JVT Amber']
    }
  },
  // Horn
  {
    name: 'Loud Compact Air Horn 12V',
    sku: 'HORN-12V-009',
    description: 'Compact air horn with powerful sound output',
    type: 'Sound System',
    cost_price: 180,
    selling_price: 499,
    stock_qty: randomNum(35, 70),
    compatibility: ['All'],
    brands: {
      'genuine': [],
      'aftermarket': ['RCB Power Horn', 'CNC Loud', 'JVT Pro Sound']
    }
  },
  // Phone Holder
  {
    name: 'Handlebar Phone Holder',
    sku: 'PH-HOLDER-010',
    description: '360 degree adjustable phone holder',
    type: 'Electronics',
    cost_price: 120,
    selling_price: 349,
    stock_qty: randomNum(50, 100),
    compatibility: ['All'],
    brands: {
      'genuine': [],
      'aftermarket': ['RCB Smart Hold', 'CNC Pro Mount']
    }
  },
  // USB Charger
  {
    name: 'Motorcycle Dual USB Charger',
    sku: 'USB-DUAL-011',
    description: 'Dual USB fast charging port for handlebar',
    type: 'Electronics',
    cost_price: 180,
    selling_price: 549,
    stock_qty: randomNum(25, 55),
    compatibility: ['All'],
    brands: {
      'genuine': [],
      'aftermarket': ['RCB Fast Charge', 'CNC Pro USB']
    }
  },
  // Crash Bar
  {
    name: 'Engine Guard Crash Bar',
    sku: 'CB-ENG-GUARD-012',
    description: 'Steel engine guard protection crash bar',
    type: 'Protection',
    cost_price: 400,
    selling_price: 1199,
    stock_qty: randomNum(15, 35),
    compatibility: ['Sniper 150', 'Raider', 'CB150R', 'Pulsar 150'],
    brands: {
      'genuine': ['OEM'],
      'aftermarket': ['RCB Pro Guard', 'CNC Steel Guard']
    }
  },
  // Footpeg
  {
    name: 'Aluminum Foot Pegs Racing',
    sku: 'FP-ALU-013',
    description: 'Lightweight aluminum foot pegs with good grip',
    type: 'Comfort',
    cost_price: 280,
    selling_price: 749,
    stock_qty: randomNum(30, 60),
    compatibility: ['All'],
    brands: {
      'genuine': [],
      'aftermarket': ['RCB Racing Pegs', 'CNC Pro Foot', 'JVT Grip']
    }
  },
];

async function seedPhMotorcycles() {
  try {
    console.log('🏍️ Starting to seed Philippine motorcycle data...\n');

    // =====================================================
    // 1. UPDATE COMPATIBLE BIKE MODELS IN EXISTING PRODUCTS
    // =====================================================
    
    console.log('🔄 Updating existing products with motorcycle compatibility...');

    // Get all existing spare parts and accessories
    const { data: existingSpareParts } = await supabase
      .from('spare_parts')
      .select('id');

    const { data: existingAccessories } = await supabase
      .from('accessories')
      .select('id');

    if ((existingSpareParts?.length || 0) > 0) {
      console.log(`   ⚙️ Updating ${existingSpareParts.length} spare parts...`);
      
      for (let i = 0; i < existingSpareParts.length; i++) {
        const part = existingSpareParts[i];
        // Assign 2-5 random motorcycle models to each part
        const randomModels = [];
        const allModels = Object.values(PH_MOTORCYCLES).flat();
        for (let j = 0; j < randomNum(2, 5); j++) {
          randomModels.push(random(allModels));
        }
        
        await supabase
          .from('spare_parts')
          .update({ 
            compatible_bike_models: JSON.stringify([...new Set(randomModels)])
          })
          .eq('id', part.id);
      }
      
      console.log(`   ✅ Updated spare parts with motorcycle compatibility`);
    }

    // =====================================================
    // 2. INSERT NEW SPARE PARTS WITH PH MOTORCYCLE DATA
    // =====================================================
    
    console.log('\n⚙️ Creating Philippine motorcycle spare parts...');
    
    // Get part types for spare parts
    const { data: partTypes } = await supabase
      .from('part_types')
      .select('id, name, code')
      .eq('category', 'sparepart')
      .limit(10);

    // Get or create RCB brand for spare parts
    let rcbBrandId;
    const { data: existingBrand } = await supabase
      .from('sparepart_brands')
      .select('id')
      .eq('code', 'RCB')
      .single();

    if (existingBrand) {
      rcbBrandId = existingBrand.id;
    } else {
      const { data: newBrand } = await supabase
        .from('sparepart_brands')
        .insert([
          { name: 'RCB Performance', code: 'RCB' },
          { name: 'CNC Pro', code: 'CNC' },
          { name: 'JVT Racing', code: 'JVT' },
          { name: 'Koso Racing', code: 'KOSO' }
        ])
        .select('id');
      rcbBrandId = newBrand?.[0]?.id;
    }

    // Map part types
    const partTypeMap = {};
    if (partTypes && partTypes.length > 0) {
      partTypes.forEach(pt => {
        partTypeMap[pt.name] = pt.id;
        partTypeMap[pt.code] = pt.id;
      });
    }

    // Insert spare parts
    let sparePpartsCreated = 0;
    for (const part of SPARE_PARTS_DATA) {
      const ptId = partTypeMap[part.type] || partTypeMap['Engine Parts'] || partTypes?.[0]?.id;
      
      const { error } = await supabase
        .from('spare_parts')
        .insert({
          sku: part.sku,
          name: part.name,
          description: part.description,
          cost_price: part.cost_price,
          selling_price: part.selling_price,
          stock_quantity: part.stock_qty,
          reorder_level: 10,
          reorder_quantity: 20,
          max_stock_level: Math.ceil(part.stock_qty * 1.5),
          quality_type: part.brands.genuine.length > 0 ? 'genuine' : 'aftermarket',
          sparepart_brand_id: rcbBrandId,
          part_type_id: ptId,
          is_universal: part.compatibility.includes('All'),
          compatible_bike_models: JSON.stringify(part.compatibility),
          is_active: true
        });

      if (!error) sparePpartsCreated++;
    }

    console.log(`   ✅ Created ${sparePpartsCreated} spare parts with PH motorcycle data`);

    // =====================================================
    // 3. INSERT NEW ACCESSORIES WITH PH MOTORCYCLE DATA
    // =====================================================
    
    console.log('\n🛡️ Creating Philippine motorcycle accessories...');

    // Get or create RCB brand for accessories
    let rcbAccBrandId;
    const { data: existingAccBrand } = await supabase
      .from('accessory_brands')
      .select('id')
      .eq('code', 'RCB')
      .single();

    if (existingAccBrand) {
      rcbAccBrandId = existingAccBrand.id;
    } else {
      const { data: newAccBrand } = await supabase
        .from('accessory_brands')
        .insert([
          { name: 'RCB Performance', code: 'RCB' },
          { name: 'CNC Pro', code: 'CNC' },
          { name: 'JVT Racing', code: 'JVT' },
          { name: 'Koso Racing', code: 'KOSO' }
        ])
        .select('id');
      rcbAccBrandId = newAccBrand?.[0]?.id;
    }

    // Get part types for accessories
    const { data: accPartTypes } = await supabase
      .from('part_types')
      .select('id, name, code')
      .eq('category', 'accessory')
      .limit(10);

    // Map accessory part types
    const accPartTypeMap = {};
    if (accPartTypes && accPartTypes.length > 0) {
      accPartTypes.forEach(pt => {
        accPartTypeMap[pt.name] = pt.id;
        accPartTypeMap[pt.code] = pt.id;
      });
    }

    // Insert accessories
    let accessoriesCreated = 0;
    for (const acc of ACCESSORIES_DATA) {
      const ptId = accPartTypeMap[acc.type] || accPartTypeMap['Lighting'] || accPartTypes?.[0]?.id;
      
      const { error } = await supabase
        .from('accessories')
        .insert({
          sku: acc.sku,
          name: acc.name,
          description: acc.description,
          cost_price: acc.cost_price,
          selling_price: acc.selling_price,
          stock_quantity: acc.stock_qty,
          reorder_level: 8,
          reorder_quantity: 15,
          max_stock_level: Math.ceil(acc.stock_qty * 1.4),
          quality_type: acc.brands.genuine.length > 0 ? 'genuine' : 'aftermarket',
          accessory_brand_id: rcbAccBrandId,
          part_type_id: ptId,
          is_universal: acc.compatibility.includes('All'),
          compatible_bike_models: JSON.stringify(acc.compatibility),
          is_active: true
        });

      if (!error) accessoriesCreated++;
    }

    console.log(`   ✅ Created ${accessoriesCreated} accessories with PH motorcycle data`);

    // =====================================================
    // 4. SUMMARY
    // =====================================================
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ SEEDING COMPLETE - Philippine Motorcycles!');
    console.log('='.repeat(60));
    console.log(`
📊 Summary:
   ✅ ${sparePpartsCreated} Spare Parts created
   ✅ ${accessoriesCreated} Accessories created
   ✅ All products mapped to popular PH motorcycle models:
      • Yamaha: Sniper 150, Sniper R, Raider, Aerox 155, N-Max 155
      • Honda: CB150R, Mio 125, PCX 150, Vario 150
      • Suzuki: Raider 150, GSX-R150
      • Hero: Dash 110, Splendor Plus
      • Bajaj: Pulsar 150, Pulsar 220
      • TVS: Apache RTR 160

🏪 Brands included: RCB, CNC, JVT, Koso
💡 Popular trend: Thai-Indo concept customization

📍 To verify:
   1. Go to Admin → Inventory
   2. Switch to "Browse by Motorcycle" view
   3. Select a motorcycle brand from the dropdown
   4. All compatible parts will display by brand!
    `);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeder
seedPhMotorcycles().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
});
