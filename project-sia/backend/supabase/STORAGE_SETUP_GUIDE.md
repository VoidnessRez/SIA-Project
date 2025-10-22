# 📸 Profile Picture Storage Setup - Step by Step Guide

## 🎯 Goal
Enable users to upload profile pictures that are publicly accessible.

---

## ✅ Method 1: Via Supabase Dashboard (RECOMMENDED - NO SQL ERRORS!)

### Step 1: Create Storage Bucket

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Left sidebar → Click **"Storage"**

3. **Create New Bucket**
   - Click **"Create a new bucket"** button
   - Fill in settings:
     ```
     Bucket name: profiles
     Public bucket: ✅ YES (IMPORTANT - CHECK THIS BOX!)
     File size limit: 2097152 (2MB)
     Allowed MIME types: image/jpeg,image/png,image/gif,image/webp
     ```
   - Click **"Create bucket"** ✅

4. **Create Avatars Folder**
   - Click on the **"profiles"** bucket
   - Click **"Create folder"** button
   - Folder name: `avatars`
   - Click **"Create"** ✅

---

### Step 2: Create Storage Policies

#### Option A: Via Dashboard (No SQL needed!)

1. **Go to Policies Tab**
   - In the "profiles" bucket, click **"Policies"** tab
   - You'll see a list of existing policies (if any)

2. **Create Policy 1: Upload**
   - Click **"New Policy"**
   - Template: Choose **"Custom"**
   - Fill in:
     ```
     Policy name: Users can upload avatars
     Allowed operation: INSERT
     Target roles: authenticated
     WITH CHECK expression:
     bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars'
     ```
   - Click **"Review"** → **"Save policy"** ✅

3. **Create Policy 2: Public View**
   - Click **"New Policy"** again
   - Fill in:
     ```
     Policy name: Public can view avatars
     Allowed operation: SELECT
     Target roles: public
     USING expression:
     bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars'
     ```
   - Click **"Review"** → **"Save policy"** ✅

4. **Create Policy 3: Update**
   - Click **"New Policy"** again
   - Fill in:
     ```
     Policy name: Users can update own avatars
     Allowed operation: UPDATE
     Target roles: authenticated
     USING expression:
     bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars'
     ```
   - Click **"Review"** → **"Save policy"** ✅

5. **Create Policy 4: Delete**
   - Click **"New Policy"** again
   - Fill in:
     ```
     Policy name: Users can delete own avatars
     Allowed operation: DELETE
     Target roles: authenticated
     USING expression:
     bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars'
     ```
   - Click **"Review"** → **"Save policy"** ✅

---

#### Option B: Via SQL Editor (If you prefer SQL)

1. **Open SQL Editor**
   - Left sidebar → Click **"SQL Editor"**
   - Click **"New query"**

2. **Copy and Paste**
   - Open file: `backend/supabase/STORAGE_SETUP_SIMPLIFIED.sql`
   - Copy ALL the policy creation statements
   - Paste into SQL Editor

3. **Run**
   - Click **"RUN"** button (▶️)
   - Check for success messages ✅

---

## ✅ Method 2: Quick Setup (All SQL in one go)

**⚠️ NOTE:** If you get "must be owner of table objects" error, use Method 1 instead!

1. Create bucket via Dashboard (see Step 1 above)
2. Run this SQL in SQL Editor:

```sql
-- Policy 1: Upload
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');

-- Policy 2: Public View
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');

-- Policy 3: Update
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');

-- Policy 4: Delete
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');
```

---

## 🧪 Testing Your Setup

### Test 1: Check Bucket Configuration

**Via Dashboard:**
1. Go to Storage → profiles bucket
2. Check if:
   - ✅ Public badge is showing
   - ✅ "avatars" folder exists
   - ✅ File size limit is 2MB

**Via SQL:**
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'profiles';
```

Expected result:
```
name: profiles
public: true
file_size_limit: 2097152
```

---

### Test 2: Check Policies

**Via Dashboard:**
1. Go to Storage → profiles bucket → Policies tab
2. You should see 4 policies listed:
   - ✅ Users can upload avatars (INSERT)
   - ✅ Public can view avatars (SELECT)
   - ✅ Users can update own avatars (UPDATE)
   - ✅ Users can delete own avatars (DELETE)

**Via SQL:**
```sql
SELECT policyname, cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;
```

Expected result: 4 rows with policy names above

---

### Test 3: Upload Test Image

1. **Via Dashboard:**
   - Go to Storage → profiles → avatars folder
   - Click **"Upload file"**
   - Select any image (max 2MB)
   - Click **"Upload"** ✅

2. **Get Public URL:**
   - Click on the uploaded file
   - Copy the public URL
   - Should look like:
     ```
     https://[project-id].supabase.co/storage/v1/object/public/profiles/avatars/test.jpg
     ```

3. **Test in Browser:**
   - Open the URL in a new tab
   - Image should load WITHOUT requiring login ✅
   - If it loads → **SUCCESS!** 🎉

---

### Test 4: Test from Edit Profile Modal

1. **Run your app:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Login as a user**

3. **Open Edit Profile modal**

4. **Click "Change Photo"**

5. **Upload an image**

6. **Check results:**
   - ✅ Preview shows immediately
   - ✅ Click "Save Changes"
   - ✅ Refresh page
   - ✅ Profile picture shows in header/dropdown

---

## 🐛 Troubleshooting

### Error: "must be owner of table objects"
**Cause:** Trying to ALTER TABLE storage.objects  
**Solution:** Don't run ALTER TABLE command. Use Method 1 (Dashboard) instead.

### Error: "policy already exists"
**Cause:** Policy with same name already created  
**Solution:** Either:
- Use different policy name, OR
- Drop existing policy first:
  ```sql
  DROP POLICY "Users can upload avatars" ON storage.objects;
  ```

### Error: "bucket not found"
**Cause:** Bucket doesn't exist yet  
**Solution:** Create bucket via Dashboard first (Step 1)

### Images not loading (404 error)
**Cause:** Bucket is not public  
**Solution:** 
1. Go to Storage → profiles bucket → Settings
2. Make sure "Public bucket" is **CHECKED** ✅

### Images require authentication
**Cause:** Missing public SELECT policy  
**Solution:** Create "Public can view avatars" policy with `TO public`

### Upload fails silently
**Cause:** Missing INSERT policy or wrong folder  
**Solution:** Check upload path includes `/avatars/` in filename

---

## ✅ Checklist

Before testing Edit Profile Modal, make sure:

- [ ] Storage bucket "profiles" exists
- [ ] Bucket is PUBLIC (checkbox is checked)
- [ ] Folder "avatars" exists inside bucket
- [ ] 4 policies are created (INSERT, SELECT, UPDATE, DELETE)
- [ ] Test image uploads successfully via Dashboard
- [ ] Public URL works in browser without login

If all checked ✅ → **READY TO USE!** 🚀

---

## 📱 What Users Will See

1. **Click "Edit Profile"** → Modal opens
2. **Click "📸 Change Photo"** → File picker opens
3. **Select image** → Preview shows immediately
4. **Click "💾 Save Changes"** → Uploads to Storage + updates database
5. **Success!** → Profile picture shows everywhere (header, dropdown, etc.)

---

## 🎉 Success Indicators

✅ Bucket shows "Public" badge  
✅ Test image accessible via public URL  
✅ Policies show in Dashboard  
✅ Upload works from Edit Profile Modal  
✅ Profile picture shows after refresh  

**ALL GREEN? YOU'RE DONE!** 🎊
