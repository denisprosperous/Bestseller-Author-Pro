import type { AIProvider } from "~/data/ai-providers";
import { aiCacheService } from "~/services/cache-service";

export interface AIRequest {
  provider: string;
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  apiKey: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * AI Service abstraction layer
 * Handles routing to different AI providers
 */
export class AIService {
  /**
   * Generate content using specified AI provider with caching and fallback support
   */
  async generateContent(request: AIRequest): Promise<AIResponse> {
    let { provider, model, prompt, maxTokens = 2000, temperature = 0.7, apiKey } = request;

    // Check cache first (only for deterministic requests with low temperature)
    if (temperature <= 0.3) {
      const cached = aiCacheService.getCachedAIResponse(provider, model, prompt);
      if (cached) {
        return {
          content: cached,
          provider,
          model,
          tokensUsed: 0 // Cached response doesn't use tokens
        };
      }
    }

    // Handle auto-selection with fallback
    if (provider === "auto") {
      const preferredOrder = ["openai", "anthropic", "xai", "google", "deepseek"];
      let lastError: Error | null = null;

      for (const p of preferredOrder) {
        try {
          // Check if we have a valid API key for this provider
          if (!this.validateApiKey(p, apiKey)) {
            continue; // Skip providers without valid keys
          }

          provider = p;
          model = await this.getBestAvailableModel(p, apiKey);
          
          // Try to generate content with this provider
          const response = await this.callProvider(provider, model, prompt, maxTokens, temperature, apiKey);
          
          // Cache successful response
          if (temperature <= 0.3) {
            aiCacheService.cacheAIResponse(provider, model, prompt, response.content, response.tokensUsed);
          }
          
          return response;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          console.warn(`Provider ${p} failed, trying next:`, lastError.message);
          continue;
        }
      }

      // If all providers failed
      throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    // Auto-select model if needed - use best available model
    if (model === "auto") {
      model = await this.getBestAvailableModel(provider, apiKey);
    }

    // Validate API key with detailed error message
    const validationError = this.getApiKeyValidationError(provider, apiKey);
    if (validationError) {
      throw new Error(validationError);
    }

    // Call specific provider
    const response = await this.callProvider(provider, model, prompt, maxTokens, temperature, apiKey);
    
    // Cache successful response (only for deterministic requests)
    if (temperature <= 0.3) {
      aiCacheService.cacheAIResponse(provider, model, prompt, response.content, response.tokensUsed);
    }
    
    return response;
  }

  /**
   * Call specific provider with error handling
   */
  private async callProvider(provider: string, model: string, prompt: string, maxTokens: number, temperature: number, apiKey: string): Promise<AIResponse> {
    switch (provider) {
      case "openai":
        return this.callOpenAI({ model, prompt, maxTokens, temperature, apiKey });
      case "anthropic":
        return this.callAnthropic({ model, prompt, maxTokens, temperature, apiKey });
      case "google":
        return this.callGoogle({ model, prompt, maxTokens, temperature, apiKey });
      case "xai":
        return this.callXAI({ model, prompt, maxTokens, temperature, apiKey });
      case "deepseek":
        return this.callDeepSeek({ model, prompt, maxTokens, temperature, apiKey });
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Get best available model for a provider based on API key capabilities
   */
  private async getBestAvailableModel(provider: string, apiKey: string): Promise<string> {
    // Try to detect available models dynamically
    try {
      const availableModels = await this.getAvailableModels(provider, apiKey);
      if (availableModels.length > 0) {
        return this.selectBestModel(provider, availableModels);
      }
    } catch (error) {
      console.warn(`Failed to detect models for ${provider}, using defaults:`, error);
    }

    // Fallback to latest known models (2026)
    const latestModels: Record<string, string> = {
      openai: "gpt-5.2", // Latest GPT-5.2 (Jan 2026)
      anthropic: "claude-4-opus", // Latest Claude 4 Opus
      google: "gemini-2-pro", // Latest Gemini 2 Pro
      xai: "grok-3", // Latest Grok 3
      deepseek: "deepseek-llm-7b-instruct",
    };
    return latestModels[provider] || "gpt-5.2";
  }

  /**
   * Get default model for a provider (backwards compatibility)
   */
  private getDefaultModel(provider: string): string {
    const defaults: Record<string, string> = {
      openai: "gpt-5.2",
      anthropic: "claude-4-opus",
      google: "gemini-2-pro",
      xai: "grok-3",
      deepseek: "deepseek-llm-7b-instruct",
    };
    return defaults[provider] || "gpt-5.2";
  }

  /**
   * Get available models for a provider
   */
  private async getAvailableModels(provider: string, apiKey: string): Promise<string[]> {
    switch (provider) {
      case "openai":
        return this.getOpenAIModels(apiKey);
      case "anthropic":
        return this.getAnthropicModels(apiKey);
      case "google":
        return this.getGoogleModels(apiKey);
      case "xai":
        return this.getXAIModels(apiKey);
      case "deepseek":
        return this.getDeepSeekModels(apiKey);
      default:
        return [];
    }
  }

  /**
   * Select the best model from available models
   */
  private selectBestModel(provider: string, availableModels: string[]): string {
    // Define model preference order (best to fallback) - Updated for 2026
    const modelPreferences: Record<string, string[]> = {
      openai: [
        "gpt-5.2",
        "gpt-5",
        "gpt-4-turbo-2024-04-09",
        "gpt-4-turbo",
        "gpt-4-0125-preview",
        "gpt-4-1106-preview", 
        "gpt-4",
        "gpt-3.5-turbo-0125",
        "gpt-3.5-turbo"
      ],
      anthropic: [
        "claude-4-opus",
        "claude-4-sonnet",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-20240620",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307"
      ],
      google: [
        "gemini-2-pro",
        "gemini-2-flash",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-pro"
      ],
      xai: [
        "grok-3",
        "grok-2-latest",
        "grok-beta"
      ],
      deepseek: [
        "deepseek-llm-7b-instruct",
        "deepseek-coder-7b-instruct"
      ]
    };

    const preferences = modelPreferences[provider] || [];
    
    // Find the first preferred model that's available
    for (const preferredModel of preferences) {
      if (availableModels.includes(preferredModel)) {
        return preferredModel;
      }
    }

    // If no preferred model found, return the first available
    return availableModels[0] || this.getDefaultModel(provider);
  }

  /**
   * Get available OpenAI models
   */
  private async getOpenAIModels(apiKey: string): Promise<string[]> {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`OpenAI models API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => model.id)
        .sort((a: string, b: string) => b.localeCompare(a)); // Sort newest first
    } catch (error) {
      console.warn('Failed to fetch OpenAI models:', error);
      return [];
    }
  }

  /**
   * Get available Anthropic models
   */
  private async getAnthropicModels(apiKey: string): Promise<string[]> {
    // Anthropic doesn't have a public models endpoint, return known models (2026)
    return [
      "claude-4-opus",
      "claude-4-sonnet",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620", 
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307"
    ];
  }

  /**
   * Get available Google models
   */
  private async getGoogleModels(apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google models API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models
        .filter((model: any) => model.name.includes('gemini') && model.supportedGenerationMethods?.includes('generateContent'))
        .map((model: any) => model.name.replace('models/', ''))
        .sort((a: string, b: string) => b.localeCompare(a));
    } catch (error) {
      console.warn('Failed to fetch Google models:', error);
      return [];
    }
  }

  /**
   * Get available xAI models
   */
  private async getXAIModels(apiKey: string): Promise<string[]> {
    // xAI doesn't have a public models endpoint, return known models (2026)
    return [
      "grok-3",
      "grok-2-latest",
      "grok-beta"
    ];
  }

  /**
   * Get available DeepSeek models
   */
  private async getDeepSeekModels(apiKey: string): Promise<string[]> {
    // DeepSeek via Hugging Face, return known models
    return [
      "deepseek-llm-7b-instruct",
      "deepseek-coder-7b-instruct"
    ];
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(params: {
    model: string;
    prompt: string;
    maxTokens: number;
    temperature: number;
    apiKey: string;
  }): Promise<AIResponse> {
    const messages: ChatMessage[] = [
      { role: "system", content: "You are a professional ebook author and writing assistant." },
      { role: "user", content: params.prompt },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      provider: "openai",
      model: params.model,
      tokensUsed: data.usage?.total_tokens,
    };
  }

  /**
   * Call Anthropic Claude API
   */
  private async callAnthropic(params: {
    model: string;
    prompt: string;
    maxTokens: number;
    temperature: number;
    apiKey: string;
  }): Promise<AIResponse> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": params.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        messages: [{ role: "user", content: params.prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      provider: "anthropic",
      model: params.model,
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
    };
  }

  /**
   * Call Google Gemini API
   */
  private async callGoogle(params: {
    model: string;
    prompt: string;
    maxTokens: number;
    temperature: number;
    apiKey: string;
  }): Promise<AIResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: params.prompt }],
            },
          ],
          generationConfig: {
            temperature: params.temperature,
            maxOutputTokens: params.maxTokens,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Check if response has the expected structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Google API unexpected response:', JSON.stringify(data, null, 2));
      throw new Error(`Google API returned unexpected response format. This may be due to an invalid API key or API quota exceeded.`);
    }
    
    return {
      content: data.candidates[0].content.parts[0].text,
      provider: "google",
      model: params.model,
      tokensUsed: data.usageMetadata?.totalTokenCount,
    };
  }

  /**
   * Call xAI Grok API
   */
  private async callXAI(params: {
    model: string;
    prompt: string;
    maxTokens: number;
    temperature: number;
    apiKey: string;
  }): Promise<AIResponse> {
    const messages: ChatMessage[] = [
      { role: "system", content: "You are a professional ebook author and writing assistant." },
      { role: "user", content: params.prompt },
    ];

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`xAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      provider: "xai",
      model: params.model,
      tokensUsed: data.usage?.total_tokens,
    };
  }

  /**
   * Call DeepSeek API via Hugging Face
   */
  private async callDeepSeek(params: {
    model: string;
    prompt: string;
    maxTokens: number;
    temperature: number;
    apiKey: string;
  }): Promise<AIResponse> {
    const response = await fetch("https://api-inference.huggingface.co/models/deepseek-ai/deepseek-llm-7b-instruct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        inputs: params.prompt,
        parameters: {
          max_new_tokens: params.maxTokens,
          temperature: params.temperature,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DeepSeek API error: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    const content = Array.isArray(data) ? data[0].generated_text : data.generated_text;

    return {
      content,
      provider: "deepseek",
      model: params.model,
    };
  }

  /**
   * Validate API key format for a provider with comprehensive checks
   */
  private validateApiKey(provider: string, apiKey: string): boolean {
    if (!apiKey || apiKey.trim().length === 0) {
      return false;
    }

    // Remove whitespace
    apiKey = apiKey.trim();

    // Basic format validation with detailed checks
    switch (provider) {
      case "openai":
        // OpenAI keys start with sk- and are typically 51 characters
        return apiKey.startsWith("sk-") && apiKey.length >= 20;
      case "anthropic":
        // Anthropic keys start with sk-ant- and are longer
        return apiKey.startsWith("sk-ant-") && apiKey.length >= 30;
      case "google":
        // Google API keys are typically 39 characters and alphanumeric
        return apiKey.length >= 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
      case "xai":
        // xAI keys start with xai- 
        return apiKey.startsWith("xai-") && apiKey.length >= 20;
      case "deepseek":
        // Hugging Face tokens start with hf_
        return apiKey.startsWith("hf_") && apiKey.length >= 20;
      default:
        // For unknown providers, just check it's not empty and has reasonable length
        return apiKey.length >= 10;
    }
  }

  /**
   * Get detailed validation error message for API key
   */
  getApiKeyValidationError(provider: string, apiKey: string): string | null {
    if (!apiKey || apiKey.trim().length === 0) {
      return `API key is required for ${provider}. Please add your API key in Settings.`;
    }

    apiKey = apiKey.trim();

    switch (provider) {
      case "openai":
        if (!apiKey.startsWith("sk-")) {
          return "OpenAI API keys must start with 'sk-'. Please check your key format.";
        }
        if (apiKey.length < 20) {
          return "OpenAI API key appears too short. Please verify your complete key.";
        }
        break;
      case "anthropic":
        if (!apiKey.startsWith("sk-ant-")) {
          return "Anthropic API keys must start with 'sk-ant-'. Please check your key format.";
        }
        if (apiKey.length < 30) {
          return "Anthropic API key appears too short. Please verify your complete key.";
        }
        break;
      case "google":
        if (apiKey.length < 20) {
          return "Google API key appears too short. Please verify your complete key.";
        }
        if (!/^[A-Za-z0-9_-]+$/.test(apiKey)) {
          return "Google API key contains invalid characters. Should only contain letters, numbers, underscores, and hyphens.";
        }
        break;
      case "xai":
        if (!apiKey.startsWith("xai-")) {
          return "xAI API keys must start with 'xai-'. Please check your key format.";
        }
        if (apiKey.length < 20) {
          return "xAI API key appears too short. Please verify your complete key.";
        }
        break;
      case "deepseek":
        if (!apiKey.startsWith("hf_")) {
          return "DeepSeek requires a Hugging Face token starting with 'hf_'. Please check your key format.";
        }
        if (apiKey.length < 20) {
          return "Hugging Face token appears too short. Please verify your complete token.";
        }
        break;
      default:
        if (apiKey.length < 10) {
          return `API key for ${provider} appears too short. Please verify your complete key.`;
        }
    }

    return null; // Key is valid
  }

  /**
   * Test API key by making a minimal request
   */
  async testApiKey(provider: string, apiKey: string): Promise<{ valid: boolean; error?: string }> {
    // First check format
    const formatError = this.getApiKeyValidationError(provider, apiKey);
    if (formatError) {
      return { valid: false, error: formatError };
    }

    try {
      // Make a minimal test request
      const testPrompt = "Hello";
      await this.generateContent({
        provider,
        model: this.getDefaultModel(provider),
        prompt: testPrompt,
        apiKey,
        maxTokens: 10,
        temperature: 0.1
      });

      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Parse common API errors
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        return { valid: false, error: `Invalid API key for ${provider}. Please check your key is correct and active.` };
      }
      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        return { valid: false, error: `API key for ${provider} lacks required permissions or has exceeded quota.` };
      }
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        return { valid: false, error: `Rate limit exceeded for ${provider}. API key is valid but temporarily blocked.` };
      }
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return { valid: false, error: `Network error testing ${provider} API key. Please check your connection.` };
      }

      return { valid: false, error: `Failed to validate ${provider} API key: ${errorMessage}` };
    }
  }

