# 🔧 AVATAR UPLOAD FIX - Step-by-Step Guide

## ❌ Current Error:
```
StorageApiError: new row violates row-level security policy
```

## ✅ Solution: Run SQL to Create Storage Policies

---

## 📋 STEP-BY-STEP INSTRUCTIONS:

### **STEP 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Login with your account
3. Select your project: `zqxsbgacaemcvzsfxnux`

---

### **STEP 2: Open SQL Editor**
1. Look at the left sidebar
2. Click on **"SQL Editor"** icon (looks like `</>`)
3. Click **"New Query"** button

---

### **STEP 3: Copy & Paste the SQL**

Open the file: `backend/supabase/FIX_AVATAR_UPLOAD.sql`

Copy **ALL** the SQL code from that file and paste it into the SQL Editor.

---

### **STEP 4: Run the SQL**
1. Click the **"Run"** button (or press `Ctrl+Enter`)
2. Wait for it to complete
3. You should see success messages

---

### **STEP 5: Verify the Fix**

The SQL will automatically run verification queries. You should see:

**Bucket Check:**
```
id: profiles
Public?: true
Max Size (MB): 5
Allowed Types Count: 5
```

**Policies Check:**
You should see 4 policies listed:
- ✅ `profiles_insert_policy` | INSERT | {authenticated}
- ✅ `profiles_select_policy` | SELECT | {public}
- ✅ `profiles_update_policy` | UPDATE | {authenticated}
- ✅ `profiles_delete_policy` | DELETE | {authenticated}

---

### **STEP 6: Test Upload Again**
1. Go back to your app: http://localhost:5173
2. Click on your profile dropdown
3. Click "Edit Profile"
4. Try uploading an avatar image again
5. It should work now! 🎉

---

## 🔍 What This SQL Does:

1. **Creates/Updates the `profiles` bucket**
   - Sets it to PUBLIC (so images are viewable)
   - Max size: 5MB
   - Allowed types: JPG, PNG, GIF, WEBP

2. **Removes old conflicting policies**
   - Cleans up any existing broken policies

3. **Creates 4 new RLS policies:**
   - **INSERT**: Allows authenticated users to upload
   - **SELECT**: Allows anyone to view images
   - **UPDATE**: Allows authenticated users to update files
   - **DELETE**: Allows users to delete only their own files

---

## ⚠️ Troubleshooting:

### If you still get errors after running SQL:

1. **Check if you're logged in:**
   - Make sure you're logged into your app
   - Try logging out and logging back in

2. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete`
   - Clear cache and reload page

3. **Check Supabase Storage tab:**
   - Go to Supabase Dashboard > Storage
   - Look for `profiles` bucket
   - It should show as "Public"

4. **Verify RLS is enabled:**
   - Go to SQL Editor
   - Run: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects';`
   - Should return: `rowsecurity = true`

---

## 📞 Need Help?

If upload still doesn't work after running the SQL:
1. Share a screenshot of the SQL Editor results
2. Share a screenshot of Storage > profiles bucket settings
3. Check browser console for new error messages

---

## ✅ Success Checklist:
- [ ] Ran the SQL in Supabase Dashboard
- [ ] Saw success messages/verification output
- [ ] `profiles` bucket exists and is PUBLIC
- [ ] 4 policies are created
- [ ] Tested upload - it works!

---

**Current Status:** ⏳ Waiting for you to run the SQL script in Supabase
