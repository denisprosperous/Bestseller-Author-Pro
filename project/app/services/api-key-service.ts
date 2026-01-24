/**
 * API Key Service with server-side encryption
 * Handles secure storage and retrieval of API keys
 */

export interface APIKey {
  id: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export class APIKeyService {
  private cache = new Map<string, { key: string; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Save API key using server-side encryption
   */
  async saveApiKey(userId: string, provider: string, apiKey: string): Promise<void> {
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          provider,
          apiKey
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save API key');
      }

      // Clear cache for this provider
      this.cache.delete(`${userId}-${provider}`);
    } catch (error) {
      console.error('Error saving API key:', error);
      throw new Error(`Failed to save API key for ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get API key with server-side decryption and caching
   */
  async getApiKey(userId: string, provider: string): Promise<string | null> {
    // Check cache first
    const cacheKey = `${userId}-${provider}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.key;
    }

    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get',
          provider
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No API key found
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to retrieve API key');
      }

      const data = await response.json();
      
      // Cache the decrypted key
      this.cache.set(cacheKey, {
        key: data.apiKey,
        timestamp: Date.now()
      });

      return data.apiKey;
    } catch (error) {
      console.error('Error retrieving API key:', error);
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw new Error(`Failed to retrieve API key for ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all API keys for a user (without decrypted values)
   */
  async getAllApiKeys(userId: string): Promise<APIKey[]> {
    try {
      const response = await fetch('/api/keys');
      
      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      return data.providers.map((p: any) => ({
        id: `${userId}-${p.provider}`,
        provider: p.provider,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }
  }

  /**
   * Check if API key exists for provider
   */
  async hasApiKey(userId: string, provider: string): Promise<boolean> {
    try {
      const response = await fetch('/api/keys');
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.providers.some((p: any) => p.provider === provider && p.hasKey);
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
    }
  }

  /**
   * Delete API key
   */
  async deleteApiKey(userId: string, provider: string): Promise<void> {
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          provider
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete API key');
      }

      // Clear cache
      this.cache.delete(`${userId}-${provider}`);
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw new Error(`Failed to delete API key for ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all cached keys (for security)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Test API key by making a minimal request
   */
  async testApiKey(userId: string, provider: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const apiKey = await this.getApiKey(userId, provider);
      if (!apiKey) {
        return { valid: false, error: `No API key found for ${provider}` };
      }
      
      // Import AI service dynamically to avoid circular dependency
      const { aiService } = await import("~/utils/ai-service");
      return await aiService.testApiKey(provider, apiKey);
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate API key format without storing
   */
  validateApiKeyFormat(provider: string, apiKey: string): { valid: boolean; error?: string } {
    if (!apiKey || apiKey.trim().length === 0) {
      return { valid: false, error: `API key is required for ${provider}` };
    }

    apiKey = apiKey.trim();

    switch (provider) {
      case "openai":
        if (!apiKey.startsWith("sk-")) {
          return { valid: false, error: "OpenAI API keys must start with 'sk-'" };
        }
        if (apiKey.length < 20) {
          return { valid: false, error: "OpenAI API key appears too short" };
        }
        break;
      case "anthropic":
        if (!apiKey.startsWith("sk-ant-")) {
          return { valid: false, error: "Anthropic API keys must start with 'sk-ant-'" };
        }
        if (apiKey.length < 30) {
          return { valid: false, error: "Anthropic API key appears too short" };
        }
        break;
      case "google":
        if (apiKey.length < 20) {
          return { valid: false, error: "Google API key appears too short" };
        }
        if (!/^[A-Za-z0-9_-]+$/.test(apiKey)) {
          return { valid: false, error: "Google API key contains invalid characters" };
        }
        break;
      case "xai":
        if (!apiKey.startsWith("xai-")) {
          return { valid: false, error: "xAI API keys must start with 'xai-'" };
        }
        if (apiKey.length < 20) {
          return { valid: false, error: "xAI API key appears too short" };
        }
        break;
      case "deepseek":
        if (!apiKey.startsWith("hf_")) {
          return { valid: false, error: "DeepSeek requires a Hugging Face token starting with 'hf_'" };
        }
        if (apiKey.length < 20) {
          return { valid: false, error: "Hugging Face token appears too short" };
        }
        break;
      default:
        if (apiKey.length < 10) {
          return { valid: false, error: `API key for ${provider} appears too short` };
        }
    }

    return { valid: true };
  }
}

export const apiKeyService = new APIKeyService();
