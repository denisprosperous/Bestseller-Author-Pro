-- Corrected schema script: removed CREATE POLICY IF NOT EXISTS and replaced with DROP POLICY IF EXISTS + CREATE POLICY to be idempotent

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SHARED FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- API KEYS
-- ============================================================================
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

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_api_keys_updated ON api_keys;
CREATE TRIGGER trg_api_keys_updated
BEFORE UPDATE ON api_keys
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP POLICY IF EXISTS "Users manage own api keys" ON api_keys;
CREATE POLICY "Users manage own api keys"
ON api_keys FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(user_id, provider);

-- ============================================================================
-- EBOOKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  topic TEXT,
  word_count INT DEFAULT 0,
  tone TEXT,
  custom_tone TEXT,
  audience TEXT,
  ai_provider TEXT,
  ai_model TEXT,
  outline TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','generating','completed','error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_ebooks_updated ON ebooks;
CREATE TRIGGER trg_ebooks_updated
BEFORE UPDATE ON ebooks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP POLICY IF EXISTS "ebooks owner access" ON ebooks;
CREATE POLICY "ebooks owner access"
ON ebooks FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_ebooks_user ON ebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_status ON ebooks(status);

-- ============================================================================
-- CHAPTERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ebook_id, chapter_number)
);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chapters via ebook owner" ON chapters;
CREATE POLICY "chapters via ebook owner"
ON chapters FOR ALL
USING ((SELECT auth.uid()) = (SELECT user_id FROM ebooks WHERE id = ebook_id));

CREATE INDEX IF NOT EXISTS idx_chapters_ebook ON chapters(ebook_id);

-- ============================================================================
-- GENERATION SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS generation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brainstorm_data JSONB,
  builder_config JSONB,
  progress JSONB,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','completed','expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions owner access" ON generation_sessions;
CREATE POLICY "sessions owner access"
ON generation_sessions FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON generation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON generation_sessions(status);

-- ============================================================================
-- TTS VOICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS tts_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT,
  language TEXT DEFAULT 'en-US',
  sample_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider, voice_id)
);

-- ============================================================================
-- AUDIOBOOKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS audiobooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  voice_provider TEXT DEFAULT 'google',
  voice_id TEXT,
  voice_settings JSONB DEFAULT '{}',
  total_duration INT DEFAULT 0,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','generating','completed','error')),
  audio_files JSONB DEFAULT '[]',
  narrator_name TEXT,
  production_settings JSONB DEFAULT '{}',
  distribution_status JSONB DEFAULT '{}',
  quality_score DECIMAL(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audiobooks
ADD COLUMN IF NOT EXISTS source_ebook_id UUID
REFERENCES ebooks(id) ON DELETE CASCADE;

ALTER TABLE audiobooks ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_audiobooks_updated ON audiobooks;
CREATE TRIGGER trg_audiobooks_updated
BEFORE UPDATE ON audiobooks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP POLICY IF EXISTS "audiobooks owner access" ON audiobooks;
CREATE POLICY "audiobooks owner access"
ON audiobooks FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_audiobooks_user ON audiobooks(user_id);
CREATE INDEX IF NOT EXISTS idx_audiobooks_source ON audiobooks(source_ebook_id);

-- ============================================================================
-- IMAGE GENERATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  prompt TEXT NOT NULL,
  style TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "images owner access" ON image_generations;
CREATE POLICY "images owner access"
ON image_generations FOR ALL USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- CHILDREN'S BOOKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS childrens_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  age_group TEXT,
  illustration_style TEXT DEFAULT 'cartoon',
  page_count INT DEFAULT 12,
  reading_level DECIMAL(3,1),
  characters JSONB DEFAULT '[]',
  pages JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE childrens_books ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_children_books_updated ON childrens_books;
CREATE TRIGGER trg_children_books_updated
BEFORE UPDATE ON childrens_books
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP POLICY IF EXISTS "children books owner access" ON childrens_books;
CREATE POLICY "children books owner access"
ON childrens_books FOR ALL USING ((SELECT auth.uid()) = user_id);