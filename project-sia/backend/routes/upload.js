import express from 'express';
import multer from 'multer';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// POST /api/upload/avatar
// Upload avatar image through backend (bypasses RLS)
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  console.log('[Upload] 📸 POST /api/upload/avatar - Request received');
  
  try {
    if (!req.file) {
      console.log('[Upload] ❌ No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    const { userId } = req.body;
    if (!userId) {
      console.log('[Upload] ❌ No userId provided');
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log('[Upload] 📦 File info:', {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      userId: userId
    });

    // Generate unique filename
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    console.log('[Upload] 📤 Uploading to Supabase Storage:', filePath);

    // Upload using SERVICE_KEY (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Upload] ❌ Upload error:', uploadError);
      throw uploadError;
    }

    console.log('[Upload] ✅ Upload successful:', uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    console.log('[Upload] 🔗 Public URL:', publicUrl);

    // Update user's avatar_url in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('[Upload] ⚠️ Failed to update profile:', updateError);
      // Don't fail the upload if profile update fails
    } else {
      console.log('[Upload] ✅ Profile avatar_url updated');
    }

    return res.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error('[Upload] 💥 Upload error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to upload file',
    });
  }
});

// POST /api/upload/product-image
// Upload product image for inventory items
router.post('/product-image', upload.single('image'), async (req, res) => {
  console.log('[Upload] 🛍️ POST /api/upload/product-image - Request received');

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { sku, productType } = req.body;
    const normalizedSku = (sku || `product-${Date.now()}`).replace(/[^a-zA-Z0-9-_]/g, '-');
    const folder = productType === 'accessory' ? 'accessories' : 'spare-parts';

    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${normalizedSku}-${Date.now()}.${fileExt}`;
    const filePath = `products/${folder}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    return res.json({
      success: true,
      url: publicUrl,
      path: filePath,
      data: uploadData,
    });
  } catch (error) {
    console.error('[Upload] 💥 Product image upload error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to upload product image',
    });
  }
});

// POST /api/upload/payment-proof
// Upload GCash payment proof for an order
router.post('/payment-proof', upload.single('receipt'), async (req, res) => {
  console.log('[Upload] 💳 POST /api/upload/payment-proof - Request received');

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No receipt image provided' });
    }

    const orderId = Number(req.body?.orderId);
    const reuploadReason = String(req.body?.reupload_reason || '').trim();
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid orderId is required' });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, payment_method, order_status, admin_notes')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (String(order.payment_method || '').toLowerCase() !== 'gcash') {
      return res.status(400).json({ success: false, message: 'Payment proof upload is only for GCash orders' });
    }

    const safeOrderNumber = String(order.order_number || `order-${orderId}`).replace(/[^a-zA-Z0-9-_]/g, '-');
    const fileExt = String(req.file.originalname || 'png').split('.').pop();
    const fileName = `${safeOrderNumber}-${Date.now()}.${fileExt}`;
    const filePath = `payments/gcash/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from('profiles').getPublicUrl(filePath);

    const settingsPayload = {
      key: 'gcash_qr',
      value: {
        url: publicUrl,
        path: filePath,
        updatedAt: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    const { error: settingsError } = await supabase
      .from('system_settings')
      .upsert(settingsPayload, { onConflict: 'key' });

    if (settingsError) {
      throw settingsError;
    }

    const updateData = {
      payment_proof_url: publicUrl,
      payment_status: 'pending',
      updated_at: new Date().toISOString()
    };

    // After failed/blurry verification, resubmission should return to admin review queue.
    if (String(order.order_status || '').toLowerCase() === 'incomplete_txn') {
      updateData.order_status = 'pending_approval';
    }

    if (reuploadReason) {
      const stamp = new Date().toISOString();
      const line = `[Buyer Reupload ${stamp}] ${reuploadReason}`;
      updateData.admin_notes = order.admin_notes
        ? `${order.admin_notes}\n${line}`
        : line;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('id, order_number, payment_method, payment_status, payment_proof_url, order_status, admin_notes, updated_at')
      .single();

    if (updateError) {
      throw updateError;
    }

    return res.json({
      success: true,
      message: 'Payment proof uploaded successfully',
      url: publicUrl,
      path: filePath,
      data: updatedOrder
    });
  } catch (error) {
    console.error('[Upload] 💥 Payment proof upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload payment proof'
    });
  }
});

// POST /api/upload/gcash-qr
// Upload or replace active GCash QR image used in checkout
router.post('/gcash-qr', upload.single('qr'), async (req, res) => {
  console.log('[Upload] 🧾 POST /api/upload/gcash-qr - Request received');

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No QR image provided' });
    }

    const fileExt = String(req.file.originalname || 'png').split('.').pop();
    const fileName = `gcash-qr-${Date.now()}.${fileExt}`;
    const filePath = `payments/gcash-qr/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl }
    } = supabase.storage.from('profiles').getPublicUrl(filePath);

    return res.json({
      success: true,
      message: 'GCash QR uploaded successfully',
      url: publicUrl,
      path: filePath
    });
  } catch (error) {
    console.error('[Upload] 💥 GCash QR upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload GCash QR image'
    });
  }
});

// DELETE /api/upload/product-image
// Delete product image by storage path
router.delete('/product-image', async (req, res) => {
  try {
    const { path } = req.body || {};

    if (!path) {
      return res.status(400).json({ error: 'path is required' });
    }

    const { error } = await supabase.storage.from('profiles').remove([path]);

    if (error) {
      throw error;
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[Upload] 💥 Product image delete error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete product image' });
  }
});

export default router;
