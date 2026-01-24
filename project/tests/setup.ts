import { beforeAll, afterAll, vi } from 'vitest';

// Mock environment variables for testing
process.env.SUPABASE_PROJECT_URL = 'https://test.supabase.co';
process.env.SUPABASE_API_KEY = 'test-key';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Mock Supabase for testing
vi.mock('~/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          })),
          single: vi.fn(() => ({
            data: null,
            error: null
          })),
          data: [],
          error: null
        })),
        data: [],
        error: null
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-id' },
            error: null
          })),
          data: [{ id: 'test-id' }],
          error: null
        })),
        data: [{ id: 'test-id' }],
        error: null
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        })),
        data: null,
        error: null
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: null
          })),
          data: null,
          error: null
        })),
        data: null,
        error: null
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({
          data: { path: 'test-path' },
          error: null
        })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://test.com/audio.mp3' }
        }))
      }))
    }
  }
}));

// Mock API key service
vi.mock('~/services/api-key-service', () => ({
  apiKeyService: {
    getApiKey: vi.fn(() => Promise.resolve('test-api-key')),
    saveApiKey: vi.fn(() => Promise.resolve()),
    hasApiKey: vi.fn(() => Promise.resolve(true))
  }
}));

// Mock TTS service
vi.mock('~/services/tts-service', () => ({
  ttsService: {
    generateSpeech: vi.fn(() => Promise.resolve({
      audioUrl: 'https://test.com/generated-audio.mp3',
      duration: 30,
      fileSize: 500000,
      format: 'mp3',
      provider: 'test-provider',
      voiceId: 'test-voice'
    })),
    validateProviderApiKey: vi.fn(() => Promise.resolve(true)),
    getVoiceQualityScore: vi.fn((profile) => {
      // Return different scores based on provider
      const scores = {
        'elevenlabs': 9.0,
        'azure': 8.0,
        'openai': 8.5,
        'aws-polly': 7.0,
        'google': 7.5,
        'resemble': 6.5
      };
      return Promise.resolve(scores[profile.provider] || 7.0);
    }),
    generateChaptersBatch: vi.fn((chapters) => {
      return Promise.resolve(chapters.map((chapter, index) => ({
        audioUrl: `https://test.com/chapter-${index + 1}.mp3`,
        duration: 120,
        fileSize: 1000000,
        format: 'mp3',
        provider: 'test-provider',
        voiceId: 'test-voice'
      })));
    })
  }
}));

