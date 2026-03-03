import { supabase } from '../supabaseClient.js';

/**
 * GET /api/inventory/overstocked
 * Get all overstocked items (items where stock_quantity > max_stock_level)
 */
export async function getOverstockedItems(req, res) {
  try {
    const { product_type, limit = 50 } = req.query;

    const overstockedItems = [];

    // Get overstocked spare parts
    if (!product_type || product_type === 'spare_part') {
      const { data: spareParts, error: spError } = await supabase
        .from('spare_parts')
        .select(`
          id,
          sku,
          name,
          stock_quantity,
          reorder_level,
          max_stock_level,
          selling_price,
          cost_price,
          sparepart_brand:sparepart_brands(name),
          part_type:part_types(name)
        `)
        .eq('is_active', true)
        .order('stock_quantity', { ascending: false });

      if (spError) throw spError;

      const overstockedSpareParts = spareParts
        .filter(item => item.stock_quantity > (item.max_stock_level || 200))
        .map(item => ({
          ...item,
          product_type: 'spare_part',
          excess_quantity: item.stock_quantity - item.max_stock_level,
          excess_percentage: ((item.stock_quantity - item.max_stock_level) / item.max_stock_level * 100).toFixed(2)
        }));

      overstockedItems.push(...overstockedSpareParts);
    }

    // Get overstocked accessories
    if (!product_type || product_type === 'accessory') {
      const { data: accessories, error: accError } = await supabase
        .from('accessories')
        .select(`
          id,
          sku,
          name,
          stock_quantity,
          reorder_level,
          max_stock_level,
          selling_price,
          cost_price,
          accessory_brand:accessory_brands(name),
          part_type:part_types(name)
        `)
        .eq('is_active', true)
        .order('stock_quantity', { ascending: false });

      if (accError) throw accError;

      const overstockedAccessories = accessories
        .filter(item => item.stock_quantity > (item.max_stock_level || 200))
        .map(item => ({
          ...item,
          product_type: 'accessory',
          excess_quantity: item.stock_quantity - item.max_stock_level,
          excess_percentage: ((item.stock_quantity - item.max_stock_level) / item.max_stock_level * 100).toFixed(2)
        }));

      overstockedItems.push(...overstockedAccessories);
    }

    // Sort by excess percentage (highest first)
    overstockedItems.sort((a, b) => parseFloat(b.excess_percentage) - parseFloat(a.excess_percentage));

    // Apply limit
    const limitedItems = overstockedItems.slice(0, parseInt(limit));

    res.json({ 
      success: true, 
      data: limitedItems,
      total: overstockedItems.length 
    });
  } catch (error) {
    console.error('[Inventory] Get overstocked items error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/inventory/overstocked/stats
 * Get overstock statistics
 */
export async function getOverstockStats(req, res) {
  try {
    // Get all spare parts
    const { data: spareParts } = await supabase
      .from('spare_parts')
      .select('stock_quantity, max_stock_level, cost_price')
      .eq('is_active', true);

    // Get all accessories
    const { data: accessories } = await supabase
      .from('accessories')
      .select('stock_quantity, max_stock_level, cost_price')
      .eq('is_active', true);

    const allProducts = [...(spareParts || []), ...(accessories || [])];

    const overstocked = allProducts.filter(p => p.stock_quantity > (p.max_stock_level || 200));
    
    const totalOverstocked = overstocked.length;
    const totalExcessUnits = overstocked.reduce((sum, item) => 
      sum + (item.stock_quantity - (item.max_stock_level || 200)), 0
    );
    const totalExcessValue = overstocked.reduce((sum, item) => 
      sum + ((item.stock_quantity - (item.max_stock_level || 200)) * parseFloat(item.cost_price || 0)), 0
    );

    res.json({
      success: true,
      stats: {
        total_overstocked_items: totalOverstocked,
        total_excess_units: totalExcessUnits,
        total_excess_value: parseFloat(totalExcessValue.toFixed(2)),
        total_products: allProducts.length,
        overstock_rate: ((totalOverstocked / allProducts.length) * 100).toFixed(2)
      }
    });
  } catch (error) {
    console.error('[Inventory] Get overstock stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /api/inventory/update-max-stock/:type/:id
 * Update max_stock_level for a product
 */
export async function updateMaxStockLevel(req, res) {
  try {
    const { type, id } = req.params;
    const { max_stock_level } = req.body;

    const table = type === 'spare_part' ? 'spare_parts' : 'accessories';

    const { data, error } = await supabase
      .from(table)
      .update({ max_stock_level: parseInt(max_stock_level) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[Inventory] Update max stock level error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
