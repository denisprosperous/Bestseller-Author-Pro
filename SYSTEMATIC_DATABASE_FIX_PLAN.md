# Systematic Database & API Integration Fix Plan

## Current Issues Identified

### 1. **Database Connection**
- ✅ Supabase credentials are configured in `.env`
- ✅ Database schema exists in `project/database/schema.sql`
- ❌ Database tables may not be created in Supabase
- ❌ Routes are falling back to localStorage instead of using database

### 2. **API Key Storage**
- ❌ API keys stored in localStorage (insecure, not persistent across devices)
- ❌ Should be stored in Supabase `api_keys` table with encryption
- ❌ Server-side API route `/api/keys/secure` may not be working

### 3. **Content Storage**
- ❌ Generated ebooks not being saved to database
- ❌ Using demo/mock data instead of real AI-generated content
- ❌ No persistence between sessions

### 4. **Authentication**
- ❌ Using demo user ID instead of real Supabase Auth
- ❌ No login/logout functionality
- ❌ Protected routes not properly enforcing authentication

## Fix Strategy

### Phase 1: Database Setup (IMMEDIATE)
1. Verify Supabase connection
2. Create all required tables using schema.sql
3. Test database connectivity

### Phase 2: API Key Management (HIGH PRIORITY)
1. Fix server-side encryption API route
2. Migrate localStorage keys to database
3. Update API key service to use database first

### Phase 3: Content Persistence (HIGH PRIORITY)
1. Ensure ebooks table exists and is accessible
2. Update content service to save to database
3. Update routes to load from database

### Phase 4: Authentication (MEDIUM PRIORITY)
1. Implement Supabase Auth
2. Add login/logout functionality
3. Update protected routes

### Phase 5: Remove Mock Data (FINAL)
1. Remove all demo mode fallbacks
2. Ensure all routes use real AI APIs
3. Test end-to-end workflow

## Implementation Steps

### Step 1: Test Database Connection
```bash
cd project
node test-supabase.js
```

### Step 2: Create Database Tables
```bash
cd project
node setup-database.js
```

### Step 3: Fix API Routes
- Update `/api/keys/secure` route
- Ensure encryption works server-side
- Test API key storage/retrieval

### Step 4: Update Services
- Fix apiKeyService to prioritize database
- Fix contentService to save to database
- Update sessionService for proper persistence

### Step 5: Update Routes
- Remove localStorage fallbacks
- Use database for all data operations
- Proper error handling

## Success Criteria

- [ ] Database tables created and accessible
- [ ] API keys stored in Supabase (encrypted)
- [ ] Generated ebooks saved to database
- [ ] No localStorage dependencies
- [ ] Real AI API calls working
- [ ] No mock/demo data
- [ ] Proper authentication flow
- [ ] End-to-end workflow functional

## Next Actions

1. Run database setup script
2. Test Supabase connection
3. Fix API key storage
4. Update routes to use database
5. Remove demo mode
