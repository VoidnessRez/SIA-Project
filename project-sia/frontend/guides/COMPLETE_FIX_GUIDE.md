# 🚨 COMPLETE FIX GUIDE - EditProfileModal Issues

## 📋 Summary of Problems:
1. ❌ **Storage upload fails** - "new row violates row-level security policy"
2. ❌ **Form fields empty** - Username, email, phone, address not showing
3. ❌ **Header/dropdown doesn't update** - After saving profile

---

## ✅ SOLUTION 1: Fix Storage Upload (MUST DO FIRST!)

### **⚠️ IMPORTANT: Run this in TWO steps!**

### **STEP 1: Diagnose the problem**

1. **Open Supabase Dashboard** → https://supabase.com/dashboard
2. **Select your project** (zqxsbgacaemcvzsfxnux)
3. **Go to SQL Editor** (left sidebar, icon looks like `</>`)
4. **Click "New Query"** button
5. **Copy ALL contents** from: `backend/supabase/DIAGNOSTIC_STORAGE.sql`
6. **Paste and RUN** it (▶️ button)
7. **Look at the results** - it will tell you exactly what's wrong

### **STEP 2: Fix the problem**

1. **Still in SQL Editor**
2. **Click "New Query"** again
3. **Copy ALL contents** from: `backend/supabase/STORAGE_FIX_V3_COMPLETE.sql`
4. **Paste and RUN** it (▶️ button)
5. **Wait for success messages**

> **✅ What V3 does:**
> - Creates 'profiles' bucket if missing
> - Sets bucket to PUBLIC
> - Drops ALL old conflicting policies
> - Creates 4 new clean policies
> - Verifies everything worked

### **Expected Output:**
```
Success: Policies created successfully!
4 rows returned
```

### **Verify It Worked:**
```sql
-- Run this query to check:
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

Should show:
- Allow authenticated uploads to profiles bucket
- Allow public access to profiles bucket
- Allow authenticated updates to profiles bucket
- Allow authenticated deletes from profiles bucket

---

## ✅ SOLUTION 2: Debug Empty Form Fields

### **What to Do:**

1. **Refresh your browser** (Ctrl+R)
2. **Open DevTools Console** (F12)
3. **Click "Edit Profile"** button
4. **Look at the NEW detailed logs:**

You should now see:
```
[EditProfileModal] 👤 Profile details: {
  id: "...",
  auth_id: "...",
  first_name: "...",
  last_name: "...",
  phone: "...",
  bio: "...",
  avatar_url: "..."
}

[EditProfileModal] 🏠 Address details: {
  street: "...",
  city: "...",
  province: "...",
  zip_code: "..."
}

[EditProfileModal] ✅ Setting form data with these values: {
  username: "...",
  email: "...",
  full_name: "...",
  phone: "...",
  ...
}
```

### **Possible Issues:**

#### **Issue 2a: All values are NULL or undefined**
**Means:** Profile doesn't exist in database

**Fix:**
```sql
-- Run in Supabase SQL Editor
-- Check if profile exists
SELECT * FROM public.profiles WHERE auth_id = '8a89584b-899f-4ac0-ab0c-2e37791e74ef';

