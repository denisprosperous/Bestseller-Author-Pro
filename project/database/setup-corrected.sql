-- =============================================================================
-- BESTSELLER AUTHOR PRO - COMPREHENSIVE DATABASE SCHEMA
-- =============================================================================
-- Complete multi-modal content creation platform supporting:
-- • Text Ebooks (brainstorm, generate, edit, export)
-- • Illustrated Children's Books (characters, pages, illustrations)
-- • Audiobooks (TTS, multi-voice, character mapping, distribution)
-- • Voice Management (cloning, profiles, quality scoring)
-- • Session Management (workflow state persistence)
-- • Image Generation (character consistency, style management)
-- • Audio Production (quality analysis, mastering, export)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =============================================================================
-- CORE USER MANAGEMENT & AUTHENTICATION
-- =============================================================================

-- API Keys table with server-side encryption support
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN (
    'openai', 'anthropic', 'google', 'xai', 'deepseek',
    'elevenlabs', 'azure-speech', 'aws-polly', 'google-cloud',
    'huggingface', 'eden-ai', 'stability-ai'
  )),
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL, -- Initialization vector for AES encryption
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_ai_provider TEXT DEFAULT 'openai',
  default_ai_model TEXT DEFAULT 'gpt-4-turbo',
  default_tts_provider TEXT DEFAULT 'elevenlabs',
  default_image_provider TEXT DEFAULT 'google-vertex',
  preferred_export_formats TEXT[] DEFAULT ARRAY['pdf', 'epub'],
  notification_settings JSONB DEFAULT '{"email": true, "push": false}',
  content_filters JSONB DEFAULT '{"adult_content": false, "violence": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TEXT EBOOKS WORKFLOW
-- =============================================================================

-- Generation sessions for workflow state persistence
CREATE TABLE IF NOT EXISTS generation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT DEFAULT 'ebook' CHECK (session_type IN ('ebook', 'children_book', 'audiobook')),
  brainstorm_data JSONB,
  builder_config JSONB,
  progress JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'error')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ebooks table for content storage
CREATE TABLE IF NOT EXISTS ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES generation_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  topic TEXT,
  description TEXT,
  word_count INTEGER DEFAULT 0,
  chapter_count INTEGER DEFAULT 0,
  tone TEXT,
  custom_tone TEXT,
  audience TEXT,
  genre TEXT,
  language TEXT DEFAULT 'en-US',
  ai_provider TEXT,
  ai_model TEXT,
  outline TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'error', 'published')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared')),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  export_formats JSONB DEFAULT '{}', -- Store export URLs and metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chapters table for structured content
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  summary TEXT,
  ai_provider TEXT,
  ai_model TEXT,
  generation_prompt TEXT,
  is_humanized BOOLEAN DEFAULT false,
  quality_score DECIMAL(3,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ebook_id, chapter_number)
);

-- =============================================================================
-- CHILDREN'S BOOKS WORKFLOW
-- =============================================================================

-- Children's books main table
CREATE TABLE IF NOT EXISTS childrens_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES generation_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  age_group TEXT CHECK (age_group IN ('0-2', '3-5', '6-8', '9-12')),
  theme TEXT,
  illustration_style TEXT,
  page_count INTEGER DEFAULT 12,
  reading_level DECIMAL(3,1),
  educational_elements TEXT[],
  moral_lessons TEXT[],
  language TEXT DEFAULT 'en-US',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'error', 'published')),
  cover_image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Character profiles for children's books
CREATE TABLE IF NOT EXISTS book_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES childrens_books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  personality_traits TEXT[],
  visual_prompt TEXT,
  consistency_prompt TEXT, -- Optimized for character consistency
  reference_images TEXT[], -- URLs to reference images
  color_palette JSONB, -- Character-specific colors
  first_appearance INTEGER, -- Page number
  total_appearances INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pages for children's books
CREATE TABLE IF NOT EXISTS book_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES childrens_books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  text_content TEXT,
  illustration_prompt TEXT,
  illustration_url TEXT,
  illustration_metadata JSONB,
  layout_type TEXT CHECK (layout_type IN ('full-page', 'text-left', 'text-right', 'text-bottom', 'text-top', 'text-overlay')),
  characters_featured UUID[], -- Array of character IDs
  educational_focus TEXT,
  reading_difficulty DECIMAL(3,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, page_number)
);

