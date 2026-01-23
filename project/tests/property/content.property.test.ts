import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { contentService, type GeneratedEbook, type CreateEbookParams } from '~/services/content-service';

/**
 * Property 5: Complete Data Storage and Retrieval
 * Validates: Requirements 3.1, 3.2, 3.3, 3.5
 * 
 * For any generated ebook, the system should store all content, metadata, 
 * and associated data in the database, and users should be able to retrieve 
 * all their ebooks with complete data integrity.
 */
describe('Property 5: Complete Data Storage and Retrieval', () => {
  const testUserId = 'test-user-property-5';

  beforeEach(async () => {
    // Clean up any existing test data
    try {
      const existingEbooks = await contentService.getUserEbooks(testUserId);
      for (const ebook of existingEbooks) {
        await contentService.deleteEbook(testUserId, ebook.id);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    // Clean up test data
    try {
      const existingEbooks = await contentService.getUserEbooks(testUserId);
      for (const ebook of existingEbooks) {
        await contentService.deleteEbook(testUserId, ebook.id);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should maintain data integrity for ebook storage and retrieval', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          subtitle: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          topic: fc.string({ minLength: 1, maxLength: 100 }),
          wordCount: fc.integer({ min: 100, max: 100000 }),
          tone: fc.constantFrom('professional', 'casual', 'academic', 'creative', 'custom'),
          customTone: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
          audience: fc.string({ minLength: 1, maxLength: 100 }),
          aiProvider: fc.constantFrom('openai', 'anthropic', 'google', 'xai', 'deepseek'),
          aiModel: fc.string({ minLength: 1, maxLength: 50 }),
          outline: fc.option(fc.string({ minLength: 1, maxLength: 5000 }))
        }),
        async (ebookParams) => {
          // Property: Stored data should be retrievable with complete integrity
          
          // Create ebook with generated parameters
          const createParams: CreateEbookParams = {
            title: ebookParams.title,
            subtitle: ebookParams.subtitle || undefined,
            topic: ebookParams.topic,
            wordCount: ebookParams.wordCount,
            tone: ebookParams.tone,
            customTone: ebookParams.customTone || undefined,
            audience: ebookParams.audience,
            aiProvider: ebookParams.aiProvider,
            aiModel: ebookParams.aiModel,
            outline: ebookParams.outline || undefined
          };

          const ebookId = await contentService.createEbook(testUserId, createParams);
          expect(ebookId).toBeTruthy();

          // Retrieve the ebook
          const retrievedEbook = await contentService.getEbook(testUserId, ebookId);
          expect(retrievedEbook).toBeTruthy();

          if (retrievedEbook) {
            // Verify all data integrity
            expect(retrievedEbook.title).toBe(ebookParams.title);
            expect(retrievedEbook.subtitle).toBe(ebookParams.subtitle || undefined);
            expect(retrievedEbook.topic).toBe(ebookParams.topic);
            expect(retrievedEbook.outline).toBe(ebookParams.outline || undefined);
            expect(retrievedEbook.metadata.tone).toBe(ebookParams.tone);
            expect(retrievedEbook.metadata.customTone).toBe(ebookParams.customTone || undefined);
            expect(retrievedEbook.metadata.audience).toBe(ebookParams.audience);
            expect(retrievedEbook.metadata.aiProvider).toBe(ebookParams.aiProvider);
            expect(retrievedEbook.metadata.aiModel).toBe(ebookParams.aiModel);
            expect(retrievedEbook.status).toBe('draft');

            // Verify it appears in user's ebook list
            const userEbooks = await contentService.getUserEbooks(testUserId);
            const foundEbook = userEbooks.find(e => e.id === ebookId);
            expect(foundEbook).toBeTruthy();
            
            if (foundEbook) {
              expect(foundEbook.title).toBe(ebookParams.title);
              expect(foundEbook.topic).toBe(ebookParams.topic);
              expect(foundEbook.aiProvider).toBe(ebookParams.aiProvider);
            }

            // Clean up
            await contentService.deleteEbook(testUserId, ebookId);
            
            // Verify deletion
            const deletedEbook = await contentService.getEbook(testUserId, ebookId);
            expect(deletedEbook).toBeNull();
          }
        }
      ),
      { numRuns: 20, timeout: 30000 }
    );
  });

  it('should handle chapter operations with data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          chapters: fc.array(
            fc.record({
              number: fc.integer({ min: 1, max: 50 }),
              title: fc.string({ minLength: 1, maxLength: 200 }),
              content: fc.string({ minLength: 10, maxLength: 5000 }),
              wordCount: fc.integer({ min: 10, max: 2000 })
            }),
            { minLength: 1, maxLength: 10 }
          )
        }),
        async (ebookData) => {
          // Property: Chapter operations should maintain data integrity
          
          // Create base ebook
          const ebookId = await contentService.createEbook(testUserId, {
            title: ebookData.title,
            topic: 'Test Topic',
            tone: 'professional',
            audience: 'Test Audience',
            aiProvider: 'openai',
            aiModel: 'gpt-4'
          });

          // Add chapters
          const chapters = ebookData.chapters.map(ch => ({
            id: `chapter-${ch.number}`,
            number: ch.number,
            title: ch.title,
            content: ch.content,
            wordCount: ch.wordCount
          }));

          await contentService.saveChapters(testUserId, ebookId, chapters);

          // Retrieve and verify
          const retrievedEbook = await contentService.getEbook(testUserId, ebookId);
          expect(retrievedEbook).toBeTruthy();
          
          if (retrievedEbook) {
            expect(retrievedEbook.chapters).toHaveLength(chapters.length);
            
            // Verify each chapter
            for (const originalChapter of chapters) {
              const foundChapter = retrievedEbook.chapters.find(
                ch => ch.number === originalChapter.number
              );
              expect(foundChapter).toBeTruthy();
              
              if (foundChapter) {
                expect(foundChapter.title).toBe(originalChapter.title);
                expect(foundChapter.content).toBe(originalChapter.content);
                expect(foundChapter.wordCount).toBe(originalChapter.wordCount);
              }
            }
          }

          // Clean up
          await contentService.deleteEbook(testUserId, ebookId);
        }
      ),
      { numRuns: 10, timeout: 45000 }
    );
  });
});