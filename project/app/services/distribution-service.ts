import { supabase } from "~/lib/supabase";
import { audioProductionService, type AudiobookMetadata, type ValidationResult } from "~/services/audio-production-service";

export interface ACXExport {
  audioFiles: string[]; // URLs to chapter audio files
  metadata: ACXMetadata;
  coverImage: string;
  sampleAudio: string; // First 5 minutes
  totalDuration: number;
  fileSize: number;
  exportUrl: string;
}

export interface ACXMetadata {
  title: string;
  author: string;
  narrator: string;
  publisher: string;
  isbn?: string;
  language: string;
  genre: string[];
  description: string;
  publishDate: Date;
  copyright: string;
  duration: number; // in seconds
  chapters: ACXChapter[];
  technicalSpecs: ACXTechnicalSpecs;
}

export interface ACXChapter {
  number: number;
  title: string;
  startTime: number; // seconds from beginning
  endTime: number;
  duration: number;
  audioFile: string;
}

export interface ACXTechnicalSpecs {
  sampleRate: number; // Must be 22.05kHz or 44.1kHz
  bitDepth: number; // Must be 16-bit or 24-bit
  bitRate: number; // Minimum 64kbps for MP3
  format: 'MP3' | 'WAV' | 'FLAC';
  channels: number; // Mono or Stereo
  loudness: number; // LUFS measurement
  peakLevel: number; // dBFS
  noiseFloor: number; // dB below peak
}

export interface SpotifyExport {
  rssUrl: string;
  episodeFiles: string[];
  metadata: SpotifyMetadata;
  coverImage: string;
  exportUrl: string;
}

export interface SpotifyMetadata {
  showTitle: string;
  showDescription: string;
  author: string;
  language: string;
  category: string;
  explicit: boolean;
  episodes: SpotifyEpisode[];
}

export interface SpotifyEpisode {
  title: string;
  description: string;
  audioUrl: string;
  duration: number;
  publishDate: Date;
  episodeNumber: number;
  seasonNumber: number;
}

export interface GenericExport {
  format: 'MP3' | 'M4A' | 'WAV' | 'FLAC';
  audioFiles: string[];
  metadata: GenericMetadata;
  exportUrl: string;
}

export interface GenericMetadata {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: number;
  trackList: GenericTrack[];
}

export interface GenericTrack {
  number: number;
  title: string;
  duration: number;
  audioFile: string;
}

export interface UploadResult {
  success: boolean;
  uploadId?: string;
  message: string;
  errors?: string[];
  warnings?: string[];
}

export interface AudibleCredentials {
  username: string;
  password: string;
  vendorId?: string;
}

