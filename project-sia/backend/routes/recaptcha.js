import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// POST /api/recaptcha/verify - Verify reCAPTCHA token
router.post('/verify', async (req, res) => {
  console.log('\n🔐 ====== reCAPTCHA VERIFICATION REQUEST ======');
  console.log('📥 Request received at:', new Date().toISOString());
  
  try {
    const { token } = req.body;
    console.log('🔑 Token received:', token ? `${token.substring(0, 50)}...` : 'MISSING');
    
    if (!token) {
      console.log('❌ No token provided in request body');
      return res.status(400).json({ 
        success: false, 
        error: 'missing token' 
      });
    }

    const secret = process.env.RECAPTCHA_SECRET;
    if (!secret) {
      console.error('⚠️ RECAPTCHA_SECRET not set in environment');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error: RECAPTCHA_SECRET not set. Check backend/.env file.' 
      });
    }
    console.log('✅ Secret key found in environment');

    // Verify with Google reCAPTCHA API
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    console.log('� Sending verification request to Google reCAPTCHA API...');
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', { 
      method: 'POST', 
      body: params 
    });
    
    console.log('📨 Response status from Google:', response.status);
    const data = await response.json();
    console.log('📋 Full response from Google:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ reCAPTCHA VERIFICATION SUCCESSFUL');
    } else {
      console.log('❌ reCAPTCHA VERIFICATION FAILED');
      console.log('🔍 Error codes:', data['error-codes']);
    }
    
    console.log('📤 Sending response to client:', data.success ? 'SUCCESS' : 'FAILED');
    console.log('====== END reCAPTCHA VERIFICATION ======\n');

    // Forward the verification result to the client
    return res.json(data);
  } catch (err) {
    console.error('💥 ====== reCAPTCHA VERIFICATION ERROR ======');
    console.error('❌ Error details:', err.message);
    console.error('📚 Stack trace:', err.stack);
    console.error('====== END ERROR ======\n');
    return res.status(500).json({ 
      success: false, 
      error: 'verification failed' 
    });
  }
});

export default router;
