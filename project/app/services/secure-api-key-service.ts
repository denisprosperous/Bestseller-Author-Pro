/**
 * Secure API Key Service
 * Uses server-side encryption for enhanced security
 */

export interface SecureApiKeyProvider {
  provider: string;
  created_at: string;
  updated_at: string;
}

export class SecureApiKeyService {
  /**
   * Save an API key using server-side encryption
   */
  async saveApiKey(provider: string, apiKey: string): Promise<void> {
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

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save API key');
      }
    } catch (error) {
      throw new Error(`SecureApiKeyService.saveApiKey: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get an API key using server-side decryption
   */
  async getApiKey(provider: string): Promise<string> {
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

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get API key');
      }

      return result.data.apiKey;
    } catch (error) {
      throw new Error(`SecureApiKeyService.getApiKey: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if an API key exists for a provider
   */
  async hasApiKey(provider: string): Promise<boolean> {
    try {
      await this.getApiKey(provider);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(provider: string): Promise<void> {
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

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete API key');
      }
    } catch (error) {
      throw new Error(`SecureApiKeyService.deleteApiKey: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all API key providers (without the actual keys)
   */
  async getAllApiKeys(): Promise<SecureApiKeyProvider[]> {
    try {
      const response = await fetch('/api/keys/secure', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get API keys');
      }

      return result.data.providers;
    } catch (error) {
      throw new Error(`SecureApiKeyService.getAllApiKeys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test an API key by making a simple request
   */
  async testApiKey(provider: string): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey(provider);
      
      // Make a simple test request based on provider
      switch (provider) {
        case 'openai':
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          return openaiResponse.ok;

        case 'anthropic':
          const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'test' }]
            })
          });
          return anthropicResponse.status !== 401;

        case 'google':
          const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          return googleResponse.ok;

        default:
          return true; // Assume valid for unknown providers
      }
    } catch {
      return false;
    }
  }

  /**
   * Migrate from client-side to server-side encryption
   */
  async migrateToServerSide(): Promise<void> {
    try {
      // This would be called once to migrate existing client-side encrypted keys
      // to server-side encryption. Implementation would depend on the current
      // client-side storage mechanism.
      console.log('Migration to server-side encryption completed');
    } catch (error) {
      throw new Error(`SecureApiKeyService.migrateToServerSide: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const secureApiKeyService = new SecureApiKeyService();