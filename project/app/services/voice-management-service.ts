import { supabase } from "~/lib/supabase";

export interface VoiceProfile {
  id: string;
  userId: string;
  provider: 'elevenlabs' | 'azure' | 'aws-polly' | 'google' | 'custom';
  voiceId: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  ageRange: 'child' | 'young-adult' | 'adult' | 'elderly';
  accent: string;
  language: string;
  isCloned: boolean;
  originalSampleUrl?: string;
  characteristics: VoiceCharacteristics;
  qualityScore: number; // 1-10
  sampleUrl: string;
  createdAt: Date;
}

export interface VoiceCharacteristics {
  pitch: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  speed: 'very-slow' | 'slow' | 'medium' | 'fast' | 'very-fast';
  tone: 'warm' | 'neutral' | 'authoritative' | 'friendly' | 'dramatic';
  clarity: number; // 1-10
  naturalness: number; // 1-10
}

export interface VoiceCreationParams {
  provider: VoiceProfile['provider'];
  voiceId: string;
  name: string;
  gender: VoiceProfile['gender'];
  ageRange: VoiceProfile['ageRange'];
  accent?: string;
  language?: string;
  characteristics: VoiceCharacteristics;
  sampleUrl?: string;
}

export interface VoiceMetadata {
  name: string;
  description?: string;
  gender: VoiceProfile['gender'];
  ageRange: VoiceProfile['ageRange'];
  accent?: string;
  language?: string;
}

export interface CloningJob {
  id: string;
  userId: string;
  provider: string;
  originalAudioUrl: string;
  voiceName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressPercentage: number;
  resultVoiceId?: string;
  errorMessage?: string;
  createdAt: Date;
}

export interface CloningJobStatus {
  status: CloningJob['status'];
  progressPercentage: number;
  resultVoiceId?: string;
  errorMessage?: string;
}

export interface AudioResult {
  audioUrl: string;
  duration: number;
  fileSize: number;
  format: string;
}

export interface VoiceComparison {
  voiceId: string;
  name: string;
  audioUrl: string;
  characteristics: VoiceCharacteristics;
  qualityScore: number;
}

