import { supabase } from "~/lib/supabase";

export interface EbookMetadata {
  wordCount: number;
  chapterCount: number;
  aiProvider: string;
  aiModel: string;
  tone: string;
  customTone?: string;
  audience: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedChapter {
  id: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
}

export interface GeneratedEbook {
  id: string;
  title: string;
  subtitle?: string;
  topic: string;
  outline?: string;
  chapters: GeneratedChapter[];
  metadata: EbookMetadata;
  status: 'draft' | 'generating' | 'completed' | 'error';
}

export interface EbookSummary {
  id: string;
  title: string;
  subtitle?: string;
  topic: string;
  wordCount: number;
  chapterCount: number;
  status: string;
  aiProvider: string;
  aiModel: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEbookParams {
  title: string;
  subtitle?: string;
  topic: string;
  wordCount?: number;
  tone: string;
  customTone?: string;
  audience: string;
  aiProvider: string;
  aiModel: string;
  outline?: string;
}

export class ContentService {
  /**
   * Save a new ebook to the database
   */
  async saveEbook(userId: string, ebook: GeneratedEbook): Promise<string> {
    try {
      // Insert ebook record
      const { data: ebookData, error: ebookError } = await supabase
        .from('ebooks')
        .insert({
          user_id: userId,
          title: ebook.title,
          subtitle: ebook.subtitle,
          topic: ebook.topic,
          word_count: ebook.metadata.wordCount,
          tone: ebook.metadata.tone,
          custom_tone: ebook.metadata.customTone,
          audience: ebook.metadata.audience,
          ai_provider: ebook.metadata.aiProvider,
          ai_model: ebook.metadata.aiModel,
          outline: ebook.outline,
          status: ebook.status
        })
        .select('id')
        .single();

      if (ebookError) {
        throw new Error(`Failed to save ebook: ${ebookError.message}`);
      }

      const ebookId = ebookData.id;

      // Insert chapters if any
      if (ebook.chapters.length > 0) {
        const chaptersData = ebook.chapters.map(chapter => ({
          ebook_id: ebookId,
          chapter_number: chapter.number,
          title: chapter.title,
          content: chapter.content,
          word_count: chapter.wordCount
        }));

        const { error: chaptersError } = await supabase
          .from('chapters')
          .insert(chaptersData);

        if (chaptersError) {
          // Rollback ebook if chapters fail
          await supabase.from('ebooks').delete().eq('id', ebookId);
          throw new Error(`Failed to save chapters: ${chaptersError.message}`);
        }
      }

      return ebookId;
    } catch (error) {
      throw new Error(`ContentService.saveEbook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new ebook record (without chapters)
   */
  async createEbook(userId: string, params: CreateEbookParams): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .insert({
          user_id: userId,
          title: params.title,
          subtitle: params.subtitle,
          topic: params.topic,
          word_count: params.wordCount || 0,
          tone: params.tone,
          custom_tone: params.customTone,
          audience: params.audience,
          ai_provider: params.aiProvider,
          ai_model: params.aiModel,
          outline: params.outline,
          status: 'draft'
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create ebook: ${error.message}`);
      }

      return data.id;
    } catch (error) {
      throw new Error(`ContentService.createEbook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific ebook with all chapters
   */
  async getEbook(userId: string, ebookId: string): Promise<GeneratedEbook | null> {
    try {
      // Get ebook data
      const { data: ebookData, error: ebookError } = await supabase
        .from('ebooks')
        .select('*')
        .eq('id', ebookId)
        .eq('user_id', userId)
        .single();

      if (ebookError) {
        if (ebookError.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get ebook: ${ebookError.message}`);
      }

      // Get chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('ebook_id', ebookId)
        .order('chapter_number');

      if (chaptersError) {
        throw new Error(`Failed to get chapters: ${chaptersError.message}`);
      }

      // Transform to GeneratedEbook format
      const ebook: GeneratedEbook = {
        id: ebookData.id,
        title: ebookData.title,
        subtitle: ebookData.subtitle,
        topic: ebookData.topic,
        outline: ebookData.outline,
        status: ebookData.status,
        chapters: (chaptersData || []).map(chapter => ({
          id: chapter.id,
          number: chapter.chapter_number,
          title: chapter.title,
          content: chapter.content,
          wordCount: chapter.word_count || 0
        })),
        metadata: {
          wordCount: ebookData.word_count || 0,
          chapterCount: chaptersData?.length || 0,
          aiProvider: ebookData.ai_provider,
          aiModel: ebookData.ai_model,
          tone: ebookData.tone,
          customTone: ebookData.custom_tone,
          audience: ebookData.audience,
          createdAt: ebookData.created_at,
          updatedAt: ebookData.updated_at
        }
      };

