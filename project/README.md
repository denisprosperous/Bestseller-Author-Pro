# Bestseller Author Pro

> AI-powered ebook creation platform with multi-provider support, humanization, and KDP-compliant exports

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.1.0-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

</div>

---

## 🌟 Features

### AI-Powered Creation
- **Auto AI Provider Selection**: Automatically chooses the best available AI provider
- **Multi-Provider Support**: OpenAI, Anthropic Claude, Google Gemini, xAI Grok, DeepSeek
- **Manual Provider Control**: Select specific AI provider and model for power users
- **Brainstorming**: AI-generated titles and outlines with full provider control
- **Full Generation**: Complete ebook from outline to conclusion

### Content Enhancement
- **4-Phase Humanization**: Removes robotic AI patterns
- **Outline Improvement**: AI-powered structure enhancement
- **Custom Writing Tone**: Define your exact writing style or choose from presets
- **Tone Presets**: Auto, Formal, Casual, Storytelling, Academic, Persuasive
- **Audience Targeting**: Customize for specific readers

### Export & Publishing
- **PDF**: Print-ready, KDP-compliant
- **EPUB**: E-reader compatible, clickable TOC
- **Markdown**: Plain text with formatting
- **HTML**: Web-ready with styling
- **All formats meet Amazon KDP standards**

### Security & Privacy
- **AES-256-CBC Encryption**: API keys encrypted before storage
- **Row Level Security**: Supabase RLS policies
- **Secure Storage**: Keys never exposed to client
- **Environment Variables**: Sensitive data in .env

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- At least one AI provider API key

### Installation

```bash
# Clone repository
git clone <repository-url>
cd bestseller-author-pro

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

Visit http://localhost:5173

### First Steps

1. **Set up database**: Run SQL from [QUICKSTART.md](./QUICKSTART.md)
2. **Add API keys**: Go to Settings page
3. **Create ebook**: Use Brainstorm → Builder → Export workflow

---

## 📖 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[SETUP.md](./SETUP.md)** - Detailed setup guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- React 19 + TypeScript
- React Router v7
- CSS Modules
- Radix UI Components
- Lucide Icons

**Backend Services**
- Supabase (Database + Auth)
- Node.js encryption (AES-256-CBC)
- Multi-provider AI abstraction

**AI Providers**
- OpenAI GPT-4 / GPT-3.5
- Anthropic Claude 3.5
- Google Gemini 1.5
- xAI Grok 4
- DeepSeek (via Hugging Face)

### Project Structure

```
app/
├── components/       # Reusable UI components
│   ├── ui/          # Base component library
│   └── navigation.tsx
├── data/            # Static data and constants
│   ├── ai-providers.ts
│   └── mock-content.ts
├── hooks/           # Custom React hooks
├── lib/             # Core libraries
│   ├── supabase.ts  # Supabase client
│   └── encryption.ts # AES-256 encryption
├── routes/          # Page routes
│   ├── home.tsx
│   ├── brainstorm.tsx
│   ├── builder.tsx
│   ├── preview.tsx
│   └── settings.tsx
├── services/        # Business logic
│   └── api-key-service.ts
├── styles/          # Global styles
│   ├── theme.css
│   └── tokens/
└── utils/           # Utility functions
    ├── ai-service.ts
    └── export-service.ts
```

---

## 🔐 Security

### API Key Encryption

```typescript
// Encryption using AES-256-CBC
const encrypted = encrypt(apiKey);
// Format: IV:EncryptedData

// Decryption
const apiKey = decrypt(encrypted);
```

### Row Level Security

```sql
-- Users can only access their own API keys
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);
```

### Best Practices

✅ API keys encrypted before storage  
✅ Unique IV for each encrypted value  
✅ Environment variables for secrets  
✅ RLS policies on all tables  
✅ HTTPS only in production  
✅ No sensitive data in logs  

---

## 🤖 AI Provider Integration

### OpenAI

```typescript
// Endpoint: https://api.openai.com/v1/chat/completions
{
  model: "gpt-4-turbo",
  messages: [...],
  max_tokens: 2000,
  temperature: 0.7
}
```

### Anthropic Claude

```typescript
// Endpoint: https://api.anthropic.com/v1/messages
{
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 2000,
  messages: [...]
}
```

### Google Gemini

```typescript
// Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
{
  contents: [...],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2000
  }
}
```

### xAI Grok

```typescript
// Endpoint: https://api.x.ai/v1/chat/completions
{
  model: "grok-4-latest",
  messages: [...],
  max_tokens: 2000,
  stream: false
}
```

### DeepSeek (Hugging Face)

```typescript
// Endpoint: https://api-inference.huggingface.co/models/deepseek-ai/deepseek-llm-7b-instruct
{
  inputs: "...",
  parameters: {
    max_new_tokens: 2000,
    temperature: 0.7
  }
}
```

---

## 📝 Usage

### 1. Brainstorming

```typescript
// Auto-select best provider
const { titles, outline } = await aiService.brainstorm(
  "Digital Marketing",
  "auto",      // Auto-select best available provider
  "auto",      // Auto-select best model
  apiKey
);

