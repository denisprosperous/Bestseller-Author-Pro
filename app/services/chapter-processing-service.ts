import { supabase } from "~/lib/supabase";
import { audioProductionService, type ChapterMetadata, type AudiobookMetadata, type IntroOutroAudio } from "~/services/audio-production-service";

export interface ChapterBreak {
  chapterNumber: number;
  title: string;
  startPosition: number; // Character position in text
  endPosition: number;
  estimatedDuration: number;
}

export interface NavigationMarker {
  id: string;
  type: 'chapter' | 'section' | 'bookmark';
  title: string;
  timestamp: number; // seconds
  chapterNumber?: number;
  description?: string;
}

export interface ProcessingJob {
  id: string;
  audiobookId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterProcessingResult {
  chapterId: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
  qualityScore: number;
  markers: NavigationMarker[];
  processingTime: number;
}

export class ChapterProcessingService {
  /**
   * Automatically detect chapter breaks in text content
   */
  async detectChapterBreaks(content: string): Promise<ChapterBreak[]> {
    try {
      console.log('Detecting chapter breaks in content');
      
      const chapterBreaks: ChapterBreak[] = [];
      
      // Common chapter patterns
      const chapterPatterns = [
        /^Chapter\s+(\d+)[:\s]*(.*)$/gim,
        /^(\d+)\.\s*(.*)$/gm,
        /^Part\s+(\d+)[:\s]*(.*)$/gim,
        /^Section\s+(\d+)[:\s]*(.*)$/gim
      ];
      
      let chapterNumber = 1;
      
      for (const pattern of chapterPatterns) {
        let match;
        pattern.lastIndex = 0; // Reset regex
        
        while ((match = pattern.exec(content)) !== null) {
          const title = match[2]?.trim() || `Chapter ${chapterNumber}`;
          const startPosition = match.index;
          
          // Find the end position (start of next chapter or end of content)
          const nextMatch = pattern.exec(content);
          const endPosition = nextMatch ? nextMatch.index : content.length;
          pattern.lastIndex = match.index + 1; // Continue from current position
          
          const chapterText = content.substring(startPosition, endPosition);
          const estimatedDuration = Math.ceil(chapterText.length / 10); // 10 chars per second estimate
          
          chapterBreaks.push({
            chapterNumber,
            title,
            startPosition,
            endPosition,
            estimatedDuration
          });
          
          chapterNumber++;
          
          if (!nextMatch) break;
        }
        
        if (chapterBreaks.length > 0) break; // Use first successful pattern
      }
      
      // If no patterns matched, create single chapter
      if (chapterBreaks.length === 0) {
        chapterBreaks.push({
          chapterNumber: 1,
          title: 'Full Content',
          startPosition: 0,
          endPosition: content.length,
          estimatedDuration: Math.ceil(content.length / 10)
        });
      }
      
      return chapterBreaks;
    } catch (error) {
      throw new Error(`ChapterProcessingService.detectChapterBreaks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate navigation markers for chapters
   */
  async generateNavigationMarkers(chapters: ChapterMetadata[]): Promise<NavigationMarker[]> {
    try {
      console.log(`Generating navigation markers for ${chapters.length} chapters`);
      
      const markers: NavigationMarker[] = [];
      let currentTimestamp = 0;
      
      chapters.forEach((chapter, index) => {
        // Main chapter marker
        markers.push({
          id: `chapter-${chapter.number}`,
          type: 'chapter',
          title: chapter.title,
          timestamp: currentTimestamp,
          chapterNumber: chapter.number,
          description: `Chapter ${chapter.number}: ${chapter.title}`
        });
        
        // Add section markers within longer chapters (>10 minutes)
        if (chapter.duration > 600) {
          const sectionCount = Math.floor(chapter.duration / 300); // Every 5 minutes
          for (let i = 1; i < sectionCount; i++) {
            const sectionTimestamp = currentTimestamp + (i * 300);
            markers.push({
              id: `section-${chapter.number}-${i}`,
              type: 'section',
              title: `${chapter.title} - Part ${i + 1}`,
              timestamp: sectionTimestamp,
              chapterNumber: chapter.number,
              description: `Section ${i + 1} of Chapter ${chapter.number}`
            });
          }
        }
        
        currentTimestamp += chapter.duration;
      });
      
      return markers;
    } catch (error) {
      throw new Error(`ChapterProcessingService.generateNavigationMarkers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create professional intro segment
   */
  async createIntroSegment(audiobookMetadata: AudiobookMetadata): Promise<IntroOutroAudio> {
    try {
      console.log(`Creating intro segment for: ${audiobookMetadata.title}`);
      
      return await audioProductionService.generateIntroOutro(audiobookMetadata);
    } catch (error) {
      throw new Error(`ChapterProcessingService.createIntroSegment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process all chapters for an audiobook with progress tracking
   */
  async processAudiobookChapters(
    audiobookId: string,
    chapters: ChapterMetadata[],
    options: {
      addIntroOutro?: boolean;
      backgroundMusic?: string;
      musicVolume?: number;
      qualityLevel?: 'standard' | 'high' | 'premium';
    } = {}
  ): Promise<ProcessingJob> {
    try {
      console.log(`Starting audiobook processing for ${chapters.length} chapters`);
      
      // Create processing job
      const { data: job, error: jobError } = await supabase
        .from('processing_jobs')
        .insert({
          audiobook_id: audiobookId,
          status: 'pending',
          progress: 0,
          current_step: 'Initializing',
          total_steps: this.calculateTotalSteps(chapters.length, options),
          completed_steps: 0
        })
        .select()
        .single();

      if (jobError) {
        throw new Error(`Failed to create processing job: ${jobError.message}`);
      }

      // Start processing in background
      this.processChaptersAsync(job.id, audiobookId, chapters, options);
      
      return this.mapDatabaseToProcessingJob(job);
    } catch (error) {
      throw new Error(`ChapterProcessingService.processAudiobookChapters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get processing job status
   */
  async getProcessingJobStatus(jobId: string): Promise<ProcessingJob | null> {
    try {
      const { data, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get processing job: ${error.message}`);
      }

      return this.mapDatabaseToProcessingJob(data);
    } catch (error) {
      throw new Error(`ChapterProcessingService.getProcessingJobStatus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel a processing job
   */
  async cancelProcessingJob(jobId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('processing_jobs')
        .update({ 
          status: 'failed',
          error_message: 'Cancelled by user'
        })
        .eq('id', jobId);

      if (error) {
        throw new Error(`Failed to cancel processing job: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`ChapterProcessingService.cancelProcessingJob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate table of contents with timestamps
   */
  async generateTableOfContents(chapters: ChapterMetadata[]): Promise<string> {
    try {
      console.log('Generating table of contents');
      
      let toc = 'Table of Contents\n\n';
      let currentTime = 0;
      
      chapters.forEach((chapter, index) => {
        const hours = Math.floor(currentTime / 3600);
        const minutes = Math.floor((currentTime % 3600) / 60);
        const seconds = currentTime % 60;
        
        const timestamp = hours > 0 
          ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          : `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        toc += `Chapter ${chapter.number}: ${chapter.title} - ${timestamp}\n`;
        currentTime += chapter.duration;
      });
      
      return toc;
    } catch (error) {
      throw new Error(`ChapterProcessingService.generateTableOfContents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate chapter structure and content
   */
  async validateChapterStructure(chapters: ChapterMetadata[]): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Check for empty chapters
      chapters.forEach(chapter => {
        if (chapter.duration <= 0) {
          errors.push(`Chapter ${chapter.number} has no duration`);
        }
        if (!chapter.title || chapter.title.trim().length === 0) {
          errors.push(`Chapter ${chapter.number} has no title`);
        }
        if (chapter.duration < 30) {
          warnings.push(`Chapter ${chapter.number} is very short (${chapter.duration}s)`);
        }
        if (chapter.duration > 3600) {
          warnings.push(`Chapter ${chapter.number} is very long (${Math.floor(chapter.duration / 60)} minutes)`);
        }
      });
      
      // Check for duplicate chapter numbers
      const chapterNumbers = chapters.map(c => c.number);
      const duplicates = chapterNumbers.filter((num, index) => chapterNumbers.indexOf(num) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate chapter numbers found: ${duplicates.join(', ')}`);
      }
      
      // Check for sequential numbering
      const sortedNumbers = [...chapterNumbers].sort((a, b) => a - b);
      for (let i = 0; i < sortedNumbers.length - 1; i++) {
        if (sortedNumbers[i + 1] - sortedNumbers[i] > 1) {
          warnings.push(`Gap in chapter numbering between ${sortedNumbers[i]} and ${sortedNumbers[i + 1]}`);
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      throw new Error(`ChapterProcessingService.validateChapterStructure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private method: Process chapters asynchronously
   */
  private async processChaptersAsync(
    jobId: string,
    audiobookId: string,
    chapters: ChapterMetadata[],
    options: any
  ): Promise<void> {
    try {
      let completedSteps = 0;
      const totalSteps = this.calculateTotalSteps(chapters.length, options);
      
      // Update job status
      await this.updateJobProgress(jobId, 'processing', 'Processing chapters', completedSteps, totalSteps);
      
      // Process each chapter
      for (const chapter of chapters) {
        await this.updateJobProgress(jobId, 'processing', `Processing Chapter ${chapter.number}`, completedSteps, totalSteps);
        
        // Simulate chapter processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        completedSteps++;
        await this.updateJobProgress(jobId, 'processing', `Completed Chapter ${chapter.number}`, completedSteps, totalSteps);
      }
      
      // Add intro/outro if requested
      if (options.addIntroOutro) {
        await this.updateJobProgress(jobId, 'processing', 'Adding intro/outro', completedSteps, totalSteps);
        await new Promise(resolve => setTimeout(resolve, 1000));
        completedSteps++;
      }
      
      // Final processing steps
      await this.updateJobProgress(jobId, 'processing', 'Finalizing audiobook', completedSteps, totalSteps);
      await new Promise(resolve => setTimeout(resolve, 1000));
      completedSteps++;
      
      // Mark as completed
      await this.updateJobProgress(jobId, 'completed', 'Processing complete', totalSteps, totalSteps);
      
    } catch (error) {
      await supabase
        .from('processing_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', jobId);
    }
  }

  /**
   * Private method: Update job progress
   */
  private async updateJobProgress(
    jobId: string,
    status: string,
    currentStep: string,
    completedSteps: number,
    totalSteps: number
  ): Promise<void> {
    const progress = Math.round((completedSteps / totalSteps) * 100);
    
    await supabase
      .from('processing_jobs')
      .update({
        status,
        progress,
        current_step: currentStep,
        completed_steps: completedSteps
      })
      .eq('id', jobId);
  }

  /**
   * Private method: Calculate total processing steps
   */
  private calculateTotalSteps(chapterCount: number, options: any): number {
    let steps = chapterCount; // One step per chapter
    
    if (options.addIntroOutro) {
      steps += 1; // Intro/outro generation
    }
    
    steps += 1; // Final processing
    
    return steps;
  }

  /**
   * Private method: Map database record to ProcessingJob
   */
  private mapDatabaseToProcessingJob(data: any): ProcessingJob {
    return {
      id: data.id,
      audiobookId: data.audiobook_id,
      status: data.status,
      progress: data.progress,
      currentStep: data.current_step,
      totalSteps: data.total_steps,
      completedSteps: data.completed_steps,
      errorMessage: data.error_message,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

export const chapterProcessingService = new ChapterProcessingService();