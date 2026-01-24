/**
 * Rate Limiting Service
 * Implements rate limiting for API endpoints and AI requests
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimitService {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  // Default rate limit configurations
  private configs: Record<string, RateLimitConfig> = {
    'ai-generation': { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute
    'api-key-operations': { windowMs: 60000, maxRequests: 20 }, // 20 requests per minute
    'image-generation': { windowMs: 300000, maxRequests: 5 }, // 5 requests per 5 minutes
    'authentication': { windowMs: 900000, maxRequests: 5 }, // 5 attempts per 15 minutes
    'export-operations': { windowMs: 60000, maxRequests: 3 }, // 3 exports per minute
  };

  /**
   * Check if a request is within rate limits
   */
  checkRateLimit(userId: string, operation: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const key = `${userId}:${operation}`;
    const config = this.configs[operation];
    
    if (!config) {
      // No rate limit configured for this operation
      return { allowed: true };
    }

    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window has expired
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return { 
        allowed: true, 
        resetTime: now + config.windowMs,
        remaining: config.maxRequests - 1
      };
    }

    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      return { 
        allowed: false, 
        resetTime: entry.resetTime,
        remaining: 0
      };
    }

    // Increment counter
    entry.count++;
    this.limits.set(key, entry);

    return { 
      allowed: true, 
      resetTime: entry.resetTime,
      remaining: config.maxRequests - entry.count
    };
  }

  /**
   * Reset rate limit for a specific user and operation
   */
  resetRateLimit(userId: string, operation: string): void {
    const key = `${userId}:${operation}`;
    this.limits.delete(key);
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(userId: string, operation: string): { count: number; resetTime: number; remaining: number } | null {
    const key = `${userId}:${operation}`;
    const config = this.configs[operation];
    const entry = this.limits.get(key);

    if (!config || !entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.resetTime) {
      // Window has expired
      this.limits.delete(key);
      return null;
    }

    return {
      count: entry.count,
      resetTime: entry.resetTime,
      remaining: Math.max(0, config.maxRequests - entry.count)
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(operation: string, config: RateLimitConfig): void {
    this.configs[operation] = config;
  }

  /**
   * Get all rate limit configurations
   */
  getConfigs(): Record<string, RateLimitConfig> {
    return { ...this.configs };
  }

  /**
   * Middleware function for Express-like frameworks
   */
  middleware(operation: string) {
    return async (userId: string) => {
      const result = this.checkRateLimit(userId, operation);
      
      if (!result.allowed) {
        const resetIn = Math.ceil((result.resetTime! - Date.now()) / 1000);
        throw new Error(`Rate limit exceeded. Try again in ${resetIn} seconds.`);
      }

      return result;
    };
  }

  /**
   * Get rate limit headers for HTTP responses
   */
  getRateLimitHeaders(userId: string, operation: string): Record<string, string> {
    const config = this.configs[operation];
    const status = this.getRateLimitStatus(userId, operation);

    if (!config) {
      return {};
    }

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Window': config.windowMs.toString(),
    };

    if (status) {
      headers['X-RateLimit-Remaining'] = status.remaining.toString();
      headers['X-RateLimit-Reset'] = Math.ceil(status.resetTime / 1000).toString();
    } else {
      headers['X-RateLimit-Remaining'] = config.maxRequests.toString();
    }

    return headers;
  }
}

// Singleton instance
export const rateLimitService = new RateLimitService();

// Clean up expired entries every 5 minutes
setInterval(() => {
  rateLimitService.cleanup();
}, 5 * 60 * 1000);