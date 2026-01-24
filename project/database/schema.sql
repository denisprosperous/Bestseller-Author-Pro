-- Bestseller Author Pro Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- API Keys table with server-side encryption support
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL, -- Initialization vector for AES encryption
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- RLS for API keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only access their own API keys
CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Index for API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(user_id, provider);

-- Auto-update trigger for API keys
CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ebooks table for content storage
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
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'error')),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ebook_id, chapter_number)
);

-- Generation sessions for workflow state persistence
CREATE TABLE IF NOT EXISTS generation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brainstorm_data JSONB,
  builder_config JSONB,
  progress JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ebooks_user_id ON ebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_status ON ebooks(status);
CREATE INDEX IF NOT EXISTS idx_ebooks_created_at ON ebooks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_ebook_id ON chapters(ebook_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(ebook_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON generation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON generation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON generation_sessions(expires_at);

-- Row Level Security policies
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own ebooks
CREATE POLICY "Users can view own ebooks" ON ebooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ebooks" ON ebooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ebooks" ON ebooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ebooks" ON ebooks
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only access chapters of their own ebooks
CREATE POLICY "Users can view own chapters" ON chapters
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM ebooks WHERE id = ebook_id));

CREATE POLICY "Users can insert own chapters" ON chapters
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM ebooks WHERE id = ebook_id));

CREATE POLICY "Users can update own chapters" ON chapters
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM ebooks WHERE id = ebook_id));

CREATE POLICY "Users can delete own chapters" ON chapters
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM ebooks WHERE id = ebook_id));

-- Users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON generation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON generation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON generation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON generation_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ebooks_updated_at 
  BEFORE UPDATE ON ebooks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Session cleanup function (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM generation_sessions 
  WHERE status = 'active' AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Optional: Create a scheduled job to cleanup expired sessions
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');

-- ============================================================================
-- PHASE 2 & 3 EXTENSIONS: Text-to-Speech and Image Generation
-- ============================================================================

-- Text-to-Speech voices configuration
CREATE TABLE IF NOT EXISTS tts_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('google', 'resemble', 'elevenlabs', 'openai')),
  voice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'neutral')),
  language TEXT DEFAULT 'en-US',
  sample_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, voice_id)
);

-- Audiobooks table for TTS generation
CREATE TABLE IF NOT EXISTS audiobooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  voice_provider TEXT DEFAULT 'google',
  voice_id TEXT,
  voice_settings JSONB DEFAULT '{}', -- speed, pitch, etc.
  total_duration INTEGER DEFAULT 0, -- in seconds
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'error')),
  audio_files JSONB DEFAULT '[]', -- array of chapter audio file URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image generation tracking
CREATE TABLE IF NOT EXISTS image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google-vertex', 'openjourney', 'dreamshaper', 'waifu-diffusion')),
  prompt TEXT NOT NULL,
  style TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Children's books extension (Phase 3)
CREATE TABLE IF NOT EXISTS childrens_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  age_group TEXT CHECK (age_group IN ('0-3', '4-7', '8-12')),
  illustration_style TEXT DEFAULT 'cartoon',
  page_count INTEGER DEFAULT 12,
  reading_level DECIMAL(3,1),
  characters JSONB DEFAULT '[]',
  pages JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE audiobooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE childrens_books ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audiobooks
CREATE POLICY "Users can manage own audiobooks" ON audiobooks
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for image_generations
CREATE POLICY "Users can manage own images" ON image_generations
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for childrens_books
CREATE POLICY "Users can manage own children's books" ON childrens_books
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_audiobooks_user_id ON audiobooks(user_id);
CREATE INDEX IF NOT EXISTS idx_audiobooks_source ON audiobooks(source_ebook_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON image_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_childrens_books_user_id ON childrens_books(user_id);

-- Auto-update triggers for new tables
CREATE TRIGGER update_audiobooks_updated_at 
  BEFORE UPDATE ON audiobooks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_childrens_books_updated_at 
  BEFORE UPDATE ON childrens_books 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUDIOBOOK EXPANSION: Enhanced Database Schema
-- ============================================================================

-- Enhanced audiobooks table with additional fields
ALTER TABLE audiobooks ADD COLUMN IF NOT EXISTS narrator_name TEXT;
ALTER TABLE audiobooks ADD COLUMN IF NOT EXISTS production_settings JSONB DEFAULT '{}';
ALTER TABLE audiobooks ADD COLUMN IF NOT EXISTS distribution_status JSONB DEFAULT '{}';
ALTER TABLE audiobooks ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,1);