// Mock Voice Management service
vi.mock('~/services/voice-management-service', () => ({
  voiceManagementService: {
    getVoiceProfiles: vi.fn(() => Promise.resolve([
      // Create 20+ voices to meet the diversity requirement
      { id: 'voice-1', userId: 'test-user', provider: 'elevenlabs', voiceId: 'test-voice-1', name: 'Test Voice 1', gender: 'female', ageRange: 'adult', accent: 'american', language: 'en-US', qualityScore: 9.0, characteristics: { pitch: 'medium', speed: 'medium', tone: 'friendly', clarity: 9, naturalness: 8 } },
      { id: 'voice-2', userId: 'test-user', provider: 'azure', voiceId: 'test-voice-2', name: 'Test Voice 2', gender: 'male', ageRange: 'young-adult', accent: 'british', language: 'en-GB', qualityScore: 8.0, characteristics: { pitch: 'low', speed: 'fast', tone: 'authoritative', clarity: 7, naturalness: 9 } },
      { id: 'voice-3', userId: 'test-user', provider: 'openai', voiceId: 'test-voice-3', name: 'Test Voice 3', gender: 'female', ageRange: 'child', accent: 'australian', language: 'en-AU', qualityScore: 8.5, characteristics: { pitch: 'high', speed: 'medium', tone: 'warm', clarity: 8, naturalness: 8 } },
      { id: 'voice-4', userId: 'test-user', provider: 'aws-polly', voiceId: 'test-voice-4', name: 'Test Voice 4', gender: 'male', ageRange: 'elderly', accent: 'neutral', language: 'en-US', qualityScore: 7.5, characteristics: { pitch: 'low', speed: 'slow', tone: 'neutral', clarity: 7, naturalness: 7 } },
      { id: 'voice-5', userId: 'test-user', provider: 'google', voiceId: 'test-voice-5', name: 'Test Voice 5', gender: 'neutral', ageRange: 'adult', accent: 'american', language: 'en-US', qualityScore: 7.8, characteristics: { pitch: 'medium', speed: 'medium', tone: 'neutral', clarity: 8, naturalness: 7 } },
      { id: 'voice-6', userId: 'test-user', provider: 'elevenlabs', voiceId: 'test-voice-6', name: 'Test Voice 6', gender: 'male', ageRange: 'adult', accent: 'british', language: 'en-GB', qualityScore: 9.2, characteristics: { pitch: 'medium', speed: 'medium', tone: 'dramatic', clarity: 9, naturalness: 9 } },
      { id: 'voice-7', userId: 'test-user', provider: 'azure', voiceId: 'test-voice-7', name: 'Test Voice 7', gender: 'female', ageRange: 'young-adult', accent: 'american', language: 'en-US', qualityScore: 8.3, characteristics: { pitch: 'high', speed: 'fast', tone: 'friendly', clarity: 8, naturalness: 8 } },
      { id: 'voice-8', userId: 'test-user', provider: 'openai', voiceId: 'test-voice-8', name: 'Test Voice 8', gender: 'male', ageRange: 'child', accent: 'neutral', language: 'en-US', qualityScore: 8.1, characteristics: { pitch: 'high', speed: 'medium', tone: 'warm', clarity: 8, naturalness: 8 } },
      { id: 'voice-9', userId: 'test-user', provider: 'aws-polly', voiceId: 'test-voice-9', name: 'Test Voice 9', gender: 'female', ageRange: 'elderly', accent: 'australian', language: 'en-AU', qualityScore: 7.2, characteristics: { pitch: 'low', speed: 'slow', tone: 'authoritative', clarity: 7, naturalness: 7 } },
      { id: 'voice-10', userId: 'test-user', provider: 'google', voiceId: 'test-voice-10', name: 'Test Voice 10', gender: 'neutral', ageRange: 'young-adult', accent: 'british', language: 'en-GB', qualityScore: 7.9, characteristics: { pitch: 'medium', speed: 'medium', tone: 'neutral', clarity: 8, naturalness: 8 } },
      { id: 'voice-11', userId: 'test-user', provider: 'elevenlabs', voiceId: 'test-voice-11', name: 'Test Voice 11', gender: 'female', ageRange: 'adult', accent: 'neutral', language: 'en-US', qualityScore: 9.1, characteristics: { pitch: 'medium', speed: 'slow', tone: 'warm', clarity: 9, naturalness: 9 } },
      { id: 'voice-12', userId: 'test-user', provider: 'azure', voiceId: 'test-voice-12', name: 'Test Voice 12', gender: 'male', ageRange: 'adult', accent: 'american', language: 'en-US', qualityScore: 8.4, characteristics: { pitch: 'low', speed: 'medium', tone: 'dramatic', clarity: 8, naturalness: 8 } },
      { id: 'voice-13', userId: 'test-user', provider: 'openai', voiceId: 'test-voice-13', name: 'Test Voice 13', gender: 'female', ageRange: 'young-adult', accent: 'british', language: 'en-GB', qualityScore: 8.6, characteristics: { pitch: 'high', speed: 'fast', tone: 'authoritative', clarity: 8, naturalness: 9 } },
      { id: 'voice-14', userId: 'test-user', provider: 'aws-polly', voiceId: 'test-voice-14', name: 'Test Voice 14', gender: 'male', ageRange: 'elderly', accent: 'australian', language: 'en-AU', qualityScore: 7.3, characteristics: { pitch: 'low', speed: 'slow', tone: 'neutral', clarity: 7, naturalness: 7 } },
      { id: 'voice-15', userId: 'test-user', provider: 'google', voiceId: 'test-voice-15', name: 'Test Voice 15', gender: 'neutral', ageRange: 'child', accent: 'american', language: 'en-US', qualityScore: 7.7, characteristics: { pitch: 'high', speed: 'medium', tone: 'friendly', clarity: 8, naturalness: 7 } },
      { id: 'voice-16', userId: 'test-user', provider: 'elevenlabs', voiceId: 'test-voice-16', name: 'Test Voice 16', gender: 'female', ageRange: 'adult', accent: 'british', language: 'en-GB', qualityScore: 9.3, characteristics: { pitch: 'medium', speed: 'medium', tone: 'warm', clarity: 9, naturalness: 9 } },
      { id: 'voice-17', userId: 'test-user', provider: 'azure', voiceId: 'test-voice-17', name: 'Test Voice 17', gender: 'male', ageRange: 'young-adult', accent: 'neutral', language: 'en-US', qualityScore: 8.2, characteristics: { pitch: 'medium', speed: 'fast', tone: 'friendly', clarity: 8, naturalness: 8 } },
      { id: 'voice-18', userId: 'test-user', provider: 'openai', voiceId: 'test-voice-18', name: 'Test Voice 18', gender: 'female', ageRange: 'elderly', accent: 'american', language: 'en-US', qualityScore: 8.0, characteristics: { pitch: 'low', speed: 'slow', tone: 'authoritative', clarity: 8, naturalness: 8 } },
      { id: 'voice-19', userId: 'test-user', provider: 'aws-polly', voiceId: 'test-voice-19', name: 'Test Voice 19', gender: 'neutral', ageRange: 'adult', accent: 'australian', language: 'en-AU', qualityScore: 7.4, characteristics: { pitch: 'medium', speed: 'medium', tone: 'neutral', clarity: 7, naturalness: 7 } },
      { id: 'voice-20', userId: 'test-user', provider: 'google', voiceId: 'test-voice-20', name: 'Test Voice 20', gender: 'male', ageRange: 'child', accent: 'british', language: 'en-GB', qualityScore: 7.6, characteristics: { pitch: 'high', speed: 'medium', tone: 'warm', clarity: 8, naturalness: 7 } }
    ])),
    createVoiceProfile: vi.fn((userId, params) => {
      // Validate required fields
      if (!params.name || params.name.trim().length === 0) {
        throw new Error('Voice name is required');
      }
      if (!params.voiceId || params.voiceId.trim().length === 0) {
        throw new Error('Voice ID is required');
      }
      
      return Promise.resolve({
        id: 'new-voice-id',
        userId,
        provider: params.provider,
        voiceId: params.voiceId,
        name: params.name,
        gender: params.gender,
        ageRange: params.ageRange,
        accent: params.accent,
        language: params.language,
        characteristics: params.characteristics,
        qualityScore: 8.0,
        createdAt: new Date()
      });
    }),
    updateVoiceProfile: vi.fn(() => Promise.resolve()),
    deleteVoiceProfile: vi.fn(() => Promise.resolve()),
    searchVoices: vi.fn(() => Promise.resolve([])),
    initiateVoiceCloning: vi.fn((userId, audioFile, metadata) => Promise.resolve({
      id: 'cloning-job-id',
      userId,
      voiceName: metadata.voiceName,
      status: 'pending',
      progressPercentage: 0,
      createdAt: new Date()
    })),
    getCloningJobStatus: vi.fn(() => Promise.resolve({
      id: 'cloning-job-id',
      status: 'completed',
      progressPercentage: 100,
      resultVoiceId: 'cloned-voice-id'
    }))
  }
}));

