# Database Column Mappings Reference

## ⚠️ IMPORTANT: Correct Column Names

This document lists the **actual database column names** to avoid confusion when writing queries.

---

## 📊 PROFILES Table

### Actual Columns (from backend/migrations/001_create_local_auth_profiles_addresses.sql):
```sql
profiles (
  id uuid PRIMARY KEY,
  auth_id uuid,              -- ⚠️ NOT user_id!
  first_name text,           -- ⚠️ NOT full_name!
  last_name text,
  gender text,
  phone text,                -- ⚠️ NOT phone_number!
  birthday date,
  status boolean,
  last_seen timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
```

### ❌ Common Mistakes:
- ❌ `.eq('user_id', ...)` → ✅ `.eq('auth_id', ...)`
- ❌ `full_name: profile?.full_name` → ✅ Split from `first_name + last_name`
- ❌ `phone_number: profile?.phone_number` → ✅ `phone: profile?.phone`

---

## 📍 ADDRESSES Table

### Actual Columns:
```sql
addresses (
  id uuid PRIMARY KEY,
  profile_id uuid,
  street text,               -- ⚠️ NOT street_address!
  barangay text,
  city text,
  province text,
  region text,
  zip_code text,             -- ⚠️ NOT zipcode!
  is_primary boolean,
  created_at timestamptz,
  updated_at timestamptz
)
```

### ❌ Common Mistakes:
- ❌ `street_address: address?.street_address` → ✅ `street: address?.street`
- ❌ `zipcode: address?.zipcode` → ✅ `zip_code: address?.zip_code`
- ❌ `country: address?.country` → ⚠️ No country column! (only region)

---

## 🔐 AUTH_USERS Table

### Actual Columns:
```sql
auth_users (
  id uuid PRIMARY KEY,
  username text UNIQUE,
  email text UNIQUE,
  password text,
  role text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
```

### ✅ Correct Usage:
```javascript
// Fetch user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('auth_id', user.id)  // ✅ auth_id, not user_id
  .single();

// Construct full name
const fullName = [profile?.first_name, profile?.last_name]
  .filter(Boolean)
  .join(' ');

// Fetch address
const { data: address } = await supabase
  .from('addresses')
  .select('*')
  .eq('profile_id', profile.id)
  .eq('is_primary', true)
  .single();

// Use correct column names
const street = address?.street;  // NOT street_address
const zipCode = address?.zip_code;  // NOT zipcode
```

---

## 🛠️ EditProfileModal.jsx Mappings

### Form Data → Database Columns:

| Form Field | Profiles Table | Addresses Table |
|------------|----------------|-----------------|
| `full_name` | Split to `first_name` + `last_name` | - |
| `phone` | `phone` | - |
| `bio` | `bio` | - |
| `avatar_url` | `avatar_url` | - |
| `street_address` | - | `street` |
| `city` | - | `city` |
| `province` | - | `province` |
| `zipcode` | - | `zip_code` |

### ✅ Fixed Functions:

#### fetchProfile():
```javascript
// ✅ Correct query
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('auth_id', user.id)  // ✅ auth_id
  .single();

// ✅ Correct mapping
setFormData({
  full_name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' '),
  phone: profile?.phone,  // ✅ phone, not phone_number
  street_address: address?.street,  // ✅ street
  zipcode: address?.zip_code  // ✅ zip_code
});
```

#### handleSubmit():
```javascript
// ✅ Split full_name
const nameParts = formData.full_name.trim().split(' ');
const firstName = nameParts[0] || '';
const lastName = nameParts.slice(1).join(' ') || '';

// ✅ Update profile
await supabase
  .from('profiles')
  .update({
    first_name: firstName,  // ✅ first_name
    last_name: lastName,    // ✅ last_name
    phone: formData.phone   // ✅ phone
  })
  .eq('auth_id', user.id);  // ✅ auth_id

// ✅ Update address
await supabase
  .from('addresses')
  .update({
    street: formData.street_address,  // ✅ street
    zip_code: formData.zipcode         // ✅ zip_code
  })
  .eq('profile_id', profile.id);
```

---

## 🚨 Troubleshooting

### Error: "column does not exist"
Check this mapping document and use the **Actual Columns** listed above.

### Error: "400 Bad Request"
Usually caused by using wrong column names in `.eq()` filters:
- ✅ `.eq('auth_id', user.id)` (correct)
- ❌ `.eq('user_id', user.id)` (wrong)

### Error: "Failed to load profile data"
1. Check if `profiles` table exists
2. Verify `auth_id` column exists (not `user_id`)
3. Ensure profile was created when user signed up

---

## ✅ Quick Reference

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `user_id` | `auth_id` |
| `full_name` | `first_name + last_name` |
| `phone_number` | `phone` |
| `street_address` | `street` |
| `zipcode` | `zip_code` |
| `country` | ⚠️ Not in schema (use `region`) |

---

## 📝 Notes

1. **profiles.id** and **profiles.auth_id** both reference **auth_users.id**
2. **addresses.profile_id** references **profiles.id**
3. **No `bio` or `avatar_url`** columns in current schema - may need to add them!
4. **No `country`** column in addresses - only `region`

---

## 🔧 Schema Enhancement Needed?

If you need `bio`, `avatar_url`, or `country` fields, add them via migration:

```sql
-- Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN bio TEXT;
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;

-- Add country to addresses
ALTER TABLE addresses ADD COLUMN country TEXT DEFAULT 'Philippines';
```

---

**Last Updated:** October 21, 2025  
**Status:** ✅ EditProfileModal.jsx fixed with correct column mappings