-- =============================================================================
-- IMAGE GENERATION & MANAGEMENT
-- =============================================================================

-- Image generation tracking and history
CREATE TABLE IF NOT EXISTS image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google-vertex', 'openjourney', 'dreamshaper', 'waifu-diffusion', 'eden-ai', 'dall-e', 'midjourney')),
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT, -- AI-enhanced version of the prompt
  style TEXT,
  aspect_ratio TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  file_size BIGINT,
  generation_time INTEGER, -- milliseconds
  quality_score DECIMAL(3,1),
  cost_credits DECIMAL(10,4), -- Cost in credits/tokens
  metadata JSONB DEFAULT '{}',
  -- Context linking
  book_id UUID REFERENCES childrens_books(id) ON DELETE SET NULL,
  page_id UUID REFERENCES book_pages(id) ON DELETE SET NULL,
  character_id UUID REFERENCES book_characters(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Style presets and templates
CREATE TABLE IF NOT EXISTS illustration_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  style_prompt TEXT NOT NULL,
  negative_prompt TEXT,
  recommended_providers TEXT[],
  age_groups TEXT[],
  sample_images TEXT[],
  popularity_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- VOICE MANAGEMENT & TTS
-- =============================================================================

-- Enhanced voice profiles with quality metrics
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('elevenlabs', 'azure', 'aws-polly', 'google', 'openai', 'custom')),
  voice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'neutral')),
  age_range TEXT CHECK (age_range IN ('child', 'young-adult', 'adult', 'elderly')),
  accent TEXT DEFAULT 'neutral',
  language TEXT DEFAULT 'en-US',
  is_cloned BOOLEAN DEFAULT false,
  original_sample_url TEXT,
  sample_url TEXT,
  characteristics JSONB DEFAULT '{}', -- pitch, speed, tone, clarity, naturalness
  quality_score DECIMAL(3,1),
  usage_count INTEGER DEFAULT 0,
  cost_per_character DECIMAL(10,6),
  is_active BOOLEAN DEFAULT true,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, voice_id)
);

-- Voice cloning jobs tracking
CREATE TABLE IF NOT EXISTS voice_cloning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  original_audio_url TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  voice_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress_percentage INTEGER DEFAULT 0,
  result_voice_id TEXT,
  result_voice_profile_id UUID REFERENCES voice_profiles(id) ON DELETE SET NULL,
  error_message TEXT,
  processing_logs JSONB DEFAULT '[]',
  estimated_completion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TTS voices catalog (system-wide available voices)
CREATE TABLE IF NOT EXISTS tts_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('google', 'resemble', 'elevenlabs', 'openai', 'azure', 'aws-polly')),
  voice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'neutral')),
  age_range TEXT CHECK (age_range IN ('child', 'young-adult', 'adult', 'elderly')),
  language TEXT DEFAULT 'en-US',
  accent TEXT DEFAULT 'neutral',
  sample_url TEXT,
  quality_rating DECIMAL(3,1),
  is_premium BOOLEAN DEFAULT false,
  cost_tier TEXT CHECK (cost_tier IN ('free', 'standard', 'premium')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, voice_id)
);

-- =============================================================================
-- AUDIOBOOKS WORKFLOW
-- =============================================================================

-- Audiobooks main table
CREATE TABLE IF NOT EXISTS audiobooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  narrator_name TEXT,
  voice_provider TEXT DEFAULT 'elevenlabs',
  primary_voice_id TEXT,
  voice_settings JSONB DEFAULT '{}', -- speed, pitch, etc.
  is_multi_voice BOOLEAN DEFAULT false,
  total_duration INTEGER DEFAULT 0, -- in seconds
  total_file_size BIGINT DEFAULT 0,
  chapter_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'generating', 'processing', 'completed', 'error')),
  generation_progress JSONB DEFAULT '{}',
  audio_quality_score DECIMAL(3,1),
  production_settings JSONB DEFAULT '{}',
  distribution_status JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio chapters with enhanced metadata
