-- =====================================================
-- DIAGNOSTIC: Check Storage Configuration
-- =====================================================
-- Run this to see what's actually configured in Supabase
-- =====================================================

-- 1️⃣ Check if 'profiles' bucket exists
SELECT 
  id,
  name,
  public as "Is Public?",
  file_size_limit as "Max Size (bytes)",
  allowed_mime_types as "Allowed Types",
  created_at
FROM storage.buckets
WHERE id = 'profiles';
-- Expected: 1 row with public = true

-- 2️⃣ Check ALL storage policies
SELECT 
  policyname as "Policy Name",
  cmd as "Action",
  roles as "Who Can Do This",
  qual as "Conditions (USING)",
  with_check as "Check (WITH CHECK)"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;
-- Expected: Should see profiles_insert_policy, profiles_select_policy, etc.

-- 3️⃣ Check if RLS is enabled on storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled?"
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
-- Expected: RLS Enabled? = true

-- 4️⃣ Check your current user ID (when logged in)
SELECT 
  auth.uid() as "Your User ID",
  auth.role() as "Your Role";
-- Expected: Should show your UUID and 'authenticated'
-- If NULL, you're not logged in to Supabase Dashboard

-- 5️⃣ List ALL buckets
SELECT 
  id,
  name,
  public
FROM storage.buckets
ORDER BY created_at DESC;

-- 6️⃣ Check if there are files in profiles bucket
SELECT 
  id,
  name,
  bucket_id,
  owner,
  created_at
FROM storage.objects
WHERE bucket_id = 'profiles'
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- INTERPRETATION:
-- =====================================================
-- ❌ If bucket doesn't exist → Run FIX_AVATAR_UPLOAD.sql again
-- ❌ If policies are missing → Run FIX_AVATAR_UPLOAD.sql again
-- ❌ If RLS is disabled → Contact Supabase support (shouldn't happen)
-- ❌ If auth.uid() is NULL → This is normal in SQL Editor
-- =====================================================
