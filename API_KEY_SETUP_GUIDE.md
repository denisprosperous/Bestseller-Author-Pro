# API Key Setup Guide

## Overview

Bestseller Author Pro supports two methods for managing AI provider API keys:

1. **Database Storage (RECOMMENDED)** - Keys stored encrypted in Supabase
2. **Environment Variables (DEVELOPMENT ONLY)** - Keys read from .env file

## Method 1: Database Storage (Production)

### How It Works
- API keys are entered through the Settings page in the app
- Keys are encrypted using AES-256-CBC encryption on the server
- Encrypted keys are stored in Supabase with Row Level Security (RLS)
- Each user has their own encrypted keys
- Keys are decrypted on-demand when making AI requests

### Setup Steps

1. **Start the app**:
   ```bash
   cd project
   npm run dev
   ```

2. **Navigate to Settings**:
   - Open http://localhost:5174
   - Click "Settings" in the navigation menu

3. **Add API Keys**:
   - Select a provider (OpenAI, Anthropic, Google, xAI, DeepSeek)
   - Paste your API key
   - Click "Save"
   - Repeat for each provider you want to use

4. **Verify**:
   - Saved keys will show a checkmark
   - You can test keys by trying to generate content

### Advantages
✅ Secure - Keys are encrypted at rest
✅ Multi-user - Each user has their own keys
✅ Production-ready - Designed for real deployment
✅ No code changes needed - Works out of the box

### Disadvantages
❌ Requires database setup
❌ Manual entry through UI
❌ Slower for development/testing

---

## Method 2: Environment Variables (Development)

### How It Works
- API keys are read directly from .env file
- No encryption or database storage
- All users share the same keys
- Faster for development and testing

### Setup Steps

1. **Copy the example file**:
   ```bash
   cd project
   cp .env.example .env
   ```

2. **Enable development mode**:
   Edit `project/.env` and set:
   ```env
   VITE_USE_DEV_API_KEYS=true
   ```

3. **Add your API keys**:
   ```env
   # OpenAI (GPT-5.2, GPT-5, GPT-4)
   VITE_OPENAI_API_KEY=sk-your-actual-openai-key-here

   # Anthropic (Claude 4, Claude 3.5)
   VITE_ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here

   # Google (Gemini 2, Gemini 1.5)
   VITE_GOOGLE_API_KEY=your-actual-google-key-here

   # xAI (Grok 3, Grok 2)
   VITE_XAI_API_KEY=xai-your-actual-xai-key-here

   # DeepSeek (via Hugging Face)
   VITE_DEEPSEEK_API_KEY=hf_your-actual-huggingface-token-here
   ```

4. **Restart the dev server**:
   ```bash
   npm run dev
   ```

5. **Verify**:
   - Check browser console for "Dev mode: Using [provider] key from environment variables"
   - Try generating content - it should work without entering keys in Settings

### Advantages
✅ Fast setup - Just edit .env file
✅ No database required
✅ Great for development/testing
✅ Easy to switch between keys

### Disadvantages
❌ NOT SECURE - Keys are in plain text
❌ Single user only - All users share keys
❌ NOT for production - Keys exposed to client
❌ Must restart server after changes

---

## Getting API Keys

### OpenAI (GPT-5.2, GPT-5, GPT-4)
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Free tier**: Limited requests, falls back to GPT-3.5
6. **Paid tier**: Full access to GPT-5.2, GPT-5, GPT-4

### Anthropic (Claude 4, Claude 3.5)
1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to API Keys
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)
6. **Free tier**: Limited requests
7. **Paid tier**: Full access to Claude 4 Opus

### Google (Gemini 2, Gemini 1.5)
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (alphanumeric string)
5. **Free tier**: Generous limits, good for testing
6. **Paid tier**: Higher limits and Gemini 2 Pro

### xAI (Grok 3, Grok 2)
1. Go to https://x.ai/api
2. Sign in or create an account
3. Navigate to API Keys
4. Click "Create API Key"
5. Copy the key (starts with `xai-`)
6. **Free tier**: Limited requests
7. **Paid tier**: Full access to Grok 3

### DeepSeek (via Hugging Face)
1. Go to https://huggingface.co/settings/tokens
2. Sign in or create an account
3. Click "New token"
4. Select "Read" access
5. Copy the token (starts with `hf_`)
6. **Free tier**: Good for basic testing
7. **Paid tier**: Faster inference

---

## Troubleshooting

### Error: "JSON.parse: unexpected character at line 1 column 1"
**Cause**: API route mismatch or response parsing issue
**Solution**: 
- Make sure you're using the latest code (routes fixed to `/api/keys/secure`)
- Clear browser cache and restart dev server
- Check browser console for detailed error messages

### Error: "No API key found for [provider]"
**Cause**: Key not saved or dev mode not enabled
**Solution**:
- **Database mode**: Add key through Settings page
- **Dev mode**: Check `VITE_USE_DEV_API_KEYS=true` in .env
- **Dev mode**: Verify key is set with `VITE_` prefix

### Error: "Failed to save API key"
**Cause**: Database connection issue or encryption problem
**Solution**:
- Check Supabase credentials in .env
- Verify ENCRYPTION_KEY is set (64-character hex string)
- Check browser console for detailed error
- Try dev mode as temporary workaround

### Keys work in dev mode but not in Settings
**Cause**: Dev mode overrides database storage
**Solution**:
- Set `VITE_USE_DEV_API_KEYS=false` to use database
- Restart dev server
- Add keys through Settings page

### "Invalid API key format" error
**Cause**: Key doesn't match expected format
**Solution**:
- **OpenAI**: Must start with `sk-`
- **Anthropic**: Must start with `sk-ant-`
- **xAI**: Must start with `xai-`
- **DeepSeek**: Must start with `hf_`
- **Google**: Alphanumeric string, no prefix required

---

## Best Practices

### Development
- ✅ Use environment variables (Method 2) for faster iteration
- ✅ Keep .env file in .gitignore
- ✅ Use free tier keys for testing
- ✅ Test with multiple providers

### Production
- ✅ Use database storage (Method 1) only
- ✅ Never set `VITE_USE_DEV_API_KEYS=true` in production
- ✅ Use paid tier keys for better performance
- ✅ Monitor API usage and costs
- ✅ Implement rate limiting
- ✅ Set up error tracking (Sentry)

### Security
- ❌ Never commit .env file to git
- ❌ Never expose API keys in client code
- ❌ Never use dev mode in production
- ✅ Rotate keys regularly
- ✅ Use separate keys for dev/staging/prod
- ✅ Monitor for unauthorized usage

---

## Switching Between Methods

### From Dev Mode to Database
1. Set `VITE_USE_DEV_API_KEYS=false` in .env
2. Restart dev server
3. Add keys through Settings page
4. Test to verify keys work

### From Database to Dev Mode
1. Set `VITE_USE_DEV_API_KEYS=true` in .env
2. Add keys with `VITE_` prefix in .env
3. Restart dev server
4. Check console for "Dev mode" messages

---

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify .env file configuration
3. Test with a single provider first
4. Try dev mode as a workaround
5. Check API provider status pages
6. Review this guide's troubleshooting section

For additional help, check the project documentation or open an issue on GitHub.
