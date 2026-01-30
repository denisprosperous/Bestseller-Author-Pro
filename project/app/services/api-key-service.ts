/**
 * API Key Service with server-side encryption
 * Handles secure storage and retrieval of API keys
 * 
 * Development Mode: Set VITE_USE_DEV_API_KEYS=true in .env to use environment variables
 * Testing Mode: Uses localStorage when database is not available
 */

import { localAPIKeyService } from "./local-api-key-service";

// Development mode - read API keys from environment variables
const DEV_API_KEYS = {
  openai: import.meta.env.VITE_OPENAI_API_KEY || '',
  anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  google: import.meta.env.VITE_GOOGLE_API_KEY || '',
  xai: import.meta.env.VITE_XAI_API_KEY || '',
  deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY || ''
};

const USE_DEV_KEYS = import.meta.env.VITE_USE_DEV_API_KEYS === 'true';

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
    // In dev mode with USE_DEV_KEYS, skip saving (use env vars instead)
    if (USE_DEV_KEYS) {
      console.log(`Dev mode: Skipping save for ${provider} (using environment variables)`);
      return;
    }

    try {
      const response = await fetch('/api/keys/secure', {
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

      const data = await response.json();

      if (!response.ok) {
        // If database fails, fallback to localStorage
        console.warn('Database save failed, using localStorage fallback');
        localAPIKeyService.saveApiKey(provider, apiKey);
        return;
      }

      // Clear cache for this provider
      this.cache.delete(`${userId}-${provider}`);
    } catch (error) {
      console.error('Error saving API key:', error);
      // Fallback to localStorage on error
      console.warn('Using localStorage fallback due to error');
      localAPIKeyService.saveApiKey(provider, apiKey);
    }
  }

  /**
   * Get API key with server-side decryption and caching
   */
  async getApiKey(userId: string, provider: string): Promise<string | null> {
    // In dev mode with USE_DEV_KEYS, return from environment variables
    if (USE_DEV_KEYS) {
      const devKey = DEV_API_KEYS[provider as keyof typeof DEV_API_KEYS];
      if (devKey) {
        console.log(`Dev mode: Using ${provider} key from environment variables`);
        return devKey;
      }
    }

    // Check cache first
    const cacheKey = `${userId}-${provider}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.key;
    }

    try {
      const response = await fetch('/api/keys/secure', {
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
        // Fallback to localStorage
        const localKey = localAPIKeyService.getApiKey(provider);
        if (localKey) {
          console.log(`Using ${provider} key from localStorage`);
          return localKey;
        }
        return null;
      }

      const result = await response.json();
      const apiKey = result.data?.apiKey;
      
      if (!apiKey) {
        // Fallback to localStorage
        const localKey = localAPIKeyService.getApiKey(provider);
        return localKey;
      }

      // Cache the decrypted key
      this.cache.set(cacheKey, {
        key: apiKey,
        timestamp: Date.now()
      });

      return apiKey;
    } catch (error) {
      console.error('Error retrieving API key:', error);
      // Fallback to localStorage
      const localKey = localAPIKeyService.getApiKey(provider);
      if (localKey) {
        console.log(`Using ${provider} key from localStorage (fallback)`);
        return localKey;
      }
      return null;
    }
  }

  /**
   * Get all API keys for a user (without decrypted values)
   */
  async getAllApiKeys(userId: string): Promise<APIKey[]> {
    // In dev mode with USE_DEV_KEYS, return providers that have env vars set
    if (USE_DEV_KEYS) {
      const providers: APIKey[] = [];
      Object.entries(DEV_API_KEYS).forEach(([provider, key]) => {
        if (key) {
          providers.push({
            id: `${userId}-${provider}`,
            provider,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });
      return providers;
    }

    try {
      const response = await fetch('/api/keys/secure');
      
      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const result = await response.json();
      const providers = result.data?.providers || [];
      
      return providers.map((p: any) => ({
        id: `${userId}-${p.provider}`,
        provider: p.provider,
        createdAt: p.created_at,
        updatedAt: p.updated_at
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
    // In dev mode with USE_DEV_KEYS, check environment variables
    if (USE_DEV_KEYS) {
      return !!DEV_API_KEYS[provider as keyof typeof DEV_API_KEYS];
    }

    try {
      const response = await fetch('/api/keys/secure');
      
      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      const providers = result.data?.providers || [];
      
      return providers.some((p: any) => p.provider === provider);
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
      const response = await fetch('/api/keys/secure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          provider
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete API key');
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
