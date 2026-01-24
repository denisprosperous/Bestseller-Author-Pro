import { supabase } from "~/lib/supabase";
import { Character, CharacterVoiceMap, VoiceCharacteristics } from "./dialogue-detection-service";
import { VoiceProfile } from "./voice-management-service";

export interface CharacterVoiceAssignment {
  id: string;
  userId: string;
  ebookId: string;
  characterId: string;
  voiceId: string;
  voiceProvider: string;
  confidence: number; // 0-1, how well the voice matches the character
  isManualOverride: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceSuggestion {
  voiceId: string;
  voiceName: string;
  provider: string;
  confidence: number;
  matchingFactors: string[];
  sample?: string;
}

export interface CharacterVoiceMapRequest {
  ebookId: string;
  characters: Character[];
  availableVoices: VoiceProfile[];
  narratorVoiceId?: string;
}

export interface CharacterVoiceMapResponse {
  assignments: CharacterVoiceAssignment[];
  suggestions: Record<string, VoiceSuggestion[]>;
  conflicts: string[];
}

class CharacterVoiceMappingService {
  /**
   * Automatically suggest voice assignments for characters based on their traits
   */
  async suggestVoiceAssignments(
    userId: string,
    characters: Character[],
    availableVoices: VoiceProfile[]
  ): Promise<Record<string, VoiceSuggestion[]>> {
    const suggestions: Record<string, VoiceSuggestion[]> = {};

    for (const character of characters) {
      const characterSuggestions = this.matchVoicesToCharacter(character, availableVoices);
      suggestions[character.id] = characterSuggestions.slice(0, 3); // Top 3 suggestions
    }

    return suggestions;
  }

  /**
   * Match voices to a character based on their characteristics
   */
  private matchVoicesToCharacter(character: Character, voices: VoiceProfile[]): VoiceSuggestion[] {
    const suggestions: VoiceSuggestion[] = [];

    for (const voice of voices) {
      const confidence = this.calculateVoiceCharacterMatch(character, voice);
      const matchingFactors = this.getMatchingFactors(character, voice);

      if (confidence > 0.3) { // Only suggest voices with reasonable confidence
        suggestions.push({
          voiceId: voice.voiceId,
          voiceName: voice.name,
          provider: voice.provider,
          confidence,
          matchingFactors,
          sample: voice.sampleUrl
        });
      }
    }

    // Sort by confidence descending
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate how well a voice matches a character (0-1 score)
   */
  private calculateVoiceCharacterMatch(character: Character, voice: VoiceProfile): number {
    let score = 0;
    let factors = 0;

    const charTraits = character.suggestedVoiceCharacteristics;
    const voiceTraits = voice.characteristics;

    // Gender matching (if determinable from character description)
    const characterGender = this.inferGenderFromDescription(character.description);
    if (characterGender && characterGender === voice.gender) {
      score += 0.3;
    }
    factors++;

    // Age matching
    const characterAge = this.inferAgeFromDescription(character.description);
    if (characterAge && characterAge === voice.ageRange) {
      score += 0.25;
    }
    factors++;

    // Tone matching
    if (charTraits.tone === voiceTraits.tone) {
      score += 0.2;
    }
    factors++;

    // Pitch matching
    if (charTraits.pitch === voiceTraits.pitch) {
      score += 0.15;
    }
    factors++;

    // Quality considerations
    if (voice.qualityScore >= 8) {
      score += 0.1;
    }
    factors++;

    return Math.min(score, 1.0);
  }

  /**
   * Get list of factors that make a voice suitable for a character
   */
  private getMatchingFactors(character: Character, voice: VoiceProfile): string[] {
    const factors: string[] = [];

    const characterGender = this.inferGenderFromDescription(character.description);
    if (characterGender === voice.gender) {
      factors.push(`Matching gender (${voice.gender})`);
    }

    const characterAge = this.inferAgeFromDescription(character.description);
    if (characterAge === voice.ageRange) {
      factors.push(`Matching age range (${voice.ageRange})`);
    }

    if (character.suggestedVoiceCharacteristics.tone === voice.characteristics.tone) {
      factors.push(`Matching tone (${voice.characteristics.tone})`);
    }

    if (voice.qualityScore >= 8) {
      factors.push('High quality voice');
    }

    if (voice.provider === 'elevenlabs') {
      factors.push('Premium voice provider');
    }

    return factors;
  }

  /**
   * Infer gender from character description using simple keyword matching
   */
  private inferGenderFromDescription(description: string): 'male' | 'female' | 'neutral' | null {
    const lowerDesc = description.toLowerCase();
    
    const maleKeywords = ['he', 'him', 'his', 'man', 'boy', 'father', 'brother', 'son', 'male'];
    const femaleKeywords = ['she', 'her', 'hers', 'woman', 'girl', 'mother', 'sister', 'daughter', 'female'];

    const maleMatches = maleKeywords.filter(keyword => lowerDesc.includes(keyword)).length;
    const femaleMatches = femaleKeywords.filter(keyword => lowerDesc.includes(keyword)).length;

    if (maleMatches > femaleMatches && maleMatches > 0) return 'male';
    if (femaleMatches > maleMatches && femaleMatches > 0) return 'female';
    
    return null; // Cannot determine or neutral
  }

  /**
   * Infer age range from character description
   */
  private inferAgeFromDescription(description: string): 'child' | 'young-adult' | 'adult' | 'elderly' | null {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('child') || lowerDesc.includes('kid') || lowerDesc.includes('young boy') || lowerDesc.includes('young girl')) {
      return 'child';
    }
    if (lowerDesc.includes('teenager') || lowerDesc.includes('teen') || lowerDesc.includes('young adult')) {
      return 'young-adult';
    }
    if (lowerDesc.includes('elderly') || lowerDesc.includes('old') || lowerDesc.includes('senior') || lowerDesc.includes('grandfather') || lowerDesc.includes('grandmother')) {
      return 'elderly';
    }
    
    return 'adult'; // Default assumption
  }

