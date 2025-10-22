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
      .select('first_name, last_name, phone, gender, birthday, avatar_url, bio')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('[Backend] ⚠️ Profile fetch error:', profileError);
    } else {
      console.log('[Backend] ✅ Profile data found:', profileData);
    }

    // ✅ MIGRATE USER TO SUPABASE AUTH (for storage access)
    console.log('[Backend] 🔄 Checking if user has Supabase Auth account...');
    
    // Check if user already has supabase_auth_id
    const { data: authUserCheck, error: checkError } = await supabase
      .from('auth_users')
      .select('supabase_auth_id')
      .eq('id', user.id)
      .single();

    let supabaseUserId = authUserCheck?.supabase_auth_id;

    if (!supabaseUserId) {
      console.log('[Backend] 🆕 Creating Supabase Auth account for user...');
      
      try {
        // Create Supabase Auth user (using admin API would be better, but using regular signup)
        const { data: supabaseAuthData, error: supabaseAuthError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            username: user.username,
            migrated_from_custom_auth: true
          }
        });

        if (supabaseAuthError) {
          console.error('[Backend] ⚠️ Failed to create Supabase Auth account:', supabaseAuthError.message);
          // Don't fail login if Supabase auth creation fails
        } else {
          supabaseUserId = supabaseAuthData.user.id;
          console.log('[Backend] ✅ Supabase Auth account created:', supabaseUserId);

          // Link Supabase Auth ID to custom auth_users
          const { error: linkError } = await supabase
            .from('auth_users')
            .update({ supabase_auth_id: supabaseUserId })
            .eq('id', user.id);

          if (linkError) {
            console.error('[Backend] ⚠️ Failed to link Supabase Auth ID:', linkError);
          } else {
            console.log('[Backend] ✅ Linked Supabase Auth ID to custom auth');
          }

          // Also update profiles.auth_id to match Supabase Auth ID
          const { error: profileAuthError } = await supabase
            .from('profiles')
            .update({ auth_id: supabaseUserId })
            .eq('id', user.id);

          if (profileAuthError) {
            console.error('[Backend] ⚠️ Failed to update profile auth_id:', profileAuthError);
          }
        }
      } catch (migrationError) {
        console.error('[Backend] 💥 Migration error:', migrationError);
        // Continue with login even if migration fails
      }
    } else {
      console.log('[Backend] ✅ User already has Supabase Auth account:', supabaseUserId);
    }

    // success - do NOT return password, include profile data
    const { password: _p, ...safeUser } = user;
    const userWithProfile = {
      ...safeUser,
      supabase_auth_id: supabaseUserId, // Include for frontend
      first_name: profileData?.first_name || null,
      last_name: profileData?.last_name || null,
      phone: profileData?.phone || null,
      gender: profileData?.gender || null,
      birthday: profileData?.birthday || null,
      avatar_url: profileData?.avatar_url || null,
      bio: profileData?.bio || null
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

// PUT /api/auth/profile/:userId
// Update user profile (username, email, first_name, last_name, phone, bio, address)
router.put('/profile/:userId', async (req, res) => {
  console.log('[Backend] 📝 PUT /api/auth/profile/:userId - Request received');
  const { userId } = req.params;
  console.log('[Backend] 👤 User ID:', userId);
  console.log('[Backend] 📦 Request body:', req.body);

  const {
    username,
    email,
    first_name,
    last_name,
    phone,
    bio,
    street_address,
    city,
    province,
    zip_code,
    country
  } = req.body;

  try {
    // 1. Update auth_users table (username and email)
    if (username || email) {
      console.log('[Backend] 💾 Updating auth_users...');
      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;

      const { error: userError } = await supabase
        .from('auth_users')
        .update(updateData)
        .eq('id', userId);

      if (userError) {
        console.error('[Backend] ❌ Failed to update auth_users:', userError);
        throw userError;
      }
      console.log('[Backend] ✅ auth_users updated');
    }

    // 2. Update or create profile
    console.log('[Backend] 💾 Checking if profile exists...');
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Backend] ❌ Error fetching profile:', fetchError);
      throw fetchError;
    }

    const profileData = {
      first_name,
      last_name,
      phone,
      bio,
      updated_at: new Date().toISOString()
    };

    if (!existingProfile) {
      // Create new profile
      console.log('[Backend] 💾 Creating new profile...');
      profileData.id = userId;
      const { error: createError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (createError) {
        console.error('[Backend] ❌ Failed to create profile:', createError);
        throw createError;
      }
      console.log('[Backend] ✅ Profile created');
    } else {
      // Update existing profile
      console.log('[Backend] 💾 Updating existing profile...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      if (updateError) {
        console.error('[Backend] ❌ Failed to update profile:', updateError);
        throw updateError;
      }
      console.log('[Backend] ✅ Profile updated');
    }

    // 3. Update or create address
    if (street_address || city || province) {
      console.log('[Backend] 💾 Handling address...');
      const { data: existingAddress, error: addressFetchError } = await supabase
        .from('addresses')
        .select('id')
        .eq('profile_id', userId)
        .limit(1);

      if (addressFetchError) {
        console.error('[Backend] ⚠️ Error fetching address:', addressFetchError);
      }

      const addressData = {
        street,
        city,
        province,
        zip_code,
        country: country || 'Philippines'
      };

      if (!existingAddress || existingAddress.length === 0) {
        // Create new address
        console.log('[Backend] 💾 Creating new address...');
        addressData.profile_id = userId;
        addressData.is_primary = true;
        
        const { error: createAddressError } = await supabase
          .from('addresses')
          .insert([addressData]);

        if (createAddressError) {
          console.error('[Backend] ⚠️ Failed to create address:', createAddressError);
          // Don't fail the whole request if address fails
        } else {
          console.log('[Backend] ✅ Address created');
        }
      } else {
        // Update existing address
        console.log('[Backend] 💾 Updating existing address...');
        const { error: updateAddressError } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', existingAddress[0].id);

        if (updateAddressError) {
          console.error('[Backend] ⚠️ Failed to update address:', updateAddressError);
          // Don't fail the whole request if address fails
        } else {
          console.log('[Backend] ✅ Address updated');
        }
      }
    }

    console.log('[Backend] 🎉 Profile update completed successfully!');
    return res.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });

  } catch (err) {
    console.error('[Backend] 💥 Profile update error:', err);
    console.error('[Backend] Error details:', {
      message: err.message,
      stack: err.stack
    });
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
