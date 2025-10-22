-- =====================================================
-- MIGRATION: Link Custom Auth to Supabase Auth
-- =====================================================
-- This creates Supabase Auth accounts for existing users
-- and links them to your custom auth_users table
-- =====================================================

-- Step 1: Add supabase_auth_id column to auth_users if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_users' 
        AND column_name = 'supabase_auth_id'
    ) THEN
        ALTER TABLE public.auth_users 
        ADD COLUMN supabase_auth_id UUID UNIQUE;
        
        RAISE NOTICE '✅ Added supabase_auth_id column to auth_users';
    ELSE
        RAISE NOTICE '⏭️ Column supabase_auth_id already exists';
    END IF;
END $$;

-- Step 2: Add comment explaining the column
COMMENT ON COLUMN public.auth_users.supabase_auth_id IS 
'Links to Supabase Auth user ID (auth.users.id) for storage access';

-- Step 3: Update profiles table to use auth_id correctly
-- Make sure auth_id in profiles matches id in auth_users
DO $$
BEGIN
    -- Check if auth_id exists in profiles
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'auth_id'
    ) THEN
        RAISE NOTICE '✅ auth_id column exists in profiles';
    ELSE
        RAISE NOTICE '❌ ERROR: auth_id column missing in profiles!';
    END IF;
END $$;

-- Step 4: Verify the linking structure
SELECT 
    '✅ VERIFICATION' as status,
    'auth_users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'auth_users'
  AND column_name IN ('id', 'username', 'email', 'supabase_auth_id')
ORDER BY ordinal_position;

-- Show current users (for reference)
SELECT 
    id as "Auth User ID",
    username,
    email,
    supabase_auth_id as "Supabase Auth ID (if linked)",
    created_at
FROM public.auth_users
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- NEXT STEPS:
-- =====================================================
-- 1. Users need to be migrated to Supabase Auth
-- 2. When they first login after this migration:
--    - Backend creates Supabase Auth account
--    - Links supabase_auth_id to auth_users.id
-- 3. Storage will then work with Supabase Auth session
-- =====================================================
