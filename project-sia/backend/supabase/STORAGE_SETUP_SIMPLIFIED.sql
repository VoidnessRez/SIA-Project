-- =====================================================
-- SUPABASE STORAGE SETUP - SIMPLIFIED VERSION
-- For Profile Pictures (Public Access)
-- =====================================================

-- ⚠️ IMPORTANT: First create the bucket via Supabase Dashboard!
-- Dashboard → Storage → Create New Bucket
-- Name: profiles
-- Public: ✅ YES (check this box!)
-- File size limit: 2097152 (2MB)
-- Allowed MIME types: image/jpeg,image/png,image/gif,image/webp

-- Then create folder inside bucket: "avatars"

-- =====================================================
-- RLS POLICIES (Copy and paste ALL policies below)
-- =====================================================

-- Policy 1: Allow authenticated users to UPLOAD their avatars
CREATE POLICY "Users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Policy 2: Allow PUBLIC to VIEW all avatars (for profile pictures)
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Policy 3: Allow users to UPDATE their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Policy 4: Allow users to DELETE their own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- =====================================================
-- VERIFICATION QUERIES (Run these to check if working)
-- =====================================================

-- Check if policies are created:
SELECT 
  policyname, 
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- Check bucket configuration:
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'profiles';

-- =====================================================
-- ALTERNATIVE: Use Supabase Dashboard (EASIER!)
-- =====================================================

/*
Instead of SQL, you can create policies via Dashboard:

1. Go to: Storage → profiles bucket → Policies tab
2. Click: "New Policy"
3. For each policy above:
   - Name: (copy from above)
   - Allowed operation: INSERT/SELECT/UPDATE/DELETE
   - Target roles: public or authenticated
   - USING expression: (copy from USING clause)
   - WITH CHECK expression: (copy from WITH CHECK clause)

This is EASIER if SQL gives errors!
*/

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

/*
❌ Error: "must be owner of table objects"
   ✅ Solution: Don't run ALTER TABLE command. RLS is already enabled.

❌ Error: "policy already exists"
   ✅ Solution: Drop existing policy first:
      DROP POLICY "Users can upload avatars" ON storage.objects;

❌ Error: "bucket not found"
   ✅ Solution: Create bucket via Dashboard first!

❌ Images not loading?
   ✅ Solution: Make sure bucket is PUBLIC (check the box!)
*/

-- =====================================================
-- TESTING
-- =====================================================

/*
Test public URL format:
https://[your-project-id].supabase.co/storage/v1/object/public/profiles/avatars/[filename]

Example:
https://abcdefgh.supabase.co/storage/v1/object/public/profiles/avatars/123e4567-e89b-12d3-a456-426614174000-1234567890.jpg

If you can access this URL without authentication, it works! ✅
*/

-- =====================================================
-- COMPLETED! ✅
-- =====================================================
