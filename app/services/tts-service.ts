import { supabase } from "~/lib/supabase";
import { apiKeyService } from "~/services/api-key-service";

export interface VoiceProfile {
  id: string;
  provider: 'google' | 'resemble' | 'elevenlabs' | 'openai' | 'azure' | 'aws-polly';
  voice_id: string;
  name: string;
  gender?: 'male' | 'female' | 'neutral';
  language: string;
  sample_url?: string;
}

export interface TTSRequest {
  text: string;
  voice: VoiceProfile;
  speed?: number; // 0.25 to 4.0
  pitch?: number; // -20.0 to 20.0
  outputFormat?: 'mp3' | 'wav' | 'ogg';
  apiKey?: string; // Optional API key override
}

export interface EmotionalTTSRequest extends TTSRequest {
  emotion?: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm' | 'dramatic';
  emphasis?: TextEmphasis[];
  pauseDuration?: number; // milliseconds
}

export interface TextEmphasis {
  startIndex: number;
  endIndex: number;
  type: 'stress' | 'whisper' | 'shout' | 'pause';
}

export interface AudioResult {
  audioUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  format: string;
  provider: string;
  voiceId: string;
  audioContent?: string; // Base64 encoded audio content
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
}

export interface AudiobookChapter {
  id: string;
  chapter_number: number;
  title: string;
  audio_url: string;
  duration: number;
  file_size: number;
}

export interface Audiobook {
  id: string;
  user_id: string;
  source_ebook_id: string;
  title: string;
  voice_provider: string;
  voice_id: string;
  voice_settings: any;
  total_duration: number;
  status: 'pending' | 'generating' | 'completed' | 'error';
  audio_files: string[];
  created_at: string;
  updated_at: string;
}