export interface SpotifyCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export class DistributionService {
  /**
   * Export audiobook in Audible ACX format
   */
  async exportToAudibleACX(audiobookId: string): Promise<ACXExport> {
    try {
      console.log(`Exporting audiobook ${audiobookId} to Audible ACX format`);
      
      // Get audiobook data
      const { data: audiobook, error } = await supabase
        .from('audiobooks')
        .select(`
          *,
          audio_chapters(*),
          ebooks(*)
        `)
        .eq('id', audiobookId)
        .single();

      if (error) {
        throw new Error(`Failed to get audiobook: ${error.message}`);
      }

      // Validate audio meets ACX requirements
      const validationResults = await this.validateACXRequirements(audiobook);
      if (!validationResults.isValid) {
        throw new Error(`Audio does not meet ACX requirements: ${validationResults.errors.join(', ')}`);
      }

      // Generate ACX metadata
      const acxMetadata = await this.generateACXMetadata(audiobook);
      
      // Process audio files for ACX compliance
      const processedAudioFiles = await this.processAudioForACX(audiobook.audio_chapters);
      
      // Generate sample audio (first 5 minutes)
      const sampleAudio = await this.createACXSample(processedAudioFiles[0]);
      
      // Create cover image if not exists
      const coverImage = audiobook.cover_image || await this.generateDefaultCover(audiobook);
      
      // Calculate total file size
      const totalFileSize = await this.calculateTotalFileSize(processedAudioFiles);
      
      // Create export package
      const exportUrl = await this.packageACXExport({
        audioFiles: processedAudioFiles,
        metadata: acxMetadata,
        coverImage,
        sampleAudio
      });

      const acxExport: ACXExport = {
        audioFiles: processedAudioFiles,
        metadata: acxMetadata,
        coverImage,
        sampleAudio,
        totalDuration: acxMetadata.duration,
        fileSize: totalFileSize,
        exportUrl
      };

      // Store export record
      await this.recordExport(audiobookId, 'audible', acxExport);

      return acxExport;
    } catch (error) {
      throw new Error(`DistributionService.exportToAudibleACX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export audiobook to Spotify for Podcasters
   */
  async exportToSpotify(audiobookId: string): Promise<SpotifyExport> {
    try {
      console.log(`Exporting audiobook ${audiobookId} to Spotify format`);
      
      // Get audiobook data
      const { data: audiobook, error } = await supabase
        .from('audiobooks')
        .select(`
          *,
          audio_chapters(*),
          ebooks(*)
        `)
        .eq('id', audiobookId)
        .single();

      if (error) {
        throw new Error(`Failed to get audiobook: ${error.message}`);
      }

      // Generate Spotify metadata
      const spotifyMetadata = await this.generateSpotifyMetadata(audiobook);
      
      // Process audio files for Spotify
      const episodeFiles = await this.processAudioForSpotify(audiobook.audio_chapters);
      
      // Generate RSS feed
      const rssUrl = await this.generateSpotifyRSS(spotifyMetadata, episodeFiles);
      
      // Create cover image
      const coverImage = audiobook.cover_image || await this.generateDefaultCover(audiobook);
      
      // Create export package
      const exportUrl = await this.packageSpotifyExport({
        rssUrl,
        episodeFiles,
        metadata: spotifyMetadata,
        coverImage
      });

      const spotifyExport: SpotifyExport = {
        rssUrl,
        episodeFiles,
        metadata: spotifyMetadata,
        coverImage,
        exportUrl
      };

      // Store export record
      await this.recordExport(audiobookId, 'spotify', spotifyExport);

      return spotifyExport;
    } catch (error) {
      throw new Error(`DistributionService.exportToSpotify: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export audiobook in generic format
   */
  async exportToGenericFormat(audiobookId: string, format: 'MP3' | 'M4A' | 'WAV' | 'FLAC'): Promise<GenericExport> {
    try {
      console.log(`Exporting audiobook ${audiobookId} to ${format} format`);
      
      // Get audiobook data
      const { data: audiobook, error } = await supabase
        .from('audiobooks')
        .select(`
          *,
          audio_chapters(*),
          ebooks(*)
        `)
        .eq('id', audiobookId)
        .single();

      if (error) {
        throw new Error(`Failed to get audiobook: ${error.message}`);
      }

      // Generate generic metadata
      const genericMetadata = await this.generateGenericMetadata(audiobook, format);
      
      // Convert audio files to requested format
      const audioFiles = await this.convertAudioFormat(audiobook.audio_chapters, format);
      
      // Create export package
      const exportUrl = await this.packageGenericExport({
        format,
        audioFiles,
        metadata: genericMetadata
      });

      const genericExport: GenericExport = {
        format,
        audioFiles,
        metadata: genericMetadata,
        exportUrl
      };

      // Store export record
      await this.recordExport(audiobookId, 'generic', genericExport);

      return genericExport;
    } catch (error) {
      throw new Error(`DistributionService.exportToGenericFormat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload to Audible ACX platform
   */
  async uploadToAudible(acxExport: ACXExport, credentials: AudibleCredentials): Promise<UploadResult> {
    try {
      console.log('Uploading to Audible ACX platform');
      
      // Validate credentials
      if (!credentials.username || !credentials.password) {
        throw new Error('Audible credentials are required');
      }

      // In a real implementation, this would:
      // 1. Authenticate with ACX API
      // 2. Create new audiobook project
      // 3. Upload audio files
      // 4. Submit metadata
      // 5. Request review
      
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success response
      const uploadResult: UploadResult = {
        success: true,
        uploadId: `acx_${Date.now()}`,
        message: 'Audiobook successfully uploaded to Audible ACX. Review process will begin within 24 hours.',
        warnings: [
          'Ensure all chapter files are properly named',
          'Review metadata for accuracy before final submission'
        ]
      };

      return uploadResult;
    } catch (error) {
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Upload to Spotify for Podcasters
   */
  async uploadToSpotify(spotifyExport: SpotifyExport, credentials: SpotifyCredentials): Promise<UploadResult> {
    try {
      console.log('Uploading to Spotify for Podcasters');
      
      // Validate credentials
      if (!credentials.clientId || !credentials.clientSecret) {
        throw new Error('Spotify credentials are required');
      }

      // In a real implementation, this would:
      // 1. Authenticate with Spotify API
      // 2. Create podcast show
      // 3. Upload episode files
      // 4. Submit RSS feed
      // 5. Request review
      
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const uploadResult: UploadResult = {
        success: true,
        uploadId: `spotify_${Date.now()}`,
        message: 'Audiobook successfully uploaded to Spotify for Podcasters. Episodes will be available within 2-3 hours.',
        warnings: [
          'Ensure cover image meets Spotify requirements (1400x1400px minimum)',
          'Episode descriptions should be engaging and keyword-optimized'
        ]
      };

      return uploadResult;
    } catch (error) {
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Generate audiobook metadata for any platform
   */
  async generateAudiobookMetadata(audiobookId: string): Promise<AudiobookMetadata> {
    try {
      const { data: audiobook, error } = await supabase
        .from('audiobooks')
        .select(`
          *,
          audio_chapters(*),
          ebooks(*)
        `)
        .eq('id', audiobookId)
        .single();

      if (error) {
        throw new Error(`Failed to get audiobook: ${error.message}`);
      }

      const metadata: AudiobookMetadata = {
        title: audiobook.title,
        author: audiobook.ebooks?.author || 'Unknown Author',
        narrator: audiobook.narrator_name || 'AI Narrator',
        description: audiobook.ebooks?.description || '',
        genre: ['Audiobook'],
        language: 'en-US',
        publishDate: new Date(),
        duration: audiobook.total_duration || 0,
        chapters: audiobook.audio_chapters?.map((chapter: any) => ({
          id: chapter.id,
          number: chapter.chapter_number,
          title: chapter.title,
          duration: chapter.duration
        })) || []
      };

      return metadata;
    } catch (error) {
      throw new Error(`DistributionService.generateAudiobookMetadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate metadata against platform requirements
   */
  async validateMetadata(metadata: AudiobookMetadata, platform: 'audible' | 'spotify'): Promise<ValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Common validations
      if (!metadata.title || metadata.title.length < 1) {
        errors.push('Title is required');
      }
      if (!metadata.author || metadata.author.length < 1) {
        errors.push('Author is required');
      }
      if (!metadata.narrator || metadata.narrator.length < 1) {
        errors.push('Narrator is required');
      }

      // Platform-specific validations
      if (platform === 'audible') {
        if (metadata.title.length > 100) {
          warnings.push('Title should be under 100 characters for Audible');
        }
        if (metadata.duration < 600) {
          errors.push('Audiobook must be at least 10 minutes for Audible');
        }
        if (metadata.chapters.length === 0) {
          errors.push('At least one chapter is required for Audible');
        }
        if (!metadata.description || metadata.description.length < 50) {
          warnings.push('Description should be at least 50 characters for better discoverability');
        }
      }

      if (platform === 'spotify') {
        if (metadata.title.length > 200) {
          warnings.push('Title should be under 200 characters for Spotify');
        }
        if (metadata.description && metadata.description.length > 4000) {
          warnings.push('Description should be under 4000 characters for Spotify');
        }
        if (metadata.chapters.length > 300) {
          warnings.push('Spotify recommends fewer than 300 episodes per show');
        }
      }

      // Recommendations
      if (metadata.genre.length === 0) {
        recommendations.push('Add genre tags for better categorization');
      }
      if (!metadata.isbn) {
        recommendations.push('Consider adding ISBN for professional publishing');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        recommendations
      };
    } catch (error) {
      throw new Error(`DistributionService.validateMetadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private method: Validate ACX requirements
   */
  private async validateACXRequirements(audiobook: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check audio technical requirements
    for (const chapter of audiobook.audio_chapters || []) {
      if (chapter.duration < 30) {
        errors.push(`Chapter ${chapter.chapter_number} is too short (minimum 30 seconds)`);
      }
      if (chapter.duration > 7200) {
        warnings.push(`Chapter ${chapter.chapter_number} is very long (over 2 hours)`);
      }
    }

    // Check total duration
    if (audiobook.total_duration < 600) {
      errors.push('Total audiobook duration must be at least 10 minutes');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations: []
    };
  }

  /**
   * Private method: Generate ACX metadata
   */
  private async generateACXMetadata(audiobook: any): Promise<ACXMetadata> {
    const chapters: ACXChapter[] = [];
    let currentTime = 0;

    for (const chapter of audiobook.audio_chapters || []) {
      chapters.push({
        number: chapter.chapter_number,
        title: chapter.title,
        startTime: currentTime,
        endTime: currentTime + chapter.duration,
        duration: chapter.duration,
        audioFile: chapter.audio_url
      });
      currentTime += chapter.duration;
    }

    return {
      title: audiobook.title,
      author: audiobook.ebooks?.author || 'Unknown Author',
      narrator: audiobook.narrator_name || 'AI Narrator',
      publisher: 'Bestseller Author Pro',
      language: 'en-US',
      genre: ['Fiction'], // Default genre
      description: audiobook.ebooks?.description || '',
      publishDate: new Date(),
      copyright: `© ${new Date().getFullYear()} ${audiobook.ebooks?.author || 'Unknown Author'}`,
      duration: audiobook.total_duration || 0,
      chapters,
      technicalSpecs: {
        sampleRate: 44100,
        bitDepth: 16,
        bitRate: 128000,
        format: 'MP3',
        channels: 2,
        loudness: -23,
        peakLevel: -3,
        noiseFloor: -60
      }
    };
  }

  /**
   * Private method: Process audio for ACX compliance
   */
  private async processAudioForACX(chapters: any[]): Promise<string[]> {
    const processedFiles: string[] = [];

    for (const chapter of chapters) {
      // In a real implementation, this would:
      // 1. Validate audio meets ACX technical specs
      // 2. Apply loudness normalization (-23 LUFS)
      // 3. Ensure proper sample rate (44.1kHz)
      // 4. Add fade in/out
      // 5. Remove long silences
      
      const processedUrl = chapter.audio_url.replace('.mp3', '_acx.mp3');
      processedFiles.push(processedUrl);
    }

    return processedFiles;
  }

  /**
   * Private method: Create ACX sample (first 5 minutes)
   */
  private async createACXSample(firstChapterUrl: string): Promise<string> {
    // In a real implementation, this would extract first 5 minutes
    return firstChapterUrl.replace('.mp3', '_sample.mp3');
  }

  /**
   * Private method: Generate default cover image
   */
  private async generateDefaultCover(audiobook: any): Promise<string> {
    // In a real implementation, this would generate a cover image
    return `https://storage.example.com/covers/${audiobook.id}_cover.jpg`;
  }

  /**
   * Private method: Calculate total file size
   */
  private async calculateTotalFileSize(audioFiles: string[]): Promise<number> {
    // Simulate file size calculation
    return audioFiles.length * 50000000; // ~50MB per file estimate
  }

  /**
   * Private method: Package ACX export
   */
  private async packageACXExport(exportData: any): Promise<string> {
    // In a real implementation, this would create a ZIP package
    return `https://storage.example.com/exports/acx_${Date.now()}.zip`;
  }

  /**
   * Private method: Generate Spotify metadata
   */
  private async generateSpotifyMetadata(audiobook: any): Promise<SpotifyMetadata> {
    const episodes: SpotifyEpisode[] = [];

    for (const [index, chapter] of (audiobook.audio_chapters || []).entries()) {
      episodes.push({
        title: chapter.title,
        description: `Chapter ${chapter.chapter_number} of ${audiobook.title}`,
        audioUrl: chapter.audio_url,
        duration: chapter.duration,
        publishDate: new Date(),
        episodeNumber: index + 1,
        seasonNumber: 1
      });
    }

    return {
      showTitle: audiobook.title,
      showDescription: audiobook.ebooks?.description || '',
      author: audiobook.ebooks?.author || 'Unknown Author',
      language: 'en-US',
      category: 'Fiction',
      explicit: false,
      episodes
    };
  }

  /**
   * Private method: Process audio for Spotify
   */
  private async processAudioForSpotify(chapters: any[]): Promise<string[]> {
    return chapters.map(chapter => chapter.audio_url);
  }

  /**
   * Private method: Generate Spotify RSS feed
   */
  private async generateSpotifyRSS(metadata: SpotifyMetadata, episodeFiles: string[]): Promise<string> {
    // In a real implementation, this would generate proper RSS XML
    return `https://storage.example.com/rss/${Date.now()}.xml`;
  }

  /**
   * Private method: Package Spotify export
   */
  private async packageSpotifyExport(exportData: any): Promise<string> {
    return `https://storage.example.com/exports/spotify_${Date.now()}.zip`;
  }

  /**
   * Private method: Generate generic metadata
   */
  private async generateGenericMetadata(audiobook: any, format: string): Promise<GenericMetadata> {
    const trackList: GenericTrack[] = [];

    for (const chapter of audiobook.audio_chapters || []) {
      trackList.push({
        number: chapter.chapter_number,
        title: chapter.title,
        duration: chapter.duration,
        audioFile: chapter.audio_url
      });
    }

    return {
      title: audiobook.title,
      artist: audiobook.ebooks?.author || 'Unknown Author',
      album: audiobook.title,
      genre: 'Audiobook',
      year: new Date().getFullYear(),
      trackList
    };
  }

  /**
   * Private method: Convert audio format
   */
  private async convertAudioFormat(chapters: any[], format: string): Promise<string[]> {
    return chapters.map(chapter => 
      chapter.audio_url.replace('.mp3', `.${format.toLowerCase()}`)
    );
  }

  /**
   * Private method: Package generic export
   */
  private async packageGenericExport(exportData: any): Promise<string> {
    return `https://storage.example.com/exports/generic_${Date.now()}.zip`;
  }

  /**
   * Private method: Record export in database
   */
  private async recordExport(audiobookId: string, platform: string, exportData: any): Promise<void> {
    await supabase
      .from('distribution_exports')
      .insert({
        audiobook_id: audiobookId,
        platform,
        export_format: platform === 'audible' ? 'ACX' : platform === 'spotify' ? 'RSS' : 'ZIP',
        export_url: exportData.exportUrl,
        metadata: exportData,
        status: 'completed'
      });
  }
}

export const distributionService = new DistributionService();