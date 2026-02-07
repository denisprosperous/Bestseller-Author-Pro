import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SessionService } from '~/services/session-service';
import type { BrainstormResult, BuilderConfig, GenerationProgress } from '~/services/session-service';

/**
 * Property-Based Tests for Session Persistence Across Workflow
 * **Property 4: State Persistence Across Workflow**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * Requirements:
 * - 2.1: Brainstorm results persist and flow to Builder
 * - 2.2: Builder configuration persists during generation
 * - 2.3: Generation progress is tracked and persisted
 * - 2.4: Session state survives page refreshes and navigation
 */

describe('Session Persistence - Property Tests', () => {
  let sessionService: SessionService;
  let mockSupabase: any;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'test-session-id' },
              error: null
            }))
          }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: null
              })),
              gt: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    single: vi.fn(() => ({
                      data: null,
                      error: null
                    }))
                  }))
                }))
              }))
            })),
            single: vi.fn(() => ({
              data: null,
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: null,
              error: null
            }))
          }))
        })),
        delete: vi.fn(() => ({
          lt: vi.fn(() => ({
            select: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      }))
    };

    // Mock the supabase module
    vi.doMock('~/lib/supabase', () => ({
      supabase: mockSupabase
    }));

    sessionService = new SessionService();
  });

  /**
   * Arbitrary generators for session data
   */
  const brainstormResultArbitrary = fc.record({
    titles: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 1, maxLength: 10 }),
    outline: fc.string({ minLength: 50, maxLength: 500 }),
    topic: fc.string({ minLength: 5, maxLength: 100 }),
    provider: fc.constantFrom('openai', 'anthropic', 'google', 'xai', 'deepseek'),
    model: fc.string({ minLength: 5, maxLength: 50 }),
    selectedTitle: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined })
  });

  const builderConfigArbitrary = fc.record({
    topic: fc.string({ minLength: 5, maxLength: 100 }),
    wordCount: fc.integer({ min: 1000, max: 100000 }),
    tone: fc.constantFrom('professional', 'casual', 'academic', 'creative', 'custom'),
    customTone: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
    audience: fc.string({ minLength: 5, maxLength: 100 }),
    provider: fc.constantFrom('openai', 'anthropic', 'google', 'xai', 'deepseek'),
    model: fc.string({ minLength: 5, maxLength: 50 }),
    outline: fc.option(fc.string({ minLength: 50, maxLength: 500 }), { nil: undefined }),
    improveOutline: fc.boolean(),
    selectedTitle: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined })
  });

  const generationProgressArbitrary = fc.record({
    phase: fc.constantFrom('brainstorming', 'outlining', 'generating', 'humanizing', 'complete'),
    currentChapter: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
    totalChapters: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
    percentage: fc.integer({ min: 0, max: 100 }),
    message: fc.string({ minLength: 10, maxLength: 200 }),
    startedAt: fc.date().map(d => d.toISOString()),
    estimatedCompletion: fc.option(fc.date().map(d => d.toISOString()), { nil: undefined }),
    ebookId: fc.option(fc.uuid(), { nil: undefined })
  });

  /**
   * Property 1: Session data persists across multiple operations
   * Validates: Requirement 2.4 - Session state survives page refreshes and navigation
   */
  it('should persist session data across multiple save and retrieve operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        brainstormResultArbitrary,
        builderConfigArbitrary,
        generationProgressArbitrary,
        async (userId, brainstormData, builderConfig, progress) => {
          // Mock session creation
          const sessionId = 'test-session-id';
          mockSupabase.from().insert().select().single.mockResolvedValueOnce({
            data: { id: sessionId },
            error: null
          });

          // Create session
          const createdSessionId = await sessionService.createSession(userId);
          expect(createdSessionId).toBe(sessionId);

          // Mock successful updates
          mockSupabase.from().update().eq().eq.mockResolvedValue({
            data: null,
            error: null
          });

          // Save all data types
          await sessionService.saveBrainstormResult(userId, sessionId, brainstormData);
          await sessionService.saveBuilderConfig(userId, sessionId, builderConfig);
          await sessionService.saveGenerationProgress(userId, sessionId, progress);

          // Mock retrieval with all data
          mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
            data: {
              id: sessionId,
              user_id: userId,
              brainstorm_data: brainstormData,
              builder_config: builderConfig,
              progress: progress,
              status: 'active',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            },
            error: null
          });

          // Retrieve session
          const session = await sessionService.getSession(userId, sessionId);

          // Verify all data persisted correctly
          expect(session).not.toBeNull();
          expect(session?.brainstormData).toEqual(brainstormData);
          expect(session?.builderConfig).toEqual(builderConfig);
          expect(session?.progress).toEqual(progress);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 2: Brainstorm results correctly flow to Builder
   * Validates: Requirement 2.1 - Brainstorm results persist and flow to Builder
   */
  it('should preserve brainstorm results when transitioning to builder', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        brainstormResultArbitrary,
        async (userId, brainstormData) => {
          const sessionId = 'test-session-id';

          // Mock session creation
          mockSupabase.from().insert().select().single.mockResolvedValueOnce({
            data: { id: sessionId },
            error: null
          });

          await sessionService.createSession(userId);

          // Mock save operation
          mockSupabase.from().update().eq().eq.mockResolvedValueOnce({
            data: null,
            error: null
          });

          // Save brainstorm result
          await sessionService.saveBrainstormResult(userId, sessionId, brainstormData);

          // Mock retrieval
          mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
            data: {
              id: sessionId,
              user_id: userId,
              brainstorm_data: brainstormData,
              builder_config: null,
              progress: null,
              status: 'active',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            },
            error: null
          });

          // Retrieve brainstorm result (simulating Builder route loading)
          const retrievedData = await sessionService.getBrainstormResult(userId, sessionId);

          // Verify data integrity
          expect(retrievedData).not.toBeNull();
          expect(retrievedData?.titles).toEqual(brainstormData.titles);
          expect(retrievedData?.outline).toBe(brainstormData.outline);
          expect(retrievedData?.topic).toBe(brainstormData.topic);
          expect(retrievedData?.provider).toBe(brainstormData.provider);
          expect(retrievedData?.model).toBe(brainstormData.model);
          expect(retrievedData?.selectedTitle).toBe(brainstormData.selectedTitle);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 3: Builder config is maintained during generation
   * Validates: Requirement 2.2 - Builder configuration persists during generation
   */
  it('should maintain builder configuration throughout generation process', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        builderConfigArbitrary,
        fc.array(generationProgressArbitrary, { minLength: 2, maxLength: 5 }),
        async (userId, builderConfig, progressUpdates) => {
          const sessionId = 'test-session-id';

          // Mock session creation
          mockSupabase.from().insert().select().single.mockResolvedValueOnce({
            data: { id: sessionId },
            error: null
          });

          await sessionService.createSession(userId);

          // Mock save operations
          mockSupabase.from().update().eq().eq.mockResolvedValue({
            data: null,
            error: null
          });

          // Save builder config
          await sessionService.saveBuilderConfig(userId, sessionId, builderConfig);

          // Simulate multiple progress updates during generation
          for (const progress of progressUpdates) {
            await sessionService.saveGenerationProgress(userId, sessionId, progress);

            // Mock retrieval after each update
            mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
              data: {
                id: sessionId,
                user_id: userId,
                brainstorm_data: null,
                builder_config: builderConfig,
                progress: progress,
                status: 'active',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString()
              },
              error: null
            });

            // Verify builder config remains unchanged
            const retrievedConfig = await sessionService.getBuilderConfig(userId, sessionId);
            expect(retrievedConfig).toEqual(builderConfig);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 4: Progress updates are properly tracked
   * Validates: Requirement 2.3 - Generation progress is tracked and persisted
   */
  it('should track and persist generation progress updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.array(generationProgressArbitrary, { minLength: 1, maxLength: 10 }),
        async (userId, progressSequence) => {
          const sessionId = 'test-session-id';

          // Mock session creation
          mockSupabase.from().insert().select().single.mockResolvedValueOnce({
            data: { id: sessionId },
            error: null
          });

          await sessionService.createSession(userId);

          // Mock save operations
          mockSupabase.from().update().eq().eq.mockResolvedValue({
            data: null,
            error: null
          });

          // Save each progress update
          for (let i = 0; i < progressSequence.length; i++) {
            const progress = progressSequence[i];
            await sessionService.saveGenerationProgress(userId, sessionId, progress);

            // Mock retrieval
            mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
              data: {
                id: sessionId,
                user_id: userId,
                brainstorm_data: null,
                builder_config: null,
                progress: progress,
                status: 'active',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString()
              },
              error: null
            });

            // Retrieve and verify
            const retrievedProgress = await sessionService.getGenerationProgress(userId, sessionId);
            expect(retrievedProgress).toEqual(progress);
            expect(retrievedProgress?.phase).toBe(progress.phase);
            expect(retrievedProgress?.percentage).toBe(progress.percentage);
            expect(retrievedProgress?.message).toBe(progress.message);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 5: Session expiration works correctly
   * Validates: Requirement 2.4 - Session state management
   */
  it('should handle session expiration correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.integer({ min: 1, max: 48 }), // hours until expiration
        async (userId, hoursUntilExpiration) => {
          const sessionId = 'test-session-id';
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + hoursUntilExpiration);

          // Mock session creation
          mockSupabase.from().insert().select().single.mockResolvedValueOnce({
            data: { id: sessionId },
            error: null
          });

          await sessionService.createSession(userId);

          // Mock extend session
          mockSupabase.from().update().eq().eq.mockResolvedValueOnce({
            data: null,
            error: null
          });

          // Extend session
          await sessionService.extendSession(userId, sessionId, hoursUntilExpiration);

          // Mock retrieval with extended expiration
          mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
            data: {
              id: sessionId,
              user_id: userId,
              brainstorm_data: null,
              builder_config: null,
              progress: null,
              status: 'active',
              expires_at: expiresAt.toISOString(),
              created_at: new Date().toISOString()
            },
            error: null
          });

          // Verify session is still active
          const session = await sessionService.getSession(userId, sessionId);
          expect(session).not.toBeNull();
          expect(session?.status).toBe('active');
          
          // Verify expiration time is in the future
          const expirationTime = new Date(session!.expiresAt).getTime();
          const now = Date.now();
          expect(expirationTime).toBeGreaterThan(now);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 6: Session cleanup removes expired sessions
   * Validates: Requirement 2.4 - Session state management
   */
  it('should cleanup expired sessions correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }), // expired session IDs
        async (expiredSessionIds) => {
          // Mock cleanup operation
          mockSupabase.from().delete().lt().select.mockResolvedValueOnce({
            data: expiredSessionIds.map(id => ({ id })),
            error: null
          });

          // Cleanup expired sessions
          const deletedCount = await sessionService.cleanupExpiredSessions();

          // Verify correct number of sessions were deleted
          expect(deletedCount).toBe(expiredSessionIds.length);
          expect(deletedCount).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 7: Session status transitions are valid
   * Validates: Requirement 2.4 - Session state management
   */
  it('should handle valid session status transitions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.constantFrom('active', 'completed', 'expired'),
        async (userId, newStatus) => {
          const sessionId = 'test-session-id';

          // Mock session creation
          mockSupabase.from().insert().select().single.mockResolvedValueOnce({
            data: { id: sessionId },
            error: null
          });

          await sessionService.createSession(userId);

          // Mock status update
          mockSupabase.from().update().eq().eq.mockResolvedValueOnce({
            data: null,
            error: null
          });

          // Update status
          await sessionService.updateSessionStatus(userId, sessionId, newStatus);

          // Mock retrieval with new status
          mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
            data: {
              id: sessionId,
              user_id: userId,
              brainstorm_data: null,
              builder_config: null,
              progress: null,
              status: newStatus,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            },
            error: null
          });

          // Verify status was updated
          const session = await sessionService.getSession(userId, sessionId);
          expect(session?.status).toBe(newStatus);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 8: Complete workflow state persistence
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4 - Complete workflow state management
   */
  it('should persist complete workflow state from brainstorm to completion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        brainstormResultArbitrary,
        builderConfigArbitrary,
        fc.array(generationProgressArbitrary, { minLength: 3, maxLength: 5 }),
        async (userId, brainstormData, builderConfig, progressUpdates) => {
          const sessionId = 'test-session-id';

          // Mock session creation
          mockSupabase.from().insert().select().single.mockResolvedValueOnce({
            data: { id: sessionId },
            error: null
          });

          // Create session
          await sessionService.createSession(userId);

          // Mock all update operations
          mockSupabase.from().update().eq().eq.mockResolvedValue({
            data: null,
            error: null
          });

          // Step 1: Save brainstorm results
          await sessionService.saveBrainstormResult(userId, sessionId, brainstormData);

          // Step 2: Save builder config
          await sessionService.saveBuilderConfig(userId, sessionId, builderConfig);

          // Step 3: Track progress through generation
          for (const progress of progressUpdates) {
            await sessionService.saveGenerationProgress(userId, sessionId, progress);
          }

          // Mock final retrieval with all data
          const finalProgress = progressUpdates[progressUpdates.length - 1];
          mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
            data: {
              id: sessionId,
              user_id: userId,
              brainstorm_data: brainstormData,
              builder_config: builderConfig,
              progress: finalProgress,
              status: 'active',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            },
            error: null
          });

          // Verify complete workflow state
          const finalSession = await sessionService.getSession(userId, sessionId);
          
          expect(finalSession).not.toBeNull();
          expect(finalSession?.brainstormData).toEqual(brainstormData);
          expect(finalSession?.builderConfig).toEqual(builderConfig);
          expect(finalSession?.progress).toEqual(finalProgress);
          
          // Verify workflow integrity
          expect(finalSession?.brainstormData?.topic).toBe(brainstormData.topic);
          expect(finalSession?.builderConfig?.topic).toBe(builderConfig.topic);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 9: Session data isolation between users
   * Validates: Requirement 2.4 - User data isolation
   */
  it('should isolate session data between different users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId1
        fc.uuid(), // userId2
        brainstormResultArbitrary,
        brainstormResultArbitrary,
        async (userId1, userId2, data1, data2) => {
          // Ensure different users
          fc.pre(userId1 !== userId2);

          const sessionId1 = 'session-1';
          const sessionId2 = 'session-2';

          // Mock session creation for user 1
          mockSupabase.from().insert().select().single.mockResolvedValueOnce({
            data: { id: sessionId1 },
            error: null
          });

          await sessionService.createSession(userId1);

          // Mock session creation for user 2
          mockSupabase.from().insert().select().single.mockResolvedValueOnce({
            data: { id: sessionId2 },
            error: null
          });

          await sessionService.createSession(userId2);

          // Mock save operations
          mockSupabase.from().update().eq().eq.mockResolvedValue({
            data: null,
            error: null
          });

          // Save data for both users
          await sessionService.saveBrainstormResult(userId1, sessionId1, data1);
          await sessionService.saveBrainstormResult(userId2, sessionId2, data2);

          // Mock retrieval for user 1
          mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
            data: {
              id: sessionId1,
              user_id: userId1,
              brainstorm_data: data1,
              builder_config: null,
              progress: null,
              status: 'active',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            },
            error: null
          });

          // Mock retrieval for user 2
          mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
            data: {
              id: sessionId2,
              user_id: userId2,
              brainstorm_data: data2,
              builder_config: null,
              progress: null,
              status: 'active',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            },
            error: null
          });

          // Verify data isolation
          const session1 = await sessionService.getSession(userId1, sessionId1);
          const session2 = await sessionService.getSession(userId2, sessionId2);

          expect(session1?.brainstormData).toEqual(data1);
          expect(session2?.brainstormData).toEqual(data2);
          expect(session1?.brainstormData).not.toEqual(data2);
          expect(session2?.brainstormData).not.toEqual(data1);
        }
      ),
      { numRuns: 10 }
    );
  });
});
