-- =====================================================
-- STORAGE FIX V3 - Complete Solution with Bucket Creation
-- =====================================================
-- Purpose: Fix "new row violates row-level security policy" error
-- This version creates bucket + proper RLS policies
-- =====================================================

-- =====================================================
-- STEP 1: Create or verify the 'profiles' bucket exists
-- =====================================================

-- Check if bucket exists
DO $$
BEGIN
    -- Try to insert the bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'profiles',
        'profiles',
        true,  -- Make it PUBLIC so images are accessible
        5242880,  -- 5MB limit
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[]
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
        public = true,  -- Ensure it's public
        file_size_limit = 5242880,
        allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[];
    
    RAISE NOTICE '✅ Bucket "profiles" created or updated successfully!';
END $$;

-- =====================================================
-- STEP 2: Drop ALL existing policies to start fresh
-- =====================================================

DROP POLICY IF EXISTS "Allow authenticated uploads to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "profiles_upload" ON storage.objects;
DROP POLICY IF EXISTS "profiles_select" ON storage.objects;
DROP POLICY IF EXISTS "profiles_update" ON storage.objects;
DROP POLICY IF EXISTS "profiles_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view profile images" ON storage.objects;

-- =====================================================
-- STEP 3: Create NEW comprehensive policies
-- =====================================================

-- Policy 1: INSERT - Allow ANY authenticated user to upload to profiles bucket
-- (No owner check - anyone logged in can upload)
CREATE POLICY "profiles_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
);

-- Policy 2: SELECT - Allow EVERYONE (public) to view/download images
-- (Public access for displaying avatars)
CREATE POLICY "profiles_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profiles'
);

-- Policy 3: UPDATE - Allow authenticated users to update any file in profiles bucket
-- (For future use - updating file metadata)
CREATE POLICY "profiles_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
)
WITH CHECK (
  bucket_id = 'profiles'
);

-- Policy 4: DELETE - Allow authenticated users to delete their own files
-- (Check if user is the owner)
CREATE POLICY "profiles_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  auth.uid() = owner
);

-- =====================================================
-- STEP 4: Verify everything was created correctly
-- =====================================================

-- Check bucket settings
SELECT 
  id,
  name,
  public as "Is Public?",
  file_size_limit as "Max File Size (bytes)",
  allowed_mime_types as "Allowed Types"
FROM storage.buckets
WHERE id = 'profiles';

-- Expected output:
-- id: profiles
-- Is Public?: true
-- Max File Size: 5242880 (5MB)
-- Allowed Types: {image/jpeg, image/jpg, image/png, image/gif, image/webp}

-- Check policies
SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  roles as "Roles",
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as "USING",
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as "WITH CHECK"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%profiles%'
ORDER BY policyname;

-- Expected output: 4 policies
-- 1. profiles_delete_policy | DELETE | {authenticated} | Has USING clause | No WITH CHECK clause
-- 2. profiles_insert_policy | INSERT | {authenticated} | No USING clause | Has WITH CHECK clause
-- 3. profiles_select_policy | SELECT | {public}        | Has USING clause | No WITH CHECK clause
-- 4. profiles_update_policy | UPDATE | {authenticated} | Has USING clause | Has WITH CHECK clause

-- =====================================================
-- STEP 5: Test if RLS is enabled (should be true)
-- =====================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled?"
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- Expected: RLS Enabled? = true

-- =====================================================
-- TROUBLESHOOTING SECTION
-- =====================================================

-- If upload STILL fails after running this, try these:

-- 1. Check if you're actually authenticated:
-- Run in Supabase Dashboard > SQL Editor:
SELECT auth.uid() as "Your User ID";
-- Should return your user ID, not NULL

-- 2. Check if the bucket really exists:
SELECT COUNT(*) as "Bucket Exists?" FROM storage.buckets WHERE id = 'profiles';
-- Should return 1

-- 3. Manually test policy with your user ID:
-- Replace 'YOUR_USER_ID' with the ID from step 1
/*
SELECT 
  bucket_id,
  name,
  owner,
  created_at
FROM storage.objects
WHERE bucket_id = 'profiles'
LIMIT 5;
*/

-- 4. Check if there are ANY other policies blocking:
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 5. If nothing works, DISABLE RLS temporarily to test:
-- ⚠️ WARNING: This removes all security! Only for testing!
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
-- DO NOT USE IN PRODUCTION!

-- =====================================================
-- SUCCESS CHECKLIST
-- =====================================================
-- ✅ Bucket 'profiles' exists
-- ✅ Bucket is set to PUBLIC
-- ✅ 4 policies created (insert, select, update, delete)
-- ✅ RLS is enabled on storage.objects
-- ✅ No conflicting policies exist
-- ✅ You are authenticated (auth.uid() returns your ID)
-- 
-- If all above are true, upload MUST work!
-- =====================================================