CREATE TABLE IF NOT EXISTS audio_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_text TEXT,
  audio_url TEXT,
  duration INTEGER, -- seconds
  file_size BIGINT,
  voice_segments JSONB DEFAULT '[]', -- array of voice assignments for multi-voice
  chapter_markers JSONB DEFAULT '[]',
  quality_score DECIMAL(3,1),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(audiobook_id, chapter_number)
);

-- Character voice mappings for multi-voice audiobooks
CREATE TABLE IF NOT EXISTS character_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  character_description TEXT,
  voice_profile_id UUID REFERENCES voice_profiles(id),
  voice_provider TEXT,
  voice_id TEXT,
  dialogue_count INTEGER DEFAULT 0,
  first_appearance INTEGER, -- chapter number
  voice_settings JSONB DEFAULT '{}',
  confidence_score DECIMAL(3,1), -- AI confidence in voice assignment
  is_manual_override BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dialogue analysis and character detection
CREATE TABLE IF NOT EXISTS dialogue_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
  audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
  total_dialogue_count INTEGER DEFAULT 0,
  average_dialogue_length DECIMAL(8,2),
  character_count INTEGER DEFAULT 0,
  analysis_data JSONB DEFAULT '{}', -- Full analysis results
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AUDIO PRODUCTION & QUALITY
-- =============================================================================

-- Audio production jobs and processing
CREATE TABLE IF NOT EXISTS audio_production_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
  job_type TEXT CHECK (job_type IN ('generation', 'enhancement', 'normalization', 'mastering', 'export')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress_percentage INTEGER DEFAULT 0,
  input_files TEXT[],
  output_files TEXT[],
  processing_settings JSONB DEFAULT '{}',
  quality_metrics JSONB DEFAULT '{}',
  error_logs JSONB DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio quality analysis results
CREATE TABLE IF NOT EXISTS audio_quality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_chapter_id UUID REFERENCES audio_chapters(id) ON DELETE CASCADE,
  audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
  overall_score DECIMAL(3,1),
  technical_specs JSONB DEFAULT '{}', -- sample rate, bit rate, etc.
  quality_issues JSONB DEFAULT '[]', -- noise, clipping, silence, etc.
  recommendations TEXT[],
  analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- DISTRIBUTION & EXPORT
-- =============================================================================

-- Distribution exports tracking
CREATE TABLE IF NOT EXISTS distribution_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('audible', 'spotify', 'apple-podcasts', 'google-podcasts', 'generic')),
  export_format TEXT NOT NULL,
  export_url TEXT,
  rss_url TEXT, -- For podcast platforms
  metadata JSONB DEFAULT '{}',
  file_size BIGINT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  validation_results JSONB DEFAULT '{}',
  distribution_id TEXT, -- Platform-specific ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export templates and presets
CREATE TABLE IF NOT EXISTS export_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  format_settings JSONB NOT NULL,
  metadata_template JSONB DEFAULT '{}',
  quality_requirements JSONB DEFAULT '{}',
  is_system_template BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ANALYTICS & USAGE TRACKING
-- =============================================================================

-- Usage analytics for billing and optimization
CREATE TABLE IF NOT EXISTS usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('ai_generation', 'tts_generation', 'image_generation', 'voice_cloning', 'export')),
  provider TEXT,
  operation TEXT,
  tokens_used INTEGER,
  characters_processed INTEGER,
  credits_consumed DECIMAL(10,4),
  cost_usd DECIMAL(10,4),
  processing_time INTEGER, -- milliseconds
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content performance metrics
CREATE TABLE IF NOT EXISTS content_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT CHECK (content_type IN ('ebook', 'children_book', 'audiobook')),
  content_id UUID NOT NULL, -- References ebooks, childrens_books, or audiobooks
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  ratings JSONB DEFAULT '[]',
  average_rating DECIMAL(3,2),
  feedback_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COLLABORATION & SHARING
-- =============================================================================

