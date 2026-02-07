import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GeneratedEbook, CreateEbookParams, GeneratedChapter } from '~/services/content-service';

// Mock Supabase client - define mock inline to avoid hoisting issues
vi.mock('~/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Import after mock is set up
import { ContentService } from '~/services/content-service';
import { supabase } from '~/lib/supabase';

describe('ContentService - Edge Cases', () => {
  let contentService: ContentService;
  const mockFrom = supabase.from as any;

  beforeEach(() => {
    contentService = new ContentService();
    vi.clearAllMocks();
  });

  describe('Invalid User IDs', () => {
    it('should handle empty user ID in saveEbook', async () => {
      const mockEbook: GeneratedEbook = {
        id: 'test-id',
        title: 'Test Book',
        topic: 'Test Topic',
        chapters: [],
        metadata: {
          wordCount: 0,
          chapterCount: 0,
          aiProvider: 'openai',
          aiModel: 'gpt-4',
          tone: 'professional',
          audience: 'general',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        status: 'draft',
      };

      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Invalid user ID' },
            }),
          }),
        }),
      });

      await expect(contentService.saveEbook('', mockEbook)).rejects.toThrow(
        'Failed to save ebook: Invalid user ID'
      );
    });

    it('should handle null user ID in getEbook', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Invalid user ID', code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      const result = await contentService.getEbook(null as any, 'ebook-id');
      expect(result).toBeNull();
    });

    it('should handle malformed UUID in getUserEbooks', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Invalid UUID format' },
            }),
          }),
        }),
      });

      await expect(contentService.getUserEbooks('not-a-uuid')).rejects.toThrow(
        'Failed to get user ebooks: Invalid UUID format'
      );
    });

    it('should handle undefined user ID in deleteEbook', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'User ID is required' },
            }),
          }),
        }),
      });

      await expect(
        contentService.deleteEbook(undefined as any, 'ebook-id')
      ).rejects.toThrow('Failed to delete ebook: User ID is required');
    });
  });

  describe('Malformed Data', () => {
    it('should handle missing required fields in createEbook', async () => {
      const invalidParams = {
        title: '',
        topic: '',
        tone: 'professional',
        audience: 'general',
        aiProvider: 'openai',
        aiModel: 'gpt-4',
      } as CreateEbookParams;

      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Title cannot be empty' },
            }),
          }),
        }),
      });

      await expect(
        contentService.createEbook('user-id', invalidParams)
      ).rejects.toThrow('Failed to create ebook: Title cannot be empty');
    });

    it('should handle invalid chapter data in saveEbook', async () => {
      const ebookWithInvalidChapters: GeneratedEbook = {
        id: 'test-id',
        title: 'Test Book',
        topic: 'Test Topic',
        chapters: [
          {
            id: 'ch1',
            number: -1,
            title: '',
            content: '',
            wordCount: -100,
          },
        ],
        metadata: {
          wordCount: 0,
          chapterCount: 1,
          aiProvider: 'openai',
          aiModel: 'gpt-4',
          tone: 'professional',
          audience: 'general',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        status: 'draft',
      };

      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'ebook-id' },
              error: null,
            }),
          }),
        }),
      });

      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid chapter data' },
        }),
      });

      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      await expect(
        contentService.saveEbook('user-id', ebookWithInvalidChapters)
      ).rejects.toThrow('Failed to save chapters: Invalid chapter data');
    });

    it('should handle null values in updateEbook', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      await expect(
        contentService.updateEbook('user-id', 'ebook-id', {
          title: undefined,
          subtitle: null,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Database Errors', () => {
    it('should handle connection timeout in saveEbook', async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Connection timeout')),
          }),
        }),
      });

      const mockEbook: GeneratedEbook = {
        id: 'test-id',
        title: 'Test Book',
        topic: 'Test Topic',
        chapters: [],
        metadata: {
          wordCount: 0,
          chapterCount: 0,
          aiProvider: 'openai',
          aiModel: 'gpt-4',
          tone: 'professional',
          audience: 'general',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        status: 'draft',
      };

      await expect(contentService.saveEbook('user-id', mockEbook)).rejects.toThrow(
        'Connection timeout'
      );
    });

    it('should rollback ebook when chapters fail to save', async () => {
      const ebookWithChapters: GeneratedEbook = {
        id: 'test-id',
        title: 'Test Book',
        topic: 'Test Topic',
        chapters: [
          {
            id: 'ch1',
            number: 1,
            title: 'Chapter 1',
            content: 'Content',
            wordCount: 100,
          },
        ],
        metadata: {
          wordCount: 100,
          chapterCount: 1,
          aiProvider: 'openai',
          aiModel: 'gpt-4',
          tone: 'professional',
          audience: 'general',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        status: 'draft',
      };

      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'ebook-id' },
              error: null,
            }),
          }),
        }),
      });

      mockFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });
      mockFrom.mockReturnValueOnce({
        delete: mockDelete,
      });

      await expect(
        contentService.saveEbook('user-id', ebookWithChapters)
      ).rejects.toThrow('Failed to save chapters: Database error');

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle empty chapters array in saveEbook', async () => {
      const ebookWithNoChapters: GeneratedEbook = {
        id: 'test-id',
        title: 'Test Book',
        topic: 'Test Topic',
        chapters: [],
        metadata: {
          wordCount: 0,
          chapterCount: 0,
          aiProvider: 'openai',
          aiModel: 'gpt-4',
          tone: 'professional',
          audience: 'general',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        status: 'draft',
      };

      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'ebook-id' },
              error: null,
            }),
          }),
        }),
      });

      const result = await contentService.saveEbook('user-id', ebookWithNoChapters);
      expect(result).toBe('ebook-id');
    });

    it('should handle very long title strings', async () => {
      const longTitle = 'A'.repeat(10000);
      const params: CreateEbookParams = {
        title: longTitle,
        topic: 'Test Topic',
        tone: 'professional',
        audience: 'general',
        aiProvider: 'openai',
        aiModel: 'gpt-4',
      };

      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'ebook-id' },
              error: null,
            }),
          }),
        }),
      });

      const result = await contentService.createEbook('user-id', params);
      expect(result).toBe('ebook-id');
    });

    it('should handle getUserEbooks with no results', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await contentService.getUserEbooks('user-id');
      expect(result).toEqual([]);
    });

    it('should handle saveChapters with empty array', async () => {
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'ebook-id' },
                error: null,
              }),
            }),
          }),
        }),
      });

      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      await expect(
        contentService.saveChapters('user-id', 'ebook-id', [])
      ).resolves.not.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous saveEbook calls', async () => {
      const mockEbook: GeneratedEbook = {
        id: 'test-id',
        title: 'Test Book',
        topic: 'Test Topic',
        chapters: [],
        metadata: {
          wordCount: 0,
          chapterCount: 0,
          aiProvider: 'openai',
          aiModel: 'gpt-4',
          tone: 'professional',
          audience: 'general',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        status: 'draft',
      };

      // Create unique IDs for each call
      let callCount = 0;
      mockFrom.mockImplementation(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: `ebook-id-${++callCount}` },
              error: null,
            }),
          }),
        }),
      }));

      const promises = Array.from({ length: 5 }, (_, i) =>
        contentService.saveEbook(`user-${i}`, mockEbook)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      // All IDs should be unique
      expect(new Set(results).size).toBe(5);
    });
  });

  describe('RLS Policy Enforcement', () => {
    it('should prevent access to other users ebooks in getEbook', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Row not found' },
              }),
            }),
          }),
        }),
      });

      const result = await contentService.getEbook('user-1', 'other-user-ebook');
      expect(result).toBeNull();
    });

    it('should prevent updating other users ebooks', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Row not found or access denied' },
            }),
          }),
        }),
      });

      await expect(
        contentService.updateEbook('user-1', 'other-user-ebook', { title: 'Hacked' })
      ).rejects.toThrow('Failed to update ebook: Row not found or access denied');
    });

    it('should prevent deleting other users ebooks', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Access denied' },
            }),
          }),
        }),
      });

      await expect(
        contentService.deleteEbook('user-1', 'other-user-ebook')
      ).rejects.toThrow('Failed to delete ebook: Access denied');
    });
  });

  describe('Status Updates', () => {
    it('should handle valid status transitions', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const statuses: Array<'draft' | 'generating' | 'completed' | 'error'> = [
        'draft',
        'generating',
        'completed',
        'error',
      ];

      for (const status of statuses) {
        await expect(
          contentService.updateStatus('user-id', 'ebook-id', status)
        ).resolves.not.toThrow();
      }
    });

    it('should handle database error during status update', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection lost' },
            }),
          }),
        }),
      });

      await expect(
        contentService.updateStatus('user-id', 'ebook-id', 'completed')
      ).rejects.toThrow('Failed to update status: Database connection lost');
    });
  });

  describe('Children\'s Books Methods', () => {
    it('should throw not implemented error for saveChildrensBook', async () => {
      await expect(
        contentService.saveChildrensBook('user-id', {
          title: 'Test',
          ageGroup: '3-5',
          theme: 'Adventure',
          illustrationStyle: 'cartoon',
          characters: [],
          pages: [],
          status: 'draft',
        })
      ).rejects.toThrow('Children\'s books not yet implemented in production mode');
    });

    it('should throw not implemented error for getChildrensBook', async () => {
      await expect(
        contentService.getChildrensBook('user-id', 'book-id')
      ).rejects.toThrow('Children\'s books not yet implemented in production mode');
    });
  });
});
