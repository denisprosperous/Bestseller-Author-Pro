# Quick Fix: Use Development Mode for API Keys

## The Problem
The database save isn't working because either:
1. The Supabase database isn't set up yet
2. The `api_keys` table doesn't exist
3. The encryption key isn't configured

## The Solution: Use Development Mode (Works Immediately!)

### Step 1: Edit your .env file

Open `project/.env` (create it if it doesn't exist by copying `.env.example`):

```bash
cd project
cp .env.example .env
```

### Step 2: Add these lines to project/.env

```env
# Enable development mode
VITE_USE_DEV_API_KEYS=true

# Add your API keys (at least one)
VITE_OPENAI_API_KEY=sk-your-actual-openai-key-here
VITE_GOOGLE_API_KEY=your-actual-google-key-here
VITE_ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here
VITE_XAI_API_KEY=xai-your-actual-xai-key-here
```

### Step 3: Restart the dev server

Stop the current server (Ctrl+C) and restart:

```bash
npm run dev
```

### Step 4: Test it

1. Open http://localhost:5173
2. Go to Brainstorm
3. Enter a book idea
4. Click "Generate Ideas"
5. It should work immediately!

## Why This Works

- Development mode reads keys directly from `.env` file
- No database setup required
- No encryption needed
- Keys work instantly
- Perfect for testing and development

## Security Note

⚠️ **Development mode is for testing only!**
- Keys are NOT encrypted
- All users share the same keys
- DO NOT use in production
- Set `VITE_USE_DEV_API_KEYS=false` before deploying

## To Fix Database Mode Later

Once you're ready to use the database:

1. Set up Supabase database
2. Run the schema SQL file
3. Add ENCRYPTION_KEY to .env
4. Set `VITE_USE_DEV_API_KEYS=false`
5. Add keys through Settings UI

But for now, dev mode will get you up and running immediately!