-- Project sharing and collaboration
CREATE TABLE IF NOT EXISTS project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('ebook', 'children_book', 'audiobook')),
  content_id UUID NOT NULL,
  permission_level TEXT CHECK (permission_level IN ('view', 'comment', 'edit')),
  share_token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments and feedback system
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT CHECK (content_type IN ('ebook', 'children_book', 'audiobook', 'chapter', 'page')),
  content_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES content_comments(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general' CHECK (comment_type IN ('general', 'suggestion', 'correction', 'praise')),
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COMPREHENSIVE INDEXING FOR PERFORMANCE
-- =============================================================================

-- API Keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(user_id, is_active);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Generation sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON generation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON generation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON generation_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON generation_sessions(session_type);

-- Ebooks indexes
CREATE INDEX IF NOT EXISTS idx_ebooks_user_id ON ebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_status ON ebooks(status);
CREATE INDEX IF NOT EXISTS idx_ebooks_created_at ON ebooks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ebooks_visibility ON ebooks(visibility);
CREATE INDEX IF NOT EXISTS idx_ebooks_genre ON ebooks(genre);
CREATE INDEX IF NOT EXISTS idx_ebooks_language ON ebooks(language);
CREATE INDEX IF NOT EXISTS idx_ebooks_tags ON ebooks USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ebooks_search ON ebooks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Chapters indexes
CREATE INDEX IF NOT EXISTS idx_chapters_ebook_id ON chapters(ebook_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(ebook_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_chapters_quality ON chapters(quality_score);

-- Children's books indexes
CREATE INDEX IF NOT EXISTS idx_childrens_books_user_id ON childrens_books(user_id);
CREATE INDEX IF NOT EXISTS idx_childrens_books_age_group ON childrens_books(age_group);
CREATE INDEX IF NOT EXISTS idx_childrens_books_status ON childrens_books(status);
CREATE INDEX IF NOT EXISTS idx_childrens_books_created_at ON childrens_books(created_at DESC);

-- Book characters indexes
CREATE INDEX IF NOT EXISTS idx_book_characters_book_id ON book_characters(book_id);
CREATE INDEX IF NOT EXISTS idx_book_characters_name ON book_characters(name);

-- Book pages indexes
CREATE INDEX IF NOT EXISTS idx_book_pages_book_id ON book_pages(book_id);
CREATE INDEX IF NOT EXISTS idx_book_pages_number ON book_pages(book_id, page_number);

-- Image generation indexes
CREATE INDEX IF NOT EXISTS idx_images_user_id ON image_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_images_provider ON image_generations(provider);
CREATE INDEX IF NOT EXISTS idx_images_book_id ON image_generations(book_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON image_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_quality ON image_generations(quality_score);

-- Voice profiles indexes
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_id ON voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_provider ON voice_profiles(provider);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_active ON voice_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_quality ON voice_profiles(quality_score);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_language ON voice_profiles(language);

-- Voice cloning jobs indexes
CREATE INDEX IF NOT EXISTS idx_voice_cloning_user ON voice_cloning_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_cloning_status ON voice_cloning_jobs(status);

-- TTS voices indexes
CREATE INDEX IF NOT EXISTS idx_tts_voices_provider ON tts_voices(provider);
CREATE INDEX IF NOT EXISTS idx_tts_voices_language ON tts_voices(language);
CREATE INDEX IF NOT EXISTS idx_tts_voices_active ON tts_voices(is_active);

-- Audiobooks indexes
CREATE INDEX IF NOT EXISTS idx_audiobooks_user_id ON audiobooks(user_id);
CREATE INDEX IF NOT EXISTS idx_audiobooks_source ON audiobooks(source_ebook_id);
CREATE INDEX IF NOT EXISTS idx_audiobooks_status ON audiobooks(status);
CREATE INDEX IF NOT EXISTS idx_audiobooks_created_at ON audiobooks(created_at DESC);

-- Audio chapters indexes
CREATE INDEX IF NOT EXISTS idx_audio_chapters_audiobook ON audio_chapters(audiobook_id);
CREATE INDEX IF NOT EXISTS idx_audio_chapters_number ON audio_chapters(audiobook_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_audio_chapters_status ON audio_chapters(processing_status);

-- Character voices indexes
CREATE INDEX IF NOT EXISTS idx_character_voices_audiobook ON character_voices(audiobook_id);
CREATE INDEX IF NOT EXISTS idx_character_voices_profile ON character_voices(voice_profile_id);

-- Distribution exports indexes
CREATE INDEX IF NOT EXISTS idx_distribution_audiobook ON distribution_exports(audiobook_id);
CREATE INDEX IF NOT EXISTS idx_distribution_platform ON distribution_exports(platform);
CREATE INDEX IF NOT EXISTS idx_distribution_status ON distribution_exports(status);

-- Usage analytics indexes
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_resource_type ON usage_analytics(resource_type);
CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage_analytics(created_at DESC);

-- Content metrics indexes
CREATE INDEX IF NOT EXISTS idx_content_metrics_content ON content_metrics(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_metrics_user ON content_metrics(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE childrens_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_cloning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiobooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE dialogue_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_production_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage own sessions" ON generation_sessions;
DROP POLICY IF EXISTS "Users can view own ebooks" ON ebooks;
DROP POLICY IF EXISTS "Users can insert own ebooks" ON ebooks;
DROP POLICY IF EXISTS "Users can update own ebooks" ON ebooks;
DROP POLICY IF EXISTS "Users can delete own ebooks" ON ebooks;
DROP POLICY IF EXISTS "Users can view own chapters" ON chapters;
DROP POLICY IF EXISTS "Users can insert own chapters" ON chapters;
DROP POLICY IF EXISTS "Users can update own chapters" ON chapters;
DROP POLICY IF EXISTS "Users can delete own chapters" ON chapters;

-- API Keys policies
CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Generation sessions policies
CREATE POLICY "Users can manage own sessions" ON generation_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Ebooks policies
CREATE POLICY "Users can view own ebooks" ON ebooks
  FOR SELECT USING (auth.uid() = user_id OR visibility = 'public');

CREATE POLICY "Users can insert own ebooks" ON ebooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ebooks" ON ebooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ebooks" ON ebooks
  FOR DELETE USING (auth.uid() = user_id);

-- Chapters policies (access through ebook ownership)
CREATE POLICY "Users can view own chapters" ON chapters
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM ebooks WHERE id = ebook_id));

CREATE POLICY "Users can insert own chapters" ON chapters
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM ebooks WHERE id = ebook_id));

CREATE POLICY "Users can update own chapters" ON chapters
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM ebooks WHERE id = ebook_id));

CREATE POLICY "Users can delete own chapters" ON chapters
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM ebooks WHERE id = ebook_id));