// Or manually specify provider
const { titles, outline } = await aiService.brainstorm(
  "Digital Marketing",
  "openai",
  "gpt-4-turbo",
  apiKey
);
```

### 2. Outline Improvement

```typescript
// Enhance existing outline
const improved = await aiService.improveOutline(
  outline,
  "anthropic",
  "claude-3-5-sonnet-20241022",
  apiKey
);
```

### 3. Ebook Generation

```typescript
// Generate with auto provider
const content = await aiService.generateEbook({
  topic: "Digital Marketing",
  wordCount: 15000,
  tone: "auto",
  audience: "business owners",
  outline: improvedOutline,
  provider: "auto",
  model: "auto",
  apiKey
});

// Generate with custom tone
const content = await aiService.generateEbook({
  topic: "Digital Marketing",
  wordCount: 15000,
  tone: "custom",
  customTone: "Conversational yet authoritative, with humor and real-world examples",
  audience: "business owners",
  outline: improvedOutline,
  provider: "openai",
  model: "gpt-4-turbo",
  apiKey
});
```

### 4. Humanization

```typescript
// Apply 4-phase humanization
const humanized = await aiService.humanizeContent(content);
```

### 5. Export

```typescript
// Export as KDP-compliant PDF
await exportService.exportAsPDF(content, "my-ebook.pdf");

// Export as EPUB
await exportService.exportAsEPUB(content, "my-ebook.epub");
```

---

## 🎨 Customization

### Theme Configuration

Edit `app/styles/theme.css`:

```css
:root {
  /* Typography */
  --font-display: "Inter", sans-serif;
  --font-heading: 700 2.5rem/1.2 var(--font-display);
  
  /* Colors */
  --color-accent-9: var(--indigo-9);
  --color-neutral-1: var(--slate-1);
  
  /* Spacing */
  --space-4: 1rem;
  --space-6: 1.5rem;
}
```

### AI Provider Selection

Edit `app/data/ai-providers.ts` to add/modify providers:

```typescript
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "custom-provider",
    name: "Custom Provider",
    description: "Your custom AI provider",
    requiresApiKey: true,
    models: [...]
  }
];
```

---

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Build check
npm run build

# Development
npm run dev
```

---

## 📊 Performance

### Optimization Tips

1. **Model Selection**: Use cheaper models for brainstorming
2. **Caching**: Cache frequently used prompts
3. **Rate Limiting**: Implement per-user quotas
4. **Streaming**: Use streaming for real-time generation
5. **Compression**: Enable gzip for exports

### Monitoring

- Track API usage per provider
- Monitor costs and quotas
- Log errors and failures
- Measure response times

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel
# Configure environment variables in dashboard
vercel --prod
```

### Netlify

```bash
netlify deploy --prod
# Set environment variables in dashboard
```

### DigitalOcean / Railway

Connect GitHub repository and configure build settings.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run typecheck    # Type check TypeScript
npm run preview      # Preview production build
```

### Adding Features

1. Create component in `app/components/`
2. Add route in `app/routes/`
3. Update `app/routes.ts` configuration
4. Add types in component or separate file
5. Style using CSS Modules

---

## 🐛 Troubleshooting

### Common Issues

**"Failed to load API keys"**
- Check Supabase connection
- Verify RLS policies
- Ensure database tables exist

**"API request failed"**
- Verify API key is correct
- Check provider rate limits
- Review error messages

**"Encryption error"**
- Ensure ENCRYPTION_KEY is 64 hex characters
- Check environment variables
- Verify server-side execution

See [QUICKSTART.md](./QUICKSTART.md#troubleshooting) for more.

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests if applicable
5. Submit pull request

---

## 📞 Support

- **Documentation**: Check guides in `/docs`
- **Issues**: GitHub Issues
- **Questions**: Discussions tab

---

## 🗺️ Roadmap

### v1.1 ✅ COMPLETED
- [x] Auto AI provider selection
- [x] Manual provider and model control
- [x] Custom writing tone input
- [x] Enhanced AI configuration
- [ ] Supabase Auth integration
- [ ] User dashboard
- [ ] Content library

### v1.2
- [ ] Ebook templates
- [ ] Chapter image generation
- [ ] Direct KDP publishing
- [ ] Cost tracking

### v2.0
- [ ] Local model support (Ollama)
- [ ] Advanced humanization
- [ ] Multi-language support
- [ ] Mobile app

---

## 🙏 Acknowledgments

- React Router team for excellent routing
- Supabase for backend infrastructure
- Radix UI for accessible components
- AI providers for powerful models

---

<div align="center">

**Built with ❤️ for authors and creators**

[Get Started](./QUICKSTART.md) • [Documentation](./SETUP.md) • [Deploy](./DEPLOYMENT.md)

</div>
