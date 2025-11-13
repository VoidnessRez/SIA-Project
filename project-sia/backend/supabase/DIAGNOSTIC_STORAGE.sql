
-- 1. Check if you're logged in
SELECT 
  auth.uid() as "Your User ID",
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NOT LOGGED IN!'
    ELSE '✅ Logged in'
  END as "Status";

-- 2. Check if profiles bucket exists
SELECT 
  id as "Bucket ID",
  name as "Bucket Name",
  public as "Is Public?",
  CASE 
    WHEN public = true THEN '✅ Public'
    ELSE '❌ NOT PUBLIC - This is the problem!'
  END as "Status",
  file_size_limit as "Max Size",
  allowed_mime_types as "Allowed Types"
FROM storage.buckets
WHERE id = 'profiles';

-- Expected: One row with Is Public? = true
-- If no rows: Bucket doesn't exist
-- If public = false: Need to make it public

-- =====================================================

-- 3. Check ALL policies on storage.objects
SELECT 
  policyname as "Policy Name",
  cmd as "Type",
  roles as "Who Can Use",
  permissive as "Permissive?"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY cmd, policyname;

-- Expected: At least 4 policies for profiles bucket
-- Look for policies with cmd = INSERT and roles = {authenticated}

-- =====================================================

-- 4. Check if RLS is enabled
SELECT 
  tablename as "Table",
  rowsecurity as "RLS Enabled?",
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS is ON (policies apply)'
    ELSE '❌ RLS is OFF (policies ignored!)'
  END as "Status"
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- Expected: RLS Enabled? = true

-- =====================================================

-- 5. Check for CONFLICTING policies
SELECT 
  policyname as "Policy Name",
  cmd as "Type",
  qual as "USING Condition",
  with_check as "WITH CHECK Condition"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Look for policies that might be blocking inserts
-- If you see policies with strict conditions, they might be the problem

-- =====================================================

-- 6. Test if you CAN insert (dry run)
-- This checks if policies would allow an insert
SELECT 
  policyname,
  CASE 
    WHEN roles @> ARRAY['authenticated']::name[] THEN '✅ Allows authenticated users'
    WHEN roles @> ARRAY['public']::name[] THEN '✅ Allows public'
    ELSE '❌ Restricted'
  END as "Accessibility"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND cmd = 'INSERT'
  AND (
    roles @> ARRAY['authenticated']::name[] OR 
    roles @> ARRAY['public']::name[]
  );

-- Expected: At least one policy that allows authenticated users

-- =====================================================
-- DIAGNOSIS RESULTS
-- =====================================================
-- Based on the output above, the problem is:
--
-- ❌ Problem 1: Not logged in (auth.uid() is NULL)
--    Solution: You need to be logged in to Supabase Dashboard
--
-- ❌ Problem 2: Bucket doesn't exist
--    Solution: Run STORAGE_FIX_V3_COMPLETE.sql
--
-- ❌ Problem 3: Bucket is not public
--    Solution: Run STORAGE_FIX_V3_COMPLETE.sql
--
-- ❌ Problem 4: No INSERT policy for profiles bucket
--    Solution: Run STORAGE_FIX_V3_COMPLETE.sql
--
-- ❌ Problem 5: RLS is enabled but no matching policies
--    Solution: Run STORAGE_FIX_V3_COMPLETE.sql
--
-- ❌ Problem 6: Conflicting policies blocking inserts
--    Solution: Run STORAGE_FIX_V3_COMPLETE.sql (it drops all first)
-- =====================================================

-- NEXT STEPS:
-- 1. Look at the output from this script
-- 2. Identify which problem you have
-- 3. Run STORAGE_FIX_V3_COMPLETE.sql to fix it
-- 4. Run this script again to verify it's fixed
-- 5. Try uploading in your app
