import { supabase } from "~/lib/supabase";

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'cartoon' | 'watercolor' | 'digital' | 'realistic' | 'anime' | 'fantasy';
  aspectRatio?: '1:1' | '4:3' | '16:9' | '9:16' | 'custom';
  width?: number;
  height?: number;
  provider?: 'google-vertex' | 'openjourney' | 'dreamshaper' | 'waifu-diffusion' | 'eden-ai';
  seed?: number; // For reproducible results
  steps?: number; // Number of inference steps
  guidanceScale?: number; // How closely to follow the prompt
}

export interface ImageResult {
  imageUrl: string;
  prompt: string;
  style: string;
  provider: string;
  width: number;
  height: number;
  fileSize?: number;
  metadata?: any;
}

export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  visualPrompt: string;
  referenceImages: string[];
  consistencyPrompt: string; // Optimized prompt for character consistency
}

export interface IllustrationRequest extends ImageGenerationRequest {
  characterConsistency?: CharacterProfile;
  pageNumber?: number;
  bookId?: string;
}

/**
 * Image Generation Service
 * Supports Google Vertex AI (Imagen), OpenJourney, DreamShaper, Waifu Diffusion, and Eden AI
 */
export class ImageGenerationService {
  /**
   * Generate image using specified provider
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageResult> {
    const {
      prompt,
      style = 'digital',
      aspectRatio = '1:1',
      width,
      height,
      provider = 'google-vertex',
      seed,
      steps = 20,
      guidanceScale = 7.5
    } = request;

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt is required for image generation');
    }

    try {
      // Enhance prompt based on style
      const enhancedPrompt = this.enhancePromptWithStyle(prompt, style);
      
      // Calculate dimensions based on aspect ratio
      const dimensions = this.calculateDimensions(aspectRatio, width, height);

      switch (provider) {
        case 'google-vertex':
          return await this.generateGoogleVertexImage(enhancedPrompt, dimensions, { seed, steps, guidanceScale });
        case 'openjourney':
          return await this.generateOpenJourneyImage(enhancedPrompt, dimensions, { seed, steps, guidanceScale });
        case 'dreamshaper':
          return await this.generateDreamShaperImage(enhancedPrompt, dimensions, { seed, steps, guidanceScale });
        case 'waifu-diffusion':
          return await this.generateWaifuDiffusionImage(enhancedPrompt, dimensions, { seed, steps, guidanceScale });
        case 'eden-ai':
          return await this.generateEdenAIImage(enhancedPrompt, dimensions, { seed, steps, guidanceScale });
        default:
          throw new Error(`Unsupported image generation provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Image generation failed for provider ${provider}:`, error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate illustration for children's book with character consistency
   */
  async generateIllustration(request: IllustrationRequest): Promise<ImageResult> {
    let enhancedPrompt = request.prompt;

    // Add character consistency if provided
    if (request.characterConsistency) {
      enhancedPrompt = `${request.characterConsistency.consistencyPrompt}, ${enhancedPrompt}`;
    }

    // Generate the image
    const result = await this.generateImage({
      ...request,
      prompt: enhancedPrompt
    });

    // Store in database for tracking
    if (request.bookId && request.pageNumber) {
      await this.saveImageGeneration(result, request.bookId, request.pageNumber);
    }

    return result;
  }

  /**
   * Google Vertex AI (Imagen) - Recommended for production
   */
  private async generateGoogleVertexImage(
    prompt: string,
    dimensions: { width: number; height: number },
    options: { seed?: number; steps?: number; guidanceScale?: number }
  ): Promise<ImageResult> {
    // Google Vertex AI Imagen API
    const endpoint = 'https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/imagegeneration:predict';
    
    const requestBody = {
      instances: [
        {
          prompt: prompt,
          image: {
            bytesBase64Encoded: ""
          }
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: `${dimensions.width}:${dimensions.height}`,
        safetyFilterLevel: "block_some",
        personGeneration: "allow_adult"
      }
    };

    // Note: This requires proper Google Cloud authentication
    // For production, use Google Cloud SDK or service account
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getGoogleAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Vertex AI error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const imageBase64 = data.predictions[0].bytesBase64Encoded;
    
    // Convert base64 to blob URL (in production, upload to storage)
    const imageBlob = new Blob([Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))], {
      type: 'image/png'
    });
    
    const imageUrl = URL.createObjectURL(imageBlob);

