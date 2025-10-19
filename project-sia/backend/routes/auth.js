import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// POST /api/auth/signup
// body: { username, email, password, first_name, last_name, phone, gender, birthday, street, barangay, city, province, region, zip_code }
router.post('/signup', async (req, res) => {
  console.log('[Backend] 📝 POST /api/auth/signup - Request received');
  console.log('[Backend] 📦 Request body:', {
    username: req.body?.username,
    email: req.body?.email,
    first_name: req.body?.first_name,
    last_name: req.body?.last_name,
    phone: req.body?.phone,
    hasPassword: !!req.body?.password,
    passwordLength: req.body?.password?.length,
    city: req.body?.city,
    province: req.body?.province
  });
  
  const { 
    username, email, password,
    first_name, last_name, phone, gender, birthday,
    street, barangay, city, province, region, zip_code
  } = req.body || {};
  
  if (!username || !email || !password) {
    console.log('[Backend] ❌ Missing required fields:', { username: !!username, email: !!email, password: !!password });
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  console.log('[Backend] ✅ Required fields present');

  try {
    // check existing username (case-insensitive)
    console.log('[Backend] 🔍 Checking for existing username...');
    const { data: existingByUsername, error: ue } = await supabase
      .from('auth_users')
      .select('id')
      .ilike('username', username)
      .limit(1);
    if (ue) {
      console.error('[Backend] ❌ Username check error:', ue);
      throw ue;
    }
    if (existingByUsername && existingByUsername.length) {
      console.log('[Backend] ❌ Username already exists:', username);
      return res.status(409).json({ error: 'username already exists' });
    }
    console.log('[Backend] ✅ Username available');

    // check existing email (case-insensitive)
    console.log('[Backend] 🔍 Checking for existing email...');
    const { data: existingByEmail, error: ee } = await supabase
      .from('auth_users')
      .select('id')
      .ilike('email', email)
      .limit(1);
    if (ee) {
      console.error('[Backend] ❌ Email check error:', ee);
      throw ee;
    }
    if (existingByEmail && existingByEmail.length) {
      console.log('[Backend] ❌ Email already exists:', email);
      return res.status(409).json({ error: 'email already exists' });
    }
    console.log('[Backend] ✅ Email available');

    // Step 1: Create auth record
    console.log('[Backend] 💾 Step 1: Creating auth record in public.auth_users...');
    const { data: authData, error: authError } = await supabase
      .from('auth_users')
      .insert([{ username, email, password }])
      .select('id, username, email, created_at');

    if (authError) {
      console.error('[Backend] ❌ Auth creation error:', authError);
      throw authError;
    }
    if (!authData || !authData.length) {
      console.error('[Backend] ❌ No auth data returned');
      throw new Error('Failed to create auth record');
    }

    const authUser = authData[0];
    const userId = authUser.id;
    console.log('[Backend] ✅ Auth record created with ID:', userId);

    // Step 2: Update profile with user data (trigger already created profile row)
    if (first_name || last_name || phone || gender || birthday) {
      console.log('[Backend] 💾 Step 2: Updating profile in public.profiles...');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name,
          last_name,
          phone,
          gender,
          birthday,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error('[Backend] ⚠️ Profile update error:', profileError);
        // Don't fail signup if profile update fails
      } else {
        console.log('[Backend] ✅ Profile updated successfully');
      }
    } else {
      console.log('[Backend] ⏭️ No profile data to update');
    }

    // Step 3: Create address if provided
    if (street || barangay || city) {
      console.log('[Backend] 💾 Step 3: Creating address in public.addresses...');
      const { error: addressError } = await supabase
        .from('addresses')
        .insert([{
          profile_id: userId,
          street,
          barangay,
          city,
          province,
          region,
          zip_code,
          is_primary: true
        }]);

      if (addressError) {
        console.error('[Backend] ⚠️ Address creation error:', addressError);
        // Don't fail signup if address creation fails
      } else {
        console.log('[Backend] ✅ Address created successfully');
      }
    } else {
      console.log('[Backend] ⏭️ No address data to create');
    }

    console.log('[Backend] 🎉 Signup completed successfully!');
    return res.status(201).json({ user: authUser });
  } catch (err) {
    console.error('[Backend] 💥 Signup error:', err);
    console.error('[Backend] Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return res.status(500).json({ error: 'signup failed' });
  }
});

// POST /api/auth/login
// body: { identifier, password } where identifier is username OR email
router.post('/login', async (req, res) => {
  console.log('[Backend] 🔐 POST /api/auth/login - Request received');
  console.log('[Backend] 📦 Request body:', {
    identifier: req.body?.identifier,
    hasPassword: !!req.body?.password
  });
  
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    console.log('[Backend] ❌ Missing identifier or password');
    return res.status(400).json({ error: 'identifier and password are required' });
  }
  console.log('[Backend] ✅ Required fields present');

  try {
    // try matching by email or username (case-insensitive)
    console.log('[Backend] 🔍 Searching for user with identifier:', identifier);
    const { data, error } = await supabase
      .from('auth_users')
      .select('id, username, email, password, created_at')
      .or(`username.ilike.${identifier},email.ilike.${identifier}`)
      .limit(1);

    if (error) {
      console.error('[Backend] ❌ Database query error:', error);
      throw error;
    }
    
    if (!data || !data.length) {
      console.log('[Backend] ❌ No user found with identifier:', identifier);
      return res.status(401).json({ error: 'invalid credentials' });
    }
    console.log('[Backend] ✅ User found:', { id: data[0].id, username: data[0].username, email: data[0].email });

    const user = data[0];
    // plaintext comparison (development only)
    console.log('[Backend] 🔑 Comparing passwords...');
    if (user.password !== password) {
      console.log('[Backend] ❌ Password mismatch');
      return res.status(401).json({ error: 'invalid credentials' });
    }
    console.log('[Backend] ✅ Password match!');

    // Fetch profile data
    console.log('[Backend] 📋 Fetching profile data...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, gender, birthday')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('[Backend] ⚠️ Profile fetch error:', profileError);
    } else {
      console.log('[Backend] ✅ Profile data found:', profileData);
    }

    // success - do NOT return password, include profile data
    const { password: _p, ...safeUser } = user;
    const userWithProfile = {
      ...safeUser,
      first_name: profileData?.first_name || null,
      last_name: profileData?.last_name || null,
      phone: profileData?.phone || null,
      gender: profileData?.gender || null,
      birthday: profileData?.birthday || null
    };
    
    console.log('[Backend] 🎉 Login successful for user:', safeUser.username);
    return res.json({ user: userWithProfile });
  } catch (err) {
    console.error('[Backend] 💥 Login error:', err);
    console.error('[Backend] Error details:', {
      message: err.message,
      stack: err.stack
    });
    return res.status(500).json({ error: 'login failed' });
  }
});

export default router;