-- Children's books policies
CREATE POLICY "Users can manage own children's books" ON childrens_books
  FOR ALL USING (auth.uid() = user_id);

-- Book characters policies (access through book ownership)
CREATE POLICY "Users can manage book characters for own books" ON book_characters
  FOR ALL USING (auth.uid() = (SELECT user_id FROM childrens_books WHERE id = book_id));

-- Book pages policies (access through book ownership)
CREATE POLICY "Users can manage book pages for own books" ON book_pages
  FOR ALL USING (auth.uid() = (SELECT user_id FROM childrens_books WHERE id = book_id));

-- Image generations policies
CREATE POLICY "Users can manage own images" ON image_generations
  FOR ALL USING (auth.uid() = user_id);

-- Voice profiles policies
CREATE POLICY "Users can manage own voice profiles" ON voice_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Voice cloning jobs policies
CREATE POLICY "Users can manage own voice cloning jobs" ON voice_cloning_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Audiobooks policies
CREATE POLICY "Users can manage own audiobooks" ON audiobooks
  FOR ALL USING (auth.uid() = user_id);

-- Audio chapters policies (access through audiobook ownership)
CREATE POLICY "Users can manage audio chapters for own audiobooks" ON audio_chapters
  FOR ALL USING (auth.uid() = (SELECT user_id FROM audiobooks WHERE id = audiobook_id));

-- Character voices policies (access through audiobook ownership)
CREATE POLICY "Users can manage character voices for own audiobooks" ON character_voices
  FOR ALL USING (auth.uid() = (SELECT user_id FROM audiobooks WHERE id = audiobook_id));

