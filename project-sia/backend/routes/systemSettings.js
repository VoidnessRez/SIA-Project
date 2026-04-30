import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// GET /api/system-settings/gcash-qr
// Returns the active GCash QR settings for checkout display.
router.get('/gcash-qr', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'gcash_qr')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const payload = data?.value || {};

    return res.json({
      success: true,
      url: String(payload.url || '').trim(),
      path: String(payload.path || '').trim(),
      updatedAt: payload.updatedAt || null
    });
  } catch (error) {
    console.error('[SystemSettings] Failed to load GCash QR:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to load GCash QR settings'
    });
  }
});

export default router;
