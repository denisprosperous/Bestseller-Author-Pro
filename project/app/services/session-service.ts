import { supabase } from "~/lib/supabase";

// Development mode - read API keys from environment variables
const DEV_API_KEYS = {
  openai: import.meta.env.VITE_OPENAI_API_KEY || '',
  anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  google: import.meta.env.VITE_GOOGLE_API_KEY || '',
  xai: import.meta.env.VITE_XAI_API_KEY || '',
  deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY || ''
};

const USE_DEV_KEYS = import.meta.env.VITE_USE_DEV_API_KEYS === 'true';

export interface BookOutline {
  title: string;
  subtitle?: string;
  chapters: OutlineChapter[];
}

export interface OutlineChapter {
  id: string;
  number: number;
  title: string;
  sections: string[];
}

export interface BrainstormResult {
  titles: string[];
  outline: string;
  topic: string;
  provider: string;
  model: string;
  selectedTitle?: string;
}

export interface BuilderConfig {
  topic: string;
  wordCount: number;
  tone: string;
  customTone?: string;
  audience: string;
  provider: string;
  model: string;
  outline?: string;
  improveOutline: boolean;
  selectedTitle?: string;
}

export interface GenerationProgress {
  phase: 'brainstorming' | 'outlining' | 'generating' | 'humanizing' | 'complete';
  currentChapter?: number;
  totalChapters?: number;
  percentage: number;
  message: string;
  startedAt: string;
  estimatedCompletion?: string;
  ebookId?: string;
}

export interface GenerationSession {
  id: string;
  userId: string;
  brainstormData?: BrainstormResult;
  builderConfig?: BuilderConfig;
  progress?: GenerationProgress;
  status: 'active' | 'completed' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export class SessionService {
  /**
   * Create a new generation session
   */
  async createSession(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('generation_sessions')
        .insert({
          user_id: userId,
          status: 'active'
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create session: ${error.message}`);
      }

      return data.id;
    } catch (error) {
      throw new Error(`SessionService.createSession: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get an active session by ID
   */
  async getSession(userId: string, sessionId: string): Promise<GenerationSession | null> {
    try {
      const { data, error } = await supabase
        .from('generation_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get session: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        brainstormData: data.brainstorm_data,
        builderConfig: data.builder_config,
        progress: data.progress,
        status: data.status,
        expiresAt: data.expires_at,
        createdAt: data.created_at
      };
    } catch (error) {
      throw new Error(`SessionService.getSession: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the most recent active session for a user
   */
  async getActiveSession(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('generation_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get active session: ${error.message}`);
      }

      return data.id;
    } catch (error) {
      throw new Error(`SessionService.getActiveSession: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save brainstorm results to session
   */
  async saveBrainstormResult(userId: string, sessionId: string, result: BrainstormResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('generation_sessions')
        .update({
          brainstorm_data: result
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to save brainstorm result: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`SessionService.saveBrainstormResult: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get brainstorm results from session
   */
  async getBrainstormResult(userId: string, sessionId: string): Promise<BrainstormResult | null> {
    try {
      const session = await this.getSession(userId, sessionId);
      return session?.brainstormData || null;
    } catch (error) {
      throw new Error(`SessionService.getBrainstormResult: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save builder configuration to session
   */
  async saveBuilderConfig(userId: string, sessionId: string, config: BuilderConfig): Promise<void> {
    try {
      const { error } = await supabase
        .from('generation_sessions')
        .update({
          builder_config: config
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to save builder config: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`SessionService.saveBuilderConfig: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get builder configuration from session
   */
  async getBuilderConfig(userId: string, sessionId: string): Promise<BuilderConfig | null> {
    try {
      const session = await this.getSession(userId, sessionId);
      return session?.builderConfig || null;
    } catch (error) {
      throw new Error(`SessionService.getBuilderConfig: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save generation progress to session
   */
  async saveGenerationProgress(userId: string, sessionId: string, progress: GenerationProgress): Promise<void> {
    try {
      const { error } = await supabase
        .from('generation_sessions')
        .update({
          progress: progress
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to save generation progress: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`SessionService.saveGenerationProgress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get generation progress from session
   */
  async getGenerationProgress(userId: string, sessionId: string): Promise<GenerationProgress | null> {
    try {
      const session = await this.getSession(userId, sessionId);
      return session?.progress || null;
    } catch (error) {
      throw new Error(`SessionService.getGenerationProgress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update session status
   */
  async updateSessionStatus(userId: string, sessionId: string, status: 'active' | 'completed' | 'expired'): Promise<void> {
    try {
      const { error } = await supabase
        .from('generation_sessions')
        .update({ status })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update session status: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`SessionService.updateSessionStatus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear session data
   */
  async clearSession(userId: string, sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('generation_sessions')
        .update({
          brainstorm_data: null,
          builder_config: null,
          progress: null,
          status: 'expired'
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to clear session: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`SessionService.clearSession: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('generation_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to cleanup expired sessions: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      throw new Error(`SessionService.cleanupExpiredSessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extend session expiration
   */
  async extendSession(userId: string, sessionId: string, hours: number = 24): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);

      const { error } = await supabase
        .from('generation_sessions')
        .update({
          expires_at: expiresAt.toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to extend session: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`SessionService.extendSession: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get or create active session for user
   */
  async getOrCreateActiveSession(userId: string): Promise<string> {
    try {
      // Try to get existing active session
      const activeSessionId = await this.getActiveSession(userId);
      
      if (activeSessionId) {
        // Extend the session
        await this.extendSession(userId, activeSessionId);
        return activeSessionId;
      }

      // Create new session
      return await this.createSession(userId);
    } catch (error) {
      throw new Error(`SessionService.getOrCreateActiveSession: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const sessionService = new SessionService();