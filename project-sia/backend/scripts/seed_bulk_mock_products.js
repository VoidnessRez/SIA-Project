import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const partCatalog = [
  ['Front Brake Lever', 'High-durability forged brake lever'],
  ['Rear Brake Shoes', 'Heat-resistant rear brake shoes'],
  ['Clutch Plate Set', 'Smooth engagement clutch plate kit'],
  ['Drive Chain 428', 'Heavy-duty chain for daily riding'],
  ['Front Sprocket 14T', 'Precision-cut front sprocket'],
  ['Rear Sprocket 42T', 'Hardened steel rear sprocket'],
  ['Fuel Pump Assembly', 'Stable fuel delivery pump module'],
  ['Fuel Filter Inline', 'Fine filtration inline fuel filter'],
  ['Radiator Coolant Hose', 'Reinforced coolant hose set'],
  ['Cylinder Head Gasket', 'Leak-resistant head gasket'],
  ['Piston Ring Set', 'Low-friction piston ring set'],
  ['Throttle Cable', 'Responsive throttle cable replacement'],
  ['Speedometer Cable', 'Accurate speed reading cable'],
  ['Wheel Bearing Set', 'Low-noise sealed wheel bearings'],
  ['Fork Oil Seal', 'Leak-proof fork oil seal'],
  ['Shock Absorber Bushing', 'Stable rear suspension bushing'],
  ['Engine Mount Bolt Kit', 'Corrosion-resistant bolt kit'],
  ['Starter Relay', 'Reliable starter relay switch'],
  ['Regulator Rectifier', 'Voltage stabilization module'],
  ['Ignition Coil', 'Strong spark high-output coil'],
  ['Tail Light Lens', 'Clear red lens for tail lamp'],
  ['Turn Signal Bulb', 'Bright amber indicator bulb'],
  ['Headlight Housing', 'OEM-fit headlight shell'],
  ['Kick Starter Gear', 'Durable kick starter gear set'],
  ['Air Intake Manifold', 'Heat-resistant intake manifold']
];

const accessoryCatalog = [
  ['Phone Mount Pro', 'Vibration-damped smartphone holder'],
  ['USB Charger Dual Port', '12V waterproof dual USB charger'],
  ['Top Box 45L', 'Large capacity top box for touring'],
  ['Tail Bag Compact', 'Expandable tail bag for essentials'],
  ['Seat Cover Premium', 'Anti-slip premium seat cover'],
  ['Handlebar End Weights', 'Reduced vibration bar-end weights'],
  ['Crash Guard Set', 'Engine protection crash guard'],
  ['Frame Slider', 'Impact protection frame slider set'],
  ['Tank Pad Carbon', 'Scratch-resistant tank protector'],
  ['Brake Fluid Reservoir Sock', 'UV protection reservoir sock'],
  ['Helmet Lock', 'Secure anti-theft helmet lock'],
  ['Disc Brake Lock', 'Compact lock with alarm indicator'],
  ['Motorcycle Cover XL', 'Waterproof all-weather bike cover'],
  ['LED Auxiliary Light', 'High-lumen auxiliary light pair'],
  ['Hand Guard Kit', 'Wind and debris hand protection'],
  ['Radiator Guard', 'Mesh guard for radiator fins'],
  ['License Plate Frame', 'Rust-proof plate frame'],
  ['Mirror Extender', 'Improved visibility mirror extender'],
  ['Foot Peg Rubber', 'Comfort anti-slip peg rubber'],
  ['Valve Cap Set', 'Aluminum dust-proof valve caps']
];

const motorcycleProfiles = [
  {
    brand: 'Yamaha',
    models: [
      { name: 'Mio Sporty', cc: 115 },
      { name: 'Mio i', cc: 125 },
      { name: 'Aerox', cc: 155 },
      { name: 'NMAX', cc: 155 },
      { name: 'Sniper', cc: 155 }
    ]
  },
  {
    brand: 'Honda',
    models: [
      { name: 'Beat', cc: 110 },
      { name: 'Click', cc: 125 },
      { name: 'PCX', cc: 160 },
      { name: 'Winner X', cc: 150 },
      { name: 'Wave RSX', cc: 110 }
    ]
  },
  {
    brand: 'Suzuki',
    models: [
      { name: 'Skydrive', cc: 125 },
      { name: 'Raider R150', cc: 150 },
      { name: 'Burgman Street', cc: 125 },
      { name: 'Smash', cc: 115 },
      { name: 'Gixxer', cc: 155 }
    ]
  },
  {
    brand: 'Kawasaki',
    models: [
      { name: 'Barako II', cc: 175 },
      { name: 'Rouser NS', cc: 160 },
      { name: 'Dominar', cc: 400 },
      { name: 'Ninja', cc: 250 },
      { name: 'KLX', cc: 150 }
    ]
  }
];

