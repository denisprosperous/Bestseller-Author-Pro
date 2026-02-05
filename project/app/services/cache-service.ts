/**
 * Cache Service for AI responses and other expensive operations
 * Uses browser localStorage with TTL (Time To Live) support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class CacheService {
  private prefix = 'bestseller_cache_';
  private stats = {
    hits: 0,
    misses: 0
  };

  /**
   * Generate cache key from parameters
   */
  private generateKey(namespace: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    const paramString = JSON.stringify(sortedParams);
    return `${this.prefix}${namespace}_${this.hashString(paramString)}`;
  }

  /**
   * Simple hash function for cache keys
   */
  protected hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(namespace: string, params: Record<string, any>, data: T, ttlMinutes: number = 60): void {
    try {
      const key = this.generateKey(namespace, params);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000 // Convert to milliseconds
      };

      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to set cache entry:', error);
      // If localStorage is full, try to clear old entries
      this.cleanup();
    }
  }

  /**
   * Get cache entry if valid
   */
  get<T>(namespace: string, params: Record<string, any>): T | null {
    try {
      const key = this.generateKey(namespace, params);
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        this.stats.misses++;
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if entry has expired
      if (now - entry.timestamp > entry.ttl) {
        localStorage.removeItem(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return entry.data;
    } catch (error) {
      console.warn('Failed to get cache entry:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(namespace: string, params: Record<string, any>): boolean {
    return this.get(namespace, params) !== null;
  }

  /**
   * Remove specific cache entry
   */
  delete(namespace: string, params: Record<string, any>): void {
    try {
      const key = this.generateKey(namespace, params);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to delete cache entry:', error);
    }
  }

  /**
   * Clear all cache entries for a namespace
   */
  clearNamespace(namespace: string): void {
    try {
      const prefix = `${this.prefix}${namespace}_`;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear namespace:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      this.stats.hits = 0;
      this.stats.misses = 0;
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const entry: CacheEntry<any> = JSON.parse(cached);
              if (now - entry.timestamp > entry.ttl) {
                keysToRemove.push(key);
              }
            }
          } catch (parseError) {
            // If we can't parse the entry, remove it
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const size = this.getCacheSize();
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Get number of cache entries
   */
  private getCacheSize(): number {
    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          count++;
        }
      }
    } catch (error) {
      console.warn('Failed to get cache size:', error);
    }
    return count;
  }

  /**
   * Get or set pattern - retrieve from cache or compute and cache
   */
  async getOrSet<T>(
    namespace: string,
    params: Record<string, any>,
    computeFn: () => Promise<T>,
    ttlMinutes: number = 60
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(namespace, params);
    if (cached !== null) {
      return cached;
    }

    // Compute the value
    const result = await computeFn();
    
    // Cache the result
    this.set(namespace, params, result, ttlMinutes);
    
    return result;
  }

  /**
   * Preload cache with common requests
   */
  async preload(requests: Array<{
    namespace: string;
    params: Record<string, any>;
    computeFn: () => Promise<any>;
    ttlMinutes?: number;
  }>): Promise<void> {
    const promises = requests.map(async (request) => {
      try {
        await this.getOrSet(
          request.namespace,
          request.params,
          request.computeFn,
          request.ttlMinutes || 60
        );
      } catch (error) {
        console.warn(`Failed to preload cache for ${request.namespace}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

// AI-specific cache methods
export class AICacheService extends CacheService {
  /**
   * Cache AI response with content-based TTL
   */
  cacheAIResponse(
    provider: string,
    model: string,
    prompt: string,
    response: string,
    tokensUsed?: number
  ): void {
    const params = { provider, model, prompt };
    
    // Longer TTL for longer content (more expensive to regenerate)
    const baseMinutes = 60;
    const contentLength = response.length;
    const ttlMinutes = Math.min(baseMinutes + Math.floor(contentLength / 1000), 24 * 60); // Max 24 hours
    
    this.set('ai_response', params, {
      content: response,
      tokensUsed,
      cachedAt: new Date().toISOString()
    }, ttlMinutes);
  }

  /**
   * Get cached AI response
   */
  getCachedAIResponse(provider: string, model: string, prompt: string): string | null {
    const params = { provider, model, prompt };
    const cached = this.get<{ content: string; tokensUsed?: number; cachedAt: string }>('ai_response', params);
    return cached ? cached.content : null;
  }

  /**
   * Cache brainstorm results
   */
  cacheBrainstorm(topic: string, provider: string, result: { titles: string[]; outline: string }): void {
    const params = { topic, provider };
    this.set('brainstorm', params, result, 4 * 60); // 4 hours TTL
  }

  /**
   * Get cached brainstorm
   */
  getCachedBrainstorm(topic: string, provider: string): { titles: string[]; outline: string } | null {
    const params = { topic, provider };
    return this.get('brainstorm', params);
  }

  /**
   * Cache chapter generation
   */
  cacheChapter(
    chapterTitle: string,
    chapterNumber: number,
    outline: string,
    provider: string,
    content: string
  ): void {
    const params = { chapterTitle, chapterNumber, outline, provider };
    this.set('chapter', params, content, 8 * 60); // 8 hours TTL
  }

  /**
   * Get cached chapter
   */
  getCachedChapter(
    chapterTitle: string,
    chapterNumber: number,
    outline: string,
    provider: string
  ): string | null {
    const params = { chapterTitle, chapterNumber, outline, provider };
    return this.get('chapter', params);
  }

  /**
   * Cache humanization results
   */
  cacheHumanization(content: string, provider: string, humanizedContent: string): void {
    // Use content hash as key to avoid storing large content in params
    const contentHash = this.hashString(content);
    const params = { contentHash, provider, contentLength: content.length };
    this.set('humanization', params, humanizedContent, 2 * 60); // 2 hours TTL
  }

  /**
   * Get cached humanization
   */
  getCachedHumanization(content: string, provider: string): string | null {
    const contentHash = this.hashString(content);
    const params = { contentHash, provider, contentLength: content.length };
    return this.get('humanization', params);
  }
}

// Export singleton instances
export const cacheService = new CacheService();
export const aiCacheService = new AICacheService();