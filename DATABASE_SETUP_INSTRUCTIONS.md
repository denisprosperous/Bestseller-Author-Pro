# Database Setup Instructions

## Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: **shzfuasxqqflrfiiwtpw**

## Step 2: Create Database Tables

1. In the left sidebar, click on **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `project/database/schema.sql`
4. Click **Run** to execute the SQL

This will create all required tables:
- `users` - User accounts
- `api_keys` - Encrypted API keys storage
- `ebooks` - Generated ebook content
- `chapters` - Individual chapter content
- `sessions` - User workflow sessions
- `tts_audio` - Text-to-speech audio files
- `generated_images` - AI-generated images

## Step 3: Verify Tables Were Created

1. In the left sidebar, click on **Table Editor**
2. You should see all the tables listed
3. Click on each table to verify the structure

## Step 4: Test API Key Storage

After tables are created, test the API key storage:

1. Open your app at http://localhost:5173
2. Go to **Settings**
3. Add an API key for any provider (e.g., OpenAI)
4. Check in Supabase Dashboard > Table Editor > `api_keys` table
5. You should see an encrypted entry

## Step 5: Enable Row Level Security (RLS)

The schema.sql already includes RLS policies, but verify they're enabled:

1. Go to **Authentication** > **Policies**
2. Check that policies exist for:
   - `api_keys` table
   - `ebooks` table
   - `chapters` table
   - `sessions` table

## Step 6: Test Database Connection from App

Run this command to test the connection:

```bash
cd project
node test-supabase.js
```

Expected output:
```
✅ Auth connection successful
✅ Database access successful
✅ Tables found: [users, api_keys, ebooks, chapters, sessions, ...]
```

## Troubleshooting

### Issue: "fetch failed" error
**Solution**: This is usually a network issue. The database is accessible from the browser but not from Node.js scripts. This is normal and doesn't affect the app.

### Issue: "relation does not exist"
**Solution**: Tables haven't been created yet. Follow Step 2 above.

### Issue: "permission denied"
**Solution**: RLS policies are blocking access. Make sure you're authenticated or temporarily disable RLS for testing.

### Issue: API keys not saving
**Solution**: 
1. Check that `api_keys` table exists
2. Verify RLS policies allow INSERT
3. Check browser console for errors
4. Try using localStorage fallback temporarily

## Current Status

- ✅ Supabase project created
- ✅ Environment variables configured
- ❌ Database tables need to be created (follow Step 2)
- ❌ API key storage needs testing (follow Step 4)

## Next Steps After Database Setup

1. **Remove Demo Mode**: Set `DEMO_MODE = false` in `project/app/lib/demo-mode.ts`
2. **Test API Key Storage**: Add keys through Settings page
3. **Test Content Generation**: Create an ebook using Brainstorm → Builder workflow
4. **Verify Database Storage**: Check Supabase dashboard to see saved content
5. **Remove localStorage Fallbacks**: Update services to use database only

## Important Notes

- The app currently uses localStorage as a fallback when database fails
- This is temporary and should be removed once database is working
- All API keys should be stored encrypted in Supabase
- Never commit API keys to git
- Use environment variables for development only