function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[randomNum(0, arr.length - 1)];
}

function makeSku(prefix, index) {
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

function productImageUrl(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/600`;
}

function buildCompatibilityJson(seedIndex, count = 3) {
  const unique = new Set();

  for (let i = 0; i < count; i += 1) {
    const profile = motorcycleProfiles[(seedIndex + i) % motorcycleProfiles.length];
    const model = profile.models[(seedIndex * 2 + i) % profile.models.length];
    unique.add(`${profile.brand} ${model.name} ${model.cc}cc`);
  }

  return JSON.stringify(Array.from(unique));
}

function computeStockByPattern(index, reorderLevel, min, max) {
  if (index % 7 === 0) {
    return randomNum(0, Math.max(1, reorderLevel));
  }

  if (index % 5 === 0) {
    return randomNum(Math.max(reorderLevel + 25, 85), Math.max(reorderLevel + 90, 180));
  }

  return randomNum(min, max);
}

function findTypeByKeywords(typePool, keywords) {
  const keys = Array.isArray(keywords) ? keywords : [keywords];
  return typePool.find((type) => {
    const haystack = `${String(type.name || '').toLowerCase()} ${String(type.code || '').toLowerCase()} ${String(type.category || '').toLowerCase()}`;
    return keys.some((key) => haystack.includes(String(key).toLowerCase()));
  });
}

function inferSparePartTypeId(typePool, productName, fallbackId) {
  const name = String(productName || '').toLowerCase();

  if (name.includes('brake')) return findTypeByKeywords(typePool, ['brake'])?.id || fallbackId;
  if (name.includes('filter') && name.includes('air')) return findTypeByKeywords(typePool, ['intake', 'air'])?.id || fallbackId;
  if (name.includes('filter') || name.includes('fuel pump')) return findTypeByKeywords(typePool, ['fuel'])?.id || fallbackId;
  if (name.includes('spark') || name.includes('ignition')) return findTypeByKeywords(typePool, ['ignition'])?.id || fallbackId;
  if (name.includes('relay') || name.includes('rectifier') || name.includes('coil') || name.includes('bulb')) {
    return findTypeByKeywords(typePool, ['electrical', 'lighting'])?.id || fallbackId;
  }
  if (name.includes('wheel') || name.includes('tire')) return findTypeByKeywords(typePool, ['wheel', 'tire'])?.id || fallbackId;
  if (name.includes('chain') || name.includes('sprocket') || name.includes('clutch') || name.includes('starter gear')) {
    return findTypeByKeywords(typePool, ['drivetrain', 'transmission'])?.id || fallbackId;
  }
  if (name.includes('cable') || name.includes('lever')) return findTypeByKeywords(typePool, ['controls'])?.id || fallbackId;
  if (name.includes('headlight') || name.includes('tail light')) return findTypeByKeywords(typePool, ['lighting'])?.id || fallbackId;
  if (name.includes('hose') || name.includes('gasket') || name.includes('piston') || name.includes('manifold') || name.includes('mount')) {
    return findTypeByKeywords(typePool, ['engine'])?.id || fallbackId;
  }

  return fallbackId;
}

function inferAccessoryTypeId(typePool, productName, fallbackId) {
  const name = String(productName || '').toLowerCase();

  if (name.includes('helmet') || name.includes('guard') || name.includes('lock')) {
    return findTypeByKeywords(typePool, ['safety'])?.id || fallbackId;
  }
  if (name.includes('light') || name.includes('led')) return findTypeByKeywords(typePool, ['lighting'])?.id || fallbackId;
  if (name.includes('mirror') || name.includes('slider') || name.includes('cover') || name.includes('frame')) {
    return findTypeByKeywords(typePool, ['body'])?.id || fallbackId;
  }
  if (name.includes('mount') || name.includes('charger') || name.includes('sock') || name.includes('radiator') || name.includes('extender')) {
    return findTypeByKeywords(typePool, ['controls', 'body'])?.id || fallbackId;
  }

  return fallbackId;
}

function inferDimensions(productName, productType) {
  const name = String(productName || '').toLowerCase();

  if (name.includes('tire')) return '80/90-17';
  if (name.includes('wheel bearing')) return '6202-2RS';
  if (name.includes('sprocket')) return name.includes('front') ? '14T' : '42T';
  if (name.includes('chain')) return '428 x 120L';
  if (name.includes('spark plug')) return 'M10 x 1.0';
  if (name.includes('bulb')) return '12V 21W';
  if (name.includes('relay')) return '12V 30A';
  if (name.includes('coil')) return '12V';
  if (name.includes('gasket')) return '0.8mm';
  if (name.includes('hose')) return '10mm ID';
  if (name.includes('cable')) return '110cm';
  if (name.includes('lever')) return 'Universal 7/8"';

  if (productType === 'accessory') {
    if (name.includes('cover')) return 'XL';
    if (name.includes('top box')) return '45L';
    if (name.includes('bag')) return '25L';
    if (name.includes('mount')) return '4.7-6.8 inch';
  }

  return 'Standard';
}

async function getExistingSkus(tableName) {
  const { data, error } = await supabase.from(tableName).select('sku');
  if (error) throw error;
  return new Set((data || []).map((row) => row.sku));
}

async function rebalanceSeededStock(tableName, skuPrefix, minStock, maxStock, minReorder, maxReorder) {
  const { data, error } = await supabase
    .from(tableName)
    .select('id, sku')
    .ilike('sku', `${skuPrefix}-%`)
    .order('sku');

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  let updated = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const reorderLevel = randomNum(minReorder, maxReorder);
    const stock = computeStockByPattern(i, reorderLevel, minStock, maxStock);

    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        reorder_level: reorderLevel,
        stock_quantity: stock,
        image_url: productImageUrl(rows[i].sku)
      })
      .eq('id', rows[i].id);

    if (!updateError) {
      updated += 1;
    }
  }

  return updated;
}

async function normalizeImageUrls(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('id, sku, image_url')
    .eq('is_active', true);

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  let updated = 0;

  for (const row of rows) {
    const hasHttpImage = typeof row.image_url === 'string' && row.image_url.startsWith('http');
    if (hasHttpImage) continue;

    const fallbackSeed = row.sku || `${tableName}-${row.id}`;
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ image_url: productImageUrl(fallbackSeed) })
      .eq('id', row.id);

    if (!updateError) updated += 1;
  }

  return updated;
}

async function normalizeCompatibility(tableName, universalByDefault = false, seedOffset = 0) {
  const { data, error } = await supabase
    .from(tableName)
    .select('id, sku, is_universal, compatible_bike_models')
    .eq('is_active', true)
    .order('id');

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  let updated = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const shouldBeUniversal = row.is_universal === null || row.is_universal === undefined
      ? universalByDefault
      : Boolean(row.is_universal);

    const raw = typeof row.compatible_bike_models === 'string' ? row.compatible_bike_models.trim() : '';
    const missingModels = raw.length === 0 || raw === '[]' || raw.toLowerCase() === 'null';

    if (shouldBeUniversal && raw === '[]') {
      continue;
    }

    const nextCompatibility = shouldBeUniversal ? '[]' : buildCompatibilityJson(i + seedOffset, 3);

    if (!missingModels && raw === nextCompatibility) {
      continue;
    }

    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        is_universal: shouldBeUniversal,
        compatible_bike_models: nextCompatibility
      })
      .eq('id', row.id);

    if (!updateError) updated += 1;
  }

  return updated;
}

async function normalizeSeededPartTypes(tableName, skuPrefix, typePool, inferTypeId) {
  const { data, error } = await supabase
    .from(tableName)
    .select('id, sku, name, part_type_id')
    .ilike('sku', `${skuPrefix}-%`)
    .order('sku');

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  let updated = 0;
  const fallbackId = typePool[0]?.id;

  for (const row of rows) {
    if (!fallbackId) break;
    const nextTypeId = inferTypeId(typePool, row.name, fallbackId);
    if (!nextTypeId || Number(row.part_type_id) === Number(nextTypeId)) continue;

    const { error: updateError } = await supabase
      .from(tableName)
      .update({ part_type_id: nextTypeId })
      .eq('id', row.id);

    if (!updateError) updated += 1;
  }

  return updated;
}

async function normalizeSeededDimensions(tableName, skuPrefix, productType) {
  const { data, error } = await supabase
    .from(tableName)
    .select('id, sku, name, dimensions')
    .ilike('sku', `${skuPrefix}-%`)
    .order('sku');

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  let updated = 0;

  for (const row of rows) {
    const current = String(row.dimensions || '').trim();
    if (current) continue;

    const nextDimensions = inferDimensions(row.name, productType);
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ dimensions: nextDimensions })
      .eq('id', row.id);

    if (!updateError) updated += 1;
  }

  return updated;
}

async function seedBulkProducts() {
  try {
    console.log('🌱 Bulk seeding started...');

    const [partTypesRes, spareBrandsRes, accessoryBrandsRes] = await Promise.all([
      supabase.from('part_types').select('id, name, code, category').eq('is_active', true),
      supabase.from('sparepart_brands').select('id, name, code').eq('is_active', true),
      supabase.from('accessory_brands').select('id, name, code').eq('is_active', true)
    ]);

    if (partTypesRes.error) throw partTypesRes.error;
    if (spareBrandsRes.error) throw spareBrandsRes.error;
    if (accessoryBrandsRes.error) throw accessoryBrandsRes.error;

    const allPartTypes = partTypesRes.data || [];
    const sparePartTypes = allPartTypes.filter((pt) => String(pt.category || '').toLowerCase().includes('spare'));
    const accessoryPartTypes = allPartTypes.filter((pt) => String(pt.category || '').toLowerCase().includes('accessory'));

    const spareTypesPool = sparePartTypes.length > 0 ? sparePartTypes : allPartTypes;
    const accessoryTypesPool = accessoryPartTypes.length > 0 ? accessoryPartTypes : allPartTypes;

    if (!spareTypesPool.length || !spareBrandsRes.data?.length) {
      throw new Error('Missing spare part types or sparepart brands.');
    }
    if (!accessoryTypesPool.length || !accessoryBrandsRes.data?.length) {
      throw new Error('Missing accessory part types or accessory brands.');
    }

    const existingSpareSkus = await getExistingSkus('spare_parts');
    const existingAccessorySkus = await getExistingSkus('accessories');

    const spareRows = [];
    partCatalog.forEach(([name, description], idx) => {
      const sku = makeSku('MSP', idx + 101);
      if (existingSpareSkus.has(sku)) return;

      const selling = randomNum(350, 6200);
      const cost = Math.max(100, Math.floor(selling * 0.58));
      const reorderLevel = randomNum(8, 25);
      const stock = computeStockByPattern(idx, reorderLevel, 18, 140);

      spareRows.push({
        sku,
        name,
        description,
        image_url: productImageUrl(sku),
        selling_price: selling,
        cost_price: cost,
        stock_quantity: stock,
        reorder_level: reorderLevel,
        dimensions: inferDimensions(name, 'sparepart'),
        part_type_id: inferSparePartTypeId(spareTypesPool, name, pickRandom(spareTypesPool).id),
        sparepart_brand_id: pickRandom(spareBrandsRes.data).id,
        is_universal: idx % 5 === 0,
        compatible_bike_models: idx % 5 === 0 ? '[]' : buildCompatibilityJson(idx, 3),
        is_active: true
      });
    });

    const accessoryRows = [];
    accessoryCatalog.forEach(([name, description], idx) => {
      const sku = makeSku('MAC', idx + 101);
      if (existingAccessorySkus.has(sku)) return;

      const selling = randomNum(180, 4800);
      const cost = Math.max(80, Math.floor(selling * 0.52));
      const reorderLevel = randomNum(6, 22);
      const stock = computeStockByPattern(idx, reorderLevel, 12, 120);

      accessoryRows.push({
        sku,
        name,
        description,
        image_url: productImageUrl(sku),
        selling_price: selling,
        cost_price: cost,
        stock_quantity: stock,
        reorder_level: reorderLevel,
        dimensions: inferDimensions(name, 'accessory'),
        part_type_id: inferAccessoryTypeId(accessoryTypesPool, name, pickRandom(accessoryTypesPool).id),
        accessory_brand_id: pickRandom(accessoryBrandsRes.data).id,
        is_universal: idx % 3 !== 0,
        compatible_bike_models: idx % 3 !== 0 ? '[]' : buildCompatibilityJson(idx + 25, 2),
        is_active: true
      });
    });

    let insertedSpare = 0;
    let insertedAccessory = 0;

    if (spareRows.length > 0) {
      const { data, error } = await supabase.from('spare_parts').insert(spareRows).select('id');
      if (error) throw error;
      insertedSpare = data?.length || 0;
    }

    if (accessoryRows.length > 0) {
      const { data, error } = await supabase.from('accessories').insert(accessoryRows).select('id');
      if (error) throw error;
      insertedAccessory = data?.length || 0;
    }

    const [rebalancedSpare, rebalancedAccessory] = await Promise.all([
      rebalanceSeededStock('spare_parts', 'MSP', 8, 130, 8, 24),
      rebalanceSeededStock('accessories', 'MAC', 6, 110, 6, 20)
    ]);

    const [normalizedSpareImages, normalizedAccessoryImages] = await Promise.all([
      normalizeImageUrls('spare_parts'),
      normalizeImageUrls('accessories')
    ]);

    const [normalizedSpareCompatibility, normalizedAccessoryCompatibility] = await Promise.all([
      normalizeCompatibility('spare_parts', false, 0),
      normalizeCompatibility('accessories', true, 35)
    ]);

    const [normalizedSpareTypes, normalizedAccessoryTypes] = await Promise.all([
      normalizeSeededPartTypes('spare_parts', 'MSP', spareTypesPool, inferSparePartTypeId),
      normalizeSeededPartTypes('accessories', 'MAC', accessoryTypesPool, inferAccessoryTypeId)
    ]);

    const [normalizedSpareDimensions, normalizedAccessoryDimensions] = await Promise.all([
      normalizeSeededDimensions('spare_parts', 'MSP', 'sparepart'),
      normalizeSeededDimensions('accessories', 'MAC', 'accessory')
    ]);

    console.log(`✅ Inserted spare parts: ${insertedSpare}`);
    console.log(`✅ Inserted accessories: ${insertedAccessory}`);
    console.log(`🔁 Rebalanced spare parts stocks: ${rebalancedSpare}`);
    console.log(`🔁 Rebalanced accessories stocks: ${rebalancedAccessory}`);
    console.log(`🖼️ Normalized spare part image URLs: ${normalizedSpareImages}`);
    console.log(`🖼️ Normalized accessory image URLs: ${normalizedAccessoryImages}`);
    console.log(`🏍️ Normalized spare part compatibility: ${normalizedSpareCompatibility}`);
    console.log(`🏍️ Normalized accessory compatibility: ${normalizedAccessoryCompatibility}`);
    console.log(`🧩 Normalized spare part types: ${normalizedSpareTypes}`);
    console.log(`🧩 Normalized accessory types: ${normalizedAccessoryTypes}`);
    console.log(`📐 Normalized spare part dimensions: ${normalizedSpareDimensions}`);
    console.log(`📐 Normalized accessory dimensions: ${normalizedAccessoryDimensions}`);

    const [spCount, accCount] = await Promise.all([
      supabase.from('spare_parts').select('*', { count: 'exact', head: true }),
      supabase.from('accessories').select('*', { count: 'exact', head: true })
    ]);

    console.log(`📦 Total spare parts in DB: ${spCount.count}`);
    console.log(`📦 Total accessories in DB: ${accCount.count}`);
    console.log('🎉 Bulk seeding complete.');
  } catch (error) {
    console.error('❌ Bulk seeding failed:', error.message);
    process.exit(1);
  }
}

seedBulkProducts();