-- Voice profiles table for enhanced voice management
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('elevenlabs', 'azure', 'aws-polly', 'google', 'custom')),
  voice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'neutral')),
  age_range TEXT CHECK (age_range IN ('child', 'young-adult', 'adult', 'elderly')),
  accent TEXT DEFAULT 'neutral',
  language TEXT DEFAULT 'en-US',
  is_cloned BOOLEAN DEFAULT false,
  original_sample_url TEXT,
  characteristics JSONB DEFAULT '{}',
  quality_score DECIMAL(3,1),
  sample_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Character voice mappings for multi-voice support
CREATE TABLE IF NOT EXISTS character_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  character_description TEXT,
  voice_profile_id UUID REFERENCES voice_profiles(id),
  dialogue_count INTEGER DEFAULT 0,
  first_appearance INTEGER, -- chapter number
  voice_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  voice_segments JSONB DEFAULT '[]', -- array of voice assignments
  chapter_markers JSONB DEFAULT '[]',
  quality_score DECIMAL(3,1),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice cloning jobs tracking
CREATE TABLE IF NOT EXISTS voice_cloning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  original_audio_url TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress_percentage INTEGER DEFAULT 0,
  result_voice_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Distribution exports tracking
CREATE TABLE IF NOT EXISTS distribution_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id UUID REFERENCES audiobooks(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('audible', 'spotify', 'generic')),
  export_format TEXT NOT NULL,
  export_url TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for new tables
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_cloning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_exports ENABLE ROW LEVEL SECURITY;

-- Voice profiles policies
CREATE POLICY "Users can manage own voice profiles" ON voice_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Character voices policies (access through audiobook ownership)
CREATE POLICY "Users can manage character voices for own audiobooks" ON character_voices
  FOR ALL USING (auth.uid() = (SELECT user_id FROM audiobooks WHERE id = audiobook_id));

-- Audio chapters policies (access through audiobook ownership)
CREATE POLICY "Users can manage audio chapters for own audiobooks" ON audio_chapters
  FOR ALL USING (auth.uid() = (SELECT user_id FROM audiobooks WHERE id = audiobook_id));

-- Voice cloning jobs policies
CREATE POLICY "Users can manage own voice cloning jobs" ON voice_cloning_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Distribution exports policies (access through audiobook ownership)
CREATE POLICY "Users can manage exports for own audiobooks" ON distribution_exports
  FOR ALL USING (auth.uid() = (SELECT user_id FROM audiobooks WHERE id = audiobook_id));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_id ON voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_provider ON voice_profiles(provider);
