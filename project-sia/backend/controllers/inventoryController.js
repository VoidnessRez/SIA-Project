import { supabase } from '../supabaseClient.js';

const normalizeQualityType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'genuine' || normalized === 'aftermarket') return normalized;
  return 'unknown';
};

const parseNumericField = (value, { integer = false, min = 0 } = {}) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = integer ? parseInt(value, 10) : Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return null;
  if (parsed < min) return null;
  return parsed;
};

const sanitizeImageUrl = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  return /^https?:\/\//i.test(text) ? text : '';
};

const normalizeCompatibilityModels = (value) => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return JSON.stringify(value.map((v) => String(v || '').trim()).filter(Boolean));

  const text = String(value || '').trim();
  if (!text) return '';

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return JSON.stringify(parsed.map((v) => String(v || '').trim()).filter(Boolean));
    }
  } catch {
    // Keep plain text format if it's not valid JSON.
  }

  return text;
};

const sanitizeInventoryPayload = (inputPayload, { partial = false, isAccessory = false } = {}) => {
  const payload = { ...inputPayload };
  const errors = [];

  if (payload.brand_id !== undefined) {
    payload[isAccessory ? 'accessory_brand_id' : 'sparepart_brand_id'] = payload.brand_id;
    delete payload.brand_id;
  }

  const cleaned = {};

  const textFields = ['sku', 'name', 'description', 'unit', 'dimensions'];
  textFields.forEach((field) => {
    if (payload[field] !== undefined) cleaned[field] = String(payload[field] || '').trim();
  });

  const normalizedCompatibility = normalizeCompatibilityModels(payload.compatible_bike_models);
  if (normalizedCompatibility !== undefined) cleaned.compatible_bike_models = normalizedCompatibility;

  ['image_url', 'image_2', 'image_3'].forEach((field) => {
    if (payload[field] !== undefined) cleaned[field] = sanitizeImageUrl(payload[field]);
  });

  if (payload.is_universal !== undefined) cleaned.is_universal = Boolean(payload.is_universal);
  if (payload.quality_type !== undefined) cleaned.quality_type = normalizeQualityType(payload.quality_type);

  const numericConfig = {
    cost_price: { integer: false, min: 0 },
    selling_price: { integer: false, min: 0 },
    stock_quantity: { integer: true, min: 0 },
    reorder_level: { integer: true, min: 0 },
    reorder_quantity: { integer: true, min: 0 },
    max_stock_level: { integer: true, min: 0 },
    warranty_months: { integer: true, min: 0 },
    part_type_id: { integer: true, min: 1 },
    sparepart_brand_id: { integer: true, min: 1 },
    accessory_brand_id: { integer: true, min: 1 },
  };

  Object.entries(numericConfig).forEach(([field, config]) => {
    if (payload[field] === undefined) return;
    if (payload[field] === null && (field === 'part_type_id' || field === 'sparepart_brand_id' || field === 'accessory_brand_id')) {
      cleaned[field] = null;
      return;
    }

    const parsed = parseNumericField(payload[field], config);
    if (parsed === null) {
      errors.push(`Invalid value for ${field}`);
      return;
    }
    cleaned[field] = parsed;
  });

  if (!partial) {
    if (!cleaned.sku) errors.push('SKU is required');
    if (!cleaned.name) errors.push('Name is required');
    if (cleaned.selling_price === undefined) errors.push('Selling price is required');
  }

  const costPrice = cleaned.cost_price;
  const sellingPrice = cleaned.selling_price;
  if (
    costPrice !== undefined &&
    sellingPrice !== undefined &&
    costPrice !== null &&
    sellingPrice !== null &&
    sellingPrice < costPrice
  ) {
    errors.push('Selling price cannot be lower than cost price');
  }

  const reorderLevel = cleaned.reorder_level;
  const maxStockLevel = cleaned.max_stock_level;
  if (
    reorderLevel !== undefined &&
    maxStockLevel !== undefined &&
    reorderLevel !== null &&
    maxStockLevel !== null &&
    reorderLevel > maxStockLevel
  ) {
    errors.push('Reorder level cannot exceed max stock level');
  }

  return { cleaned, errors };
};