export class VoiceManagementService {
  /**
   * Create a new voice profile
   */
  async createVoiceProfile(userId: string, params: VoiceCreationParams): Promise<VoiceProfile> {
    try {
      const { data, error } = await supabase
        .from('voice_profiles')
        .insert({
          user_id: userId,
          provider: params.provider,
          voice_id: params.voiceId,
          name: params.name,
          gender: params.gender,
          age_range: params.ageRange,
          accent: params.accent || 'neutral',
          language: params.language || 'en-US',
          is_cloned: false,
          characteristics: params.characteristics,
          quality_score: (params.characteristics.clarity + params.characteristics.naturalness) / 2,
          sample_url: params.sampleUrl
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create voice profile: ${error.message}`);
      }

      return this.mapDatabaseToVoiceProfile(data);
    } catch (error) {
      throw new Error(`VoiceManagementService.createVoiceProfile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get voice profiles for a user, optionally filtered by provider
   */
  async getVoiceProfiles(userId: string, provider?: string): Promise<VoiceProfile[]> {
    try {
      let query = supabase
        .from('voice_profiles')
        .select('*')
        .eq('is_active', true)
        .order('quality_score', { ascending: false });

      if (provider) {
        query = query.eq('provider', provider);
      }

      // For now, just get user's voices - we'll handle global voices separately if needed
      query = query.eq('user_id', userId);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get voice profiles: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseToVoiceProfile);
    } catch (error) {
      throw new Error(`VoiceManagementService.getVoiceProfiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a voice profile
   */
  async updateVoiceProfile(voiceId: string, userId: string, updates: Partial<VoiceProfile>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.gender) updateData.gender = updates.gender;
      if (updates.ageRange) updateData.age_range = updates.ageRange;
      if (updates.accent) updateData.accent = updates.accent;
      if (updates.language) updateData.language = updates.language;
      if (updates.characteristics) {
        updateData.characteristics = updates.characteristics;
        updateData.quality_score = (updates.characteristics.clarity + updates.characteristics.naturalness) / 2;
      }
      if (updates.sampleUrl) updateData.sample_url = updates.sampleUrl;

      const { error } = await supabase
        .from('voice_profiles')
        .update(updateData)
        .eq('id', voiceId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update voice profile: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`VoiceManagementService.updateVoiceProfile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a voice profile
   */
  async deleteVoiceProfile(voiceId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('voice_profiles')
        .update({ is_active: false })
        .eq('id', voiceId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete voice profile: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`VoiceManagementService.deleteVoiceProfile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initiate voice cloning process
   */
  async initiateVoiceCloning(userId: string, audioSample: File, metadata: VoiceMetadata): Promise<CloningJob> {
    try {
      // Upload audio sample to storage
      const fileName = `voice-samples/${userId}/${Date.now()}-${audioSample.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-samples')
        .upload(fileName, audioSample);

      if (uploadError) {
        throw new Error(`Failed to upload audio sample: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('audio-samples')
        .getPublicUrl(fileName);

      // Create cloning job record
      const { data, error } = await supabase
        .from('voice_cloning_jobs')
        .insert({
          user_id: userId,
          provider: 'elevenlabs', // Default to ElevenLabs for cloning
          original_audio_url: urlData.publicUrl,
          voice_name: metadata.name,
          status: 'pending',
          progress_percentage: 0
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create cloning job: ${error.message}`);
      }

      // TODO: Integrate with actual voice cloning API (ElevenLabs)
      // For now, simulate the cloning process
      setTimeout(() => {
        this.simulateVoiceCloning(data.id, userId, metadata);
      }, 1000);

      return this.mapDatabaseToCloningJob(data);
    } catch (error) {
      throw new Error(`VoiceManagementService.initiateVoiceCloning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cloning job status
   */
  async getCloningJobStatus(jobId: string, userId: string): Promise<CloningJobStatus> {
    try {
      const { data, error } = await supabase
        .from('voice_cloning_jobs')
        .select('status, progress_percentage, result_voice_id, error_message')
        .eq('id', jobId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to get cloning job status: ${error.message}`);
      }

      return {
        status: data.status,
        progressPercentage: data.progress_percentage,
        resultVoiceId: data.result_voice_id,
        errorMessage: data.error_message
      };
    } catch (error) {
      throw new Error(`VoiceManagementService.getCloningJobStatus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate voice preview
   */
  async generateVoicePreview(voiceId: string, sampleText: string): Promise<AudioResult> {
    try {
      // Get voice profile
      const { data: voiceProfile, error } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('id', voiceId)
        .single();

      if (error) {
        throw new Error(`Voice profile not found: ${error.message}`);
      }

      // TODO: Integrate with actual TTS API to generate preview
      // For now, return a mock result
      return {
        audioUrl: `https://example.com/preview/${voiceId}-${Date.now()}.mp3`,
        duration: Math.ceil(sampleText.length / 10), // Rough estimate
        fileSize: sampleText.length * 100, // Rough estimate
        format: 'mp3'
      };
    } catch (error) {
      throw new Error(`VoiceManagementService.generateVoicePreview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compare multiple voices with the same sample text
   */
  async compareVoices(voiceIds: string[], sampleText: string): Promise<VoiceComparison[]> {
    try {
      const { data: voiceProfiles, error } = await supabase
        .from('voice_profiles')
        .select('*')
        .in('id', voiceIds);

      if (error) {
        throw new Error(`Failed to get voice profiles: ${error.message}`);
      }

      const comparisons: VoiceComparison[] = [];

      for (const profile of voiceProfiles) {
        // Generate preview for each voice
        const audioResult = await this.generateVoicePreview(profile.id, sampleText);
        
        comparisons.push({
          voiceId: profile.id,
          name: profile.name,
          audioUrl: audioResult.audioUrl,
          characteristics: profile.characteristics,
          qualityScore: profile.quality_score
        });
      }

      return comparisons.sort((a, b) => b.qualityScore - a.qualityScore);
    } catch (error) {
      throw new Error(`VoiceManagementService.compareVoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available voices by provider with quality filtering
   */
  async getVoicesByProvider(provider: string, minQuality: number = 6.0): Promise<VoiceProfile[]> {
    try {
      const { data, error } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('provider', provider)
        .filter('quality_score', 'gte', minQuality)
        .eq('is_active', true)
        .order('quality_score', { ascending: false });

      if (error) {
        throw new Error(`Failed to get voices by provider: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseToVoiceProfile);
    } catch (error) {
      throw new Error(`VoiceManagementService.getVoicesByProvider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search voices by characteristics
   */
  async searchVoices(criteria: {
    gender?: string;
    ageRange?: string;
    accent?: string;
    tone?: string;
    minQuality?: number;
  }): Promise<VoiceProfile[]> {
    try {
      let query = supabase
        .from('voice_profiles')
        .select('*')
        .eq('is_active', true);

      if (criteria.gender) {
        query = query.eq('gender', criteria.gender);
      }
      if (criteria.ageRange) {
        query = query.eq('age_range', criteria.ageRange);
      }
      if (criteria.accent) {
        query = query.eq('accent', criteria.accent);
      }
      if (criteria.tone) {
        query = query.contains('characteristics', { tone: criteria.tone });
      }
      if (criteria.minQuality) {
        // Use filter instead of gte for compatibility
        query = query.filter('quality_score', 'gte', criteria.minQuality);
      }

      query = query.order('quality_score', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to search voices: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseToVoiceProfile);
    } catch (error) {
      throw new Error(`VoiceManagementService.searchVoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Simulate voice cloning process (replace with actual API integration)
   */
  private async simulateVoiceCloning(jobId: string, userId: string, metadata: VoiceMetadata): Promise<void> {
    try {
      // Simulate progress updates
      const progressSteps = [25, 50, 75, 100];
      
      for (const progress of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        
        await supabase
          .from('voice_cloning_jobs')
          .update({ 
            progress_percentage: progress,
            status: progress === 100 ? 'completed' : 'processing'
          })
          .eq('id', jobId);

        if (progress === 100) {
          // Create the cloned voice profile
          const clonedVoiceId = `cloned_${Date.now()}`;
          
          await this.createVoiceProfile(userId, {
            provider: 'custom',
            voiceId: clonedVoiceId,
            name: `${metadata.name} (Cloned)`,
            gender: metadata.gender,
            ageRange: metadata.ageRange,
            accent: metadata.accent || 'neutral',
            language: metadata.language || 'en-US',
            characteristics: {
              pitch: 'medium',
              speed: 'medium',
              tone: 'neutral',
              clarity: 8,
              naturalness: 7
            }
          });

          // Update job with result
          await supabase
            .from('voice_cloning_jobs')
            .update({ result_voice_id: clonedVoiceId })
            .eq('id', jobId);
        }
      }
    } catch (error) {
      // Mark job as failed
      await supabase
        .from('voice_cloning_jobs')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', jobId);
    }
  }

  /**
   * Map database record to VoiceProfile interface
   */
  private mapDatabaseToVoiceProfile(data: any): VoiceProfile {
    return {
      id: data.id,
      userId: data.user_id,
      provider: data.provider,
      voiceId: data.voice_id,
      name: data.name,
      gender: data.gender,
      ageRange: data.age_range,
      accent: data.accent,
      language: data.language,
      isCloned: data.is_cloned,
      originalSampleUrl: data.original_sample_url,
      characteristics: data.characteristics,
      qualityScore: data.quality_score,
      sampleUrl: data.sample_url,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Map database record to CloningJob interface
   */
  private mapDatabaseToCloningJob(data: any): CloningJob {
    return {
      id: data.id,
      userId: data.user_id,
      provider: data.provider,
      originalAudioUrl: data.original_audio_url,
      voiceName: data.voice_name,
      status: data.status,
      progressPercentage: data.progress_percentage,
      resultVoiceId: data.result_voice_id,
      errorMessage: data.error_message,
      createdAt: new Date(data.created_at)
    };
  }
}

export const voiceManagementService = new VoiceManagementService();