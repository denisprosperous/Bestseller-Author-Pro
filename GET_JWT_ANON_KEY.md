# 🔑 How to Get Your JWT Anon Key from Supabase

## ⚠️ IMPORTANT: You Need the JWT Format, Not Publishable Key

You provided:
- ❌ `sb_publishable_uIWafl14qsPPffW5dOLBHQ_ObSLTB7V` (Wrong format)
- ❌ `sb_secret_KlewQne74j_9oiKlp9YNlA_r5clPxOF` (Wrong format)

You need:
- ✅ JWT token starting with `eyJ...` (Correct format)

---

## 📋 Step-by-Step Guide

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Login with your credentials
3. Select project: **shzfuasxqqflrfiiwtpw**

### Step 2: Navigate to API Settings
1. Click **Settings** (⚙️ gear icon) in the left sidebar
2. Click **API** in the settings submenu
3. You'll see the "Project API keys" section

### Step 3: Find the Correct Keys
You'll see a section called **Project API keys** with:

#### Option 1: Project URL
```
https://shzfuasxqqflrfiiwtpw.supabase.co
```
✅ You already have this!

#### Option 2: anon public (JWT format)
This is what you need! It looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoemZ1YXN4cXFmbHJmaWl3dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NzE5NzQsImV4cCI6MjA1MzU0Nzk3NH0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Click the copy button (📋) next to this key!**

#### Option 3: service_role secret (JWT format)
This is for server-side only. Don't use this in the browser!

---

## 🎯 What to Look For

### ✅ CORRECT Format (JWT Token)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoemZ1YXN4cXFmbHJmaWl3dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NzE5NzQsImV4cCI6MjA1MzU0Nzk3NH0.uIWafl14qsPPffW5dOLBHQ_ObSLTB7V
```
- Starts with: `eyJ`
- Has 3 parts separated by dots (`.`)
- Total length: ~200-250 characters
- This is a JWT (JSON Web Token)

### ❌ WRONG Format (Publishable Key)
```
sb_publishable_uIWafl14qsPPffW5dOLBHQ_ObSLTB7V
```
- Starts with: `sb_publishable_`
- This is NOT what Supabase client library uses!

---

## 🖼️ Visual Guide

When you're on the API settings page, you should see something like:

```
┌─────────────────────────────────────────────────────┐
│ Project API keys                                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Project URL                                          │
│ https://shzfuasxqqflrfiiwtpw.supabase.co           │
│ [📋 Copy]                                           │
│                                                      │
│ anon public                                          │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi... │
│ [📋 Copy] [👁️ Reveal]                               │
│                                                      │
│ service_role secret                                  │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi... │
│ [📋 Copy] [👁️ Reveal]                               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Copy the "anon public" key!**

---

## 🔧 Once You Have the Key

### Option 1: Paste It Here
Just reply with:
```
The JWT anon key is: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoemZ1YXN4cXFmbHJmaWl3dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NzE5NzQsImV4cCI6MjA1MzU0Nzk3NH0.COMPLETE_KEY_HERE
```

I'll update your `.env` file immediately!

### Option 2: Update Manually
1. Open `project/.env`
2. Find these lines:
```env
SUPABASE_API_KEY=...
VITE_SUPABASE_API_KEY=...
```
3. Replace with your JWT anon key:
```env
SUPABASE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_COMPLETE_JWT_HERE
VITE_SUPABASE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_COMPLETE_JWT_HERE
```

---

## 🧪 Test the Connection

After updating, run:
```bash
cd project
node test-supabase-connection.js
```

Expected output:
```
✅ Supabase client created successfully
✅ Auth service responding
✅ CONNECTION TEST COMPLETE
```

---

## 🤔 Why Two Different Key Formats?

Supabase has evolved and now shows different key formats:

1. **JWT Tokens** (Old format, still used by client library)
   - `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Used by `@supabase/supabase-js` client
   - This is what you need!

2. **Publishable Keys** (New format, for some services)
   - `sb_publishable_...`
   - Used by some newer Supabase services
   - NOT used by the JavaScript client library

**For your React app, you need the JWT format!**

---

## 📞 Still Can't Find It?

### Alternative 1: Check Project Settings
1. Go to: Settings → General
2. Look for "Reference ID": `shzfuasxqqflrfiiwtpw`
3. Confirm this matches your project

### Alternative 2: Check Email
Search your email for "Supabase" and look for:
- Subject: "Your new Supabase project"
- Should contain the JWT anon key

### Alternative 3: Screenshot
If you can't find it, take a screenshot of your Supabase API settings page (blur any sensitive parts) and I can help identify the correct key.

---

## ✅ Success Checklist

- [ ] Logged into Supabase dashboard
- [ ] Selected correct project (shzfuasxqqflrfiiwtpw)
- [ ] Navigated to Settings → API
- [ ] Found "anon public" key (JWT format)
- [ ] Copied the COMPLETE key
- [ ] Key starts with `eyJ`
- [ ] Key has 3 parts separated by dots
- [ ] Key is ~200+ characters long
- [ ] Pasted key here or updated .env file
- [ ] Tested connection
- [ ] Ready to test signup! 🎉

---

**Waiting for your JWT anon key!** 🚀
