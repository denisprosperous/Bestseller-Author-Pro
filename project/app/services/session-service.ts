import { supabase } from "~/lib/supabase";

export interface BrainstormResult {
  topic: string;
  provider: string;
  model: string;
  outline: any;
}

export interface BuilderConfig {
  topic: string;
  wordCount: number;
  tone: string;
  customTone?: string;
  audience: string;
  provider: string;
  model: string;
  outline: any;
  improveOutline: boolean;
}

export interface GenerationProgress {
  phase: string;
  percentage: number;
  message: string;
  startedAt: string;
  ebookId?: string;
}

export const sessionService = {
  async getOrCreateActiveSession(userId: string): Promise<string> {
    const { data: sessions } = await supabase
      .from('generation_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessions && sessions.length > 0) {
      return sessions[0].id;
    }

    const { data, error } = await supabase
      .from('generation_sessions')
      .insert({
        user_id: userId,
        status: 'active',
        progress: { percentage: 0, phase: 'init' }
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async getBrainstormResult(userId: string, sessionId: string): Promise<BrainstormResult | null> {
    const { data } = await supabase
      .from('generation_sessions')
      .select('brainstorm_data')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    return data?.brainstorm_data as BrainstormResult || null;
  },

  async saveBrainstormResult(userId: string, sessionId: string, data: BrainstormResult) {
      const { error } = await supabase
      .from('generation_sessions')
      .update({ brainstorm_data: data })
      .eq('id', sessionId)
      .eq('user_id', userId);
      
      if (error) throw error;
  },

  async getBuilderConfig(userId: string, sessionId: string): Promise<BuilderConfig | null> {
    const { data } = await supabase
      .from('generation_sessions')
      .select('builder_config')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    return data?.builder_config as BuilderConfig || null;
  },

  async saveBuilderConfig(userId: string, sessionId: string, config: BuilderConfig) {
    const { error } = await supabase
      .from('generation_sessions')
      .update({ builder_config: config })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async saveGenerationProgress(userId: string, sessionId: string, progress: GenerationProgress) {
    const { error } = await supabase
      .from('generation_sessions')
      .update({ progress })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async updateSessionStatus(userId: string, sessionId: string, status: string) {
    const { error } = await supabase
      .from('generation_sessions')
      .update({ status })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  }
};
