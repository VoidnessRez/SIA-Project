-- =====================================================
-- ADD MISSING COLUMNS TO PROFILES TABLE
-- For EditProfileModal support
-- =====================================================

-- Add bio column (for user biography/about section)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add avatar_url column (for profile picture storage URL)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add index for faster avatar lookups (optional)
CREATE INDEX IF NOT EXISTS profiles_avatar_url_idx 
ON public.profiles (avatar_url) 
WHERE avatar_url IS NOT NULL;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Check if columns were added successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('bio', 'avatar_url')
ORDER BY column_name;

-- Expected output:
-- column_name | data_type | is_nullable | column_default
-- ------------|-----------|-------------|---------------
-- avatar_url  | text      | YES         | NULL
-- bio         | text      | YES         | NULL

-- =====================================================
-- NOTES
-- =====================================================

/*
These columns are needed for EditProfileModal.jsx functionality:

1. bio: User's biography or "about me" section
   - Allows users to write a short description about themselves
   - Optional field (nullable)

2. avatar_url: URL to user's profile picture in Supabase Storage
   - Format: https://[project].supabase.co/storage/v1/object/public/profiles/avatars/[filename]
   - Links to images uploaded via EditProfileModal
   - Optional field (nullable)

After running this migration:
1. Restart your backend server
2. Test EditProfileModal in frontend
3. Verify profile picture uploads work
4. Verify bio field saves correctly
*/
