# Edit Profile Modal - Setup Guide

## ✅ Completed Features

### 1. **EditProfileModal Component** (`src/components/EditProfileModal.jsx`)
- ✏️ Edit username, full name, phone, bio
- 📸 Profile picture upload with preview
- 📍 Address management (street, city, province, zipcode)
- 💾 Auto-save to Supabase database
- ✅ Success/error messages
- 🎨 Beautiful dark mode UI matching your theme

### 2. **Integration** (`UserProfileDropdown.jsx`)
- Opens modal when clicking "Edit Profile"
- Closes modal properly
- Refreshes data after save

---

## 🔧 Supabase Storage Setup Required

Before using the profile picture upload, you need to create a **Storage Bucket** in Supabase:

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: **Storage** → **Create a new bucket**

2. **Create Bucket**
   - Bucket name: `profiles`
   - Public bucket: ✅ **YES** (check this)
   - File size limit: 2MB (recommended)
   - Allowed MIME types: `image/*`

3. **Create `avatars` folder**
   - Inside the `profiles` bucket
   - Click "Create Folder"
   - Name: `avatars`

4. **Set Storage Policies (RLS)**

Run this SQL in Supabase SQL Editor:

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = (storage.filename(name) LIKE (auth.uid()::text || '-%'))
);

-- Allow public to view avatars
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = (storage.filename(name) LIKE (auth.uid()::text || '-%'))
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND auth.uid()::text = (storage.filename(name) LIKE (auth.uid()::text || '-%'))
);
```

---

## 📋 Database Tables Expected

The modal expects these tables (should already exist):

### 1. **auth_users** table
```sql
- id (uuid)
- username (varchar)
- email (varchar)
```

### 2. **profiles** table
```sql
- id (serial/uuid)
- user_id (uuid) → references auth_users(id)
- full_name (varchar)
- phone_number (varchar)
- bio (text)
- avatar_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### 3. **addresses** table
```sql
- id (serial)
- profile_id (integer) → references profiles(id)
- street_address (text)
- city (varchar)
- province (varchar)
- zipcode (varchar)
- country (varchar)
- is_primary (boolean)
- address_type (varchar)
- created_at (timestamp)
```

---

## 🎯 How to Use

1. **User clicks "Edit Profile"** in dropdown menu
2. **Modal opens** with current user data loaded
3. **User can:**
   - Change profile picture (drag/drop or click)
   - Edit personal info (name, phone, bio)
   - Update address details
4. **Click "Save Changes"**
5. **Success message** appears
6. **Page auto-refreshes** with new data

---

## 🎨 Features

- ✅ **Live image preview** before upload
- ✅ **File validation** (type & size)
- ✅ **Auto-create profile** if doesn't exist
- ✅ **Update or create address** automatically
- ✅ **Loading states** for better UX
- ✅ **Error handling** with user-friendly messages
- ✅ **Responsive design** - works on mobile
- ✅ **Dark/Light mode** support
- ✅ **Keyboard shortcuts** (ESC to close)
- ✅ **Click outside to close**

---

## 🐛 Troubleshooting

### Image upload fails?
- Check if `profiles` bucket exists in Supabase Storage
- Verify RLS policies are applied
- Make sure bucket is **public**

### Profile not saving?
- Check browser console for errors
- Verify user is authenticated (`user.id` exists)
- Check if tables exist in database

### Modal not opening?
- Check if `EditProfileModal` is imported in `UserProfileDropdown`
- Verify `showEditProfile` state is being set to `true`

---

## 📱 Mobile Responsive

The modal is fully responsive:
- Stacks form fields vertically on mobile
- Full-width buttons on small screens
- Touch-friendly UI elements
- Smooth animations

---

## 🚀 Next Steps (Optional Enhancements)

1. **Image cropping** before upload
2. **Multiple address management** (home, work, shipping)
3. **Email change** with verification
4. **Phone verification** via OTP
5. **Social media links**
6. **Privacy settings**

---

## ✨ Ready to Test!

Just make sure:
1. ✅ Supabase Storage bucket `profiles` is created
2. ✅ RLS policies are applied
3. ✅ Tables exist in database
4. ✅ User is logged in

Then click **"Edit Profile"** in the user dropdown! 🎉