  /**
   * Check if API key exists for auto provider selection
   */
  private async checkApiKeyExists(provider: string, apiKey: string): Promise<boolean> {
    return this.validateApiKey(provider, apiKey);
  }

  /**
   * Improve an outline using AI with real API calls
   */
  async improveOutline(outline: string, provider: string, model: string, apiKey: string): Promise<string> {
    if (!this.validateApiKey(provider, apiKey)) {
      throw new Error(`Invalid API key for ${provider}. Please check your API key in settings.`);
    }

    const prompt = `You are a bestselling author and book structure expert. Analyze and improve this book outline to make it more comprehensive, engaging, and marketable.

Current Outline:
${outline}

Instructions:
- Enhance chapter titles to be more compelling and specific
- Add missing chapters that would strengthen the book
- Improve the logical flow and progression
- Add 3-5 section topics under each chapter
- Ensure the structure appeals to readers and provides clear value
- Maintain the core topic and intent
- Return the improved outline in a clear, structured format

Provide the enhanced outline:`;

    try {
      const response = await this.generateContent({
        provider,
        model,
        prompt,
        apiKey,
        maxTokens: 2000,
        temperature: 0.6,
      });

      return response.content;
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key')) {
        throw error;
      }
      throw new Error(`Failed to improve outline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a chapter using AI
   */
  async generateChapter(
    chapterTitle: string,
    sections: string[],
    context: string,
    provider: string,
    model: string,
    apiKey: string,
  ): Promise<string> {
    const prompt = `Write a detailed chapter titled "${chapterTitle}" covering these sections: ${sections.join(", ")}. Context: ${context}`;
    const response = await this.generateContent({ provider, model, prompt, apiKey });
    return response.content;
  }

  /**
   * Generate brainstorming suggestions with real AI and caching
   */
  async brainstorm(topic: string, provider: string, model: string, apiKey: string): Promise<{ titles: string[]; outline: string }> {
    if (!this.validateApiKey(provider, apiKey)) {
      throw new Error(`Invalid API key for ${provider}. Please check your API key in settings.`);
    }

    // Check cache first
    const cached = aiCacheService.getCachedBrainstorm(topic, provider);
    if (cached) {
      return cached;
    }

    const prompt = `You are a bestselling ebook author and publishing expert. Generate 5 compelling, marketable book titles and a detailed chapter outline for a book about: ${topic}

Requirements:
- Titles should be attention-grabbing and marketable
- Outline should have 8-12 chapters with descriptive titles
- Each chapter should have 3-5 section topics
- Focus on practical, actionable content
- Consider SEO and keyword optimization

Return your response as JSON with this exact structure:
{
  "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
  "outline": {
    "title": "Main Book Title",
    "subtitle": "Compelling Subtitle",
    "chapters": [
      {
        "number": 1,
        "title": "Chapter Title",
        "sections": ["Section 1", "Section 2", "Section 3"]
      }
    ]
  }
}`;

    try {
      const response = await this.generateContent({
        provider,
        model,
        prompt,
        apiKey,
        temperature: 0.8,
        maxTokens: 3000
      });

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response.content);
        if (parsed.titles && parsed.outline) {
          const result = {
            titles: parsed.titles,
            outline: JSON.stringify(parsed.outline, null, 2)
          };
          
          // Cache the result
          aiCacheService.cacheBrainstorm(topic, provider, result);
          return result;
        }
      } catch (parseError) {
        // If JSON parsing fails, return structured fallback
        console.warn('Failed to parse AI response as JSON, using fallback structure');
      }

      // Fallback: extract titles and create basic outline
      const lines = response.content.split('\n').filter(line => line.trim());
      const titles = lines
        .filter(line => line.includes('Title') || line.match(/^\d+\./))
        .slice(0, 5)
        .map(line => line.replace(/^\d+\.?\s*/, '').replace(/Title\s*\d*:?\s*/i, '').trim());

      if (titles.length === 0) {
        titles.push(
          `The Complete Guide to ${topic}`,
          `Mastering ${topic}: A Practical Approach`,
          `${topic} for Beginners and Experts`,
          `The Ultimate ${topic} Handbook`,
          `Transform Your Life with ${topic}`
        );
      }

      const result = {
        titles,
        outline: response.content
      };

      // Cache the fallback result
      aiCacheService.cacheBrainstorm(topic, provider, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key')) {
        throw error;
      }
      throw new Error(`Failed to generate brainstorm ideas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate complete ebook content with real AI
   */
  async generateEbook(params: {
    topic: string;
    wordCount: number;
    tone: string;
    customTone?: string;
    audience: string;
    outline?: string;
    provider: string;
    model: string;
    apiKey: string;
  }): Promise<string> {
    if (!this.validateApiKey(params.provider, params.apiKey)) {
      throw new Error(`Invalid API key for ${params.provider}. Please check your API key in settings.`);
    }

    const outlineSection = params.outline ? `\n\nUse this outline as your structure:\n${params.outline}` : "";
    const toneInstruction = params.tone === "custom" && params.customTone
      ? `Writing style: ${params.customTone}`
      : `Tone: ${params.tone}`;

    const prompt = `You are a professional ghostwriter and bestselling author. Write a complete, detailed ebook on the topic: ${params.topic}.

Requirements:
- Target word count: ${params.wordCount} words
- ${toneInstruction}
- Target audience: ${params.audience}
- Include: Title Page, Table of Contents, Introduction, Multiple Chapters (8-15), Conclusion, Resources/References
- Format in clean Markdown with proper heading structure
- Use H1 for main title, H2 for major sections, H3 for chapters
- Write engaging, valuable content that provides real insights
- Include practical examples, actionable advice, and clear explanations
- Ensure content flows logically from chapter to chapter${outlineSection}

Generate the complete ebook content now in Markdown format.`;

    try {
      const response = await this.generateContent({
        provider: params.provider,
        model: params.model,
        prompt,
        apiKey: params.apiKey,
        maxTokens: Math.min(8000, Math.floor(params.wordCount / 2)), // Rough token estimation
        temperature: 0.7,
      });

      return response.content;
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key')) {
        throw error;
      }
      throw new Error(`Failed to generate ebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a single chapter with real AI
   */
  async generateChapter(params: {
    chapterTitle: string;
    chapterNumber: number;
    outline: string;
    tone: string;
    audience: string;
    wordCount: number;
    provider: string;
    model: string;
    apiKey: string;
  }): Promise<string> {
    if (!this.validateApiKey(params.provider, params.apiKey)) {
      throw new Error(`Invalid API key for ${params.provider}. Please check your API key in settings.`);
    }

    const prompt = `You are a professional author writing Chapter ${params.chapterNumber} of a book. 

Chapter Details:
- Title: "${params.chapterTitle}"
- Target word count: ${params.wordCount} words
- Tone: ${params.tone}
- Audience: ${params.audience}

Book Context:
${params.outline}

Instructions:
- Write a complete, engaging chapter that fits within the overall book structure
- Include practical examples, actionable advice, and clear explanations
- Use subheadings to organize content (H3 and H4 levels)
- Ensure the chapter flows well and provides real value
- Write in Markdown format
- Start with the chapter title as H2: ## Chapter ${params.chapterNumber}: ${params.chapterTitle}

Generate the complete chapter content now.`;

    try {
      const response = await this.generateContent({
        provider: params.provider,
        model: params.model,
        prompt,
        apiKey: params.apiKey,
        maxTokens: Math.min(4000, Math.floor(params.wordCount / 2)),
        temperature: 0.7,
      });

      return response.content;
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key')) {
        throw error;
      }
      throw new Error(`Failed to generate chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Humanize content using real AI processing with caching
   */
  async humanizeContent(content: string, provider: string, model: string, apiKey: string): Promise<string> {
    if (!this.validateApiKey(provider, apiKey)) {
      throw new Error(`Invalid API key for ${provider}. Please check your API key in settings.`);
    }

    // Check cache first
    const cached = aiCacheService.getCachedHumanization(content, provider);
    if (cached) {
      return cached;
    }

    const prompt = `You are an expert editor specializing in making AI-generated content sound more natural and human-written. Transform this content through a comprehensive humanization process:

CONTENT TO HUMANIZE:
${content}

HUMANIZATION REQUIREMENTS:
1. STRUCTURAL REWRITE: Vary sentence lengths, merge short sentences, break up long ones
2. LEXICAL IMPROVEMENTS: Replace AI clichés and robotic phrases with natural language
3. PERSONALITY INJECTION: Add contractions, personal touches, conversational elements
4. FLOW ENHANCEMENT: Improve transitions and logical connections between ideas

BANNED AI PHRASES TO REPLACE:
- "delve into" → "explore" or "examine"
- "leverage" → "use" or "apply"
- "tapestry" → "mix" or "blend"
- "navigate" → "handle" or "manage"
- "robust" → "strong" or "solid"
- "pivotal" → "key" or "important"
- "moreover" → "also" or "plus"
- "furthermore" → "what's more" or "additionally"

STYLE GUIDELINES:
- Use contractions (don't, can't, it's, you're)
- Add occasional rhetorical questions
- Include personal pronouns (you, we, I)
- Vary paragraph lengths
- Use active voice over passive
- Add transitional phrases that sound natural

Return the fully humanized content that reads as if written by a skilled human author.`;

    try {
      const response = await this.generateContent({
        provider,
        model,
        prompt,
        apiKey,
        maxTokens: Math.min(4000, content.length * 2), // Allow for expansion
        temperature: 0.3, // Lower temperature for more consistent editing
      });

      // Cache the result
      aiCacheService.cacheHumanization(content, provider, response.content);
      
      return response.content;
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key')) {
        throw error;
      }
      throw new Error(`Failed to humanize content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const aiService = new AIService();