  /**
   * Save character voice assignments to database
   */
  async saveCharacterVoiceAssignments(
    userId: string,
    ebookId: string,
    assignments: Record<string, string>
  ): Promise<CharacterVoiceAssignment[]> {
    try {
      const assignmentRecords: Omit<CharacterVoiceAssignment, 'id' | 'createdAt' | 'updatedAt'>[] = [];

      for (const [characterId, voiceId] of Object.entries(assignments)) {
        assignmentRecords.push({
          userId,
          ebookId,
          characterId,
          voiceId,
          voiceProvider: 'elevenlabs', // TODO: Get actual provider from voice
          confidence: 1.0, // Manual assignment gets full confidence
          isManualOverride: true
        });
      }

      const { data, error } = await supabase
        .from('character_voices')
        .upsert(assignmentRecords, {
          onConflict: 'user_id,ebook_id,character_id'
        })
        .select();

      if (error) {
        throw new Error(`Failed to save character voice assignments: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`CharacterVoiceMappingService.saveCharacterVoiceAssignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get existing character voice assignments for an ebook
   */
  async getCharacterVoiceAssignments(
    userId: string,
    ebookId: string
  ): Promise<CharacterVoiceAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('character_voices')
        .select('*')
        .eq('user_id', userId)
        .eq('ebook_id', ebookId);

      if (error) {
        throw new Error(`Failed to get character voice assignments: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`CharacterVoiceMappingService.getCharacterVoiceAssignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate character voice assignments for conflicts
   */
  validateAssignments(
    characters: Character[],
    assignments: Record<string, string>,
    availableVoices: VoiceProfile[]
  ): string[] {
    const conflicts: string[] = [];
    const usedVoices = new Set<string>();

    // Check for duplicate voice assignments
    for (const [characterId, voiceId] of Object.entries(assignments)) {
      if (usedVoices.has(voiceId)) {
        const character = characters.find(c => c.id === characterId);
        const voice = availableVoices.find(v => v.voiceId === voiceId);
        conflicts.push(`Voice "${voice?.name}" is assigned to multiple characters including "${character?.name}"`);
      }
      usedVoices.add(voiceId);
    }

    // Check for missing assignments
    for (const character of characters) {
      if (!assignments[character.id]) {
        conflicts.push(`Character "${character.name}" has no voice assigned`);
      }
    }

    // Check for invalid voice IDs
    for (const [characterId, voiceId] of Object.entries(assignments)) {
      const voice = availableVoices.find(v => v.voiceId === voiceId);
      if (!voice) {
        const character = characters.find(c => c.id === characterId);
        conflicts.push(`Character "${character?.name}" has invalid voice ID: ${voiceId}`);
      }
    }

    return conflicts;
  }

  /**
   * Generate character voice map for audiobook production
   */
  async generateVoiceMap(
    userId: string,
    ebookId: string,
    characters: Character[],
    narratorVoiceId: string
  ): Promise<CharacterVoiceMap> {
    try {
      // Get existing assignments
      const assignments = await this.getCharacterVoiceAssignments(userId, ebookId);
      
      const voiceMap: CharacterVoiceMap = {};

      // Add narrator voice for narration segments
      voiceMap['narrator'] = narratorVoiceId;

      // Add character voice assignments
      for (const assignment of assignments) {
        voiceMap[assignment.characterId] = assignment.voiceId;
      }

      // Fill in missing assignments with narrator voice as fallback
      for (const character of characters) {
        if (!voiceMap[character.id]) {
          voiceMap[character.id] = narratorVoiceId;
        }
      }

      return voiceMap;
    } catch (error) {
      throw new Error(`CharacterVoiceMappingService.generateVoiceMap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const characterVoiceMappingService = new CharacterVoiceMappingService();