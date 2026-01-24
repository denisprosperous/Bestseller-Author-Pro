import { supabase } from "~/lib/supabase";

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'cartoon' | 'watercolor' | 'digital' | 'realistic' | 'anime';
  aspectRatio?: '1:1' | '4:3' | '16:9' | '3:4' | '9:16';
  provider?: 'google-vertex' | 'openjourney' | 'dreamshaper' | 'waifu-diffusion';
  characterConsistency?: CharacterProfile;
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  visualPrompt: string;
  referenceImages?: string[];
}

export interface ImageResult {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  provider: string;
  metadata: any;
  created_at: string;
}

export interface ChildrensBook {
  id: string;
  user_id: string;
  title: string;
  age_group: '0-3' | '4-7' | '8-12';
  illustration_style: string;
  page_count: number;
  reading_level?: number;
  characters: CharacterProfile[];
  pages: BookPage[];
  status: 'draft' | 'generating' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
}

export interface BookPage {
  page_number: number;
  text_content: string;
  illustration_prompt: string;
  illustration_url?: string;
  layout_type: 'full-page' | 'text-left' | 'text-right' | 'text-bottom';
}

export class ImageService {
  /**
   * Generate an image using the specified provider
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageResult> {
    try {
      // For now, this is a placeholder implementation
      // In production, this would call actual image generation APIs
      console.log('Generating image with request:', request);
      
      const provider = request.provider || 'google-vertex';
      
      // Simulate image generation
      const mockImageUrl = `https://example.com/images/${Date.now()}.jpg`;
      
      // Save generation record to database
      const { data, error } = await supabase
        .from('image_generations')
        .insert({
          user_id: 'demo-user-123', // This would come from auth
          provider,
          prompt: request.prompt,
          style: request.style || 'digital',
          image_url: mockImageUrl,
          metadata: {
            aspectRatio: request.aspectRatio || '1:1',
            characterConsistency: request.characterConsistency
          }
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to save image generation: ${error.message}`);
      }

      return {
        id: data.id,
        imageUrl: mockImageUrl,
        prompt: request.prompt,
        style: request.style || 'digital',
        provider,
        metadata: data.metadata,
        created_at: data.created_at
      };
    } catch (error) {
      throw new Error(`ImageService.generateImage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate images with character consistency
   */
  async generateWithCharacterConsistency(
    prompt: string,
    character: CharacterProfile,
    style: string = 'cartoon'
  ): Promise<ImageResult> {
    try {
      // Enhance prompt with character details for consistency
      const enhancedPrompt = `${prompt}. Character: ${character.description}. ${character.visualPrompt}. Style: ${style}`;
      
      return await this.generateImage({
        prompt: enhancedPrompt,
        style: style as any,
        characterConsistency: character
      });
    } catch (error) {
      throw new Error(`ImageService.generateWithCharacterConsistency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a children's book
   */
  async createChildrensBook(userId: string, bookData: {
    title: string;
    age_group: '0-3' | '4-7' | '8-12';
    illustration_style: string;
    page_count: number;
    characters: CharacterProfile[];
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('childrens_books')
        .insert({
          user_id: userId,
          title: bookData.title,
          age_group: bookData.age_group,
          illustration_style: bookData.illustration_style,
          page_count: bookData.page_count,
          characters: bookData.characters,
          pages: [],
          status: 'draft'
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create children's book: ${error.message}`);
      }

      return data.id;
    } catch (error) {
      throw new Error(`ImageService.createChildrensBook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a children's book by ID
   */
  async getChildrensBook(userId: string, bookId: string): Promise<ChildrensBook | null> {
    try {
      const { data, error } = await supabase
        .from('childrens_books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get children's book: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`ImageService.getChildrensBook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all children's books for a user
   */
  async getUserChildrensBooks(userId: string): Promise<ChildrensBook[]> {
    try {
      const { data, error } = await supabase
        .from('childrens_books')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user children's books: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`ImageService.getUserChildrensBooks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a page to a children's book
   */
  async addBookPage(
    userId: string,
    bookId: string,
    pageData: BookPage
  ): Promise<void> {
    try {
      // Get current book
      const book = await this.getChildrensBook(userId, bookId);
      if (!book) {
        throw new Error('Children\'s book not found');
      }

      // Add new page
      const updatedPages = [...book.pages, pageData];

      // Update book with new pages
      const { error } = await supabase
        .from('childrens_books')
        .update({ pages: updatedPages })
        .eq('id', bookId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to add book page: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`ImageService.addBookPage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate illustrations for a children's book page
   */
  async generatePageIllustration(
    userId: string,
    bookId: string,
    pageNumber: number,
    textContent: string,
    characters: CharacterProfile[]
  ): Promise<ImageResult> {
    try {
      // Get book details
      const book = await this.getChildrensBook(userId, bookId);
      if (!book) {
        throw new Error('Children\'s book not found');
      }

      // Create illustration prompt based on text content and characters
      let prompt = `Children's book illustration: ${textContent}`;
      
      if (characters.length > 0) {
        const characterDescriptions = characters.map(c => c.description).join(', ');
        prompt += `. Characters: ${characterDescriptions}`;
      }

      prompt += `. Style: ${book.illustration_style}. Age-appropriate for ${book.age_group}.`;

      // Generate the illustration
      const imageResult = await this.generateImage({
        prompt,
        style: book.illustration_style as any,
        aspectRatio: '4:3', // Good for children's books
        characterConsistency: characters[0] // Use first character for consistency
      });

      // Update the book page with the illustration
      const updatedPages = book.pages.map(page => 
        page.page_number === pageNumber 
          ? { ...page, illustration_url: imageResult.imageUrl }
          : page
      );

      await supabase
        .from('childrens_books')
        .update({ pages: updatedPages })
        .eq('id', bookId)
        .eq('user_id', userId);

      return imageResult;
    } catch (error) {
      throw new Error(`ImageService.generatePageIllustration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update children's book status
   */
  async updateChildrensBookStatus(
    userId: string,
    bookId: string,
    status: ChildrensBook['status']
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('childrens_books')
        .update({ status })
        .eq('id', bookId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update children's book status: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`ImageService.updateChildrensBookStatus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a children's book
   */
  async deleteChildrensBook(userId: string, bookId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('childrens_books')
        .delete()
        .eq('id', bookId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete children's book: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`ImageService.deleteChildrensBook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's generated images
   */
  async getUserImages(userId: string): Promise<ImageResult[]> {
    try {
      const { data, error } = await supabase
        .from('image_generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user images: ${error.message}`);
      }

      return (data || []).map(img => ({
        id: img.id,
        imageUrl: img.image_url,
        prompt: img.prompt,
        style: img.style,
        provider: img.provider,
        metadata: img.metadata,
        created_at: img.created_at
      }));
    } catch (error) {
      throw new Error(`ImageService.getUserImages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const imageService = new ImageService();