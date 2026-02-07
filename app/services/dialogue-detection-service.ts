import { supabase } from "~/lib/supabase";

export interface Character {
  id: string;
  name: string;
  description: string;
  dialogueCount: number;
  suggestedVoiceCharacteristics: VoiceCharacteristics;
  firstAppearance: number; // chapter number
}

export interface DialogueSegment {
  text: string;
  characterId?: string;
  isNarration: boolean;
  startIndex: number;
  endIndex: number;
  emotion?: string;
}

export interface VoicedSegment extends DialogueSegment {
  voiceId: string;
  audioSettings: TTSRequest;
}

export interface CharacterVoiceMap {
  [characterId: string]: string; // voiceId
}

export interface VoiceCharacteristics {
  pitch: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  speed: 'very-slow' | 'slow' | 'medium' | 'fast' | 'very-fast';
  tone: 'warm' | 'neutral' | 'authoritative' | 'friendly' | 'dramatic';
  clarity: number; // 1-10
  naturalness: number; // 1-10
}

export interface TTSRequest {
  text: string;
  voice: any;
  speed?: number;
  pitch?: number;
  outputFormat?: string;
}

export interface DialogueAnalysis {
  characters: Character[];
  segments: DialogueSegment[];
  narratorSegments: DialogueSegment[];
  totalDialogueCount: number;
  averageDialogueLength: number;
}

