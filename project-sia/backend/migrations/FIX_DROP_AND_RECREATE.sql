-- ========================================
-- FIX: Drop existing tables and recreate with correct foreign keys
-- RUN THIS IN SUPABASE SQL EDITOR
-- ========================================

-- WARNING: This will delete all existing data in these tables!
-- If you have important data, back it up first!

-- Drop old trigger and function if they exist (ignore errors)
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON public.auth_users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop function with CASCADE to remove all dependent triggers
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.auth_users CASCADE;

-- Now recreate everything with correct structure
-- ========================================

-- 0) Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Create public.auth_users table (main auth table)
CREATE TABLE public.auth_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create case-insensitive unique indexes
CREATE UNIQUE INDEX auth_users_email_lower_idx ON public.auth_users (lower(email));
CREATE UNIQUE INDEX auth_users_username_lower_idx ON public.auth_users (lower(username));

-- 2) Create profiles table (1:1 with auth_users)
-- IMPORTANT: auth_id references auth_users.id (not app_auth!)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  auth_id uuid REFERENCES public.auth_users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  gender text,
  phone text,
  birthday date,
  status boolean DEFAULT true,
  last_seen timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX profiles_auth_id_idx ON public.profiles (auth_id);
CREATE INDEX profiles_last_seen_idx ON public.profiles (last_seen);

-- 3) Create addresses table (1..N per profile)
CREATE TABLE public.addresses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  street text,
  barangay text,
  city text,
  province text,
  region text,
  zip_code text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX addresses_profile_id_idx ON public.addresses (profile_id);

-- 4) Create function to auto-create profile when auth_users row is inserted
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Create a profile placeholder with same id
  INSERT INTO public.profiles (id, auth_id, created_at, updated_at)
  VALUES (NEW.id, NEW.id, now(), now());
  RETURN NEW;
END;
$$;

-- 5) Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON public.auth_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ========================================
-- DONE! Tables recreated with correct foreign keys:
-- - auth_users (username, email, password)
-- - profiles (auth_id → auth_users.id)
-- - addresses (profile_id → profiles.id)
-- ========================================
