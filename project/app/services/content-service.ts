import { supabase } from "~/lib/supabase";

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
  outline: any;
  chapters: GeneratedChapter[];
  metadata: any;
  status: string;
  created_at?: string;
}

export const contentService = {
  async getUserEbooks(userId: string): Promise<GeneratedEbook[]> {
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(ebook => ({
        ...ebook,
        metadata: {
            aiProvider: ebook.ai_provider,
            aiModel: ebook.ai_model,
            tone: ebook.tone,
            customTone: ebook.custom_tone,
            audience: ebook.audience
        },
        chapters: [] 
    }));
  },

  async getEbook(userId: string, ebookId: string): Promise<GeneratedEbook | null> {
    const { data: ebook, error } = await supabase
      .from('ebooks')
      .select('*')
      .eq('id', ebookId)
      .eq('user_id', userId)
      .single();

    if (error || !ebook) return null;

    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('ebook_id', ebookId)
      .order('chapter_number', { ascending: true });

    return {
      ...ebook,
      metadata: {
            aiProvider: ebook.ai_provider,
            aiModel: ebook.ai_model,
            tone: ebook.tone,
            customTone: ebook.custom_tone,
            audience: ebook.audience
      },
      chapters: chapters || []
    };
  },

  async saveEbook(userId: string, ebookData: GeneratedEbook): Promise<string> {
    const { data, error } = await supabase
      .from('ebooks')
      .insert({
        id: ebookData.id,
        user_id: userId,
        title: ebookData.title,
        subtitle: ebookData.subtitle,
        topic: ebookData.topic,
        outline: JSON.stringify(ebookData.outline),
        word_count: ebookData.metadata.wordCount,
        tone: ebookData.metadata.tone,
        custom_tone: ebookData.metadata.customTone,
        audience: ebookData.metadata.audience,
        ai_provider: ebookData.metadata.aiProvider,
        ai_model: ebookData.metadata.aiModel,
        status: ebookData.status
      })
      .select('id')
      .single();

    if (error) throw error;

    if (ebookData.chapters.length > 0) {
      const chaptersToInsert = ebookData.chapters.map(ch => ({
        ebook_id: data.id,
        chapter_number: ch.number,
        title: ch.title,
        content: ch.content,
        word_count: ch.wordCount
      }));

      const { error: chapterError } = await supabase
        .from('chapters')
        .insert(chaptersToInsert);
        
      if (chapterError) throw chapterError;
    }

    return data.id;
  },

  async saveChapters(userId: string, ebookId: string, chapters: GeneratedChapter[]) {
      const { data: ebook } = await supabase
      .from('ebooks')
      .select('id')
      .eq('id', ebookId)
      .eq('user_id', userId)
      .single();
      
      if (!ebook) throw new Error("Ebook not found or access denied");

      const chaptersToUpsert = chapters.map(ch => ({
        id: ch.id,
        ebook_id: ebookId,
        chapter_number: ch.number,
        title: ch.title,
        content: ch.content,
        word_count: ch.wordCount
      }));

      const { error } = await supabase
        .from('chapters')
        .upsert(chaptersToUpsert);
        
      if (error) throw error;
  }
};
