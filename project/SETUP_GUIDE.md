# 🚀 Bestseller Author Pro - Setup Guide

## Quick Start (5 minutes)

### 1. Set Up Your Supabase Database

You mentioned you already have a Supabase database set up! Perfect! 

**Get your credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **anon/public** API key

### 2. Configure Environment Variables

Update your `.env` file with your real Supabase credentials:

```env
# Replace with your actual Supabase project credentials
SUPABASE_PROJECT_URL=https://your-project-id.supabase.co
SUPABASE_API_KEY=your-anon-public-key-here

# Keep this encryption key (or generate a new secure one)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### 3. Verify Database Schema

Your database schema looks excellent! It includes:
- ✅ `ebooks` table with RLS policies
- ✅ `chapters` table with proper relationships
- ✅ `audiobooks` table for TTS features
- ✅ `user_profiles` table for user management
- ✅ Row Level Security (RLS) policies
- ✅ Proper indexes for performance

### 4. Start the Development Server

```bash
cd project
npm install
npm run dev
```

Visit: http://localhost:5173

## 🌐 Deploy to Production

### Option 1: Netlify (Recommended for your setup)

Since you mentioned Netlify, here's the complete setup:

**Method A: Netlify CLI**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy from project directory
cd project
netlify deploy

# For production deployment
netlify deploy --prod
```

**Method B: GitHub Integration**
1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build settings:
     - Build command: `npm run build`
     - Publish directory: `build/client`
   - Add environment variables (see below)

### Option 2: Vercel (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
cd project
vercel

# Follow the prompts and add environment variables
```

### Environment Variables for Deployment

**For Netlify Dashboard (Site settings → Environment variables):**

**REQUIRED (Minimum for basic functionality):**
```env
SUPABASE_PROJECT_URL=https://your-project-id.supabase.co
SUPABASE_API_KEY=your-anon-public-key-here
ENCRYPTION_KEY=your-64-character-hex-encryption-key
NODE_ENV=production
XAI_API_KEY=your-xai-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

**RECOMMENDED (Enhanced features):**
```env
ANTHROPIC_API_KEY=your-anthropic-api-key-here
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
HUGGINGFACE_API_KEY=your-huggingface-api-key-here
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
SENTRY_DSN=your-sentry-dsn-here
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

**OPTIONAL (Advanced features):**
```env
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
STRIPE_SECRET_KEY=sk_live_your-stripe-key
SENDGRID_API_KEY=your-sendgrid-api-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
```

## 🔧 Additional Configuration

### API Keys for AI Providers (Optional)

Users can add their own API keys through the settings page, but you can also pre-configure them:

```env
# Text Generation
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_API_KEY=your-google-api-key

# Voice Generation (TTS)
ELEVENLABS_API_KEY=your-elevenlabs-key
RESEMBLE_API_KEY=your-resemble-key

# Image Generation
HUGGINGFACE_API_KEY=your-huggingface-key
EDEN_AI_API_KEY=your-eden-ai-key
```

### Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Update DNS records as instructed

## 🧪 Testing Your Setup

### 1. Authentication Test
- Visit `/login`
- Create a new account
- Verify email confirmation works
- Test login/logout

### 2. Ebook Creation Test
- Go to **Home** → **Start Creating**
- Test: Brainstorm → Builder → Preview → Export
- Verify content saves to database

### 3. API Key Management Test
- Go to **Settings**
- Add an OpenAI API key
- Verify it's encrypted and stored securely

### 4. Audiobook Test
- Go to `/audiobooks`
- Convert an existing ebook to audio
- Test voice selection and playback

## 🔍 Troubleshooting

### Common Issues

**"Missing Supabase environment variables"**
- Check your `.env` file has correct credentials
- Verify environment variables are set in Vercel

**"Authentication not working"**
- Confirm your Supabase project has Auth enabled
- Check email templates are configured
- Verify RLS policies are active

**"AI generation fails"**
- Add API keys in Settings page
- Check API key format and validity
- Verify provider quotas and billing

**"Database connection issues"**
- Confirm Supabase project is active
- Check database URL format
- Verify API key permissions

### Performance Optimization

**For Production:**
1. Enable Vercel Analytics
2. Set up Sentry for error monitoring
3. Configure Redis for caching (optional)
4. Enable Supabase connection pooling

## 📊 Monitoring & Analytics

### Recommended Tools
- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and performance monitoring
- **Supabase Dashboard**: Database metrics and logs
- **Vercel Speed Insights**: Core Web Vitals tracking

## 🚀 You're Ready!

Your Bestseller Author Pro platform is now:
- ✅ Connected to your Supabase database
- ✅ Ready for local development
- ✅ Configured for Vercel deployment
- ✅ Optimized for production

**Next Steps:**
1. Update your `.env` with real Supabase credentials
2. Test locally: `npm run dev`
3. Deploy to Vercel: `vercel`
4. Share with users! 🎉

Need help? Check the troubleshooting section or create an issue in the repository.