import { supabase } from "~/lib/supabase";

export interface OptimizationSettings {
  enableParallelProcessing: boolean;
  maxConcurrentJobs: number;
  enableCaching: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  enableProgressiveGeneration: boolean;
  chunkSize: number; // For progressive processing
}

export interface ProcessingJob {
  id: string;
  type: 'audio_generation' | 'audio_processing' | 'format_conversion';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startTime: Date;
  endTime?: Date;
  inputData: any;
  outputData?: any;
  errorMessage?: string;
}

export interface CacheEntry {
  key: string;
  data: any;
  createdAt: Date;
  expiresAt: Date;
  size: number; // in bytes
  accessCount: number;
  lastAccessed: Date;
}

export interface OptimizationMetrics {
  totalProcessingTime: number;
  cacheHitRate: number;
  parallelJobsExecuted: number;
  averageJobDuration: number;
  memoryUsage: number;
  diskUsage: number;
}

export class AudioOptimizationService {
  private processingQueue: ProcessingJob[] = [];
  private activeJobs: Map<string, ProcessingJob> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private settings: OptimizationSettings;

  constructor(settings?: Partial<OptimizationSettings>) {
    this.settings = {
      enableParallelProcessing: true,
      maxConcurrentJobs: 4,
      enableCaching: true,
      compressionLevel: 'medium',
      enableProgressiveGeneration: true,
      chunkSize: 1024 * 1024, // 1MB chunks
      ...settings
    };
  }