// Mock Audio Production service
vi.mock('~/services/audio-production-service', () => ({
  audioProductionService: {
    processChapterAudio: vi.fn((audioUrl, metadata) => Promise.resolve({
      audioUrl: audioUrl.replace('.mp3', '_processed.mp3'),
      duration: metadata.duration,
      qualityScore: 8.5,
      fileSize: metadata.duration * 8000, // Reasonable file size
      chapterMarkers: [{
        title: metadata.title,
        startTime: 0,
        endTime: metadata.duration
      }]
    })),
    normalizeAudioLevels: vi.fn((urls) => Promise.resolve(
      urls.map(url => url.replace('.mp3', '_normalized.mp3'))
    )),
    addBackgroundMusic: vi.fn((audioUrl) => Promise.resolve(
      audioUrl.replace('.mp3', '_with_music.mp3')
    )),
    analyzeAudioQuality: vi.fn(() => Promise.resolve({
      overallScore: 8.0,
      issues: [],
      recommendations: [],
      technicalSpecs: {
        sampleRate: 44100,
        bitRate: 192000,
        channels: 2,
        duration: 120,
        fileSize: 1000000,
        format: 'mp3'
      }
    })),
    validateAudioStandards: vi.fn((audioUrl, platform) => {
      // Mock validation logic
      const isValid = platform !== 'audible' || Math.random() > 0.3;
      return Promise.resolve({
        isValid,
        errors: isValid ? [] : ['Sample rate too low for Audible'],
        warnings: [],
        recommendations: []
      });
    }),
    batchProcessAudio: vi.fn((audioFiles, settings) => Promise.resolve(
      audioFiles.map(url => {
        let processedUrl = url.replace('.mp3', '_processed.mp3');
        if (settings.removeArtifacts) processedUrl = processedUrl.replace('.mp3', '_cleaned.mp3');
        if (settings.addMusic) processedUrl = processedUrl.replace('.mp3', '_with_music.mp3');
        if (settings.normalize) processedUrl = processedUrl.replace('.mp3', '_normalized.mp3');
        return processedUrl;
      })
    )),
    generateIntroOutro: vi.fn(() => Promise.resolve({
      introUrl: 'https://test.com/intro.mp3',
      outroUrl: 'https://test.com/outro.mp3',
      introDuration: 30,
      outroDuration: 15
    }))
  }
}));

