-- Add address columns directly to profiles table for easier checkout integration
-- This makes address data accessible directly from the user profile

-- Add address columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS barangay text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS province text,
ADD COLUMN IF NOT EXISTS zip_code text;

-- Add bio and avatar_url if they don't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create index for faster address lookups
CREATE INDEX IF NOT EXISTS profiles_city_idx ON public.profiles (city);
CREATE INDEX IF NOT EXISTS profiles_province_idx ON public.profiles (province);

-- Add comment
COMMENT ON COLUMN public.profiles.address IS 'Street address stored directly in profile for faster checkout access';
COMMENT ON COLUMN public.profiles.barangay IS 'Barangay/district';
COMMENT ON COLUMN public.profiles.city IS 'City/municipality';
COMMENT ON COLUMN public.profiles.province IS 'Province';
COMMENT ON COLUMN public.profiles.zip_code IS '4-digit Philippine postal code';
