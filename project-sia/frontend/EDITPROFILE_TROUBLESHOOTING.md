# 🔧 EditProfileModal Troubleshooting Guide

## 🐛 Issue: "Failed to load profile data" / No customer info showing

### Root Causes:
1. **No profile record in database** - User signed up but profile wasn't created
2. **Wrong column names** - Using `user_id` instead of `auth_id`
3. **Missing bio/avatar_url columns** - Database schema incomplete
4. **User not authenticated** - AuthContext not working

---

## ✅ Fixes Applied

### 1. **Enhanced Error Logging**
Now logs everything to console for debugging:
```javascript
console.log('[EditProfileModal] 📋 Fetching profile for user:', user?.id);
console.log('[EditProfileModal] 🔍 Querying profiles table with auth_id:', user.id);
console.log('[EditProfileModal] 📨 Profile query result:', { profile, error });
```

### 2. **Better Error Handling**
- Checks if user exists before querying
- Shows specific error messages
- Handles missing profile gracefully

### 3. **Image Upload Debugging**
```javascript
console.log('[EditProfileModal] 📸 File selected:', { name, size, type });
console.log('[EditProfileModal] 📤 Uploading to Supabase Storage...');
console.log('[EditProfileModal] ✅ Upload successful:', uploadData);
```

---

## 🔍 Debugging Steps

### Step 1: Open Browser Console
1. Press **F12** in browser
2. Go to **Console** tab
3. Click "Edit Profile" button
4. Watch the logs

### Step 2: Check What's Logged

#### ✅ **Good Output:**
```
[EditProfileModal] 📋 Fetching profile for user: 72077abb-e218-4060-9558-d69064cd9604
[EditProfileModal] 🔍 Querying profiles table with auth_id: 72077abb-e218-4060-9558-d69064cd9604
[EditProfileModal] 📨 Profile query result: { profile: {...}, error: null }
[EditProfileModal] 🔍 Querying addresses for profile_id: 72077abb-e218-4060-9558-d69064cd9604
[EditProfileModal] 📨 Address query result: { address: {...}, error: null }
[EditProfileModal] ✅ Setting form data: { username: "...", email: "..." }
```

#### ❌ **Bad Output (Profile Not Found):**
```
[EditProfileModal] 📋 Fetching profile for user: 72077abb-e218-4060-9558-d69064cd9604
[EditProfileModal] 🔍 Querying profiles table with auth_id: 72077abb-e218-4060-9558-d69064cd9604
[EditProfileModal] 📨 Profile query result: { profile: null, error: { code: 'PGRST116', message: '...' } }
[EditProfileModal] ⚠️ No profile found, using user data only
```

#### ❌ **Bad Output (No User):**
```
[EditProfileModal] ❌ No user ID available
```

---

## 🔧 Solutions

### Problem 1: No User ID Available
**Error:** `[EditProfileModal] ❌ No user ID available`

**Cause:** User not logged in or AuthContext broken

**Fix:**
1. Check if user is logged in:
```javascript
console.log('User from AuthContext:', user);
```

2. Verify AuthContext is working:
```javascript
// In component
const { user } = useAuth();
console.log('Auth user:', user);
```

3. If null, check `frontend/src/context/AuthContext.jsx`

---

### Problem 2: Profile Not Found (PGRST116)
**Error:** `{ profile: null, error: { code: 'PGRST116' } }`

**Cause:** No profile record exists for this user

**Fix Option A - Run Migration:**
```sql
-- In Supabase SQL Editor
-- Add missing columns first
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Check if profile exists
SELECT * FROM public.profiles WHERE auth_id = 'YOUR_USER_ID_HERE';

-- If no profile, create one
INSERT INTO public.profiles (id, auth_id, created_at, updated_at)
VALUES (
  'YOUR_USER_ID_HERE',
  'YOUR_USER_ID_HERE',
  NOW(),
  NOW()
);
```

**Fix Option B - Re-signup:**
1. Log out
2. Delete user from `auth_users` table
3. Sign up again (should auto-create profile)

---

### Problem 3: Image Upload Fails
**Error:** `Failed to upload image`

**Possible Causes:**
1. **Bucket doesn't exist** - Create "profiles" bucket
2. **No avatars folder** - Create "avatars" folder in bucket
3. **No policies** - Storage policies not set
4. **Wrong bucket name** - Using wrong bucket name

**Check Console Logs:**
```
[EditProfileModal] 📤 Uploading to Supabase Storage: { bucket: 'profiles', path: 'avatars/...' }
[EditProfileModal] ❌ Upload error: { message: '...' }
```

**Fix:**
1. Go to Supabase Dashboard → Storage
2. Check if "profiles" bucket exists
3. Check if "avatars" folder exists inside
4. Run storage policies from `backend/supabase/ADD_PROFILE_COLUMNS.sql`

---

## 📊 Database Schema Check

### Required Tables:

#### 1. profiles table:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  auth_id UUID REFERENCES auth_users(id),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  bio TEXT,              -- ⚠️ Must exist!
  avatar_url TEXT,       -- ⚠️ Must exist!
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. addresses table:
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  street TEXT,
  city TEXT,
  province TEXT,
  zip_code TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Storage bucket:
- Name: `profiles`
- Public: ✅ YES
- Folder: `avatars/`

---

## 🧪 Testing Checklist

### Before Opening Modal:
- [ ] User is logged in
- [ ] Console shows no errors
- [ ] AuthContext has user data

### When Opening Modal:
- [ ] Console shows: `📋 Fetching profile for user: [UUID]`
- [ ] Console shows: `📨 Profile query result: { profile: {...} }`
- [ ] Form fields are populated
- [ ] Avatar shows if exists

### When Uploading Image:
- [ ] Console shows: `📸 File selected: {...}`
- [ ] Console shows: `📤 Uploading to Supabase Storage...`
- [ ] Console shows: `✅ Upload successful`
- [ ] Success message appears
- [ ] Preview updates

### When Saving:
- [ ] Console shows update queries
- [ ] Success message appears
- [ ] Form data persists

---

## 🚀 Quick Fix Commands

### 1. Add Missing Columns:
```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### 2. Create Missing Profile:
```sql
-- Replace YOUR_USER_ID with actual user ID
INSERT INTO public.profiles (id, auth_id, created_at, updated_at)
VALUES (
  'YOUR_USER_ID',
  'YOUR_USER_ID',
  NOW(),
  NOW()
);
```

### 3. Check Storage:
```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE name = 'profiles';

-- Verify policies
SELECT * FROM storage.policies WHERE bucket_id = 'profiles';
```

---

## 📝 Next Steps

1. **Open browser console** (F12)
2. **Click "Edit Profile"**
3. **Read the console logs**
4. **Send me the exact error** messages you see
5. I'll help you fix it! 😊

---

**Key Files:**
- `frontend/src/components/EditProfileModal.jsx` - Main component (NOW WITH LOGS!)
- `backend/supabase/ADD_PROFILE_COLUMNS.sql` - Add missing columns
- `backend/supabase/STORAGE_SETUP_SIMPLIFIED.sql` - Storage policies
- `frontend/COLUMN_MAPPINGS.md` - Database column reference

**Last Updated:** October 21, 2025  
**Status:** Enhanced with detailed logging! 🔍
