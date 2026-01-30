/**
 * Local API Key Service - Browser Storage
 * Stores API keys in browser localStorage for testing
 * WARNING: This is NOT secure and should only be used for development/testing
 */

const STORAGE_KEY = 'bestseller_api_keys';

export interface LocalAPIKey {
  provider: string;
  key: string;
  createdAt: string;
  updatedAt: string;
}

export class LocalAPIKeyService {
  /**
   * Save API key to localStorage
   */
  saveApiKey(provider: string, apiKey: string): void {
    try {
      const keys = this.getAllKeys();
      const existingIndex = keys.findIndex(k => k.provider === provider);
      
      const keyData: LocalAPIKey = {
        provider,
        key: apiKey,
        createdAt: existingIndex >= 0 ? keys[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        keys[existingIndex] = keyData;
      } else {
        keys.push(keyData);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
      console.log(`✅ API key saved to localStorage for ${provider}`);
    } catch (error) {
      console.error('Failed to save API key to localStorage:', error);
      throw new Error(`Failed to save API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get API key from localStorage
   */
  getApiKey(provider: string): string | null {
    try {
      const keys = this.getAllKeys();
      const keyData = keys.find(k => k.provider === provider);
      return keyData ? keyData.key : null;
    } catch (error) {
      console.error('Failed to get API key from localStorage:', error);
      return null;
    }
  }

  /**
   * Get all API keys from localStorage
   */
  getAllKeys(): LocalAPIKey[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get all API keys from localStorage:', error);
      return [];
    }
  }

  /**
   * Check if API key exists for provider
   */
  hasApiKey(provider: string): boolean {
    const keys = this.getAllKeys();
    return keys.some(k => k.provider === provider);
  }

  /**
   * Delete API key from localStorage
   */
  deleteApiKey(provider: string): void {
    try {
      const keys = this.getAllKeys();
      const filtered = keys.filter(k => k.provider !== provider);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log(`✅ API key deleted from localStorage for ${provider}`);
    } catch (error) {
      console.error('Failed to delete API key from localStorage:', error);
      throw new Error(`Failed to delete API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all API keys from localStorage
   */
  clearAllKeys(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('✅ All API keys cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear API keys from localStorage:', error);
    }
  }

  /**
   * Export keys as JSON (for backup)
   */
  exportKeys(): string {
    const keys = this.getAllKeys();
    return JSON.stringify(keys, null, 2);
  }

  /**
   * Import keys from JSON (for restore)
   */
  importKeys(jsonData: string): void {
    try {
      const keys = JSON.parse(jsonData) as LocalAPIKey[];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
      console.log(`✅ Imported ${keys.length} API keys to localStorage`);
    } catch (error) {
      console.error('Failed to import API keys:', error);
      throw new Error('Invalid JSON data');
    }
  }
}

export const localAPIKeyService = new LocalAPIKeyService();
