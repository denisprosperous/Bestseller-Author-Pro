# Quick Start Guide - Bestseller Author Pro

## 🚀 Get Started in 2 Minutes

### Option 1: Development Mode (Fastest)

1. **Copy environment file**:
   ```bash
   cd project
   cp .env.example .env
   ```

2. **Enable dev mode and add your API keys**:
   Edit `project/.env`:
   ```env
   VITE_USE_DEV_API_KEYS=true
   VITE_OPENAI_API_KEY=sk-your-actual-key-here
   VITE_GOOGLE_API_KEY=your-actual-key-here
   ```

3. **Start the app**:
   ```bash
   npm install
   npm run dev
   ```

4. **Open browser**:
   http://localhost:5174

5. **Start creating**:
   - Click "Start Creating Now"
   - Enter a book idea
   - Generate!

### Option 2: Database Mode (Production)

1. **Start the app**:
   ```bash
   cd project
   npm install
   npm run dev
   ```

2. **Add API keys through UI**:
   - Open http://localhost:5174
   - Click "Settings"
   - Select provider
   - Paste API key
   - Click "Save"

3. **Start creating**:
   - Click "Start Creating Now"
   - Enter a book idea
   - Generate!

## 📋 What You Need

### Required
- Node.js 18+ installed
- At least ONE AI provider API key:
  - OpenAI (GPT-5.2, GPT-5, GPT-4) - https://platform.openai.com/api-keys
  - Google (Gemini 2, Gemini 1.5) - https://makersuite.google.com/app/apikey
  - Anthropic (Claude 4, Claude 3.5) - https://console.anthropic.com/
  - xAI (Grok 3, Grok 2) - https://x.ai/api
  - DeepSeek (via Hugging Face) - https://huggingface.co/settings/tokens

### Optional (for database mode)
- Supabase account - https://supabase.com
- Encryption key (generate with: `openssl rand -hex 32`)

## 🎯 Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Check for errors
npm run lint
```

## 🔑 API Key Formats

Make sure your keys match these formats:

| Provider | Format | Example |
|----------|--------|---------|
| OpenAI | `sk-...` | `sk-proj-abc123...` |
| Anthropic | `sk-ant-...` | `sk-ant-api03-xyz...` |
| Google | Alphanumeric | `AIzaSyAbc123...` |
| xAI | `xai-...` | `xai-abc123...` |
| DeepSeek | `hf_...` | `hf_abc123...` |

## ✅ Verify It's Working

### Check 1: App Loads
- Navigate to http://localhost:5174
- You should see the home page
- No errors in browser console

### Check 2: API Keys Detected
**Dev Mode**:
- Open browser console (F12)
- Look for: "Dev mode: Using [provider] key from environment variables"

**Database Mode**:
- Go to Settings
- Saved keys show a checkmark

### Check 3: Generate Content
- Click "Start Creating Now"
- Enter: "A guide to productivity"
- Click "Generate Ideas"
- Should see 5 titles and an outline

## 🐛 Common Issues

### "No API key found"
- **Dev mode**: Check `VITE_USE_DEV_API_KEYS=true` in .env
- **Dev mode**: Verify keys have `VITE_` prefix
- **Database mode**: Add keys through Settings page

### "JSON.parse error"
- Clear browser cache
- Restart dev server
- Check you're using latest code

### "Failed to save API key"
- Try dev mode instead
- Check Supabase credentials
- Verify ENCRYPTION_KEY is set

### App won't start
- Run `npm install` again
- Check Node.js version (need 18+)
- Delete `node_modules` and reinstall

## 📚 Next Steps

1. ✅ Generate your first ebook
2. ✅ Try different AI providers
3. ✅ Explore audiobook features
4. ✅ Create illustrated children's books
5. ✅ Export in multiple formats

## 🆘 Need Help?

- **Setup Guide**: See `API_KEY_SETUP_GUIDE.md`
- **Fix Summary**: See `API_KEY_FIX_SUMMARY.md`
- **Full Docs**: See `README.md`
- **Browser Console**: Press F12 for detailed errors

## 🎉 You're Ready!

The app is now working with:
- ✅ Latest AI models (GPT-5.2, Claude 4, Gemini 2, Grok 3)
- ✅ Fixed API key management
- ✅ Development mode for fast testing
- ✅ Database mode for production
- ✅ Multi-format export (PDF, EPUB, HTML, Markdown)
- ✅ Audiobook generation
- ✅ Children's book creation

Start creating your bestseller! 🚀📚
