# Address System - FINAL FIXED VERSION ✅

## Overview
Address data is stored in the **`addresses` table** (not profiles table) and requires **admin approval** to change.

## How It Works

### 1. During Signup
- User enters address during registration
- Address is saved to `addresses` table with `is_primary = true`
- Backend: `POST /api/auth/signup` creates address record

### 2. During Login
- Backend fetches user's primary address from `addresses` table
- Address data is included in user object:
  - `user.address` (street from addresses.street)
  - `user.barangay`
  - `user.city`
  - `user.province`
  - `user.region`
  - `user.zip_code`

### 3. In Edit Profile Page
- Address fields are **READ-ONLY** ⚠️
- Displays saved address from signup
- Shows warning: "Address changes require admin approval"
- User cannot edit address (disabled/readonly inputs)
- Backend: `PUT /api/auth/profile` does NOT accept address changes

### 4. In Checkout Page
- When "Use My Saved Address" is selected:
  - Reads from `user.address`, `user.barangay`, `user.city`, `user.province`, `user.zip_code`
  - These are populated from `addresses` table via login
- When "Use New Shipping Address" is selected:
  - User can enter a different delivery address just for this order
  - Does NOT save to profile (one-time use)

## Database Structure

```sql
-- addresses table (existing)
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id),
  street text,           -- user.address in frontend
  barangay text,
  city text,
  province text,
  region text,
  zip_code text,
  is_primary boolean,    -- true for main address
  created_at timestamptz,
  updated_at timestamptz
);
```

## Backend Endpoints

### `POST /api/auth/signup`
```javascript
// Creates address in addresses table
await supabase
  .from('addresses')
  .insert([{
    profile_id: userId,
    street,
    barangay,
    city,
    province,
    region,
    zip_code,
    is_primary: true
  }]);
```

### `POST /api/auth/login`
```javascript
// Fetches address from addresses table
const { data: addressData } = await supabase
  .from('addresses')
  .select('street, barangay, city, province, region, zip_code')
  .eq('profile_id', user.id)
  .eq('is_primary', true)
  .single();

// Returns in user object
return {
  ...user,
  address: addressData?.street,
  barangay: addressData?.barangay,
  city: addressData?.city,
  province: addressData?.province,
  region: addressData?.region,
  zip_code: addressData?.zip_code
};
```

### `PUT /api/auth/profile/:userId`
```javascript
// Does NOT update address (intentional)
// Only updates: username, email, first_name, last_name, phone, bio
// Address changes need admin approval (separate flow)
```

## Frontend Components

### `UserPersonalInfo.jsx`
- Fetches address from `addresses` table
- Displays as **read-only** with warning message
- Shows: "⚠️ Address changes require admin approval"

### `Checkout.jsx`
- Reads address from `user` context
- Option 1: "Use My Saved Address" (from addresses table)
- Option 2: "Use New Shipping Address" (temporary, not saved)

## User Flow

1. **Sign Up** → Enter address → Saved to `addresses` table ✅
2. **Login** → Address loaded from `addresses` table to user context ✅
3. **View Profile** → Address displayed as read-only ✅
4. **Checkout** → Can use saved address or enter new one ✅

## Why This Design?

✅ **Security** - Address changes controlled by admin  
✅ **Data Integrity** - Address stored in proper normalized table  
✅ **Flexibility** - Users can use different address for delivery without changing profile  
✅ **Simple** - No complex address management UI needed  

## Future: Admin Address Approval

To allow users to request address changes:

1. Create `address_change_requests` table
2. User submits change request
3. Admin reviews and approves/rejects
4. On approval, update `addresses` table
5. User gets notification

## Testing

1. **Sign up** with an address
2. **Login** - address should be in user context
3. **Edit Profile** - address shows as read-only ✅
4. **Checkout** - "Use My Saved Address" should populate fields ✅

## Notes

- Do NOT add address columns to profiles table
- Do NOT run `002_add_address_to_profiles.sql` migration
- Address lives in `addresses` table only
- `user.address` in frontend = `addresses.street` in database