CREATE INDEX IF NOT EXISTS idx_character_voices_audiobook ON character_voices(audiobook_id);
CREATE INDEX IF NOT EXISTS idx_audio_chapters_audiobook ON audio_chapters(audiobook_id);
CREATE INDEX IF NOT EXISTS idx_audio_chapters_number ON audio_chapters(audiobook_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_voice_cloning_user ON voice_cloning_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_distribution_audiobook ON distribution_exports(audiobook_id);

-- Auto-update triggers
CREATE TRIGGER update_voice_profiles_updated_at 
  BEFORE UPDATE ON voice_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_chapters_updated_at 
  BEFORE UPDATE ON audio_chapters 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_cloning_jobs_updated_at 
  BEFORE UPDATE ON voice_cloning_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default TTS voices for Google Cloud Text-to-Speech
INSERT INTO tts_voices (provider, voice_id, name, gender, language) VALUES
  ('google', 'en-US-Standard-A', 'Google Standard A (Female)', 'female', 'en-US'),
  ('google', 'en-US-Standard-B', 'Google Standard B (Male)', 'male', 'en-US'),
  ('google', 'en-US-Standard-C', 'Google Standard C (Female)', 'female', 'en-US'),
  ('google', 'en-US-Standard-D', 'Google Standard D (Male)', 'male', 'en-US'),
  ('google', 'en-US-Wavenet-A', 'Google Wavenet A (Female)', 'female', 'en-US'),
  ('google', 'en-US-Wavenet-B', 'Google Wavenet B (Male)', 'male', 'en-US'),
  ('google', 'en-US-Neural2-A', 'Google Neural2 A (Female)', 'female', 'en-US'),
  ('google', 'en-US-Neural2-C', 'Google Neural2 C (Male)', 'male', 'en-US')
ON CONFLICT (provider, voice_id) DO NOTHING;

-- Insert enhanced voice profiles for multiple providers
INSERT INTO voice_profiles (user_id, provider, voice_id, name, gender, age_range, accent, language, characteristics, quality_score, sample_url) VALUES
  -- ElevenLabs voices (premium quality)
  (NULL, 'elevenlabs', 'rachel', 'Rachel (Professional Female)', 'female', 'adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "professional", "clarity": 9, "naturalness": 9}', 9.0, 'https://api.elevenlabs.io/v1/voices/rachel/preview'),
  (NULL, 'elevenlabs', 'drew', 'Drew (Confident Male)', 'male', 'adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "confident", "clarity": 9, "naturalness": 9}', 9.0, 'https://api.elevenlabs.io/v1/voices/drew/preview'),
  (NULL, 'elevenlabs', 'clyde', 'Clyde (Warm Male)', 'male', 'adult', 'american', '{"pitch": "low", "speed": "medium", "tone": "warm", "clarity": 8, "naturalness": 9}', 8.5, 'https://api.elevenlabs.io/v1/voices/clyde/preview'),
  (NULL, 'elevenlabs', 'bella', 'Bella (Expressive Female)', 'female', 'young-adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "expressive", "clarity": 9, "naturalness": 8}', 8.5, 'https://api.elevenlabs.io/v1/voices/bella/preview'),
  
  -- Azure Speech voices (neural quality)
  (NULL, 'azure', 'en-US-JennyNeural', 'Jenny (Friendly Female)', 'female', 'adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "friendly", "clarity": 8, "naturalness": 8}', 8.0, NULL),
  (NULL, 'azure', 'en-US-GuyNeural', 'Guy (Professional Male)', 'male', 'adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "professional", "clarity": 8, "naturalness": 8}', 8.0, NULL),
  (NULL, 'azure', 'en-US-AriaNeural', 'Aria (Conversational Female)', 'female', 'adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "conversational", "clarity": 8, "naturalness": 8}', 8.0, NULL),
  (NULL, 'azure', 'en-US-DavisNeural', 'Davis (Authoritative Male)', 'male', 'adult', 'american', '{"pitch": "low", "speed": "medium", "tone": "authoritative", "clarity": 8, "naturalness": 7}', 7.5, NULL),
  
  -- AWS Polly voices (neural)
  (NULL, 'aws-polly', 'Joanna', 'Joanna (Clear Female)', 'female', 'adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "clear", "clarity": 7, "naturalness": 7}', 7.0, NULL),
  (NULL, 'aws-polly', 'Matthew', 'Matthew (Steady Male)', 'male', 'adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "steady", "clarity": 7, "naturalness": 7}', 7.0, NULL),
  (NULL, 'aws-polly', 'Ivy', 'Ivy (Youthful Female)', 'female', 'young-adult', 'american', '{"pitch": "high", "speed": "medium", "tone": "youthful", "clarity": 7, "naturalness": 6}', 6.5, NULL),
  (NULL, 'aws-polly', 'Justin', 'Justin (Casual Male)', 'male', 'young-adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "casual", "clarity": 7, "naturalness": 6}', 6.5, NULL),
  
  -- Google Cloud TTS voices (enhanced)
  (NULL, 'google', 'en-US-Neural2-A', 'Google Neural A (Premium Female)', 'female', 'adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "neutral", "clarity": 8, "naturalness": 7}', 7.5, NULL),
  (NULL, 'google', 'en-US-Neural2-C', 'Google Neural C (Premium Male)', 'male', 'adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "neutral", "clarity": 8, "naturalness": 7}', 7.5, NULL),
  (NULL, 'google', 'en-US-Studio-M', 'Google Studio M (Expressive Male)', 'male', 'adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "expressive", "clarity": 8, "naturalness": 8}', 8.0, NULL),
  (NULL, 'google', 'en-US-Studio-O', 'Google Studio O (Expressive Female)', 'female', 'adult', 'american', '{"pitch": "medium", "speed": "medium", "tone": "expressive", "clarity": 8, "naturalness": 8}', 8.0, NULL)
ON CONFLICT DO NOTHING;