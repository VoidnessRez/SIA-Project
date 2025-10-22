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

export default router;