// Mock Chapter Processing service
vi.mock('~/services/chapter-processing-service', () => ({
  chapterProcessingService: {
    detectChapterBreaks: vi.fn((content) => {
      // Simple mock implementation
      const chapters = content.match(/Chapter \d+|Part \d+|\d+\./g) || ['Chapter 1'];
      return Promise.resolve(chapters.map((title, index) => ({
        chapterNumber: index + 1,
        title: title.trim(),
        startPosition: index * 100,
        endPosition: (index + 1) * 100,
        estimatedDuration: 60
      })));
    }),
    generateNavigationMarkers: vi.fn((chapters) => {
      let currentTime = 0;
      const markers = chapters.map(chapter => {
        const marker = {
          id: `marker-${chapter.number}`,
          type: 'chapter' as const,
          title: chapter.title,
          timestamp: currentTime,
          chapterNumber: chapter.number
        };
        currentTime += chapter.duration;
        return marker;
      });
      return Promise.resolve(markers);
    }),
    generateTableOfContents: vi.fn((chapters) => {
      let toc = 'Table of Contents\n\n';
      let currentTime = 0;
      chapters.forEach(chapter => {
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        toc += `Chapter ${chapter.number}: ${chapter.title} - ${timestamp}\n`;
        currentTime += chapter.duration;
      });
      return Promise.resolve(toc);
    }),
    validateChapterStructure: vi.fn((chapters) => {
      const errors = [];
      const warnings = [];
      
      // Check for empty titles (only whitespace)
      chapters.forEach(chapter => {
        if (!chapter.title || chapter.title.trim().length === 0) {
          errors.push(`Chapter ${chapter.number} has no title`);
        }
        if (chapter.duration === 0) {
          errors.push(`Chapter ${chapter.number} has no duration`);
        }
        if (chapter.duration < 30 && chapter.duration > 0) {
          warnings.push(`Chapter ${chapter.number} is very short`);
        }
        if (chapter.duration > 3600) {
          warnings.push(`Chapter ${chapter.number} is very long`);
        }
      });
      
      // Check for duplicate chapter numbers
      const numbers = chapters.map(c => c.number);
      const duplicates = numbers.filter((num, index) => numbers.indexOf(num) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate chapter numbers found: ${duplicates.join(', ')}`);
      }
      
      return Promise.resolve({
        isValid: errors.length === 0,
        errors,
        warnings
      });
    }),
    processAudiobookChapters: vi.fn(() => Promise.resolve({
      id: 'processing-job-id',
      audiobookId: 'test-audiobook',
      status: 'processing',
      progress: 50,
      totalSteps: 10,
      completedSteps: 5
    })),
    getProcessingJobStatus: vi.fn(() => Promise.resolve({
      id: 'processing-job-id',
      status: 'completed',
      progress: 100,
      totalSteps: 10,
      completedSteps: 10
    }))
  }
}));

beforeAll(() => {
  // Setup test environment
});

afterAll(() => {
  // Cleanup test environment
});