import { supabase } from '../supabaseClient.js';

/**
 * GET /api/price-history
 * Get all price history records with optional filters
 */
export async function getPriceHistory(req, res) {
  try {
    const { 
      product_type, 
      product_id, 
      change_type, 
      limit = 50,
      offset = 0,
      start_date,
      end_date,
      sort_by = 'change_date',
      sort_order = 'desc'
    } = req.query;

    let query = supabase
      .from('price_history')
      .select('*', { count: 'exact' });

    // Apply filters
    if (product_type) query = query.eq('product_type', product_type);
    if (product_id) query = query.eq('product_id', product_id);
    if (change_type) query = query.eq('change_type', change_type);
    if (start_date) query = query.gte('change_date', start_date);
    if (end_date) query = query.lte('change_date', end_date);

    // Apply sorting and pagination
    const ascending = sort_order === 'asc';
    query = query
      .order(sort_by, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({ 
      success: true, 
      data,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: count > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[PriceHistory] Get price history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/price-history/product/:type/:id
 * Get price history for a specific product
 */
export async function getProductPriceHistory(req, res) {
  try {
    const { type, id } = req.params;
    const { limit = 20 } = req.query;

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_type', type)
      .eq('product_id', id)
      .order('change_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[PriceHistory] Get product price history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/price-history/recent?days=N
 * Get price changes from last N days
 */
export async function getRecentPriceChanges(req, res) {
  try {
    const { days = 30 } = req.query;
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .gte('change_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('change_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ success: true, data, days: parseInt(days) });
  } catch (error) {
    console.error('[PriceHistory] Get recent price changes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/price-history/increases
 * Get all price increases
 */
export async function getPriceIncreases(req, res) {
  try {
    const { limit = 50, min_percentage } = req.query;

    let query = supabase
      .from('price_history')
      .select('*')
      .eq('change_type', 'increase')
      .order('change_date', { ascending: false });

    if (min_percentage) {
      query = query.gte('percentage_change', min_percentage);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[PriceHistory] Get price increases error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/price-history/decreases
 * Get all price decreases
 */
export async function getPriceDecreases(req, res) {
  try {
    const { limit = 50, min_percentage } = req.query;

    let query = supabase
      .from('price_history')
      .select('*')
      .eq('change_type', 'decrease')
      .order('change_date', { ascending: false });

    if (min_percentage) {
      query = query.lte('percentage_change', -min_percentage);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[PriceHistory] Get price decreases error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/price-history/stats
 * Get price history statistics
 */
export async function getPriceHistoryStats(req, res) {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .gte('change_date', startDate);

    if (error) throw error;

    // Calculate statistics
    const total = data.length;
    const increases = data.filter(item => item.change_type === 'increase').length;
    const decreases = data.filter(item => item.change_type === 'decrease').length;
    
    const avgIncrease = increases > 0 
      ? data.filter(item => item.change_type === 'increase')
        .reduce((sum, item) => sum + parseFloat(item.percentage_change), 0) / increases
      : 0;
    
    const avgDecrease = decreases > 0
      ? data.filter(item => item.change_type === 'decrease')
        .reduce((sum, item) => sum + Math.abs(parseFloat(item.percentage_change)), 0) / decreases
      : 0;

    const maxIncrease = data.length > 0
      ? Math.max(...data.map(item => parseFloat(item.percentage_change)))
      : 0;

    const maxDecrease = data.length > 0
      ? Math.min(...data.map(item => parseFloat(item.percentage_change)))
      : 0;

    res.json({ 
      success: true, 
      stats: {
        days: parseInt(days),
        total_changes: total,
        price_increases: increases,
        price_decreases: decreases,
        average_increase_percent: parseFloat(avgIncrease.toFixed(2)),
        average_decrease_percent: parseFloat(avgDecrease.toFixed(2)),
        max_increase_percent: parseFloat(maxIncrease.toFixed(2)),
        max_decrease_percent: parseFloat(maxDecrease.toFixed(2))
      }
    });
  } catch (error) {
    console.error('[PriceHistory] Get price history stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/price-history/manual
 * Manually create a price history entry (for bulk imports or corrections)
 */
export async function createPriceHistoryEntry(req, res) {
  try {
    const {
      product_type,
      product_id,
      product_sku,
      product_name,
      old_selling_price,
      new_selling_price,
      old_cost_price,
      new_cost_price,
      change_reason,
      market_price,
      competitor_price,
      notes
    } = req.body;

    // Calculate price difference and percentage
    const price_difference = parseFloat(new_selling_price) - parseFloat(old_selling_price);
    const percentage_change = (price_difference / parseFloat(old_selling_price)) * 100;
    const change_type = price_difference >= 0 ? 'increase' : 'decrease';

    const { data, error } = await supabase
      .from('price_history')
      .insert([{
        product_type,
        product_id,
        product_sku,
        product_name,
        old_cost_price,
        new_cost_price,
        old_selling_price,
        new_selling_price,
        price_difference,
        percentage_change,
        change_type,
        change_reason,
        market_price,
        competitor_price,
        notes
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('[PriceHistory] Create price history entry error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /api/price-history/:id
 * Update an existing price history entry
 */
export async function updatePriceHistoryEntry(req, res) {
  try {
    const { id } = req.params;
    const {
      old_selling_price,
      new_selling_price,
      change_reason,
      change_date,
      notes
    } = req.body;

    const oldPrice = parseFloat(old_selling_price);
    const newPrice = parseFloat(new_selling_price);

    if (!id || Number.isNaN(oldPrice) || Number.isNaN(newPrice) || oldPrice <= 0 || newPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payload. Old/new selling price is required and must be valid numbers.'
      });
    }

    const price_difference = newPrice - oldPrice;
    const percentage_change = oldPrice === 0 ? 0 : (price_difference / oldPrice) * 100;
    const change_type = price_difference >= 0 ? 'increase' : 'decrease';

    const payload = {
      old_selling_price: oldPrice,
      new_selling_price: newPrice,
      price_difference,
      percentage_change,
      change_type,
      change_reason: change_reason || null,
      notes: notes || null,
    };

    if (change_date) {
      payload.change_date = change_date;
    }

    const { data, error } = await supabase
      .from('price_history')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data, message: 'Price history entry updated' });
  } catch (error) {
    console.error('[PriceHistory] Update price history entry error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/price-history/:id
 * Delete a price history entry (admin only, for corrections)
 */
export async function deletePriceHistoryEntry(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('price_history')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Price history entry deleted' });
  } catch (error) {
    console.error('[PriceHistory] Delete price history entry error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