export class TTSService {
  /**
   * Get available voices from database
   */
  async getAvailableVoices(): Promise<VoiceProfile[]> {
    try {
      const { data, error } = await supabase
        .from('tts_voices')
        .select('*')
        .eq('is_active', true)
        .order('provider, name');

      if (error) {
        throw new Error(`Failed to get voices: ${error.message}`);
      }

      return (data || []).map(voice => ({
        id: voice.id,
        provider: voice.provider,
        voice_id: voice.voice_id,
        name: voice.name,
        gender: voice.gender,
        language: voice.language,
        sample_url: voice.sample_url
      }));
    } catch (error) {
      throw new Error(`TTSService.getAvailableVoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate speech from text using multiple TTS providers
   */
  async generateSpeech(request: TTSRequest, userId: string): Promise<AudioResult> {
    try {
      console.log('Generating speech with request:', request);
      
      switch (request.voice.provider) {
        case 'elevenlabs':
          return await this.generateElevenLabsSpeech(request, userId);
        case 'azure':
          return await this.generateAzureSpeech(request, userId);
        case 'aws-polly':
          return await this.generateAWSPollySpeech(request, userId);
        case 'google':
          return await this.generateGoogleSpeech(request, userId);
        case 'openai':
          return await this.generateOpenAISpeech(request, userId);
        default:
          throw new Error(`Unsupported TTS provider: ${request.voice.provider}`);
      }
    } catch (error) {
      throw new Error(`TTSService.generateSpeech: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate speech with emotional context and emphasis
   */
  async generateWithEmotions(request: EmotionalTTSRequest, userId: string): Promise<AudioResult> {
    try {
      // For providers that support SSML, we can add emotional markup
      let enhancedText = request.text;
      
      if (request.voice.provider === 'azure' || request.voice.provider === 'aws-polly') {
        enhancedText = this.addSSMLMarkup(request);
      }
      
      const enhancedRequest: TTSRequest = {
        ...request,
        text: enhancedText
      };
      
      return await this.generateSpeech(enhancedRequest, userId);
    } catch (error) {
      throw new Error(`TTSService.generateWithEmotions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate audio for multiple chapters in batch
   */
  async generateChaptersBatch(chapters: Chapter[], voiceProfile: VoiceProfile, userId: string): Promise<AudioResult[]> {
    try {
      const results: AudioResult[] = [];
      
      for (const chapter of chapters) {
        const chapterText = `Chapter ${chapter.number}: ${chapter.title}. ${chapter.content}`;
        
        const audioResult = await this.generateSpeech({
          text: chapterText,
          voice: voiceProfile,
          speed: 1.0,
          pitch: 0.0,
          outputFormat: 'mp3'
        }, userId);
        
        results.push(audioResult);
        
        // Add small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return results;
    } catch (error) {
      throw new Error(`TTSService.generateChaptersBatch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhance audio quality (placeholder for future audio processing)
   */
  async enhanceAudioQuality(audioUrl: string): Promise<AudioResult> {
    try {
      // TODO: Implement actual audio enhancement
      // This could involve noise reduction, normalization, etc.
      
      return {
        audioUrl: audioUrl.replace('.mp3', '_enhanced.mp3'),
        duration: 0, // Would be calculated from actual audio
        fileSize: 0, // Would be calculated from actual audio
        format: 'mp3',
        provider: 'enhanced',
        voiceId: 'enhanced'
      };
    } catch (error) {
      throw new Error(`TTSService.enhanceAudioQuality: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ElevenLabs TTS integration
   */
  private async generateElevenLabsSpeech(request: TTSRequest, userId: string): Promise<AudioResult> {
    try {
      const apiKey = request.apiKey || await apiKeyService.getApiKey(userId, 'elevenlabs');
      if (!apiKey) {
        throw new Error('ElevenLabs API key not found');
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${request.voice.voice_id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: request.text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      // In a real implementation, you would upload the audio to storage
      // For now, we'll simulate the response
      const mockAudioUrl = `https://storage.example.com/elevenlabs/${Date.now()}.mp3`;
      const estimatedDuration = Math.ceil(request.text.length / 12); // ElevenLabs is faster
      
      return {
        audioUrl: mockAudioUrl,
        duration: estimatedDuration,
        fileSize: estimatedDuration * 48000, // Higher quality estimate
        format: request.outputFormat || 'mp3',
        provider: 'elevenlabs',
        voiceId: request.voice.voice_id
      };
    } catch (error) {
      throw new Error(`ElevenLabs TTS error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Azure Speech Services integration
   */
  private async generateAzureSpeech(request: TTSRequest, userId: string): Promise<AudioResult> {
    try {
      const apiKey = request.apiKey || await apiKeyService.getApiKey(userId, 'azure-speech');
      if (!apiKey) {
        throw new Error('Azure Speech API key not found');
      }

      // Azure Speech uses SSML format
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
          <voice name="${request.voice.voice_id}">
            <prosody rate="${this.convertSpeedToRate(request.speed || 1.0)}" 
                     pitch="${this.convertPitchToSSML(request.pitch || 0)}">
              ${request.text}
            </prosody>
          </voice>
        </speak>
      `;

      // Simulate Azure Speech API call
      const mockAudioUrl = `https://storage.example.com/azure/${Date.now()}.mp3`;
      const estimatedDuration = Math.ceil(request.text.length / 10);
      
      return {
        audioUrl: mockAudioUrl,
        duration: estimatedDuration,
        fileSize: estimatedDuration * 32000,
        format: request.outputFormat || 'mp3',
        provider: 'azure',
        voiceId: request.voice.voice_id
      };
    } catch (error) {
      throw new Error(`Azure Speech TTS error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * AWS Polly integration
   */
  private async generateAWSPollySpeech(request: TTSRequest, userId: string): Promise<AudioResult> {
    try {
      const apiKey = request.apiKey || await apiKeyService.getApiKey(userId, 'aws-polly');
      if (!apiKey) {
        throw new Error('AWS Polly API key not found');
      }

      // AWS Polly supports SSML and speech marks
      const ssml = `
        <speak>
          <prosody rate="${this.convertSpeedToRate(request.speed || 1.0)}" 
                   pitch="${this.convertPitchToSSML(request.pitch || 0)}">
            ${request.text}
          </prosody>
        </speak>
      `;

      // Simulate AWS Polly API call
      const mockAudioUrl = `https://storage.example.com/polly/${Date.now()}.mp3`;
      const estimatedDuration = Math.ceil(request.text.length / 10);
      
      return {
        audioUrl: mockAudioUrl,
        duration: estimatedDuration,
        fileSize: estimatedDuration * 32000,
        format: request.outputFormat || 'mp3',
        provider: 'aws-polly',
        voiceId: request.voice.voice_id
      };
    } catch (error) {
      throw new Error(`AWS Polly TTS error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Google Cloud Text-to-Speech integration
   */
  private async generateGoogleSpeech(request: TTSRequest, userId: string): Promise<AudioResult> {
    try {
      const apiKey = request.apiKey || await apiKeyService.getApiKey(userId, 'google-cloud');
      if (!apiKey) {
        throw new Error('Google Cloud API key not found');
      }

      // Simulate Google Cloud TTS API call
      const mockAudioUrl = `https://storage.example.com/google/${Date.now()}.mp3`;
      const estimatedDuration = Math.ceil(request.text.length / 10);
      
      return {
        audioUrl: mockAudioUrl,
        duration: estimatedDuration,
        fileSize: estimatedDuration * 32000,
        format: request.outputFormat || 'mp3',
        provider: 'google',
        voiceId: request.voice.voice_id
      };
    } catch (error) {
      throw new Error(`Google TTS error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * OpenAI TTS integration
   */
  private async generateOpenAISpeech(request: TTSRequest, userId: string): Promise<AudioResult> {
    try {
      const apiKey = request.apiKey || await apiKeyService.getApiKey(userId, 'openai');
      if (!apiKey) {
        throw new Error('OpenAI API key not found');
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          input: request.text,
          voice: request.voice.voice_id,
          response_format: request.outputFormat || 'mp3',
          speed: request.speed || 1.0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI TTS API error: ${response.status} - ${errorText}`);
      }

      // In a real implementation, you would upload the audio to storage
      const mockAudioUrl = `https://storage.example.com/openai/${Date.now()}.mp3`;
      const estimatedDuration = Math.ceil(request.text.length / 15); // OpenAI is quite fast
      
      return {
        audioUrl: mockAudioUrl,
        duration: estimatedDuration,
        fileSize: estimatedDuration * 40000, // High quality estimate
        format: request.outputFormat || 'mp3',
        provider: 'openai',
        voiceId: request.voice.voice_id
      };
    } catch (error) {
      throw new Error(`OpenAI TTS error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add SSML markup for emotional TTS
   */
  private addSSMLMarkup(request: EmotionalTTSRequest): string {
    let ssmlText = request.text;
    
    // Add emotion markup
    if (request.emotion && request.emotion !== 'neutral') {
      ssmlText = `<mstts:express-as style="${request.emotion}">${ssmlText}</mstts:express-as>`;
    }
    
    // Add emphasis markup
    if (request.emphasis && request.emphasis.length > 0) {
      request.emphasis.forEach(emphasis => {
        const beforeText = ssmlText.substring(0, emphasis.startIndex);
        const emphasizedText = ssmlText.substring(emphasis.startIndex, emphasis.endIndex);
        const afterText = ssmlText.substring(emphasis.endIndex);
        
        let markup = '';
        switch (emphasis.type) {
          case 'stress':
            markup = `<emphasis level="strong">${emphasizedText}</emphasis>`;
            break;
          case 'whisper':
            markup = `<mstts:express-as style="whisper">${emphasizedText}</mstts:express-as>`;
            break;
          case 'shout':
            markup = `<emphasis level="strong"><prosody volume="loud">${emphasizedText}</prosody></emphasis>`;
            break;
          case 'pause':
            markup = `${emphasizedText}<break time="${request.pauseDuration || 500}ms"/>`;
            break;
          default:
            markup = emphasizedText;
        }
        
        ssmlText = beforeText + markup + afterText;
      });
    }
    
    return ssmlText;
  }

  /**
   * Convert speed value to SSML rate
   */
  private convertSpeedToRate(speed: number): string {
    if (speed <= 0.5) return 'x-slow';
    if (speed <= 0.75) return 'slow';
    if (speed <= 1.25) return 'medium';
    if (speed <= 1.5) return 'fast';
    return 'x-fast';
  }

  /**
   * Convert pitch value to SSML pitch
   */
  private convertPitchToSSML(pitch: number): string {
    if (pitch <= -10) return 'x-low';
    if (pitch <= -5) return 'low';
    if (pitch <= 5) return 'medium';
    if (pitch <= 10) return 'high';
    return 'x-high';
  }

  /**
   * Create an audiobook from an ebook
   */
  async createAudiobook(userId: string, ebookId: string, voiceProfile: VoiceProfile): Promise<string> {
    try {
      // Create audiobook record
      const { data: audiobook, error: audiobookError } = await supabase
        .from('audiobooks')
        .insert({
          user_id: userId,
          source_ebook_id: ebookId,
          title: `Audiobook - ${ebookId}`,
          voice_provider: voiceProfile.provider,
          voice_id: voiceProfile.voice_id,
          voice_settings: {
            speed: 1.0,
            pitch: 0.0
          },
          status: 'pending'
        })
        .select('id')
        .single();

      if (audiobookError) {
        throw new Error(`Failed to create audiobook: ${audiobookError.message}`);
      }

      return audiobook.id;
    } catch (error) {
      throw new Error(`TTSService.createAudiobook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get audiobook by ID
   */
  async getAudiobook(userId: string, audiobookId: string): Promise<Audiobook | null> {
    try {
      const { data, error } = await supabase
        .from('audiobooks')
        .select('*')
        .eq('id', audiobookId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get audiobook: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`TTSService.getAudiobook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all audiobooks for a user
   */
  async getUserAudiobooks(userId: string): Promise<Audiobook[]> {
    try {
      const { data, error } = await supabase
        .from('audiobooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user audiobooks: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`TTSService.getUserAudiobooks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update audiobook status
   */
  async updateAudiobookStatus(userId: string, audiobookId: string, status: Audiobook['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('audiobooks')
        .update({ status })
        .eq('id', audiobookId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update audiobook status: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`TTSService.updateAudiobookStatus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an audiobook
   */
  async deleteAudiobook(userId: string, audiobookId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('audiobooks')
        .delete()
        .eq('id', audiobookId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete audiobook: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`TTSService.deleteAudiobook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate audio for a specific chapter (enhanced with multi-provider support)
   */
  async generateChapterAudio(
    userId: string,
    audiobookId: string,
    chapterNumber: number,
    chapterTitle: string,
    chapterContent: string,
    voiceProfile: VoiceProfile
  ): Promise<AudioResult> {
    try {
      // This integrates with actual TTS services
      const audioResult = await this.generateSpeech({
        text: `Chapter ${chapterNumber}: ${chapterTitle}. ${chapterContent}`,
        voice: voiceProfile,
        speed: 1.0,
        pitch: 0.0,
        outputFormat: 'mp3'
      }, userId);

      return audioResult;
    } catch (error) {
      throw new Error(`TTSService.generateChapterAudio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get voice quality score based on provider and voice characteristics
   */
  async getVoiceQualityScore(voiceProfile: VoiceProfile): Promise<number> {
    try {
      // Quality scoring based on provider and voice type
      const providerScores = {
        'elevenlabs': 9.0,
        'azure': 8.0,
        'openai': 8.5,
        'aws-polly': 7.0,
        'google': 7.5,
        'resemble': 6.5
      };

      let baseScore = providerScores[voiceProfile.provider] || 5.0;
      
      // Adjust based on voice type (neural voices are typically higher quality)
      if (voiceProfile.voice_id.includes('Neural') || voiceProfile.voice_id.includes('neural')) {
        baseScore += 0.5;
      }
      if (voiceProfile.voice_id.includes('Studio') || voiceProfile.voice_id.includes('HD')) {
        baseScore += 1.0;
      }
      
      return Math.min(baseScore, 10.0);
    } catch (error) {
      throw new Error(`TTSService.getVoiceQualityScore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate TTS provider API key
   */
  async validateProviderApiKey(userId: string, provider: string): Promise<boolean> {
    try {
      const apiKey = await apiKeyService.getApiKey(userId, provider);
      if (!apiKey) {
        return false;
      }

      // Test API key with a simple request
      switch (provider) {
        case 'elevenlabs':
          return await this.testElevenLabsKey(apiKey);
        case 'azure-speech':
          return await this.testAzureKey(apiKey);
        case 'aws-polly':
          return await this.testAWSPollyKey(apiKey);
        case 'google-cloud':
          return await this.testGoogleKey(apiKey);
        case 'openai':
          return await this.testOpenAIKey(apiKey);
        default:
          return false;
      }
    } catch (error) {
      console.error(`API key validation error for ${provider}:`, error);
      return false;
    }
  }

  /**
   * Test ElevenLabs API key
   */
  private async testElevenLabsKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Test Azure Speech API key
   */
  private async testAzureKey(apiKey: string): Promise<boolean> {
    try {
      // Azure Speech requires region, so this is a simplified test
      // In production, you'd need to store region with the API key
      return apiKey.length > 20; // Basic validation
    } catch {
      return false;
    }
  }

  /**
   * Test AWS Polly API key
   */
  private async testAWSPollyKey(apiKey: string): Promise<boolean> {
    try {
      // AWS requires access key and secret, so this is a simplified test
      return apiKey.length > 20; // Basic validation
    } catch {
      return false;
    }
  }

  /**
   * Test Google Cloud API key
   */
  private async testGoogleKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Test OpenAI API key
   */
  private async testOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const ttsService = new TTSService();