  /**
   * Process multiple audio chapters in parallel
   */
  async processChaptersParallel(chapters: any[], processingFunction: (chapter: any) => Promise<any>): Promise<any[]> {
    try {
      if (!this.settings.enableParallelProcessing) {
        // Sequential processing fallback
        const results = [];
        for (const chapter of chapters) {
          results.push(await processingFunction(chapter));
        }
        return results;
      }

      // Parallel processing with concurrency limit
      const results: any[] = [];
      const chunks = this.chunkArray(chapters, this.settings.maxConcurrentJobs);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (chapter) => {
          const job = await this.createProcessingJob('audio_processing', chapter);
          
          try {
            const result = await processingFunction(chapter);
            await this.completeJob(job.id, result);
            return result;
          } catch (error) {
            await this.failJob(job.id, error instanceof Error ? error.message : 'Unknown error');
            throw error;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }

      return results;
    } catch (error) {
      throw new Error(`AudioOptimizationService.processChaptersParallel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cache audio files with intelligent compression
   */
  async cacheAudioFile(key: string, audioData: ArrayBuffer, ttl: number = 3600000): Promise<void> {
    try {
      if (!this.settings.enableCaching) {
        return;
      }

      // Compress audio data based on settings
      const compressedData = await this.compressAudioData(audioData);
      
      const cacheEntry: CacheEntry = {
        key,
        data: compressedData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + ttl),
        size: compressedData.byteLength,
        accessCount: 0,
        lastAccessed: new Date()
      };

      // Store in memory cache
      this.cache.set(key, cacheEntry);

      // Store in database for persistence
      await supabase
        .from('audio_cache')
        .upsert({
          cache_key: key,
          data: Array.from(new Uint8Array(compressedData)),
          expires_at: cacheEntry.expiresAt.toISOString(),
          size: cacheEntry.size
        });

      // Clean up expired entries
      await this.cleanupExpiredCache();
    } catch (error) {
      console.warn(`Failed to cache audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve cached audio file
   */
  async getCachedAudioFile(key: string): Promise<ArrayBuffer | null> {
    try {
      if (!this.settings.enableCaching) {
        return null;
      }

      // Check memory cache first
      let cacheEntry = this.cache.get(key);
      
      if (!cacheEntry) {
        // Check database cache
        const { data, error } = await supabase
          .from('audio_cache')
          .select('*')
          .eq('cache_key', key)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !data) {
          return null;
        }

        // Reconstruct cache entry
        cacheEntry = {
          key,
          data: new Uint8Array(data.data).buffer,
          createdAt: new Date(data.created_at),
          expiresAt: new Date(data.expires_at),
          size: data.size,
          accessCount: 0,
          lastAccessed: new Date()
        };

        // Store in memory cache for faster access
        this.cache.set(key, cacheEntry);
      }

      // Check if expired
      if (cacheEntry.expiresAt < new Date()) {
        this.cache.delete(key);
        return null;
      }

      // Update access statistics
      cacheEntry.accessCount++;
      cacheEntry.lastAccessed = new Date();

      // Decompress data
      const decompressedData = await this.decompressAudioData(cacheEntry.data);
      
      return decompressedData;
    } catch (error) {
      console.warn(`Failed to retrieve cached audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Generate audio progressively in chunks
   */
  async generateAudioProgressive(
    text: string, 
    voiceSettings: any, 
    onProgress?: (progress: number) => void
  ): Promise<ArrayBuffer> {
    try {
      if (!this.settings.enableProgressiveGeneration) {
        // Generate all at once (fallback)
        return await this.generateAudioComplete(text, voiceSettings);
      }

      const chunks = this.splitTextIntoChunks(text, this.settings.chunkSize);
      const audioChunks: ArrayBuffer[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Check cache first
        const cacheKey = this.generateCacheKey(chunk, voiceSettings);
        let audioChunk = await this.getCachedAudioFile(cacheKey);
        
        if (!audioChunk) {
          // Generate audio for this chunk
          audioChunk = await this.generateAudioComplete(chunk, voiceSettings);
          
          // Cache the result
          await this.cacheAudioFile(cacheKey, audioChunk);
        }
        
        audioChunks.push(audioChunk);
        
        // Report progress
        const progress = ((i + 1) / chunks.length) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      }

      // Combine audio chunks
      return await this.combineAudioChunks(audioChunks);
    } catch (error) {
      throw new Error(`AudioOptimizationService.generateAudioProgressive: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize audio file compression
   */
  async optimizeAudioCompression(audioData: ArrayBuffer, targetSize?: number): Promise<ArrayBuffer> {
    try {
      // Simulate audio compression optimization
      // In production, this would use actual audio compression libraries
      
      const originalSize = audioData.byteLength;
      let compressionRatio = 0.7; // Default 30% compression
      
      // Adjust compression based on settings
      switch (this.settings.compressionLevel) {
        case 'low':
          compressionRatio = 0.9;
          break;
        case 'medium':
          compressionRatio = 0.7;
          break;
        case 'high':
          compressionRatio = 0.5;
          break;
      }

      // If target size specified, calculate required compression
      if (targetSize && targetSize < originalSize) {
        compressionRatio = targetSize / originalSize;
      }

      // Simulate compression (in production, use actual audio compression)
      const compressedSize = Math.floor(originalSize * compressionRatio);
      const compressedData = new ArrayBuffer(compressedSize);
      
      // Copy data (simplified - real compression would process audio)
      const sourceView = new Uint8Array(audioData);
      const targetView = new Uint8Array(compressedData);
      
      for (let i = 0; i < compressedSize; i++) {
        targetView[i] = sourceView[Math.floor(i / compressionRatio)];
      }

      return compressedData;
    } catch (error) {
      throw new Error(`AudioOptimizationService.optimizeAudioCompression: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get optimization metrics
   */
  async getOptimizationMetrics(): Promise<OptimizationMetrics> {
    try {
      // Calculate cache hit rate
      const totalCacheAccesses = Array.from(this.cache.values())
        .reduce((sum, entry) => sum + entry.accessCount, 0);
      const cacheHitRate = totalCacheAccesses > 0 ? 
        (this.cache.size / totalCacheAccesses) * 100 : 0;

      // Calculate job metrics
      const completedJobs = Array.from(this.activeJobs.values())
        .filter(job => job.status === 'completed');
      
      const totalProcessingTime = completedJobs
        .reduce((sum, job) => {
          if (job.endTime) {
            return sum + (job.endTime.getTime() - job.startTime.getTime());
          }
          return sum;
        }, 0);

      const averageJobDuration = completedJobs.length > 0 ? 
        totalProcessingTime / completedJobs.length : 0;

      // Calculate memory usage
      const memoryUsage = Array.from(this.cache.values())
        .reduce((sum, entry) => sum + entry.size, 0);

      return {
        totalProcessingTime,
        cacheHitRate,
        parallelJobsExecuted: completedJobs.length,
        averageJobDuration,
        memoryUsage,
        diskUsage: memoryUsage // Simplified - same as memory for now
      };
    } catch (error) {
      throw new Error(`AudioOptimizationService.getOptimizationMetrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear cache and reset optimization state
   */
  async clearOptimizationCache(): Promise<void> {
    try {
      // Clear memory cache
      this.cache.clear();

      // Clear database cache
      await supabase
        .from('audio_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      // Reset job tracking
      this.activeJobs.clear();
      this.processingQueue = [];
    } catch (error) {
      throw new Error(`AudioOptimizationService.clearOptimizationCache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private method: Create processing job
   */
  private async createProcessingJob(type: ProcessingJob['type'], inputData: any): Promise<ProcessingJob> {
    const job: ProcessingJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'queued',
      progress: 0,
      startTime: new Date(),
      inputData
    };

    this.activeJobs.set(job.id, job);
    return job;
  }

  /**
   * Private method: Complete processing job
   */
  private async completeJob(jobId: string, outputData: any): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date();
      job.outputData = outputData;
    }
  }

  /**
   * Private method: Fail processing job
   */
  private async failJob(jobId: string, errorMessage: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.errorMessage = errorMessage;
      job.endTime = new Date();
    }
  }

  /**
   * Private method: Chunk array for parallel processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Private method: Compress audio data
   */
  private async compressAudioData(audioData: ArrayBuffer): Promise<ArrayBuffer> {
    // Simplified compression - in production use actual audio compression
    return await this.optimizeAudioCompression(audioData);
  }

  /**
   * Private method: Decompress audio data
   */
  private async decompressAudioData(compressedData: ArrayBuffer): Promise<ArrayBuffer> {
    // Simplified decompression - in production use actual audio decompression
    return compressedData; // For now, return as-is
  }

  /**
   * Private method: Split text into chunks
   */
  private splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Private method: Generate cache key
   */
  private generateCacheKey(text: string, voiceSettings: any): string {
    const settingsStr = JSON.stringify(voiceSettings);
    const hash = this.simpleHash(text + settingsStr);
    return `audio_${hash}`;
  }

  /**
   * Private method: Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Private method: Generate audio using real TTS service
   */
  private async generateAudioComplete(text: string, voiceSettings: any): Promise<ArrayBuffer> {
    try {
      // Use the TTS service to generate real audio
      const { ttsService } = await import('./tts-service');
      
      // Extract voice settings
      const provider = voiceSettings.provider || 'google';
      const voiceId = voiceSettings.voiceId || 'en-US-Standard-A';
      const apiKey = voiceSettings.apiKey;
      
      if (!apiKey) {
        throw new Error('API key required for audio generation');
      }
      
      // Generate audio using TTS service
      const audioResult = await ttsService.generateSpeech({
        text,
        provider,
        voiceId,
        apiKey,
        speed: voiceSettings.speed || 1.0,
        pitch: voiceSettings.pitch || 0,
        volume: voiceSettings.volume || 1.0
      });
      
      // Convert base64 audio to ArrayBuffer if needed
      if (typeof audioResult.audioContent === 'string') {
        const binaryString = atob(audioResult.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
      
      return audioResult.audioContent;
    } catch (error) {
      console.error('Audio generation error:', error);
      // Fallback: return empty audio buffer
      return new ArrayBuffer(0);
    }
  }

  /**
   * Private method: Combine audio chunks
   */
  private async combineAudioChunks(chunks: ArrayBuffer[]): Promise<ArrayBuffer> {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const combined = new ArrayBuffer(totalSize);
    const combinedView = new Uint8Array(combined);
    
    let offset = 0;
    for (const chunk of chunks) {
      const chunkView = new Uint8Array(chunk);
      combinedView.set(chunkView, offset);
      offset += chunk.byteLength;
    }
    
    return combined;
  }

  /**
   * Private method: Clean up expired cache entries
   */
  private async cleanupExpiredCache(): Promise<void> {
    const now = new Date();
    
    // Clean memory cache
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }

    // Clean database cache
    await supabase
      .from('audio_cache')
      .delete()
      .lt('expires_at', now.toISOString());
  }
}

export const audioOptimizationService = new AudioOptimizationService();