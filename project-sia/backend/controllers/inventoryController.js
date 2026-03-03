import { supabase } from '../supabaseClient.js';

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
    // Rename brand_id to sparepart_brand_id if it exists
    const payload = { ...req.body };
    if (payload.brand_id !== undefined) {
      payload.sparepart_brand_id = payload.brand_id;
      delete payload.brand_id;
    }

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
    
    // Rename brand_id to sparepart_brand_id if it exists
    const payload = { ...req.body };
    if (payload.brand_id !== undefined) {
      payload.sparepart_brand_id = payload.brand_id;
      delete payload.brand_id;
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
    // Rename brand_id to accessory_brand_id if it exists
    const payload = { ...req.body };
    if (payload.brand_id !== undefined) {
      payload.accessory_brand_id = payload.brand_id;
      delete payload.brand_id;
    }

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
    
    // Rename brand_id to accessory_brand_id if it exists
    const payload = { ...req.body };
    if (payload.brand_id !== undefined) {
      payload.accessory_brand_id = payload.brand_id;
      delete payload.brand_id;
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
      product_type: 'sparepart',
      brand_name: sp.sparepart_brand?.name || 'Unknown',
      brand_code: sp.sparepart_brand?.code || 'UNK',
      category: sp.part_type?.category || 'sparepart',
      part_type_name: sp.part_type?.name || 'Unknown'
    }));

    // Format accessories
    const formattedAccessories = accessories.map(acc => ({
      ...acc,
      product_type: 'accessory',
      brand_name: acc.accessory_brand?.name || 'Unknown',
      brand_code: acc.accessory_brand?.code || 'UNK',
      category: acc.part_type?.category || 'accessory',
      part_type_name: acc.part_type?.name || 'Unknown'
    }));

    // Combine and sort by created_at
    const allProducts = [...formattedSpareParts, ...formattedAccessories]
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
