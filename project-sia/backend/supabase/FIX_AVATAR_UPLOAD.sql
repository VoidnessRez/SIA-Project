-- =====================================================
-- FIX AVATAR UPLOAD - Row Level Security Policy Fix
-- =====================================================
-- Error: "new row violates row-level security policy"
-- Solution: Create proper RLS policies for storage.objects
-- =====================================================

-- =====================================================
-- STEP 1: Ensure 'profiles' bucket exists and is PUBLIC
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profiles',
    'profiles',
    true,  -- MUST be public so images are accessible
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) 
DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[];

-- =====================================================
-- STEP 2: Drop any existing conflicting policies
-- =====================================================

DROP POLICY IF EXISTS "profiles_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "profiles_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to profiles bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from profiles bucket" ON storage.objects;

-- =====================================================
-- STEP 3: Create NEW policies (simple and permissive)
-- =====================================================

-- ✅ Policy 1: Allow authenticated users to UPLOAD to profiles bucket
CREATE POLICY "profiles_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
);

-- ✅ Policy 2: Allow EVERYONE to VIEW profile images
CREATE POLICY "profiles_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profiles'
);

-- ✅ Policy 3: Allow authenticated users to UPDATE files
CREATE POLICY "profiles_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles')
WITH CHECK (bucket_id = 'profiles');

-- ✅ Policy 4: Allow users to DELETE their own files
CREATE POLICY "profiles_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  auth.uid() = owner
);

-- =====================================================
-- VERIFICATION: Check if everything is set up correctly
-- =====================================================

-- Check bucket
SELECT 
  id,
  name,
  public as "Public?",
  file_size_limit / 1024 / 1024 as "Max Size (MB)",
  array_length(allowed_mime_types, 1) as "Allowed Types Count"
FROM storage.buckets
WHERE id = 'profiles';

-- Check policies
SELECT 
  policyname as "Policy Name",
  cmd as "Action",
  roles as "Allowed Roles"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%profiles%'
ORDER BY policyname;

-- Should show 4 policies:
-- ✅ profiles_insert_policy | INSERT | {authenticated}
-- ✅ profiles_select_policy | SELECT | {public}
-- ✅ profiles_update_policy | UPDATE | {authenticated}
-- ✅ profiles_delete_policy | DELETE | {authenticated}

-- =====================================================
-- ✅ DONE! Your avatar upload should now work!
-- =====================================================
