# Supabase API Key Fix - "Invalid API key" Error

## Problem Identified
The "Invalid API key" error during signup was caused by Vite not being able to read environment variables without the `VITE_` prefix.

## What Was Fixed

### 1. Added VITE_ Prefixed Variables
Updated `project/.env` to include browser-accessible versions:
```env
# Original (server-side only)
SUPABASE_PROJECT_URL=https://shzfuasxqqflrfiiwtpw.supabase.co
SUPABASE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Added (browser-accessible)
VITE_SUPABASE_PROJECT_URL=https://shzfuasxqqflrfiiwtpw.supabase.co
VITE_SUPABASE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. How Vite Environment Variables Work
- **Without VITE_ prefix**: Only accessible in server-side code (Node.js)
- **With VITE_ prefix**: Accessible in browser code via `import.meta.env`
- The `supabase.ts` file already has fallback logic to check both versions

### 3. Service Role Key Issue
The `SUPABASE_SERVICE_ROLE_KEY` in your .env file is incomplete/truncated. This key is only needed for server-side admin operations, not for signup/login. The anon key (SUPABASE_API_KEY) is what's used for authentication.

## How to Test the Fix

### Step 1: Restart the Dev Server
The dev server needs to be restarted to pick up the new environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd project
npm run dev
```

### Step 2: Clear Browser Cache
1. Open DevTools (F12)
2. Go to Application tab
3. Clear all storage (localStorage, sessionStorage, cookies)
4. Refresh the page

### Step 3: Test Signup
1. Go to http://localhost:5173/login
2. Click "Sign up"
3. Enter email: test@example.com
4. Enter password: TestPassword123!
5. Click "Sign up"

### Expected Result
✅ Signup should succeed without "Invalid API key" error
✅ You should see a success message or be redirected to the home page
✅ Check browser console for "✅ Supabase: Connected to https://shzfuasxqqflrfiiwtpw.supabase.co"

## Verification Checklist

### Check Environment Variables Are Loaded
Open browser console and run:
```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_PROJECT_URL);
console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_API_KEY);
console.log('Key length:', import.meta.env.VITE_SUPABASE_API_KEY?.length);
```

Expected output:
```
URL: https://shzfuasxqqflrfiiwtpw.supabase.co
Key exists: true
Key length: 189
```

### Check Supabase Connection
The console should show:
```
✅ Supabase: Connected to https://shzfuasxqqflrfiiwtpw.supabase.co
```

If you see:
```
⚠️ Supabase: Using placeholder values
```
Then the environment variables are not being read correctly.

## Troubleshooting

### If Still Getting "Invalid API key"

**Option 1: Verify .env File**
```bash
cd project
cat .env | grep VITE_SUPABASE
```
Should show both VITE_SUPABASE_PROJECT_URL and VITE_SUPABASE_API_KEY

**Option 2: Hard Restart**
```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Clear npm cache
npm cache clean --force

# Restart dev server
cd project
npm run dev
```

**Option 3: Check Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Verify the anon/public key matches what's in your .env file
5. If different, copy the correct key and update .env

### If Signup Works But No Email Confirmation

This is expected! Supabase email confirmation requires SMTP configuration. For now:

1. **Option A**: Disable email confirmation in Supabase
   - Go to Authentication > Settings
   - Disable "Enable email confirmations"

2. **Option B**: Use Supabase dashboard to confirm users manually
   - Go to Authentication > Users
   - Find the user and click "Confirm email"

3. **Option C**: Configure SMTP (see SUPABASE_SETUP_FIXED.md)

## Next Steps After Fix

1. ✅ Test signup with new account
2. ✅ Test login with created account
3. ✅ Test logout functionality
4. ✅ Test protected routes (should redirect to login when not authenticated)
5. ✅ Test API key storage in Settings page
6. ✅ Test content generation workflows

## Files Modified
- `project/.env` - Added VITE_ prefixed variables
- `project/.env.example` - Updated template with VITE_ prefix pattern
- `SUPABASE_API_KEY_FIX.md` - This documentation

## Technical Details

### Why This Happened
Vite uses a security feature where only environment variables prefixed with `VITE_` are exposed to the browser. This prevents accidentally exposing sensitive server-side secrets to client code.

### The Fallback Chain
The `supabase.ts` file checks in this order:
1. `import.meta.env.VITE_SUPABASE_PROJECT_URL` (browser-accessible)
2. `import.meta.env.SUPABASE_PROJECT_URL` (won't work in browser)
3. Hardcoded fallback value

With the VITE_ prefix added, step 1 now succeeds.

### Security Note
The anon/public key is SAFE to expose to the browser - it's designed for client-side use. The service role key should NEVER be exposed to the browser (that's why we don't add VITE_ prefix to it).
