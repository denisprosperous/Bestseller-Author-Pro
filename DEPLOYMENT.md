# Deployment Guide - Bestseller Author Pro

## Overview

This guide covers deploying Bestseller Author Pro to production environments.

---

## Important: Server-Side Encryption

⚠️ **Critical**: The encryption service uses Node.js `crypto` module and must run server-side only.

Current implementation uses client-side code. For production deployment, you need to:

1. **Create Server-Side API Routes** for encryption operations
2. **Move encryption logic** to server endpoints
3. **Update client code** to call these endpoints

### Recommended Architecture

```
Client (Browser)
    ↓ (HTTPS)
Server API Routes (Node.js)
    ↓
Encryption Service (crypto module)
    ↓
Supabase Database
```

### Example Server Route Structure

Create API routes in `app/routes/api/` for:

```typescript
// app/routes/api/keys.save.ts
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const provider = formData.get("provider");
  const apiKey = formData.get("apiKey");
  const userId = await getUserId(request); // From session
  
  // Server-side encryption
  const encrypted = encrypt(apiKey);
  
  // Save to Supabase
  await supabase.from("api_keys").insert({
    user_id: userId,
    provider,
    encrypted_key: encrypted,
  });
  
  return json({ success: true });
}
```

---

## Deployment Platforms

### 1. Vercel (Recommended)

**Prerequisites:**
- Vercel account
- GitHub repository

**Steps:**

1. **Connect Repository**
   ```bash
   vercel
   ```

2. **Configure Environment Variables** in Vercel dashboard:
   ```
   SUPABASE_PROJECT_URL=your-url
   SUPABASE_API_KEY=your-key
   ENCRYPTION_KEY=your-encryption-key
   ```

3. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### 2. Netlify

**Steps:**

1. **Create `netlify.toml`**:
   ```toml
   [build]
     command = "npm run build"
     publish = "build/client"
     functions = "build/server"

   [[redirects]]
     from = "/*"
     to = "/.netlify/functions/server"
     status = 200
   ```

2. **Environment Variables** in Netlify dashboard:
   - `SUPABASE_PROJECT_URL`
   - `SUPABASE_API_KEY`
   - `ENCRYPTION_KEY`

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

### 3. DigitalOcean App Platform

**Steps:**

1. **Create App** from GitHub repo

2. **Configure**:
   - Build Command: `npm run build`
   - Run Command: `npm start`

3. **Environment Variables**:
   - Add all required env vars in dashboard

4. **Deploy**: Auto-deploys on git push

### 4. Railway

**Steps:**

1. **New Project** from GitHub

2. **Environment Variables**:
   - Add in Railway dashboard

3. **Deploy**: Automatic

---

## Production Checklist

### Security

- [ ] Move encryption to server-side API routes
- [ ] Enable HTTPS only
- [ ] Add rate limiting for API calls
- [ ] Implement CSRF protection
- [ ] Set secure cookie flags
- [ ] Add Content Security Policy headers
- [ ] Rotate encryption keys periodically
- [ ] Enable Supabase RLS policies
- [ ] Add API key validation
- [ ] Implement request signing

### Authentication

- [ ] Enable Supabase Auth
- [ ] Add login/signup flows
- [ ] Implement session management
- [ ] Add password reset
- [ ] Enable 2FA (optional)
- [ ] Replace demo user ID with auth.uid()

### Performance

- [ ] Enable CDN for static assets
- [ ] Add caching headers
- [ ] Optimize images
- [ ] Minify CSS/JS
- [ ] Enable compression
- [ ] Add service worker (optional)

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Add analytics
- [ ] Monitor API usage
- [ ] Track costs
- [ ] Set up uptime monitoring
- [ ] Add performance monitoring

### Database

- [ ] Enable connection pooling
- [ ] Set up backups
- [ ] Add database indexes
- [ ] Monitor query performance
- [ ] Set up replication (optional)

### API Management

- [ ] Add rate limiting per user
- [ ] Monitor AI provider costs
- [ ] Set spending limits
- [ ] Add usage quotas
- [ ] Implement retry logic
- [ ] Add circuit breakers

---

## Environment Variables

### Required

```env
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-anon-key
ENCRYPTION_KEY=64-character-hex-string
```

### Optional

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=random-secret-string
SENTRY_DSN=your-sentry-dsn
```

---

## Post-Deployment

### 1. Test All Features

- [ ] API key saving
- [ ] Brainstorming
- [ ] Ebook generation
- [ ] Export functionality
- [ ] File uploads

### 2. Monitor Initial Traffic

- Check error logs
- Monitor API costs
- Track performance metrics
- Review user feedback

### 3. Set Up Alerts

- Error rate thresholds
- API cost limits
- Uptime monitoring
- Performance degradation

---

## Scaling Considerations

### Database

- **Supabase Pro** for increased connections
- **Read replicas** for heavy read workloads
- **Connection pooling** (PgBouncer)

### API Calls

- **Queue system** (BullMQ, Redis) for long-running tasks
- **Background workers** for async processing
- **Caching layer** (Redis) for frequently accessed data

### Storage

- **CDN** for exported files
- **S3-compatible storage** for user uploads
- **File compression** for exports

---

## Cost Optimization

### AI Provider Costs

1. **Implement Caching**
   - Cache common prompts/responses
   - Use cheaper models for brainstorming
   - Reserve expensive models for final generation

2. **Set Usage Limits**
   - Per-user quotas
   - Rate limiting
   - Cost tracking

3. **Choose Models Wisely**
   - GPT-3.5 for simple tasks
   - GPT-4 for complex generation
   - Gemini Flash for speed
   - Claude for quality

### Supabase Costs

- **Free tier**: 500MB database, 1GB file storage
- **Pro tier**: $25/month for production
- Monitor database size
- Clean up old data

---

## Backup Strategy

### Database Backups

Supabase provides automatic backups:
- **Free tier**: Daily backups (7-day retention)
- **Pro tier**: Point-in-time recovery

### Manual Backups

```bash
# Export database
supabase db dump > backup.sql

# Restore
supabase db push backup.sql
```

### File Backups

- Export user-generated ebooks
- Backup uploaded files
- Store in S3 or similar

---

## Troubleshooting

### Build Failures

**"Module not found"**
- Clear node_modules
- Delete package-lock.json
- Run `npm install`

**"Type errors"**
- Run `npm run typecheck`
- Fix TypeScript errors
- Rebuild

### Runtime Errors

**"Encryption error"**
- Check ENCRYPTION_KEY length
- Verify environment variables
- Check server-side execution

**"Database connection failed"**
- Verify Supabase credentials
- Check connection string
- Review RLS policies

**"API request failed"**
- Verify API keys
- Check rate limits
- Review error logs

---

## Support

For deployment issues:

1. Check platform documentation
2. Review error logs
3. Test locally first
4. Check environment variables
5. Verify database setup

---

## Next Steps After Deployment

1. **Authentication**: Implement full auth system
2. **Payments**: Add subscription tiers
3. **Team Features**: Multi-user collaboration
4. **Templates**: Pre-built ebook templates
5. **Direct Publishing**: KDP API integration
6. **Analytics**: User behavior tracking
7. **A/B Testing**: Optimize conversion

---

**Ready for production!** 🚀
