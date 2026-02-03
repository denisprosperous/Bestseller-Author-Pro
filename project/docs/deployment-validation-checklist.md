# Deployment Validation Checklist

- Environment variables:
  - Required: `SUPABASE_PROJECT_URL`, `SUPABASE_API_KEY`, `ENCRYPTION_KEY`
  - Providers: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `XAI_API_KEY`, `ELEVENLABS_API_KEY`
- Netlify config:
  - Base directory: `project`
  - Build command: `npm run build`
  - Publish: `build/client`
  - Functions: `build/server`
- CSP/connect-src allowlist includes:
  - `supabase.co`, `api.openai.com`, `api.anthropic.com`, `generativelanguage.googleapis.com`, `api.x.ai`, `api.deepseek.com`, `api.elevenlabs.io`, `api.resemble.ai`, `api-inference.huggingface.co`, `api.edenai.run`
- Smoke tests:
  - Settings: save/get/delete API keys
  - Ebooks: Brainstorm→Builder→Preview→Export
  - Children’s Books: pages and images
  - Audiobooks: voices and chapter audio
- Database:
  - Apply `project/database/setup-corrected.sql`
  - Run `npm run setup:db` to verify tables and RLS
