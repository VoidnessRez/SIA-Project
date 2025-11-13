# Fix Address Saving Issue

## Problem
Users can't save their address in the profile because the address columns don't exist in the `profiles` table yet.

## Solution
Add address columns directly to the profiles table for easier access during checkout.

## Steps to Fix

### 1. Run the Migration in Supabase SQL Editor

Go to your Supabase Dashboard → SQL Editor and run the migration file:

```sql
-- Copy and paste the contents of:
-- backend/migrations/002_add_address_to_profiles.sql
```

Or run this directly:

```sql
-- Add address columns directly to profiles table
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
```

### 2. Verify the Columns

Run this query to check if columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

You should see:
- address (text)
- barangay (text)
- city (text)
- province (text)
- zip_code (text)
- bio (text)
- avatar_url (text)

### 3. Test the Fix

1. **Login** to your account
2. Click on your **profile picture/avatar** in the header
3. Click **"✏️ Edit Your Information"**
4. Fill in your address details:
   - Street Address
   - Barangay
   - City/Municipality
   - Province
   - Zip Code
5. Click **"💾 Save Changes"**
6. Go to **Checkout** page
7. Select **"Home Delivery"**
8. Select **"Use My Saved Address"**
9. Your saved address should now appear! ✅

## What Changed

### Frontend (`UserPersonalInfo.jsx`)
- ✅ Address fields are now **editable** (no longer read-only)
- ✅ Saves to `profiles` table columns instead of separate `addresses` table
- ✅ Uses correct column names: `address`, `barangay`, `city`, `province`, `zip_code`

### Backend (`routes/auth.js`)
- ✅ Updated profile update endpoint to accept new address fields
- ✅ Saves address directly to profiles table
- ✅ Returns address fields on login

### Database
- ✅ Added address columns to profiles table
- ✅ Created indexes for faster lookups

## Benefits

✅ **Faster checkout** - Address is part of user profile, no extra join needed  
✅ **Simpler code** - No need to manage separate addresses table  
✅ **Better UX** - Users can save and reuse their address for deliveries  
✅ **Works with checkout** - Checkout page reads from `user.address`, `user.city`, etc.

## Troubleshooting

**"No saved address in profile"** - Make sure you:
1. Ran the migration SQL in Supabase
2. Saved your address in Edit Personal Info page
3. Refreshed your login session (logout and login again)

**Can't save address** - Check browser console for errors. Make sure backend is running on port 5174.

**Address not showing in checkout** - Logout and login again to refresh user data with address fields.
