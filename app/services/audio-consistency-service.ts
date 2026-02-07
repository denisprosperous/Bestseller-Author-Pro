import { supabase } from "~/lib/supabase";

export interface VoiceConsistencyReport {
  overallScore: number; // 1-10
  issues: ConsistencyIssue[];
  recommendations: string[];
  voiceParameterAnalysis: VoiceParameterAnalysis[];
}

export interface ConsistencyIssue {
  type: 'pitch_variation' | 'speed_variation' | 'tone_inconsistency' | 'pronunciation_mismatch';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedChapters: number[];
  suggestedFix: string;
}

export interface VoiceParameterAnalysis {
  chapterNumber: number;
  voiceId: string;
  parameters: {
    pitch: number;
    speed: number;
    volume: number;
    clarity: number;
  };
  deviationFromBaseline: number;
}

export interface PronunciationCheck {
  word: string;
  expectedPronunciation: string;
  actualPronunciation: string;
  confidence: number;
  chapterOccurrences: number[];
}

export interface AudioQualityMetrics {
  chapterId: string;
  audioUrl: string;
  qualityScore: number;
  technicalSpecs: {
    sampleRate: number;
    bitRate: number;
    channels: number;
    duration: number;
    fileSize: number;
    format: string;
  };
  issues: string[];
  recommendations: string[];
}