      return ebook;
    } catch (error) {
      throw new Error(`ContentService.getEbook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all ebooks for a user (summary view)
   */
  async getUserEbooks(userId: string): Promise<EbookSummary[]> {
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .select(`
          id,
          title,
          subtitle,
          topic,
          word_count,
          status,
          ai_provider,
          ai_model,
          created_at,
          updated_at,
          chapters(id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user ebooks: ${error.message}`);
      }

      return (data || []).map(ebook => ({
        id: ebook.id,
        title: ebook.title,
        subtitle: ebook.subtitle,
        topic: ebook.topic,
        wordCount: ebook.word_count || 0,
        chapterCount: Array.isArray(ebook.chapters) ? ebook.chapters.length : 0,
        status: ebook.status,
        aiProvider: ebook.ai_provider,
        aiModel: ebook.ai_model,
        createdAt: ebook.created_at,
        updatedAt: ebook.updated_at
      }));
    } catch (error) {
      throw new Error(`ContentService.getUserEbooks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an ebook
   */
  async updateEbook(userId: string, ebookId: string, updates: Partial<GeneratedEbook>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle;
      if (updates.topic) updateData.topic = updates.topic;
      if (updates.outline !== undefined) updateData.outline = updates.outline;
      if (updates.status) updateData.status = updates.status;
      
      if (updates.metadata) {
        if (updates.metadata.wordCount !== undefined) updateData.word_count = updates.metadata.wordCount;
        if (updates.metadata.tone) updateData.tone = updates.metadata.tone;
        if (updates.metadata.customTone !== undefined) updateData.custom_tone = updates.metadata.customTone;
        if (updates.metadata.audience) updateData.audience = updates.metadata.audience;
        if (updates.metadata.aiProvider) updateData.ai_provider = updates.metadata.aiProvider;
        if (updates.metadata.aiModel) updateData.ai_model = updates.metadata.aiModel;
      }

      const { error } = await supabase
        .from('ebooks')
        .update(updateData)
        .eq('id', ebookId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update ebook: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`ContentService.updateEbook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add or update chapters for an ebook
   */
  async saveChapters(userId: string, ebookId: string, chapters: GeneratedChapter[]): Promise<void> {
    try {
      // Verify ebook ownership
      const { data: ebook, error: ebookError } = await supabase
        .from('ebooks')
        .select('id')
        .eq('id', ebookId)
        .eq('user_id', userId)
        .single();

      if (ebookError || !ebook) {
        throw new Error('Ebook not found or access denied');
      }

      // Delete existing chapters
      const { error: deleteError } = await supabase
        .from('chapters')
        .delete()
        .eq('ebook_id', ebookId);

      if (deleteError) {
        throw new Error(`Failed to delete existing chapters: ${deleteError.message}`);
      }

      // Insert new chapters
      if (chapters.length > 0) {
        const chaptersData = chapters.map(chapter => ({
          ebook_id: ebookId,
          chapter_number: chapter.number,
          title: chapter.title,
          content: chapter.content,
          word_count: chapter.wordCount
        }));

        const { error: insertError } = await supabase
          .from('chapters')
          .insert(chaptersData);

        if (insertError) {
          throw new Error(`Failed to save chapters: ${insertError.message}`);
        }

        // Update ebook word count and chapter count
        const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
        await this.updateEbook(userId, ebookId, {
          metadata: {
            wordCount: totalWordCount,
            chapterCount: chapters.length,
            aiProvider: '',
            aiModel: '',
            tone: '',
            audience: '',
            createdAt: '',
            updatedAt: ''
          }
        });
      }
    } catch (error) {
      throw new Error(`ContentService.saveChapters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an ebook and all its chapters
   */
  async deleteEbook(userId: string, ebookId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ebooks')
        .delete()
        .eq('id', ebookId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete ebook: ${error.message}`);
      }
      
      // Chapters will be deleted automatically due to CASCADE
    } catch (error) {
      throw new Error(`ContentService.deleteEbook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update ebook status
   */
  async updateStatus(userId: string, ebookId: string, status: 'draft' | 'generating' | 'completed' | 'error'): Promise<void> {
    try {
      const { error } = await supabase
        .from('ebooks')
        .update({ status })
        .eq('id', ebookId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update status: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`ContentService.updateStatus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const contentService = new ContentService();