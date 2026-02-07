-- ============================================================================
-- Bestseller Author Pro Database Schema
-- ERROR-FREE • RERUN-SAFE • SUPABASE-COMPATIBLE
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DROP POLICIES SAFELY (avoid conflicts)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'api_keys') THEN
    DROP POLICY IF EXISTS "Users can manage own API keys" ON api_keys;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ebooks') THEN
    DROP POLICY IF EXISTS "Users can view own ebooks" ON ebooks;
    DROP POLICY IF EXISTS "Users can insert own ebooks" ON ebooks;
    DROP POLICY IF EXISTS "Users can update own ebooks" ON ebooks;
    DROP POLICY IF EXISTS "Users can delete own ebooks" ON ebooks;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'chapters') THEN
    DROP POLICY IF EXISTS "Users can view own chapters" ON chapters;
    DROP POLICY IF EXISTS "Users can insert own chapters" ON chapters;
    DROP POLICY IF EXISTS "Users can update own chapters" ON chapters;
    DROP POLICY IF EXISTS "Users can delete own chapters" ON chapters;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'generation_sessions') THEN
    DROP POLICY IF EXISTS "Users can view own sessions" ON generation_sessions;
    DROP POLICY IF EXISTS "Users can insert own sessions" ON generation_sessions;
    DROP POLICY IF EXISTS "Users can update own sessions" ON generation_sessions;
    DROP POLICY IF EXISTS "Users can delete own sessions" ON generation_sessions;
  END IF;
END $$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

-- Ebooks
CREATE TABLE IF NOT EXISTS ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  topic TEXT,
  word_count INTEGER DEFAULT 0,
  tone TEXT,
  custom_tone TEXT,
  audience TEXT,
  ai_provider TEXT,
  ai_model TEXT,
  outline TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'generating', 'completed', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ebook_id, chapter_number)
);

-- Generation Sessions
CREATE TABLE IF NOT EXISTS generation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brainstorm_data JSONB,
  builder_config JSONB,
  progress JSONB,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES (SAFE)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(user_id, provider);

CREATE INDEX IF NOT EXISTS idx_ebooks_user_id ON ebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_status ON ebooks(status);
CREATE INDEX IF NOT EXISTS idx_ebooks_created_at ON ebooks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chapters_ebook_id ON chapters(ebook_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(ebook_id, chapter_number);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON generation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON generation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON generation_sessions(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

CREATE POLICY "Users can manage own API keys"
ON api_keys
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own ebooks"
ON ebooks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ebooks"
ON ebooks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ebooks"
ON ebooks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ebooks"
ON ebooks
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chapters"
ON chapters
FOR SELECT
USING (
  auth.uid() = (SELECT user_id FROM ebooks WHERE ebooks.id = chapters.ebook_id)
);

CREATE POLICY "Users can insert own chapters"
ON chapters
FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM ebooks WHERE ebooks.id = chapters.ebook_id)
);

CREATE POLICY "Users can update own chapters"
ON chapters
FOR UPDATE
USING (
  auth.uid() = (SELECT user_id FROM ebooks WHERE ebooks.id = chapters.ebook_id)
);

CREATE POLICY "Users can delete own chapters"
ON chapters
FOR DELETE
USING (
  auth.uid() = (SELECT user_id FROM ebooks WHERE ebooks.id = chapters.ebook_id)
);

CREATE POLICY "Users can view own sessions"
ON generation_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON generation_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON generation_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON generation_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS (FIXED: DROP IF EXISTS)
-- ============================================================================

DROP TRIGGER IF EXISTS trg_api_keys_updated ON api_keys;
CREATE TRIGGER trg_api_keys_updated
BEFORE UPDATE ON api_keys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ebooks_updated ON ebooks;
CREATE TRIGGER trg_ebooks_updated
BEFORE UPDATE ON ebooks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SESSION CLEANUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS VOID AS $$
BEGIN
  DELETE FROM generation_sessions
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS CONFIRMATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Bestseller Author Pro database schema setup completed successfully.';
  RAISE NOTICE 'Tables: api_keys, ebooks, chapters, generation_sessions';
  RAISE NOTICE 'RLS, indexes, triggers applied safely.';
END $$;