    return {
      imageUrl,
      prompt,
      style: 'digital',
      provider: 'google-vertex',
      width: dimensions.width,
      height: dimensions.height,
      fileSize: imageBlob.size,
      metadata: { model: 'imagen', version: 'v1' }
    };
  }

  /**
   * OpenJourney (Stable Diffusion fine-tune) - Open source
   */
  private async generateOpenJourneyImage(
    prompt: string,
    dimensions: { width: number; height: number },
    options: { seed?: number; steps?: number; guidanceScale?: number }
  ): Promise<ImageResult> {
    // Using Hugging Face Inference API for OpenJourney
    const endpoint = 'https://api-inference.huggingface.co/models/prompthero/openjourney';
    
    const requestBody = {
      inputs: `mdjrny-v4 style, ${prompt}`,
      parameters: {
        width: dimensions.width,
        height: dimensions.height,
        num_inference_steps: options.steps || 20,
        guidance_scale: options.guidanceScale || 7.5,
        seed: options.seed
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenJourney error: ${error || response.statusText}`);
    }

    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);

    return {
      imageUrl,
      prompt,
      style: 'artistic',
      provider: 'openjourney',
      width: dimensions.width,
      height: dimensions.height,
      fileSize: imageBlob.size,
      metadata: { model: 'openjourney-v4', steps: options.steps }
    };
  }

  /**
   * DreamShaper (Stable Diffusion fine-tune) - Open source
   */
  private async generateDreamShaperImage(
    prompt: string,
    dimensions: { width: number; height: number },
    options: { seed?: number; steps?: number; guidanceScale?: number }
  ): Promise<ImageResult> {
    // Using Hugging Face Inference API for DreamShaper
    const endpoint = 'https://api-inference.huggingface.co/models/Lykon/DreamShaper';
    
    const requestBody = {
      inputs: prompt,
      parameters: {
        width: dimensions.width,
        height: dimensions.height,
        num_inference_steps: options.steps || 20,
        guidance_scale: options.guidanceScale || 7.5,
        seed: options.seed
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DreamShaper error: ${error || response.statusText}`);
    }

    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);

    return {
      imageUrl,
      prompt,
      style: 'realistic',
      provider: 'dreamshaper',
      width: dimensions.width,
      height: dimensions.height,
      fileSize: imageBlob.size,
      metadata: { model: 'dreamshaper', steps: options.steps }
    };
  }

  /**
   * Waifu Diffusion (Anime-style Stable Diffusion) - Open source
   */
  private async generateWaifuDiffusionImage(
    prompt: string,
    dimensions: { width: number; height: number },
    options: { seed?: number; steps?: number; guidanceScale?: number }
  ): Promise<ImageResult> {
    // Using Hugging Face Inference API for Waifu Diffusion
    const endpoint = 'https://api-inference.huggingface.co/models/hakurei/waifu-diffusion';
    
    const requestBody = {
      inputs: prompt,
      parameters: {
        width: dimensions.width,
        height: dimensions.height,
        num_inference_steps: options.steps || 28,
        guidance_scale: options.guidanceScale || 12,
        seed: options.seed
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Waifu Diffusion error: ${error || response.statusText}`);
    }

    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);

    return {
      imageUrl,
      prompt,
      style: 'anime',
      provider: 'waifu-diffusion',
      width: dimensions.width,
      height: dimensions.height,
      fileSize: imageBlob.size,
      metadata: { model: 'waifu-diffusion', steps: options.steps }
    };
  }

  /**
   * Eden AI (Multi-provider API) - Commercial
   */
  private async generateEdenAIImage(
    prompt: string,
    dimensions: { width: number; height: number },
    options: { seed?: number; steps?: number; guidanceScale?: number }
  ): Promise<ImageResult> {
    const endpoint = 'https://api.edenai.run/v2/image/generation';
    
    const requestBody = {
      providers: 'stabilityai',
      text: prompt,
      resolution: `${dimensions.width}x${dimensions.height}`,
      num_images: 1,
      settings: {
        stabilityai: {
          steps: options.steps || 20,
          cfg_scale: options.guidanceScale || 7.5,
          seed: options.seed
        }
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EDEN_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Eden AI error: ${error.detail || response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.stabilityai.items[0].image_resource_url;

    return {
      imageUrl,
      prompt,
      style: 'digital',
      provider: 'eden-ai',
      width: dimensions.width,
      height: dimensions.height,
      metadata: { model: 'stability-ai', provider_used: 'stabilityai' }
    };
  }

  /**
   * Create character profile for consistency across illustrations
   */
  async createCharacterProfile(
    bookId: string,
    name: string,
    description: string,
    referenceImageUrl?: string
  ): Promise<CharacterProfile> {
    // Generate optimized consistency prompt
    const consistencyPrompt = this.generateCharacterConsistencyPrompt(name, description);

    const characterData = {
      book_id: bookId,
      name,
      description,
      visual_prompt: consistencyPrompt,
      reference_images: referenceImageUrl ? [referenceImageUrl] : []
    };

    const { data, error } = await supabase
      .from('book_characters')
      .insert(characterData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create character profile: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      visualPrompt: data.visual_prompt,
      referenceImages: data.reference_images,
      consistencyPrompt: data.visual_prompt
    };
  }

  /**
   * Get character profiles for a book
   */
  async getBookCharacters(bookId: string): Promise<CharacterProfile[]> {
    const { data, error } = await supabase
      .from('book_characters')
      .select('*')
      .eq('book_id', bookId);

    if (error) {
      throw new Error(`Failed to get book characters: ${error.message}`);
    }

    return (data || []).map(char => ({
      id: char.id,
      name: char.name,
      description: char.description,
      visualPrompt: char.visual_prompt,
      referenceImages: char.reference_images,
      consistencyPrompt: char.visual_prompt
    }));
  }

  /**
   * Save image generation to database for tracking
   */
  private async saveImageGeneration(
    result: ImageResult,
    bookId?: string,
    pageNumber?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('image_generations')
        .insert({
          user_id: 'demo-user-123', // Replace with real user ID
          provider: result.provider,
          prompt: result.prompt,
          style: result.style,
          image_url: result.imageUrl,
          metadata: {
            ...result.metadata,
            width: result.width,
            height: result.height,
            fileSize: result.fileSize,
            bookId,
            pageNumber
          }
        });

      if (error) {
        console.error('Failed to save image generation:', error);
      }
    } catch (error) {
      console.error('Error saving image generation:', error);
    }
  }

  /**
   * Enhance prompt with style-specific keywords
   */
  private enhancePromptWithStyle(prompt: string, style: string): string {
    const styleEnhancements = {
      cartoon: 'cartoon style, colorful, simple shapes, child-friendly',
      watercolor: 'watercolor painting, soft colors, artistic, flowing',
      digital: 'digital art, clean lines, vibrant colors, modern',
      realistic: 'photorealistic, detailed, high quality, professional',
      anime: 'anime style, manga, Japanese animation, detailed eyes',
      fantasy: 'fantasy art, magical, ethereal, mystical atmosphere'
    };

    const enhancement = styleEnhancements[style as keyof typeof styleEnhancements];
    return enhancement ? `${prompt}, ${enhancement}` : prompt;
  }

  /**
   * Calculate image dimensions based on aspect ratio
   */
  private calculateDimensions(
    aspectRatio: string,
    customWidth?: number,
    customHeight?: number
  ): { width: number; height: number } {
    if (customWidth && customHeight) {
      return { width: customWidth, height: customHeight };
    }

    const ratios = {
      '1:1': { width: 512, height: 512 },
      '4:3': { width: 512, height: 384 },
      '16:9': { width: 512, height: 288 },
      '9:16': { width: 288, height: 512 }
    };

    return ratios[aspectRatio as keyof typeof ratios] || ratios['1:1'];
  }

  /**
   * Generate character consistency prompt
   */
  private generateCharacterConsistencyPrompt(name: string, description: string): string {
    return `${name}, ${description}, consistent character design, same appearance, recognizable features`;
  }

  /**
   * Get Google Cloud access token (placeholder)
   */
  private async getGoogleAccessToken(): Promise<string> {
    // In production, implement proper Google Cloud authentication
    // This could use service account credentials or OAuth
    return process.env.GOOGLE_CLOUD_ACCESS_TOKEN || '';
  }

  /**
   * Get user's generated images
   */
  async getUserImages(userId: string, limit: number = 50): Promise<ImageResult[]> {
    const { data, error } = await supabase
      .from('image_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get user images: ${error.message}`);
    }

    return (data || []).map(img => ({
      imageUrl: img.image_url,
      prompt: img.prompt,
      style: img.style,
      provider: img.provider,
      width: img.metadata?.width || 512,
      height: img.metadata?.height || 512,
      fileSize: img.metadata?.fileSize,
      metadata: img.metadata
    }));
  }
}

export const imageGenerationService = new ImageGenerationService();