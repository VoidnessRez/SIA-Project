# 📧 Email Setup Guide - Real Gmail Sending

## 🎯 Current Status
- ✅ Backend email service is working
- ✅ OTP generation is working
- ⚠️ Currently using **Ethereal Email** (test-only service)
- ❌ Emails don't reach real Gmail addresses yet

## 🔧 Why Emails Aren't Reaching Your Gmail

**Ethereal Email** is a **testing service** that catches emails for development. It doesn't actually send emails to real addresses like Gmail.

To send **real emails** to your Gmail (`khenardgwapo123@gmail.com`), you need to configure Gmail SMTP.

---

## 📝 Step-by-Step: Enable Real Gmail Sending

### **Option 1: Gmail App Password (Recommended)**

#### Step 1: Enable 2-Step Verification
1. Go to: https://myaccount.google.com/security
2. Find **"2-Step Verification"**
3. Click **"Get Started"** and follow the steps
4. Verify with your phone number

#### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Windows Computer**
4. Click **"Generate"**
5. Google will show a 16-character password like: `abcd efgh ijkl mnop`
6. **Copy this password** (you won't see it again!)

#### Step 3: Update `.env` File
1. Open: `backend/.env`
2. Replace these lines:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password-here
   ```
   
   With your actual credentials:
   ```env
   EMAIL_USER=khenardgwapo123@gmail.com
   EMAIL_PASS=abcdefghijklmnop
   ```
   
   **Note:** Remove spaces from the app password!

#### Step 4: Restart Backend Server
```bash
# Stop the current server (Ctrl+C in terminal)
cd backend
node index.js
```

You should see:
```
✅ Email service connected successfully
```

Instead of:
```
❌ Email service connection failed
📧 Using Ethereal Email for testing
```

---

### **Option 2: Less Secure Apps (Not Recommended)**

**⚠️ Google is deprecating this method. Use App Password instead!**

1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn ON "Allow less secure apps"
3. Update `.env` with your regular Gmail password
4. Restart backend server

---

## 🧪 Testing Real Email Sending

### Test via API:
```powershell
# PowerShell
$body = @{ email = "khenardgwapo123@gmail.com" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5174/api/auth/send-otp" -Method POST -ContentType "application/json" -Body $body
```

### Test via Frontend:
1. Open: http://localhost:5173
2. Go to **Admin Inventory**
3. Enter credentials
4. Enter email: `khenardgwapo123@gmail.com`
5. Click **"Send OTP"**
6. Check your Gmail inbox for OTP email

---

## 📧 What the Email Will Look Like

### Subject:
```
🔐 Admin OTP Verification - Mejia Spareparts
```

### Body:
```
Hello Admin,

Your OTP verification code is:

┌──────────────┐
│   123456     │
└──────────────┘

⏰ This code will expire in 5 minutes
🔒 Do not share this code with anyone
```

---

## 🐛 Troubleshooting

### Problem: "Invalid login" error
**Solution:** Make sure you're using an **App Password**, not your regular Gmail password.

### Problem: "Username and Password not accepted"
**Solution:** 
1. Verify 2-Step Verification is enabled
2. Generate a new App Password
3. Copy the password without spaces
4. Update `.env` file
5. Restart server

### Problem: Still using Ethereal Email
**Solution:** 
1. Check `.env` file has correct EMAIL_USER and EMAIL_PASS
2. Restart the backend server completely
3. Check terminal logs for "✅ Email service connected"

### Problem: Email goes to Spam
**Solution:** 
- Mark as "Not Spam" in Gmail
- Add sender to contacts
- This is normal for first-time emails

---

## 🎯 Quick Setup Summary

```bash
# 1. Get Gmail App Password
https://myaccount.google.com/apppasswords

# 2. Update backend/.env
EMAIL_USER=khenardgwapo123@gmail.com
EMAIL_PASS=your-16-char-password

# 3. Restart backend
cd backend
node index.js

# 4. Test
# Should see: ✅ Email service connected successfully
```

---

## 📌 Current Workaround (Without Gmail Setup)

If you want to test **right now** without Gmail setup:

1. **Use the console OTP:**
   - Backend generates OTP (you saw: 799807)
   - Use that OTP in the frontend
   
2. **Check backend terminal:**
   - Backend logs the OTP code
   - Copy and paste into OTP input field

---

## 🔐 Security Notes

- ✅ App Password is **safer** than regular password
- ✅ App Password can be revoked anytime
- ✅ App Password only works for this app
- ❌ Never commit `.env` file to Git
- ❌ Never share your App Password

---

## ✨ After Setup Success

Once Gmail SMTP is configured, you'll get:

- ✅ Real emails to your Gmail
- ✅ Professional HTML email templates
- ✅ Mejia Spareparts branding
- ✅ 6-digit OTP codes
- ✅ 5-minute expiration
- ✅ Security alerts

---

**Need help? Check the terminal logs when starting the backend server!**