-- Dialogue analysis policies (access through ebook/audiobook ownership)
CREATE POLICY "Users can manage dialogue analysis for own content" ON dialogue_analysis
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM ebooks WHERE id = ebook_id) OR
    auth.uid() = (SELECT user_id FROM audiobooks WHERE id = audiobook_id)
  );

-- Audio production jobs policies (access through audiobook ownership)
CREATE POLICY "Users can manage audio production for own audiobooks" ON audio_production_jobs
  FOR ALL USING (auth.uid() = (SELECT user_id FROM audiobooks WHERE id = audiobook_id));

-- Audio quality reports policies (access through audiobook ownership)
CREATE POLICY "Users can view audio quality for own audiobooks" ON audio_quality_reports
  FOR ALL USING (auth.uid() = (SELECT user_id FROM audiobooks WHERE id = audiobook_id));

-- Distribution exports policies (access through audiobook ownership)
CREATE POLICY "Users can manage exports for own audiobooks" ON distribution_exports
  FOR ALL USING (auth.uid() = (SELECT user_id FROM audiobooks WHERE id = audiobook_id));

-- Usage analytics policies
CREATE POLICY "Users can view own usage analytics" ON usage_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Content metrics policies
CREATE POLICY "Users can view metrics for own content" ON content_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Project shares policies
CREATE POLICY "Users can manage own project shares" ON project_shares
  FOR ALL USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);

-- Content comments policies
CREATE POLICY "Users can manage comments on accessible content" ON content_comments
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =============================================================================

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_generation_sessions_updated_at ON generation_sessions;
CREATE TRIGGER update_generation_sessions_updated_at 
  BEFORE UPDATE ON generation_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ebooks_updated_at ON ebooks;
CREATE TRIGGER update_ebooks_updated_at 
  BEFORE UPDATE ON ebooks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
CREATE TRIGGER update_chapters_updated_at 
  BEFORE UPDATE ON chapters 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_childrens_books_updated_at ON childrens_books;
CREATE TRIGGER update_childrens_books_updated_at 
  BEFORE UPDATE ON childrens_books 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_profiles_updated_at ON voice_profiles;
CREATE TRIGGER update_voice_profiles_updated_at 
  BEFORE UPDATE ON voice_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_cloning_jobs_updated_at ON voice_cloning_jobs;
CREATE TRIGGER update_voice_cloning_jobs_updated_at 
  BEFORE UPDATE ON voice_cloning_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_audiobooks_updated_at ON audiobooks;
CREATE TRIGGER update_audiobooks_updated_at 
  BEFORE UPDATE ON audiobooks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_audio_chapters_updated_at ON audio_chapters;
CREATE TRIGGER update_audio_chapters_updated_at 
  BEFORE UPDATE ON audio_chapters 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_distribution_exports_updated_at ON distribution_exports;
CREATE TRIGGER update_distribution_exports_updated_at 
  BEFORE UPDATE ON distribution_exports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_metrics_updated_at ON content_metrics;
CREATE TRIGGER update_content_metrics_updated_at 
  BEFORE UPDATE ON content_metrics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_comments_updated_at ON content_comments;
CREATE TRIGGER update_content_comments_updated_at 
  BEFORE UPDATE ON content_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Session cleanup function (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM generation_sessions 
  WHERE status = 'active' AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Content statistics function
CREATE OR REPLACE FUNCTION get_user_content_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'ebooks', (SELECT COUNT(*) FROM ebooks WHERE user_id = user_uuid),
    'childrens_books', (SELECT COUNT(*) FROM childrens_books WHERE user_id = user_uuid),
    'audiobooks', (SELECT COUNT(*) FROM audiobooks WHERE user_id = user_uuid),
    'total_words', (SELECT COALESCE(SUM(word_count), 0) FROM ebooks WHERE user_id = user_uuid),
    'total_audio_duration', (SELECT COALESCE(SUM(total_duration), 0) FROM audiobooks WHERE user_id = user_uuid),
    'voice_profiles', (SELECT COUNT(*) FROM voice_profiles WHERE user_id = user_uuid),
    'images_generated', (SELECT COUNT(*) FROM image_generations WHERE user_id = user_uuid)
  ) INTO stats;
  
  RETURN stats;
END;
$$ language 'plpgsql';