export class AudioConsistencyService {
  /**
   * Analyze voice consistency across all chapters of an audiobook
   */
  async analyzeVoiceConsistency(audiobookId: string): Promise<VoiceConsistencyReport> {
    try {
      // Get all audio chapters for the audiobook
      const { data: chapters, error } = await supabase
        .from('audio_chapters')
        .select('*')
        .eq('audiobook_id', audiobookId)
        .order('chapter_number');

      if (error) {
        throw new Error(`Failed to get audio chapters: ${error.message}`);
      }

      if (!chapters || chapters.length === 0) {
        throw new Error('No audio chapters found for audiobook');
      }

      // Analyze voice parameters for each chapter
      const voiceAnalysis = await this.analyzeVoiceParameters(chapters);
      
      // Check for consistency issues
      const issues = this.detectConsistencyIssues(voiceAnalysis);
      
      // Generate recommendations
      const recommendations = this.generateConsistencyRecommendations(issues);
      
      // Calculate overall consistency score
      const overallScore = this.calculateConsistencyScore(voiceAnalysis, issues);

      return {
        overallScore,
        issues,
        recommendations,
        voiceParameterAnalysis: voiceAnalysis
      };
    } catch (error) {
      throw new Error(`AudioConsistencyService.analyzeVoiceConsistency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check pronunciation consistency across chapters
   */
  async checkPronunciationConsistency(audiobookId: string, targetWords: string[]): Promise<PronunciationCheck[]> {
    try {
      const { data: chapters, error } = await supabase
        .from('audio_chapters')
        .select('chapter_number, content, audio_url')
        .eq('audiobook_id', audiobookId)
        .order('chapter_number');

      if (error) {
        throw new Error(`Failed to get chapters: ${error.message}`);
      }

      const pronunciationChecks: PronunciationCheck[] = [];

      for (const word of targetWords) {
        const occurrences: number[] = [];
        let expectedPronunciation = '';
        let actualPronunciation = '';
        let totalConfidence = 0;
        let occurrenceCount = 0;

        // Find chapters containing the word
        for (const chapter of chapters) {
          if (chapter.content.toLowerCase().includes(word.toLowerCase())) {
            occurrences.push(chapter.chapter_number);
            
            // Simulate pronunciation analysis
            // In production, this would use speech recognition API
            const pronunciation = this.simulatePronunciationAnalysis(word, chapter.audio_url);
            
            if (!expectedPronunciation) {
              expectedPronunciation = pronunciation.expected;
            }
            
            actualPronunciation = pronunciation.actual;
            totalConfidence += pronunciation.confidence;
            occurrenceCount++;
          }
        }

        if (occurrenceCount > 0) {
          pronunciationChecks.push({
            word,
            expectedPronunciation,
            actualPronunciation,
            confidence: totalConfidence / occurrenceCount,
            chapterOccurrences: occurrences
          });
        }
      }

      return pronunciationChecks;
    } catch (error) {
      throw new Error(`AudioConsistencyService.checkPronunciationConsistency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate audio quality across all chapters
   */
  async validateAudioQuality(audiobookId: string): Promise<AudioQualityMetrics[]> {
    try {
      const { data: chapters, error } = await supabase
        .from('audio_chapters')
        .select('*')
        .eq('audiobook_id', audiobookId)
        .order('chapter_number');

      if (error) {
        throw new Error(`Failed to get audio chapters: ${error.message}`);
      }

      const qualityMetrics: AudioQualityMetrics[] = [];

      for (const chapter of chapters) {
        const metrics = await this.analyzeAudioQuality(chapter.audio_url);
        
        qualityMetrics.push({
          chapterId: chapter.id,
          audioUrl: chapter.audio_url,
          qualityScore: metrics.qualityScore,
          technicalSpecs: metrics.technicalSpecs,
          issues: metrics.issues,
          recommendations: metrics.recommendations
        });
      }

      return qualityMetrics;
    } catch (error) {
      throw new Error(`AudioConsistencyService.validateAudioQuality: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate voice similarity scores between chapters
   */
  async calculateVoiceSimilarity(audiobookId: string): Promise<number[][]> {
    try {
      const { data: chapters, error } = await supabase
        .from('audio_chapters')
        .select('*')
        .eq('audiobook_id', audiobookId)
        .order('chapter_number');

      if (error) {
        throw new Error(`Failed to get audio chapters: ${error.message}`);
      }

      const similarityMatrix: number[][] = [];
      
      for (let i = 0; i < chapters.length; i++) {
        similarityMatrix[i] = [];
        
        for (let j = 0; j < chapters.length; j++) {
          if (i === j) {
            similarityMatrix[i][j] = 1.0; // Perfect similarity with itself
          } else {
            // Calculate similarity between chapters i and j
            const similarity = await this.calculateChapterSimilarity(
              chapters[i].audio_url,
              chapters[j].audio_url
            );
            similarityMatrix[i][j] = similarity;
          }
        }
      }

      return similarityMatrix;
    } catch (error) {
      throw new Error(`AudioConsistencyService.calculateVoiceSimilarity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Track voice parameters across chapters
   */
  private async analyzeVoiceParameters(chapters: any[]): Promise<VoiceParameterAnalysis[]> {
    const analysis: VoiceParameterAnalysis[] = [];
    let baselineParameters: any = null;

    for (const chapter of chapters) {
      // Simulate voice parameter extraction
      // In production, this would use audio analysis libraries
      const parameters = {
        pitch: Math.random() * 100 + 150, // Hz
        speed: Math.random() * 50 + 150, // words per minute
        volume: Math.random() * 20 + 70, // dB
        clarity: Math.random() * 2 + 8 // 8-10 scale
      };

      // Set baseline from first chapter
      if (!baselineParameters) {
        baselineParameters = { ...parameters };
      }

      // Calculate deviation from baseline
      const deviation = Math.sqrt(
        Math.pow((parameters.pitch - baselineParameters.pitch) / baselineParameters.pitch, 2) +
        Math.pow((parameters.speed - baselineParameters.speed) / baselineParameters.speed, 2) +
        Math.pow((parameters.volume - baselineParameters.volume) / baselineParameters.volume, 2) +
        Math.pow((parameters.clarity - baselineParameters.clarity) / baselineParameters.clarity, 2)
      );

      analysis.push({
        chapterNumber: chapter.chapter_number,
        voiceId: chapter.voice_id || 'default',
        parameters,
        deviationFromBaseline: deviation
      });
    }

    return analysis;
  }

  /**
   * Detect consistency issues from voice analysis
   */
  private detectConsistencyIssues(analysis: VoiceParameterAnalysis[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const deviationThreshold = 0.15; // 15% deviation threshold

    // Check for pitch variations
    const pitchDeviations = analysis.filter(a => 
      Math.abs(a.parameters.pitch - analysis[0].parameters.pitch) / analysis[0].parameters.pitch > deviationThreshold
    );

    if (pitchDeviations.length > 0) {
      issues.push({
        type: 'pitch_variation',
        severity: pitchDeviations.length > analysis.length / 2 ? 'high' : 'medium',
        description: `Significant pitch variations detected in ${pitchDeviations.length} chapters`,
        affectedChapters: pitchDeviations.map(d => d.chapterNumber),
        suggestedFix: 'Normalize pitch settings across all chapters or use consistent voice parameters'
      });
    }

    // Check for speed variations
    const speedDeviations = analysis.filter(a => 
      Math.abs(a.parameters.speed - analysis[0].parameters.speed) / analysis[0].parameters.speed > deviationThreshold
    );

    if (speedDeviations.length > 0) {
      issues.push({
        type: 'speed_variation',
        severity: speedDeviations.length > analysis.length / 2 ? 'high' : 'medium',
        description: `Speaking speed inconsistencies found in ${speedDeviations.length} chapters`,
        affectedChapters: speedDeviations.map(d => d.chapterNumber),
        suggestedFix: 'Adjust TTS speed settings to maintain consistent narration pace'
      });
    }

    // Check for overall deviation
    const highDeviationChapters = analysis.filter(a => a.deviationFromBaseline > 0.2);
    
    if (highDeviationChapters.length > 0) {
      issues.push({
        type: 'tone_inconsistency',
        severity: 'medium',
        description: `Voice tone inconsistencies detected in ${highDeviationChapters.length} chapters`,
        affectedChapters: highDeviationChapters.map(d => d.chapterNumber),
        suggestedFix: 'Review voice settings and ensure consistent emotional tone across chapters'
      });
    }

    return issues;
  }

  /**
   * Generate recommendations based on consistency issues
   */
  private generateConsistencyRecommendations(issues: ConsistencyIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.length === 0) {
      recommendations.push('Excellent voice consistency! No major issues detected.');
      return recommendations;
    }

    const highSeverityIssues = issues.filter(i => i.severity === 'high');
    const mediumSeverityIssues = issues.filter(i => i.severity === 'medium');

    if (highSeverityIssues.length > 0) {
      recommendations.push('Critical: Address high-severity consistency issues before publishing');
      recommendations.push('Consider re-generating affected chapters with standardized voice parameters');
    }

    if (mediumSeverityIssues.length > 0) {
      recommendations.push('Review voice settings for medium-severity issues to improve overall quality');
    }

    // Specific recommendations based on issue types
    const pitchIssues = issues.filter(i => i.type === 'pitch_variation');
    if (pitchIssues.length > 0) {
      recommendations.push('Use consistent pitch settings across all TTS generations');
    }

    const speedIssues = issues.filter(i => i.type === 'speed_variation');
    if (speedIssues.length > 0) {
      recommendations.push('Standardize speaking speed to maintain natural flow');
    }

    const toneIssues = issues.filter(i => i.type === 'tone_inconsistency');
    if (toneIssues.length > 0) {
      recommendations.push('Ensure emotional tone consistency throughout the audiobook');
    }

    return recommendations;
  }

  /**
   * Calculate overall consistency score
   */
  private calculateConsistencyScore(analysis: VoiceParameterAnalysis[], issues: ConsistencyIssue[]): number {
    if (analysis.length === 0) return 0;

    // Base score starts at 10
    let score = 10;

    // Deduct points for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'high':
          score -= 3;
          break;
        case 'medium':
          score -= 2;
          break;
        case 'low':
          score -= 1;
          break;
      }
    }

    // Deduct points for high deviations
    const avgDeviation = analysis.reduce((sum, a) => sum + a.deviationFromBaseline, 0) / analysis.length;
    score -= avgDeviation * 10; // Scale deviation to score impact

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Simulate pronunciation analysis (replace with actual speech recognition)
   */
  private simulatePronunciationAnalysis(word: string, audioUrl: string): {
    expected: string;
    actual: string;
    confidence: number;
  } {
    // This would be replaced with actual speech recognition API
    const variations = ['standard', 'variant1', 'variant2'];
    const randomVariation = variations[Math.floor(Math.random() * variations.length)];
    
    return {
      expected: `/${word}/`,
      actual: randomVariation === 'standard' ? `/${word}/` : `/${word}_${randomVariation}/`,
      confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
    };
  }

  /**
   * Analyze audio quality for a single file
   */
  private async analyzeAudioQuality(audioUrl: string): Promise<{
    qualityScore: number;
    technicalSpecs: any;
    issues: string[];
    recommendations: string[];
  }> {
    // Simulate audio quality analysis
    // In production, this would use audio analysis libraries
    const qualityScore = Math.random() * 2 + 8; // 8-10 range
    const issues: string[] = [];
    const recommendations: string[] = [];

    const technicalSpecs = {
      sampleRate: 44100,
      bitRate: 192000,
      channels: 2,
      duration: Math.random() * 300 + 60, // 1-6 minutes
      fileSize: Math.random() * 5000000 + 1000000, // 1-6 MB
      format: 'mp3'
    };

    // Simulate quality checks
    if (technicalSpecs.sampleRate < 44100) {
      issues.push('Low sample rate detected');
      recommendations.push('Increase sample rate to 44.1kHz or higher');
    }

    if (technicalSpecs.bitRate < 128000) {
      issues.push('Low bit rate may affect audio quality');
      recommendations.push('Use bit rate of 192kbps or higher for better quality');
    }

    if (qualityScore < 7) {
      issues.push('Overall audio quality below recommended threshold');
      recommendations.push('Consider re-generating with higher quality settings');
    }

    return {
      qualityScore,
      technicalSpecs,
      issues,
      recommendations
    };
  }

  /**
   * Calculate similarity between two audio chapters
   */
  private async calculateChapterSimilarity(audioUrl1: string, audioUrl2: string): Promise<number> {
    // Simulate voice similarity calculation
    // In production, this would use audio fingerprinting or voice comparison algorithms
    return Math.random() * 0.3 + 0.7; // 70-100% similarity
  }
}

export const audioConsistencyService = new AudioConsistencyService();