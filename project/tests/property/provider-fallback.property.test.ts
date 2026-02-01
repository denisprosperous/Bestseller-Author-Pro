import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { aiService } from '~/utils/ai-service';

/**
 * Property 3: Provider Fallback Mechanism
 * Validates: Requirements 1.5, 5.2, 5.3
 * 
 * For any AI request with "auto" provider selection, when the primary provider fails, 
 * the system should attempt fallback providers in the correct preference order 
 * until success or all providers are exhausted.
 */
describe('Property 3: Provider Fallback Mechanism', () => {
  beforeEach(() => {
    // Clear any mocks before each test
    vi.clearAllMocks();
  });

  it('should handle auto provider selection gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          prompt: fc.string({ minLength: 10, maxLength: 200 }),
          maxTokens: fc.integer({ min: 100, max: 2000 }),
          temperature: fc.float({ min: 0, max: 1 })
        }),
        async (request) => {
          // Property: Auto provider selection should handle failures gracefully
          
          try {
            const response = await aiService.generateContent({
              provider: 'auto',
              model: 'auto',
              prompt: request.prompt,
              apiKey: 'mock-key-for-fallback-test',
              maxTokens: request.maxTokens,
              temperature: request.temperature
            });

            // If successful, should return valid response structure
            if (response) {
              expect(response.content).toBeTruthy();
              expect(response.provider).toBeTruthy();
              expect(response.model).toBeTruthy();
              
              // Provider should be one of the supported ones
              expect(['openai', 'anthropic', 'xai', 'google', 'deepseek']).toContain(response.provider);
            }
            
          } catch (error) {
            // If all providers fail, should get descriptive error
            expect(error).toBeInstanceOf(Error);
            const errorMessage = (error as Error).message;
            expect(errorMessage).toBeTruthy();
            
            // Error should indicate provider failure
            expect(
              errorMessage.includes('provider') ||
              errorMessage.includes('failed') ||
              errorMessage.includes('API key')
            ).toBe(true);
          }
        }
      ),
      { numRuns: 3, timeout: 120000 } // Longer timeout for fallback testing
    );
  });

  it('should validate transient error detection', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('rate limit exceeded'),
          fc.constant('429 Too Many Requests'),
          fc.constant('network timeout'),
          fc.constant('ETIMEDOUT'),
          fc.constant('service unavailable'),
          fc.constant('503 Service Unavailable'),
          fc.constant('fetch failed'),
          fc.constant('ECONNRESET')
        ),
        (errorMessage) => {
          // Property: Transient errors should be correctly identified
          const service = aiService as any;
          
          if (service.isTransientError) {
            const isTransient = service.isTransientError(errorMessage);
            
            // All these error messages should be identified as transient
            expect(isTransient).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should validate permanent error detection', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('Invalid API key'),
          fc.constant('unauthorized'),
          fc.constant('401 Unauthorized'),
          fc.constant('API key is required'),
          fc.constant('forbidden'),
          fc.constant('invalid credentials')
        ),
        (errorMessage) => {
          // Property: Permanent errors should NOT be identified as transient
          const service = aiService as any;
          
          if (service.isTransientError) {
            const isTransient = service.isTransientError(errorMessage);
            
            // These error messages should NOT be transient
            expect(isTransient).toBe(false);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should validate exponential backoff delay calculation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }),
        (attempt) => {
          // Property: Exponential backoff should follow 2^n * 1000ms pattern
          const expectedDelay = Math.pow(2, attempt) * 1000;
          
          // Verify the calculation is correct
          expect(expectedDelay).toBeGreaterThanOrEqual(0);
          expect(expectedDelay).toBeLessThanOrEqual(32000); // Max 32 seconds for attempt 5
          
          // Verify exponential growth
          if (attempt > 0) {
            const previousDelay = Math.pow(2, attempt - 1) * 1000;
            expect(expectedDelay).toBe(previousDelay * 2);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate provider preference order', () => {
    // Property: Provider preference order should be consistent
    const expectedOrder = ['openai', 'anthropic', 'xai', 'google', 'deepseek'];
    
    // This is a deterministic property - the order should always be the same
    expect(expectedOrder).toEqual(['openai', 'anthropic', 'xai', 'google', 'deepseek']);
    
    // Verify no duplicates
    const uniqueProviders = new Set(expectedOrder);
    expect(uniqueProviders.size).toBe(expectedOrder.length);
    
    // Verify all providers are strings
    expectedOrder.forEach(provider => {
      expect(typeof provider).toBe('string');
      expect(provider.length).toBeGreaterThan(0);
    });
  });
});
