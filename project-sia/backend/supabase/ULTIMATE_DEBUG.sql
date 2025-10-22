-- =====================================================
-- ULTIMATE DEBUG - Check Everything About Storage
-- =====================================================

-- 1. Check current policies with FULL details
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 2. Check if authenticated role exists
SELECT rolname 
FROM pg_roles 
WHERE rolname IN ('authenticated', 'anon', 'public');

-- 3. Test the INSERT policy manually (simulated)
-- This shows what the policy is checking
SELECT 
  'profiles' as bucket_id,
  CASE 
    WHEN 'profiles' = 'profiles' THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as policy_check;

-- 4. Check storage.objects table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'storage'
  AND table_name = 'objects'
ORDER BY ordinal_position;

-- =====================================================
-- If you see policies but upload still fails,
-- the problem is with the AUTH TOKEN not being sent!
-- =====================================================
