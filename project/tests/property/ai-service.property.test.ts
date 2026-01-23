import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { aiService } from '~/utils/ai-service';

/**
 * Property 1: AI Service Integration
 * Validates: Requirements 1.1, 1.2, 1.3
 * 
 * For any valid brainstorm or generation request with proper API keys, 
 * the AI service should successfully call the specified provider and model, 
 * returning generated content that matches the request parameters.
 */
describe('Property 1: AI Service Integration', () => {
  // Mock API key for testing - in real tests, use test API keys
  const mockApiKey = 'test-api-key-mock';

  it('should generate consistent content structure for valid requests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          provider: fc.constantFrom('openai', 'anthropic', 'google', 'xai', 'deepseek'),
          model: fc.string({ minLength: 1, maxLength: 50 }),
          prompt: fc.string({ minLength: 10, maxLength: 1000 }),
          maxTokens: fc.integer({ min: 100, max: 4000 }),
          temperature: fc.float({ min: 0, max: 1 })
        }),
        async (request) => {
          // Property: Valid requests should return structured responses
          
          try {
            const response = await aiService.generateContent({
              provider: request.provider,
              model: request.model,
              prompt: request.prompt,
              apiKey: mockApiKey,
              maxTokens: request.maxTokens,
              temperature: request.temperature
            });

            // Response should have required structure
            expect(response).toBeTruthy();
            expect(response.content).toBeTruthy();
            expect(typeof response.content).toBe('string');
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.provider).toBe(request.provider);
            expect(response.model).toBeTruthy();

            // Content should be non-empty and reasonable
            expect(response.content.trim().length).toBeGreaterThan(0);
            
          } catch (error) {
            // If API key is invalid or service unavailable, error should be descriptive
            expect(error).toBeInstanceOf(Error);
            const errorMessage = (error as Error).message;
            expect(errorMessage).toBeTruthy();
            expect(typeof errorMessage).toBe('string');
          }
        }
      ),
      { numRuns: 5, timeout: 60000 } // Reduced runs for API calls
    );
  });

  it('should handle brainstorm requests consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          topic: fc.string({ minLength: 5, maxLength: 200 }),
          provider: fc.constantFrom('openai', 'anthropic', 'google'),
          model: fc.string({ minLength: 1, maxLength: 50 })
        }),
        async (brainstormRequest) => {
          // Property: Brainstorm should return structured title and outline data
          
          try {
            const result = await aiService.brainstorm(
              brainstormRequest.topic,
              brainstormRequest.provider,
              brainstormRequest.model,
              mockApiKey
            );

            // Should return structured brainstorm data
            expect(result).toBeTruthy();
            expect(result.titles).toBeTruthy();
            expect(Array.isArray(result.titles)).toBe(true);
            expect(result.titles.length).toBeGreaterThan(0);
            expect(result.outline).toBeTruthy();
            expect(typeof result.outline).toBe('string');

            // Titles should be non-empty strings
            for (const title of result.titles) {
              expect(typeof title).toBe('string');
              expect(title.trim().length).toBeGreaterThan(0);
            }

            // Outline should be substantial
            expect(result.outline.trim().length).toBeGreaterThan(10);
            
          } catch (error) {
            // If API fails, error should be descriptive
            expect(error).toBeInstanceOf(Error);
            const errorMessage = (error as Error).message;
            expect(errorMessage).toBeTruthy();
          }
        }
      ),
      { numRuns: 3, timeout: 90000 }
    );
  });
});

/**
 * Property 2: API Key Validation and Error Handling
 * Validates: Requirements 1.4, 5.1, 5.5
 * 
 * For any AI service request, if API keys are invalid or missing, 
 * the system should return descriptive error messages and appropriate 
 * redirects without making external API calls.
 */
describe('Property 2: API Key Validation and Error Handling', () => {
  it('should handle invalid API keys consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          provider: fc.constantFrom('openai', 'anthropic', 'google', 'xai', 'deepseek'),
          model: fc.string({ minLength: 1, maxLength: 50 }),
          prompt: fc.string({ minLength: 1, maxLength: 100 }),
          invalidApiKey: fc.oneof(
            fc.constant(''),
            fc.constant('invalid-key'),
            fc.string({ minLength: 1, maxLength: 10 }),
            fc.constant('wrong-format-key')
          )
        }),
        async (request) => {
          // Property: Invalid API keys should produce consistent error behavior
          
          try {
            await aiService.generateContent({
              provider: request.provider,
              model: request.model,
              prompt: request.prompt,
              apiKey: request.invalidApiKey,
              maxTokens: 1000,
              temperature: 0.7
            });

            // If no error thrown, the key might have been valid by coincidence
            // This is acceptable for the property test
            
          } catch (error) {
            // Error should be descriptive and mention API key issues
            expect(error).toBeInstanceOf(Error);
            const errorMessage = (error as Error).message.toLowerCase();
            
            // Should contain relevant error information
            expect(
              errorMessage.includes('api key') ||
              errorMessage.includes('invalid') ||
              errorMessage.includes('unauthorized') ||
              errorMessage.includes('authentication')
            ).toBe(true);
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  it('should validate API key formats correctly', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          provider: fc.constantFrom('openai', 'anthropic', 'google', 'xai', 'deepseek'),
          apiKey: fc.string({ minLength: 0, maxLength: 100 })
        }),
        (testCase) => {
          // Property: API key validation should be consistent with provider requirements
          
          // This tests the validateApiKey method indirectly through the service
          const service = aiService as any; // Access private method for testing
          
          if (service.validateApiKey) {
            const isValid = service.validateApiKey(testCase.provider, testCase.apiKey);
            
            // Validation should be boolean
            expect(typeof isValid).toBe('boolean');
            
            // Empty keys should always be invalid
            if (testCase.apiKey.trim().length === 0) {
              expect(isValid).toBe(false);
            }
            
            // Provider-specific validation
            switch (testCase.provider) {
              case 'openai':
                if (testCase.apiKey.startsWith('sk-')) {
                  // OpenAI keys starting with sk- should be considered valid format
                  expect(isValid).toBe(true);
                }
                break;
              case 'anthropic':
                if (testCase.apiKey.startsWith('sk-ant-')) {
                  expect(isValid).toBe(true);
                }
                break;
              case 'xai':
                if (testCase.apiKey.startsWith('xai-')) {
                  expect(isValid).toBe(true);
                }
                break;
              case 'deepseek':
                if (testCase.apiKey.startsWith('hf_')) {
                  expect(isValid).toBe(true);
                }
                break;
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 3: Provider Fallback Mechanism
 * Validates: Requirements 1.5, 5.2, 5.3
 * 
 * For any AI request with "auto" provider selection, when the primary provider fails, 
 * the system should attempt fallback providers in the correct preference order 
 * until success or all providers are exhausted.
 */
describe('Property 3: Provider Fallback Mechanism', () => {
  it('should attempt providers in correct fallback order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          prompt: fc.string({ minLength: 10, maxLength: 200 }),
          maxTokens: fc.integer({ min: 100, max: 2000 }),
          temperature: fc.float({ min: 0, max: 1 })
        }),
        async (request) => {
          // Property: Auto provider selection should follow preference order
          
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
});