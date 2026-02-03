# Vercel Environment Setup Guide

To successfully deploy your application to Vercel, you must configure the following Environment Variables in your Vercel Project Settings.

## Required Variables

Go to **Settings** > **Environment Variables** in your Vercel dashboard and add:

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `SUPABASE_PROJECT_URL` | Your Supabase Project URL | `https://xyzproject.supabase.co` |
| `SUPABASE_API_KEY` | Your Supabase Anon/Public Key | `eyJhbGciOiJIUzI1NiIsInR5c...` |
| `ENCRYPTION_KEY` | 64-character hex string for API key encryption | `a1b2c3d4...` (must be 64 chars) |

## Generating an Encryption Key

You can generate a valid 64-character hex string using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Optional Variables

| Variable Name | Value | Purpose |
|--------------|-------|---------|
| `NODE_ENV` | `production` | Optimizes build for production (default on Vercel) |

## Deployment Steps

1. **Push to GitHub**: Ensure your latest changes (including the new `vercel.json` and `package.json`) are pushed.
2. **Import Project**: In Vercel, import your repository.
3. **Configure**:
   - **Framework Preset**: Vercel should auto-detect "React Router" or "Other".
   - **Root Directory**: `project` (Since your app is in the `project` subfolder).
   - **Environment Variables**: Add the variables listed above.
4. **Deploy**: Click Deploy.
