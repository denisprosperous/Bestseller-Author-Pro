# Bestseller Author Pro - Setup Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account
- AI Provider API keys (at least one)

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
SUPABASE_PROJECT_URL=your-project-url
SUPABASE_API_KEY=your-supabase-anon-key

# Encryption Key (64 characters hex string)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-encryption-key-here
```

## Database Setup

1. Create the following tables in your Supabase project:

### Users Table

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Keys Table

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

### Enable Row Level Security

```sql
-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only access their own API keys
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
```

### Auto-update Timestamp Trigger

```sql
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

## Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Navigate to Settings page and configure your AI provider API keys

## AI Provider API Keys

### OpenAI

- Get your key: https://platform.openai.com/api-keys
- Models: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`

### Anthropic Claude

- Get your key: https://console.anthropic.com/settings/keys
- Models: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`

### Google Gemini

- Get your key: https://makersuite.google.com/app/apikey
- Models: `gemini-1.5-pro`, `gemini-1.5-flash`

### xAI Grok

- Get your key: https://console.x.ai
- API Endpoint: `https://api.x.ai/v1/chat/completions`
- Models: `grok-4-latest`, `grok-beta`
- Format: OpenAI-compatible API

### DeepSeek (via Hugging Face)

- Get your key: https://huggingface.co/settings/tokens
- Endpoint: `https://api-inference.huggingface.co/models/deepseek-ai/deepseek-llm-7b-instruct`
- Use Hugging Face token as API key

## Security Features

### API Key Encryption

- All API keys are encrypted using **AES-256-CBC** before storage
- Encryption key is stored in environment variables (never in database)
- Each encrypted value has a unique initialization vector (IV)

### Row Level Security (RLS)

- Supabase RLS policies ensure users can only access their own API keys
- Even with database access, users cannot see other users' keys
- Server-side validation prevents unauthorized access

### Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Rotate encryption key** - Generate new key periodically
3. **Use strong API keys** - Follow provider recommendations
4. **Monitor usage** - Track API calls and costs
5. **Delete unused keys** - Remove API keys you're no longer using

## Features

### Brainstorming

- AI-powered book title suggestions
- Automated outline generation
- Multiple AI provider support

### Ebook Generation

- Full manuscript creation from outlines
- Customizable tone and target audience
- Word count configuration
- File upload support (.txt, .md, .docx)

### Humanization

- 4-phase AI humanization gauntlet
- Removes robotic AI patterns
- Adds natural language variations
- Improves burstiness and perplexity

### Export Formats

- **PDF** - Print-ready format
- **EPUB** - E-reader compatible
- **Markdown** - Plain text with formatting
- **HTML** - Web-ready format

All exports are **KDP-compliant** for Amazon publishing.

## Development

### Project Structure

```
app/
├── components/       # React components
├── data/            # Static data and constants
├── hooks/           # Custom React hooks
├── lib/             # Core libraries (Supabase client, encryption)
├── routes/          # Page routes
├── services/        # Business logic services
├── styles/          # Global styles and themes
└── utils/           # Utility functions
```

### Key Services

- **API Key Service** - Secure key storage and retrieval
- **AI Service** - Multi-provider AI abstraction layer
- **Export Service** - Document format conversion

## Troubleshooting

### "Failed to load API keys"

- Check Supabase connection
- Verify RLS policies are correctly configured
- Ensure user ID matches authentication

### "API request failed"

- Verify API key is correct
- Check provider API limits and quotas
- Review error messages in console

### Encryption errors

- Ensure `ENCRYPTION_KEY` is exactly 64 hex characters
- Regenerate key if corrupted
- Clear browser cache/storage

## Support

For issues or questions:
- Check the documentation in `/docs`
- Review error messages in browser console
- Verify environment variables are set correctly
