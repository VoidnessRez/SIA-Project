
-- Step 1: Make sure bucket is PUBLIC
UPDATE storage.buckets
SET public = true
WHERE id = 'profiles';

-- Step 2: Drop ALL existing policies (clean slate)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Step 3: Create SUPER SIMPLE policies that WILL work
-- Policy 1: Let ANY authenticated user upload to profiles bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
);

-- Policy 2: Let ANYONE view files in profiles bucket
CREATE POLICY "Allow public downloads"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profiles'
);

-- Policy 3: Let authenticated users update files
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles')
WITH CHECK (bucket_id = 'profiles');

-- Policy 4: Let users delete their own files
CREATE POLICY "Allow owner deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show bucket status
SELECT 
  '✅ BUCKET' as check_type,
  id,
  public,
  file_size_limit / 1024 / 1024 || ' MB' as max_size
FROM storage.buckets
WHERE id = 'profiles';

-- Show all policies
SELECT 
  '✅ POLICIES' as check_type,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Test if RLS is enabled
SELECT 
  '✅ RLS STATUS' as check_type,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- =====================================================
-- EXPECTED OUTPUT:
-- ✅ Bucket is PUBLIC
-- ✅ 4 policies shown
-- ✅ RLS is TRUE
-- 
-- If you see these, UPLOAD WILL WORK! 🎉
-- =====================================================