-- =============================================================================
-- INITIAL DATA SEEDING
-- =============================================================================

-- Insert default illustration styles
INSERT INTO illustration_styles (name, description, style_prompt, age_groups, recommended_providers) VALUES
  ('Cartoon', 'Bright, colorful cartoon style perfect for young children', 'cartoon style, bright colors, simple shapes, child-friendly, cheerful', ARRAY['0-2', '3-5', '6-8'], ARRAY['google-vertex', 'dall-e']),
  ('Watercolor', 'Soft watercolor painting style with gentle colors', 'watercolor painting, soft colors, artistic, flowing, gentle brushstrokes', ARRAY['3-5', '6-8', '9-12'], ARRAY['google-vertex', 'midjourney']),
  ('Digital Art', 'Modern digital illustration with clean lines', 'digital art, clean lines, vibrant colors, modern illustration', ARRAY['6-8', '9-12'], ARRAY['dall-e', 'midjourney']),
  ('Hand Drawn', 'Traditional hand-drawn illustration style', 'hand drawn illustration, pencil sketch, traditional art, detailed', ARRAY['6-8', '9-12'], ARRAY['midjourney', 'dall-e']),
  ('Minimalist', 'Simple, clean minimalist style', 'minimalist illustration, simple shapes, clean design, geometric', ARRAY['3-5', '6-8'], ARRAY['google-vertex', 'dall-e'])
ON CONFLICT (name) DO NOTHING;

-- Insert default TTS voices for Google Cloud Text-to-Speech
INSERT INTO tts_voices (provider, voice_id, name, gender, age_range, language, quality_rating, cost_tier) VALUES
  ('google', 'en-US-Standard-A', 'Google Standard A (Female)', 'female', 'adult', 'en-US', 7.0, 'standard'),
  ('google', 'en-US-Standard-B', 'Google Standard B (Male)', 'male', 'adult', 'en-US', 7.0, 'standard'),
  ('google', 'en-US-Standard-C', 'Google Standard C (Female)', 'female', 'adult', 'en-US', 7.0, 'standard'),
  ('google', 'en-US-Standard-D', 'Google Standard D (Male)', 'male', 'adult', 'en-US', 7.0, 'standard'),
  ('google', 'en-US-Wavenet-A', 'Google Wavenet A (Female)', 'female', 'adult', 'en-US', 8.5, 'premium'),
  ('google', 'en-US-Wavenet-B', 'Google Wavenet B (Male)', 'male', 'adult', 'en-US', 8.5, 'premium'),
  ('google', 'en-US-Neural2-A', 'Google Neural2 A (Female)', 'female', 'adult', 'en-US', 9.0, 'premium'),
  ('google', 'en-US-Neural2-C', 'Google Neural2 C (Male)', 'male', 'adult', 'en-US', 9.0, 'premium'),
  ('elevenlabs', 'rachel', 'Rachel (Professional Female)', 'female', 'adult', 'en-US', 9.5, 'premium'),
  ('elevenlabs', 'drew', 'Drew (Confident Male)', 'male', 'adult', 'en-US', 9.5, 'premium'),
  ('elevenlabs', 'clyde', 'Clyde (Warm Male)', 'male', 'adult', 'en-US', 9.0, 'premium'),
  ('elevenlabs', 'bella', 'Bella (Expressive Female)', 'female', 'young-adult', 'en-US', 9.0, 'premium'),
  ('openai', 'alloy', 'OpenAI Alloy (Neutral)', 'neutral', 'adult', 'en-US', 8.5, 'premium'),
  ('openai', 'echo', 'OpenAI Echo (Male)', 'male', 'adult', 'en-US', 8.5, 'premium'),
  ('openai', 'fable', 'OpenAI Fable (Female)', 'female', 'adult', 'en-US', 8.5, 'premium'),
  ('openai', 'onyx', 'OpenAI Onyx (Male)', 'male', 'adult', 'en-US', 8.5, 'premium'),
  ('openai', 'nova', 'OpenAI Nova (Female)', 'female', 'young-adult', 'en-US', 8.5, 'premium'),
  ('openai', 'shimmer', 'OpenAI Shimmer (Female)', 'female', 'adult', 'en-US', 8.5, 'premium')