// =====================================================
// SPARE PARTS CONTROLLERS
// =====================================================

export async function getAllSpareParts(req, res) {
  try {
    const { data, error } = await supabase
      .from('spare_parts')
      .select(`
        *,
        sparepart_brand:sparepart_brands(id, name, code),
        part_type:part_types(id, name, code, category)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('[InventoryController] Get spare parts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getSparePartById(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('spare_parts')
      .select(`
        *,
        sparepart_brand:sparepart_brands(id, name, code),
        part_type:part_types(id, name, code, category)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('[InventoryController] Get spare part by ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createSparePart(req, res) {
  try {
    const { cleaned, errors } = sanitizeInventoryPayload(req.body, { partial: false, isAccessory: false });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }

    const payload = { ...cleaned };
    payload.is_active = true;
    payload.quality_type = normalizeQualityType(payload.quality_type);

    const { data, error } = await supabase
      .from('spare_parts')
      .insert([payload])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No data returned from insert');
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('[InventoryController] Create spare part error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateSparePart(req, res) {
  try {
    const { id } = req.params;
    const { cleaned, errors } = sanitizeInventoryPayload(req.body, { partial: true, isAccessory: false });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }

    const payload = { ...cleaned };
    if (payload.quality_type !== undefined) {
      payload.quality_type = normalizeQualityType(payload.quality_type);
    }

    const { data, error } = await supabase
      .from('spare_parts')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Spare part not found or update failed');
    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('[InventoryController] Update spare part error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteSparePart(req, res) {
  try {
    const { id } = req.params;
    // Soft delete - just set is_active to false
    const { error } = await supabase
      .from('spare_parts')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Spare part deleted successfully' });
  } catch (error) {
    console.error('[InventoryController] Delete spare part error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// =====================================================
// ACCESSORIES CONTROLLERS
// =====================================================

export async function getAllAccessories(req, res) {
  try {
    const { data, error } = await supabase
      .from('accessories')
      .select(`
        *,
        accessory_brand:accessory_brands(id, name, code),
        part_type:part_types(id, name, code, category)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('[InventoryController] Get accessories error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAccessoryById(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('accessories')
      .select(`
        *,
        accessory_brand:accessory_brands(id, name, code),
        part_type:part_types(id, name, code, category)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('[InventoryController] Get accessory by ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createAccessory(req, res) {
  try {
    const { cleaned, errors } = sanitizeInventoryPayload(req.body, { partial: false, isAccessory: true });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }

    const payload = { ...cleaned };
    payload.is_active = true;
    payload.quality_type = normalizeQualityType(payload.quality_type);

    const { data, error } = await supabase
      .from('accessories')
      .insert([payload])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No data returned from insert');
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('[InventoryController] Create accessory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateAccessory(req, res) {
  try {
    const { id } = req.params;
    const { cleaned, errors } = sanitizeInventoryPayload(req.body, { partial: true, isAccessory: true });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }

    const payload = { ...cleaned };
    if (payload.quality_type !== undefined) {
      payload.quality_type = normalizeQualityType(payload.quality_type);
    }

    const { data, error } = await supabase
      .from('accessories')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Accessory not found or update failed');
    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('[InventoryController] Update accessory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteAccessory(req, res) {
  try {
    const { id } = req.params;
    // Soft delete
    const { error } = await supabase
      .from('accessories')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Accessory deleted successfully' });
  } catch (error) {
    console.error('[InventoryController] Delete accessory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// =====================================================
// ALL PRODUCTS (SPARE PARTS + ACCESSORIES COMBINED)
// =====================================================

export async function getAllProducts(req, res) {
  try {
    res.set('Cache-Control', 'no-store');

    // Get spare parts
    const { data: spareParts, error: spError } = await supabase
      .from('spare_parts')
      .select(`
        *,
        sparepart_brand:sparepart_brands(id, name, code),
        part_type:part_types(id, name, code, category)
      `)
      .eq('is_active', true);

    if (spError) throw spError;

    // Get accessories
    const { data: accessories, error: accError } = await supabase
      .from('accessories')
      .select(`
        *,
        accessory_brand:accessory_brands(id, name, code),
        part_type:part_types(id, name, code, category)
      `)
      .eq('is_active', true);

    if (accError) throw accError;

    // Format spare parts
    const formattedSpareParts = spareParts.map(sp => ({
      ...sp,
      selling_price: Number(sp.selling_price || 0),
      stock_quantity: Math.max(parseInt(sp.stock_quantity || 0, 10) || 0, 0),
      quality_type: normalizeQualityType(sp.quality_type),
      product_type: 'sparepart',
      brand_name: sp.sparepart_brand?.name || 'Unknown',
      brand_code: sp.sparepart_brand?.code || 'UNK',
      category: sp.part_type?.category || 'sparepart',
      part_type_name: sp.part_type?.name || 'Unknown'
    }));

    // Format accessories
    const formattedAccessories = accessories.map(acc => ({
      ...acc,
      selling_price: Number(acc.selling_price || 0),
      stock_quantity: Math.max(parseInt(acc.stock_quantity || 0, 10) || 0, 0),
      quality_type: normalizeQualityType(acc.quality_type),
      product_type: 'accessory',
      brand_name: acc.accessory_brand?.name || 'Unknown',
      brand_code: acc.accessory_brand?.code || 'UNK',
      category: acc.part_type?.category || 'accessory',
      part_type_name: acc.part_type?.name || 'Unknown'
    }));

    // Combine and sort by created_at
    const allProducts = [...formattedSpareParts, ...formattedAccessories]
      .filter((item) => String(item.name || '').trim().length > 0)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: allProducts });
  } catch (error) {
    console.error('[InventoryController] Get all products error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// =====================================================
// BRANDS
// =====================================================

export async function getAllBrands(req, res) {
  try {
    const [motorcycleBrands, sparepartBrands, accessoryBrands] = await Promise.all([
      supabase.from('motorcycle_brands').select('*').eq('is_active', true),
      supabase.from('sparepart_brands').select('*').eq('is_active', true),
      supabase.from('accessory_brands').select('*').eq('is_active', true)
    ]);

    if (motorcycleBrands.error) throw motorcycleBrands.error;
    if (sparepartBrands.error) throw sparepartBrands.error;
    if (accessoryBrands.error) throw accessoryBrands.error;

    res.json({
      success: true,
      data: {
        motorcycle: motorcycleBrands.data || [],
        sparepart: sparepartBrands.data || [],
        accessory: accessoryBrands.data || []
      }
    });
  } catch (error) {
    console.error('[InventoryController] Get all brands error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getPartTypes(req, res) {
  try {
    const { data, error } = await supabase
      .from('part_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('[InventoryController] Get part types error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// =====================================================
// LOW STOCK ITEMS
// =====================================================

export async function getLowStockItems(req, res) {
  try {
    const { data, error } = await supabase
      .from('low_stock_items')
      .select('*');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('[InventoryController] Get low stock items error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// =====================================================
// INVENTORY TRANSACTIONS
// =====================================================

export async function createInventoryTransaction(req, res) {
  try {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert([req.body])
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No data returned from insert');
    res.status(201).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('[InventoryController] Create inventory transaction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getInventoryTransactions(req, res) {
  try {
    const { product_type, product_id, limit = 50 } = req.query;
    
    let query = supabase
      .from('inventory_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (product_type) query = query.eq('product_type', product_type);
    if (product_id) query = query.eq('product_id', product_id);

    const { data, error } = await query;

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('[InventoryController] Get inventory transactions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
