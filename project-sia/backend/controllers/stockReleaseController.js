import { supabase } from '../supabaseClient.js';

/**
 * GET /api/stock-releases
 * Get all stock releases with filters
 */
export async function getStockReleases(req, res) {
  try {
    const { status, release_type, product_type, limit = 50 } = req.query;

    let query = supabase
      .from('stock_releases')
      .select('*')
      .order('requested_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (release_type) query = query.eq('release_type', release_type);
    if (product_type) query = query.eq('product_type', product_type);
    
    query = query.limit(parseInt(limit));

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[StockRelease] Get stock releases error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/stock-releases/create
 * Create a new stock release request
 */
export async function createStockRelease(req, res) {
  try {
    const {
      product_type,
      product_id,
      product_sku,
      product_name,
      quantity_released,
      release_type,
      release_reason,
      released_to,
      destination,
      unit_cost,
      reference_number,
      notes,
      requested_by
    } = req.body;

    const total_cost = parseFloat(unit_cost || 0) * parseInt(quantity_released);

    const { data, error } = await supabase
      .from('stock_releases')
      .insert ([{
        product_type,
        product_id,
        product_sku,
        product_name,
        quantity_released: parseInt(quantity_released),
        release_type,
        release_reason,
        released_to,
        destination,
        unit_cost: parseFloat(unit_cost || 0),
        total_cost,
        reference_number,
        notes,
        requested_by,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('[StockRelease] Create stock release error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /api/stock-releases/:id/approve
 * Approve a stock release
 */
export async function approveStockRelease(req, res) {
  try {
    const { id } = req.params;
    const { approved_by } = req.body;

    const { data, error } = await supabase
      .from('stock_releases')
      .update({
        status: 'approved',
        approved_by,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[StockRelease] Approve stock release error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /api/stock-releases/:id/release
 * Mark stock as released and update inventory
 */
export async function processStockRelease(req, res) {
  try {
    const { id } = req.params;
    const { processed_by } = req.body;

    // Get the release details
    const { data: release, error: fetchError } = await supabase
      .from('stock_releases')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (release.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        error: 'Release must be approved before processing' 
      });
    }

    // Update stock quantity
    const table = release.product_type === 'spare_part' ? 'spare_parts' : 'accessories';
    
    const { error: updateError } = await supabase
      .rpc('decrement_stock', {
        table_name: table,
        product_id: release.product_id,
        quantity: release.quantity_released
      });

    if (updateError) {
      // Fallback: manual update
      const { data: product } = await supabase
        .from(table)
        .select('stock_quantity')
        .eq('id', release.product_id)
        .single();

      const newStock = product.stock_quantity - release.quantity_released;

      await supabase
        .from(table)
        .update({ stock_quantity: newStock })
        .eq('id', release.product_id);
    }

    // Update release status
    const { data, error } = await supabase
      .from('stock_releases')
      .update({
        status: 'released',
        processed_by,
        released_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create inventory transaction
    await supabase
      .from('inventory_transactions')
      .insert([{
        product_type: release.product_type,
        product_id: release.product_id,
        transaction_type: 'stock_release',
        quantity_change: -release.quantity_released,
        transaction_date: new Date().toISOString(),
        notes: `Stock Release: ${release.release_number} - ${release.release_type}`,
        reference_number: release.release_number
      }]);

    res.json({ success: true, data });
  } catch (error) {
    console.error('[StockRelease] Process stock release error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /api/stock-releases/:id/cancel
 * Cancel a stock release
 */
export async function cancelStockRelease(req, res) {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const { data, error } = await supabase
      .from('stock_releases')
      .update({
        status: 'cancelled',
        notes: cancellation_reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[StockRelease] Cancel stock release error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/stock-releases/stats
 * Get stock release statistics
 */
export async function getStockReleaseStats(req, res) {
  try {
    const { data, error } = await supabase
      .from('stock_releases')
      .select('status, quantity_released, total_cost, release_type');

    if (error) throw error;

    const stats = {
      total_releases: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      approved: data.filter(r => r.status === 'approved').length,
      released: data.filter(r => r.status === 'released').length,
      cancelled: data.filter(r => r.status === 'cancelled').length,
      total_units_released: data
        .filter(r => r.status === 'released')
        .reduce((sum, r) => sum + r.quantity_released, 0),
      total_value_released: data
        .filter(r => r.status === 'released')
        .reduce((sum, r) => sum + parseFloat(r.total_cost || 0), 0)
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('[StockRelease] Get stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