-- If nothing returned, create profile:
INSERT INTO public.profiles (id, auth_id, created_at, updated_at)
VALUES (
  '8a89584b-899f-4ac0-ab0c-2e37791e74ef',
  '8a89584b-899f-4ac0-ab0c-2e37791e74ef',
  NOW(),
  NOW()
);
```

#### **Issue 2b: Values exist but form is empty**
**Means:** React state not updating properly

**Fix:** Check if formData is being passed to inputs correctly. The console will show if data is being set.

---

## ✅ SOLUTION 3: Header/Dropdown Auto-Update

### **Already Fixed!**

After you save profile changes:
1. Modal closes automatically
2. Page reloads after 1.5 seconds
3. Header and dropdown show new data

This is the updated code that already does this:
```javascript
// After successful update:
setTimeout(() => {
  onClose(); // Close modal
  window.location.reload(); // Reload page
}, 1500);
```

---

## 🧪 COMPLETE TESTING PROCEDURE

### **Test 1: Storage Upload**

1. ✅ Run STORAGE_FIX_POLICIES.sql
2. ✅ Refresh browser
3. ✅ Click "Edit Profile"
4. ✅ Click "Change Photo"
5. ✅ Select an image

**Expected Console Output:**
```
[EditProfileModal] 📸 File selected: { name: "...", size: ..., type: "image/jpeg" }
[EditProfileModal] ✅ Preview created
[EditProfileModal] 📤 Uploading to Supabase Storage: { bucket: "profiles", path: "avatars/..." }
[EditProfileModal] ✅ Upload successful: { path: "..." }
[EditProfileModal] 🔗 Public URL: https://...
✅ Image uploaded successfully! ✅
```

**If you see this instead:**
```
❌ Upload error: StorageApiError: new row violates row-level security policy
```
**→ Go back and run STORAGE_FIX_POLICIES.sql again!**

---

### **Test 2: Form Data Loading**

1. ✅ Refresh browser
2. ✅ Click "Edit Profile"
3. ✅ Check console for detailed logs

**Expected Console Output:**
```
[EditProfileModal] 📋 Fetching profile for user: 8a89584b-899f-4ac0-ab0c-2e37791e74ef
[EditProfileModal] 🔍 Querying profiles table with auth_id: 8a89584b-899f-4ac0-ab0c-2e37791e74ef
[EditProfileModal] 📨 Profile query result: { profile: {...}, error: null }
[EditProfileModal] 👤 Profile details: {
  first_name: "John",
  last_name: "Doe",
  phone: "09123456789",
  ...
}
[EditProfileModal] 🏠 Address details: {
  street: "123 Main St",
  city: "Manila",
  ...
}
[EditProfileModal] ✅ Setting form data with these values: {
  username: "johndoe",
  email: "john@example.com",
  full_name: "John Doe",
  phone: "09123456789",
  ...
}
```

**If values are NULL:**
- Profile doesn't exist → Create it using SQL above
- Columns don't exist → Run ADD_PROFILE_COLUMNS.sql

---

### **Test 3: Profile Update & Refresh**

1. ✅ Edit some fields in the modal
2. ✅ Click "Save Changes"
3. ✅ Wait for success message
4. ✅ Modal closes automatically
5. ✅ Page reloads (1.5 seconds)
6. ✅ Header shows updated name
7. ✅ Dropdown shows updated info

---

## 🎯 QUICK CHECKLIST

Before testing, make sure:

### Database:
- [ ] `profiles` table exists
- [ ] `profiles` has `bio` and `avatar_url` columns
- [ ] `addresses` table exists
- [ ] Your user has a profile record
- [ ] Your user has an address record (optional)

### Storage:
- [ ] Bucket "profiles" exists
- [ ] Bucket is set to PUBLIC
- [ ] Folder "avatars" exists in bucket
- [ ] 4 storage policies are created (run SQL!)

### Authentication:
- [ ] User is logged in
- [ ] JWT token exists in browser
- [ ] User ID matches profile auth_id

---

## 📝 SQL Commands to Run

### 1. Add Missing Columns (if needed):
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### 2. Create Profile (if missing):
```sql
INSERT INTO public.profiles (id, auth_id, created_at, updated_at)
VALUES (
  '8a89584b-899f-4ac0-ab0c-2e37791e74ef',  -- Your user ID
  '8a89584b-899f-4ac0-ab0c-2e37791e74ef',  -- Same as ID
  NOW(),
  NOW()
);
```

### 3. Fix Storage Policies:
```sql
-- STEP 1: Run DIAGNOSTIC_STORAGE.sql to see what's wrong
-- STEP 2: Run STORAGE_FIX_V3_COMPLETE.sql to fix it
-- V3 creates bucket + drops old policies + creates new ones
```

---

## 🐛 Common Errors & Fixes

### Error 1: "new row violates row-level security policy"
**Fix:** Run STORAGE_FIX_POLICIES.sql in Supabase SQL Editor

### Error 2: Form fields are empty
**Fix:** 
1. Check console for detailed logs
2. If profile is NULL, create profile record
3. If columns missing, run ADD_PROFILE_COLUMNS.sql

### Error 3: "Failed to load profile data"
**Fix:**
1. Check if user is logged in
2. Verify auth_id column exists
3. Check console for specific error

### Error 4: Header doesn't update
**Fix:** Already fixed! Page reloads automatically after save

---

## ✅ FILES UPDATED

1. ✅ `EditProfileModal.jsx` - Added detailed logging + auto-reload
2. ✅ `STORAGE_FIX_POLICIES.sql` - SQL to fix upload errors
3. ✅ `COMPLETE_FIX_GUIDE.md` - This guide!

---

## 🚀 DO THIS NOW:

1. **Run STORAGE_FIX_POLICIES.sql** in Supabase
2. **Refresh browser**
3. **Click "Edit Profile"**
4. **Check console logs**
5. **Send me screenshots** of:
   - Console logs (the detailed ones)
   - What you see in the form
   - Any error messages

Then I can help fix any remaining issues! 😊

---

**Last Updated:** October 21, 2025  
**Status:** Enhanced with detailed logging + auto-refresh! 🔍✨