ON CONFLICT (provider, voice_id) DO NOTHING;

-- Insert default export templates
INSERT INTO export_templates (name, platform, format_settings, metadata_template, quality_requirements, is_system_template) VALUES
  ('Audible ACX Standard', 'audible', 
   '{"format": "MP3", "bitrate": 128, "sample_rate": 44100, "channels": 2}',
   '{"title": "", "author": "", "narrator": "", "description": "", "genre": "", "language": "en-US", "copyright": "", "isbn": ""}',
   '{"min_bitrate": 64, "max_bitrate": 320, "min_sample_rate": 22050, "max_file_size": 1073741824}',
   true),
  ('Spotify Podcast', 'spotify',
   '{"format": "MP3", "bitrate": 128, "sample_rate": 44100, "channels": 2}',
   '{"title": "", "description": "", "category": "Arts", "language": "en", "explicit": false}',
   '{"min_bitrate": 96, "max_bitrate": 320, "min_sample_rate": 44100}',
   true),
  ('Generic MP3', 'generic',
   '{"format": "MP3", "bitrate": 192, "sample_rate": 44100, "channels": 2}',
   '{"title": "", "artist": "", "album": "", "year": "", "genre": ""}',
   '{"min_bitrate": 128, "max_bitrate": 320}',
   true)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'BESTSELLER AUTHOR PRO - COMPREHENSIVE DATABASE SCHEMA SETUP COMPLETED!';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Successfully created comprehensive multi-modal content creation database:';
  RAISE NOTICE '';
  RAISE NOTICE '📚 TEXT EBOOKS:';
  RAISE NOTICE '   • ebooks, chapters, generation_sessions tables';
  RAISE NOTICE '   • Full workflow state persistence';
  RAISE NOTICE '   • Content search and analytics';
  RAISE NOTICE '';
  RAISE NOTICE '🎨 CHILDREN''S BOOKS:';
  RAISE NOTICE '   • childrens_books, book_characters, book_pages tables';
  RAISE NOTICE '   • Character consistency and illustration management';
  RAISE NOTICE '   • Age-appropriate content filtering';
  RAISE NOTICE '';
  RAISE NOTICE '🎧 AUDIOBOOKS:';
  RAISE NOTICE '   • audiobooks, audio_chapters, character_voices tables';
  RAISE NOTICE '   • Multi-voice support with character mapping';
  RAISE NOTICE '   • Audio quality analysis and production tracking';
  RAISE NOTICE '';
  RAISE NOTICE '🎤 VOICE MANAGEMENT:';
  RAISE NOTICE '   • voice_profiles, voice_cloning_jobs, tts_voices tables';
  RAISE NOTICE '   • Quality scoring and usage analytics';
  RAISE NOTICE '   • Custom voice cloning workflow';
  RAISE NOTICE '';
  RAISE NOTICE '🖼️ IMAGE GENERATION:';
  RAISE NOTICE '   • image_generations, illustration_styles tables';
  RAISE NOTICE '   • Character consistency across illustrations';
  RAISE NOTICE '   • Style templates and quality tracking';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ANALYTICS & DISTRIBUTION:';
  RAISE NOTICE '   • usage_analytics, content_metrics tables';
  RAISE NOTICE '   • distribution_exports, export_templates tables';
  RAISE NOTICE '   • Platform-specific export optimization';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SECURITY & COLLABORATION:';
  RAISE NOTICE '   • Comprehensive Row Level Security (RLS) policies';
  RAISE NOTICE '   • project_shares, content_comments tables';
  RAISE NOTICE '   • Encrypted API key storage';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ PERFORMANCE OPTIMIZATIONS:';
  RAISE NOTICE '   • 50+ strategic indexes for fast queries';
  RAISE NOTICE '   • Full-text search capabilities';
  RAISE NOTICE '   • Automatic timestamp updates';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 READY FOR PRODUCTION:';
  RAISE NOTICE '   • All application workflows supported';
  RAISE NOTICE '   • Scalable architecture for growth';
  RAISE NOTICE '   • Complete data integrity and security';
  RAISE NOTICE '=============================================================================';
END $$;