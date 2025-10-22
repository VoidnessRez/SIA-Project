-- =====================================================
-- SUPABASE STORAGE SETUP FOR PROFILE PICTURES
-- Create public bucket for user profile avatars
-- =====================================================

-- Step 1: Create the bucket (do this in Supabase Dashboard > Storage)
-- Bucket name: profiles
-- Public bucket: YES (checked)
-- File size limit: 2MB
-- Allowed MIME types: image/*

-- =====================================================
-- Step 2: Create RLS Policies for Storage
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- NOTE: RLS is already enabled on storage.objects by default in Supabase
-- No need to run ALTER TABLE command

-- =====================================================
-- POLICY 1: Allow authenticated users to upload avatars
-- =====================================================
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- =====================================================
-- POLICY 2: Allow PUBLIC to view avatars (IMPORTANT!)
-- =====================================================
CREATE POLICY "Public can view all avatars"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- =====================================================
-- POLICY 3: Allow users to update their own avatars
-- =====================================================
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = split_part(name, '/', 2)
);

-- =====================================================
-- POLICY 4: Allow users to delete their own avatars
-- =====================================================
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = split_part(name, '/', 2)
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if policies are created:
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
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
-- MANUAL BUCKET CREATION STEPS (via Dashboard)
-- =====================================================

/*
1. Go to: Supabase Dashboard → Storage
2. Click: "Create a new bucket"
3. Settings:
   - Bucket name: profiles
   - Public bucket: ✅ YES (IMPORTANT - check this!)
   - File size limit: 2097152 (2MB)
   - Allowed MIME types: image/jpeg,image/png,image/gif,image/webp
4. Click "Create bucket"
5. Inside the bucket, create folder: "avatars"
6. Then run the SQL policies above
*/

-- =====================================================
-- TESTING THE SETUP
-- =====================================================

-- Test upload (will return file path):
-- Upload via Supabase client in your app

-- Test public URL (should be accessible without auth):
-- https://[your-project-ref].supabase.co/storage/v1/object/public/profiles/avatars/test-image.jpg

-- =====================================================
-- COMPLETED! ✅
-- =====================================================
