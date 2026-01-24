# Quick Start Guide - Bestseller Author Pro

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key
3. Create a `.env` file:

```env
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-anon-key
ENCRYPTION_KEY=your-64-character-hex-encryption-key
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Set Up Database

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Create tables
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 4: Start Development Server

```bash
npm run dev
```

Visit: http://localhost:5173

### Step 5: Configure API Keys

1. Go to **Settings** page
2. Add API keys for your preferred AI providers:
   - **OpenAI**: https://platform.openai.com/api-keys
   - **Anthropic**: https://console.anthropic.com/settings/keys
   - **Google Gemini**: https://makersuite.google.com/app/apikey
   - **xAI Grok**: https://console.x.ai
   - **DeepSeek**: https://huggingface.co/settings/tokens

### Step 6: Create Your First Ebook

1. Go to **Brainstorm** page
2. Enter your book topic
3. Select AI provider and model
4. Generate titles and outlines
5. Go to **Builder** to create full ebook
6. Export as PDF, EPUB, Markdown, or HTML

---

## 🔐 Security Features

### API Key Encryption
- **AES-256-CBC** encryption before storage
- Unique IV for each encrypted value
- Keys never stored in plaintext
- Encryption key in environment variables only

### Row Level Security
- User data isolated at database level
- RLS policies prevent unauthorized access
- Supabase authentication integration ready

---

## 🤖 AI Provider Support

### OpenAI
- Endpoint: `https://api.openai.com/v1/chat/completions`
- Models: `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`

### Anthropic Claude
- Endpoint: `https://api.anthropic.com/v1/messages`
- Models: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`

### Google Gemini
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Models: `gemini-1.5-pro`, `gemini-1.5-flash`

### xAI Grok
- Endpoint: `https://api.x.ai/v1/chat/completions`
- Models: `grok-4-latest`, `grok-beta`
- Format: OpenAI-compatible

### DeepSeek (via Hugging Face)
- Endpoint: `https://api-inference.huggingface.co/models/deepseek-ai/deepseek-llm-7b-instruct`
- Model: `deepseek-llm-7b-instruct`

---

## 📝 Features

### Brainstorming
- AI-generated book titles
- Automated outline creation
- Multi-provider support

### Ebook Generation
- Full manuscript from outline
- Customizable tone and audience
- Word count control
- File upload support

### Humanization
- 4-phase gauntlet
- Removes AI patterns
- Natural language flow
- Improved readability

### Export
- **PDF** - Print-ready
- **EPUB** - E-reader compatible
- **Markdown** - Plain text
- **HTML** - Web-ready
- All formats are **KDP-compliant**

---

## 🛠️ Development

### Project Structure
```
app/
├── components/       # React components
├── data/            # Static data
├── lib/             # Core libraries
├── routes/          # Pages
├── services/        # Business logic
├── styles/          # Global styles
└── utils/           # Utilities
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run typecheck    # Type check TypeScript
```

---

## ⚠️ Important Notes

### Demo User ID
The current implementation uses a fixed demo user ID (`demo-user-123`) for development. In production:

1. Implement Supabase Auth
2. Replace `DEMO_USER_ID` with `auth.uid()`
3. Add login/signup flows
4. Update RLS policies as needed

### Server-Side Only Operations
The encryption service (`app/lib/encryption.ts`) uses Node.js `crypto` module and must run server-side only. For client-side operations, create API routes that handle encryption/decryption.

### API Rate Limits
Be aware of API rate limits for each provider:
- OpenAI: Varies by tier
- Anthropic: Check your plan
- Google: 60 requests/minute (free tier)
- xAI: Check console
- Hugging Face: 30 requests/hour (free tier)

---

## 📚 Next Steps

1. **Authentication**: Implement Supabase Auth for production
2. **Rate Limiting**: Add rate limiting for API calls
3. **Cost Tracking**: Monitor AI provider costs
4. **Content Storage**: Save generated ebooks to database
5. **Collaboration**: Add multi-user features
6. **Templates**: Create ebook templates
7. **Publishing**: Direct KDP publishing integration

---

## 🐛 Troubleshooting

### "Failed to load API keys"
- Check Supabase connection
- Verify database tables exist
- Check RLS policies

### "API request failed"
- Verify API key is correct
- Check provider status pages
- Review rate limits

### "Encryption error"
- Ensure ENCRYPTION_KEY is 64 hex characters
- Check environment variables loaded
- Clear and re-encrypt keys if needed

---

## 📖 Documentation

For detailed documentation, see:
- [SETUP.md](./SETUP.md) - Full setup guide
- [README.md](./README.md) - Project overview

---

**Ready to create bestselling ebooks!** 🎉
