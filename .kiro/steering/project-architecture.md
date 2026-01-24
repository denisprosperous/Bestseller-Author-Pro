---
inclusion: always
---

# Bestseller Author Pro - Project Architecture

## Overview
AI-powered ebook creation platform with multi-provider support, secure API key management, and KDP-compliant exports.

## Tech Stack
- **Frontend**: React 19 + TypeScript, React Router v7, CSS Modules
- **Backend**: Supabase (Database + Auth), Node.js encryption
- **AI Integration**: 5 providers (OpenAI, Anthropic, Google, xAI, DeepSeek)
- **Build**: Vite, TypeScript 5.9

## Core Architecture

### Service Layer
- `AIService` - Unified abstraction for all AI providers
- `APIKeyService` - Encrypted storage/retrieval of API keys
- `ExportService` - Multi-format export (PDF, EPUB, Markdown, HTML)

### Data Flow
1. User workflow: Home → Brainstorm → Builder → Preview → Export
2. AI provider selection with auto-fallback
3. Secure API key retrieval from Supabase
4. Content generation and humanization
5. Multi-format export with KDP compliance

### Security Implementation
- AES-256-CBC encryption for API keys (server-side)
- Supabase Row Level Security (RLS)
- Environment variable configuration
- User-specific data isolation

## File Structure
```
app/
├── routes/           # Page components
├── services/         # Business logic
├── utils/           # Utility functions
├── lib/             # External integrations
├── data/            # Static data and types
└── components/      # Reusable UI components
```

## AI Provider Integration
All providers use unified interface:
```typescript
await aiService.generateContent({
  provider: "openai",
  model: "gpt-4-turbo", 
  prompt: "...",
  apiKey: "...",
  maxTokens: 2000,
  temperature: 0.7
});
```

## Database Schema (Supabase)
- `users` - User accounts
- `api_keys` - Encrypted API keys with RLS
- `ebooks` - Generated content storage (to be implemented)

## Environment Variables
```env
SUPABASE_PROJECT_URL=your-project-url
SUPABASE_API_KEY=your-anon-key
ENCRYPTION_KEY=64-char-hex-string
```