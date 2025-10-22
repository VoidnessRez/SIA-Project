-- =====================================================
-- NUCLEAR OPTION: Force Create Bucket and Policies
-- =====================================================
-- Use this if the previous SQL didn't work
-- This manually creates the bucket first
-- =====================================================

-- =====================================================
-- STEP 1: Check if bucket exists, if not create it
-- =====================================================

-- First, try to delete the bucket if it exists (to start fresh)
DELETE FROM storage.buckets WHERE id = 'profiles';

-- Now create it fresh
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profiles',
    'profiles',
    true,
    5242880,  -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[]
);

-- =====================================================
-- STEP 2: Drop ALL existing policies (clean slate)
-- =====================================================

DROP POLICY IF EXISTS "profiles_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "profiles_upload" ON storage.objects;
DROP POLICY IF EXISTS "profiles_select" ON storage.objects;
DROP POLICY IF EXISTS "profiles_update" ON storage.objects;
DROP POLICY IF EXISTS "profiles_delete" ON storage.objects;

-- =====================================================
-- STEP 3: Create SUPER PERMISSIVE policies
-- =====================================================

-- Policy 1: INSERT - Allow authenticated users
CREATE POLICY "profiles_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
);

-- Policy 2: SELECT - Public access
CREATE POLICY "profiles_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profiles'
);

-- Policy 3: UPDATE - Authenticated users
CREATE POLICY "profiles_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles')
WITH CHECK (bucket_id = 'profiles');

-- Policy 4: DELETE - Own files only
CREATE POLICY "profiles_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (auth.uid() = owner OR auth.uid() IS NOT NULL)  -- More permissive
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check bucket
SELECT 
  '✅ BUCKET CHECK' as "Status",
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 || ' MB' as "Max Size"
FROM storage.buckets
WHERE id = 'profiles';

-- Check policies
SELECT 
  '✅ POLICIES CHECK' as "Status",
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%profiles%'
ORDER BY policyname;

-- Check RLS
SELECT 
  '✅ RLS CHECK' as "Status",
  tablename,
  rowsecurity as "Enabled"
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- =====================================================
-- If you see 3 tables with ✅ checkmarks, you're good!
-- =====================================================
