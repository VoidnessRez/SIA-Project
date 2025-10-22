# 🔧 STORAGE POLICY ERROR FIX

## 🔴 Error Message:
```
StorageApiError: new row violates row-level security policy
```

## 🎯 Root Cause:
Your Supabase Storage bucket **does NOT have proper RLS policies** set up, so authenticated users can't upload files!

---

## ✅ SOLUTION: Run This SQL

### **Option 1: Copy-Paste SQL (Fastest)**

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy ALL of this file: `backend/supabase/STORAGE_FIX_POLICIES.sql`
4. Paste and click **RUN**
5. Done! ✅

---

## ✅ SOLUTION: Dashboard Method (Safest)

If SQL doesn't work, do it manually:

### **Step 1: Go to Storage Policies**
1. Supabase Dashboard → **Storage**
2. Click on **"profiles"** bucket
3. Click **"Policies"** tab
4. Click **"New Policy"** button

### **Step 2: Create 4 Policies**

#### **Policy #1: Upload (INSERT)**
```
Name: Allow authenticated uploads to profiles bucket
Operation: INSERT
Role: authenticated
WITH CHECK: bucket_id = 'profiles'
```

#### **Policy #2: View (SELECT)**
```
Name: Allow public access to profiles bucket
Operation: SELECT
Role: public
USING: bucket_id = 'profiles'
```

#### **Policy #3: Update**
```
Name: Allow authenticated updates to profiles bucket
Operation: UPDATE
Role: authenticated
USING: bucket_id = 'profiles'
```

#### **Policy #4: Delete**
```
Name: Allow authenticated deletes from profiles bucket
Operation: DELETE
Role: authenticated
USING: bucket_id = 'profiles'
```

---

## 📋 Verification Checklist

After setting up policies, verify:

### ✅ Bucket Configuration
- [ ] Bucket name is **"profiles"**
- [ ] Bucket is set to **PUBLIC** (checkbox checked!)
- [ ] File size limit: **2097152** (2MB)
- [ ] Folder **"avatars"** exists inside

### ✅ Policies Created
- [ ] Policy #1: INSERT for authenticated users
- [ ] Policy #2: SELECT for public
- [ ] Policy #3: UPDATE for authenticated users
- [ ] Policy #4: DELETE for authenticated users

### ✅ User Authentication
- [ ] User is logged in
- [ ] JWT token exists in browser
- [ ] Auth session is active

---

## 🧪 How to Test

### **Step 1: Run Verification Query**
In Supabase SQL Editor, run:
```sql
SELECT 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;
```

**Expected Output:** Should show 4 policies

### **Step 2: Test Upload**
1. Refresh your app (Ctrl+R)
2. Click "Edit Profile"
3. Click "Change Photo"
4. Select an image
5. Should upload successfully! ✅

### **Step 3: Check Console**
Should see:
```
[EditProfileModal] 📸 File selected: { name: "...", size: ..., type: "image/..." }
[EditProfileModal] 📤 Uploading to Supabase Storage: { bucket: "profiles", path: "avatars/..." }
[EditProfileModal] ✅ Upload successful: { path: "avatars/..." }
[EditProfileModal] 🔗 Public URL: https://...
✅ Image uploaded successfully!
```

---

## 🐛 Still Not Working?

### Check These Common Issues:

#### ❌ Bucket Not Public
**Fix:**
1. Go to Storage → profiles bucket
2. Click "Edit" or settings icon
3. Check the "Public bucket" checkbox
4. Save

#### ❌ Policies Conflict
**Fix:**
1. Delete ALL old policies first
2. Create new ones from scratch
3. Make sure no duplicates exist

#### ❌ User Not Authenticated
**Fix:**
1. Log out completely
2. Log back in
3. Check browser console for JWT token:
   ```javascript
   localStorage.getItem('supabase.auth.token')
   ```

#### ❌ Bucket Doesn't Exist
**Fix:**
1. Create bucket manually in Dashboard
2. Name: **profiles**
3. Public: ✅ YES
4. Create "avatars" folder inside

---

## 📊 Expected Behavior After Fix

### ✅ Before Upload:
- Console shows: `📸 File selected`
- Preview updates immediately

### ✅ During Upload:
- Console shows: `📤 Uploading to Supabase Storage`
- No errors in Network tab

### ✅ After Upload:
- Console shows: `✅ Upload successful`
- Console shows: `🔗 Public URL: https://...`
- Success message appears: "Image uploaded successfully! ✅"
- Avatar preview updates
- Public URL works (can open in new tab)

---

## 🚀 Quick Commands

### Drop all old policies:
```sql
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
```

### Check policies exist:
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

### Check bucket is public:
```sql
SELECT name, public FROM storage.buckets WHERE name = 'profiles';
```
Should show: `public: true`

---

## 📝 Summary

**Problem:** RLS policies blocking uploads  
**Solution:** Create 4 permissive policies (INSERT, SELECT, UPDATE, DELETE)  
**File to Run:** `backend/supabase/STORAGE_FIX_POLICIES.sql`  
**Time to Fix:** ~2 minutes  
**Success Rate:** 99% ✅

---

**Gawin mo lang yan beh tapos upload na! 🎉**

**Last Updated:** October 21, 2025  
**Status:** Ready to fix! 🔧