export class DialogueDetectionService {
  /**
   * Detect characters from text content using pattern matching and NLP
   */
  async detectCharacters(content: string): Promise<Character[]> {
    try {
      console.log('Detecting characters in content');
      
      const characters: Map<string, Character> = new Map();
      
      // Split content into paragraphs for analysis
      const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
      let chapterNumber = 1;
      
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        
        // Update chapter number if we encounter chapter markers
        if (this.isChapterMarker(paragraph)) {
          chapterNumber++;
          continue;
        }
        
        // Detect dialogue in this paragraph
        const dialogueSegments = this.parseDialogueInParagraph(paragraph, i * 100); // Approximate position
        
        for (const segment of dialogueSegments) {
          if (!segment.isNarration && segment.characterId) {
            const characterName = segment.characterId;
            
            if (!characters.has(characterName)) {
              // Create new character
              const character: Character = {
                id: this.generateCharacterId(characterName),
                name: characterName,
                description: this.generateCharacterDescription(characterName, content),
                dialogueCount: 1,
                suggestedVoiceCharacteristics: this.suggestVoiceCharacteristics(characterName, segment.text),
                firstAppearance: chapterNumber
              };
              characters.set(characterName, character);
            } else {
              // Update existing character
              const character = characters.get(characterName)!;
              character.dialogueCount++;
              characters.set(characterName, character);
            }
          }
        }
      }
      
      return Array.from(characters.values()).sort((a, b) => b.dialogueCount - a.dialogueCount);
    } catch (error) {
      throw new Error(`DialogueDetectionService.detectCharacters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse dialogue segments from text content
   */
  async parseDialogue(text: string): Promise<DialogueSegment[]> {
    try {
      console.log('Parsing dialogue from text');
      
      const segments: DialogueSegment[] = [];
      const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
      let currentIndex = 0;
      
      for (const paragraph of paragraphs) {
        const paragraphSegments = this.parseDialogueInParagraph(paragraph, currentIndex);
        segments.push(...paragraphSegments);
        currentIndex += paragraph.length + 1; // +1 for newline
      }
      
      return segments;
    } catch (error) {
      throw new Error(`DialogueDetectionService.parseDialogue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assign voices to dialogue segments based on character voice mapping
   */
  async assignVoicesToDialogue(
    segments: DialogueSegment[], 
    characterVoices: CharacterVoiceMap
  ): Promise<VoicedSegment[]> {
    try {
      console.log('Assigning voices to dialogue segments');
      
      const voicedSegments: VoicedSegment[] = [];
      
      for (const segment of segments) {
        let voiceId: string;
        
        if (segment.isNarration) {
          // Use default narrator voice
          voiceId = 'narrator-default';
        } else if (segment.characterId && characterVoices[segment.characterId]) {
          // Use assigned character voice
          voiceId = characterVoices[segment.characterId];
        } else {
          // Fallback to default voice
          voiceId = 'default-character-voice';
        }
        
        const voicedSegment: VoicedSegment = {
          ...segment,
          voiceId,
          audioSettings: {
            text: segment.text,
            voice: { voice_id: voiceId },
            speed: this.getSpeedForEmotion(segment.emotion),
            pitch: this.getPitchForEmotion(segment.emotion),
            outputFormat: 'mp3'
          }
        };
        
        voicedSegments.push(voicedSegment);
      }
      
      return voicedSegments;
    } catch (error) {
      throw new Error(`DialogueDetectionService.assignVoicesToDialogue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze dialogue patterns and provide comprehensive analysis
   */
  async analyzeDialogue(content: string): Promise<DialogueAnalysis> {
    try {
      console.log('Analyzing dialogue patterns');
      
      const characters = await this.detectCharacters(content);
      const segments = await this.parseDialogue(content);
      
      const narratorSegments = segments.filter(s => s.isNarration);
      const dialogueSegments = segments.filter(s => !s.isNarration);
      
      const totalDialogueCount = dialogueSegments.length;
      const averageDialogueLength = totalDialogueCount > 0 
        ? dialogueSegments.reduce((sum, s) => sum + s.text.length, 0) / totalDialogueCount
        : 0;
      
      return {
        characters,
        segments,
        narratorSegments,
        totalDialogueCount,
        averageDialogueLength
      };
    } catch (error) {
      throw new Error(`DialogueDetectionService.analyzeDialogue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract character emotions from dialogue context
   */
  async extractEmotions(segments: DialogueSegment[]): Promise<DialogueSegment[]> {
    try {
      console.log('Extracting emotions from dialogue');
      
      const emotionalSegments = segments.map(segment => {
        const emotion = this.detectEmotionInText(segment.text);
        return {
          ...segment,
          emotion
        };
      });
      
      return emotionalSegments;
    } catch (error) {
      throw new Error(`DialogueDetectionService.extractEmotions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse dialogue in a single paragraph
   */
  private parseDialogueInParagraph(paragraph: string, startIndex: number): DialogueSegment[] {
    const segments: DialogueSegment[] = [];
    
    // Common dialogue patterns
    const dialoguePatterns = [
      // "Character said, 'dialogue'"
      /(\w+)\s+(?:said|asked|replied|whispered|shouted|exclaimed|muttered),?\s*["']([^"']+)["']/gi,
      // 'dialogue,' Character said
      /["']([^"']+)["'],?\s*(\w+)\s+(?:said|asked|replied|whispered|shouted|exclaimed|muttered)/gi,
      // Direct quotes
      /["']([^"']+)["']/g
    ];
    
    let processedText = paragraph;
    let currentIndex = startIndex;
    
    // Try each pattern
    for (const pattern of dialoguePatterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(paragraph)) !== null) {
        const dialogueText = match[1] || match[2];
        const characterName = match[2] || match[1];
        
        // Determine if this looks like a character name
        const isCharacterName = characterName && 
          characterName.length < 20 && 
          /^[A-Z][a-zA-Z\s]*$/.test(characterName) &&
          !this.isCommonWord(characterName);
        
        const segment: DialogueSegment = {
          text: dialogueText,
          characterId: isCharacterName ? characterName : undefined,
          isNarration: !isCharacterName,
          startIndex: currentIndex + match.index,
          endIndex: currentIndex + match.index + match[0].length
        };
        
        segments.push(segment);
        
        // Remove processed text to avoid double-processing
        processedText = processedText.replace(match[0], ' '.repeat(match[0].length));
      }
    }
    
    // If no dialogue found, treat entire paragraph as narration
    if (segments.length === 0) {
      segments.push({
        text: paragraph,
        isNarration: true,
        startIndex: currentIndex,
        endIndex: currentIndex + paragraph.length
      });
    }
    
    return segments;
  }

  /**
   * Check if text is a chapter marker
   */
  private isChapterMarker(text: string): boolean {
    const chapterPatterns = [
      /^Chapter\s+\d+/i,
      /^\d+\.\s/,
      /^Part\s+\d+/i,
      /^Section\s+\d+/i
    ];
    
    return chapterPatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Generate character ID from name
   */
  private generateCharacterId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Generate character description based on context
   */
  private generateCharacterDescription(name: string, content: string): string {
    // Simple heuristic-based description
    const nameOccurrences = (content.match(new RegExp(name, 'gi')) || []).length;
    
    if (nameOccurrences > 20) {
      return `Main character - appears frequently throughout the story`;
    } else if (nameOccurrences > 10) {
      return `Supporting character - has significant dialogue`;
    } else if (nameOccurrences > 5) {
      return `Minor character - appears in several scenes`;
    } else {
      return `Background character - has limited dialogue`;
    }
  }

  /**
   * Suggest voice characteristics based on character name and dialogue
   */
  private suggestVoiceCharacteristics(name: string, sampleDialogue: string): VoiceCharacteristics {
    // Simple heuristics for voice characteristics
    const characteristics: VoiceCharacteristics = {
      pitch: 'medium',
      speed: 'medium',
      tone: 'neutral',
      clarity: 7,
      naturalness: 7
    };
    
    // Adjust based on name patterns
    if (name.toLowerCase().includes('dr') || name.toLowerCase().includes('professor')) {
      characteristics.tone = 'authoritative';
      characteristics.pitch = 'low';
    } else if (name.toLowerCase().includes('child') || name.length < 5) {
      characteristics.pitch = 'high';
      characteristics.speed = 'fast';
      characteristics.tone = 'friendly';
    }
    
    // Adjust based on dialogue content
    if (sampleDialogue.includes('!')) {
      characteristics.tone = 'dramatic';
      characteristics.speed = 'fast';
    } else if (sampleDialogue.includes('...')) {
      characteristics.speed = 'slow';
      characteristics.tone = 'warm';
    }
    
    return characteristics;
  }

  /**
   * Detect emotion in text
   */
  private detectEmotionInText(text: string): string {
    const emotionPatterns = {
      'angry': /\b(angry|furious|mad|rage|shouted|yelled)\b/i,
      'sad': /\b(sad|crying|tears|sorrow|wept|sobbed)\b/i,
      'happy': /\b(happy|joy|laugh|smiled|cheerful|delighted)\b/i,
      'excited': /\b(excited|thrilled|amazing|wonderful|fantastic)\b/i,
      'calm': /\b(calm|peaceful|serene|quiet|gentle)\b/i,
      'dramatic': /[!]{2,}|[A-Z]{3,}/
    };
    
    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
      if (pattern.test(text)) {
        return emotion;
      }
    }
    
    return 'neutral';
  }

  /**
   * Check if word is a common word (not likely a character name)
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'said', 'asked', 'replied', 'whispered', 'shouted', 'exclaimed', 'muttered',
      'the', 'and', 'but', 'or', 'so', 'then', 'now', 'here', 'there', 'when',
      'what', 'where', 'why', 'how', 'who', 'which', 'that', 'this', 'these',
      'those', 'they', 'them', 'their', 'he', 'she', 'it', 'his', 'her', 'its'
    ];
    
    return commonWords.includes(word.toLowerCase());
  }

  /**
   * Get appropriate speed for emotion
   */
  private getSpeedForEmotion(emotion?: string): number {
    const speedMap: Record<string, number> = {
      'angry': 1.2,
      'excited': 1.3,
      'happy': 1.1,
      'sad': 0.8,
      'calm': 0.9,
      'dramatic': 1.1,
      'neutral': 1.0
    };
    
    return speedMap[emotion || 'neutral'] || 1.0;
  }

  /**
   * Get appropriate pitch for emotion
   */
  private getPitchForEmotion(emotion?: string): number {
    const pitchMap: Record<string, number> = {
      'angry': 2.0,
      'excited': 3.0,
      'happy': 1.0,
      'sad': -2.0,
      'calm': -1.0,
      'dramatic': 2.0,
      'neutral': 0.0
    };
    
    return pitchMap[emotion || 'neutral'] || 0.0;
  }
}

export const dialogueDetectionService = new DialogueDetectionService();