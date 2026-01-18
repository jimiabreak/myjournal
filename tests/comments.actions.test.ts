import { createComment, updateCommentState, deleteComment } from '@/lib/actions/comments';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CommentState, Security } from '@/generated/prisma';
import { headers } from 'next/headers';

// Mock the dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/prisma');
jest.mock('next/headers');

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockHeaders = headers as jest.MockedFunction<typeof headers>;

describe('Comment Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default headers mock
    mockHeaders.mockResolvedValue(new Map([
      ['x-forwarded-for', '127.0.0.1']
    ]) as any);
  });

  describe('createComment', () => {
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    const mockEntry = {
      id: 'entry-123',
      security: Security.PUBLIC,
      userId: 'entry-owner-456',
      user: { username: 'entryowner' }
    };

    it('should create comment successfully for authenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.entry.findUnique.mockResolvedValue(mockEntry);
      mockPrisma.comment.create.mockResolvedValue({
        id: 'comment-123',
        entryId: 'entry-123',
        authorId: 'user-123',
        authorName: null,
        contentHtml: '<p>Test comment</p>',
        parentId: null,
        state: CommentState.VISIBLE,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await createComment({
        entryId: 'entry-123',
        contentHtml: '<p>Test comment</p><script>alert("xss")</script>',
        parentId: undefined,
        authorName: undefined
      });

      expect(result.success).toBe(true);
      expect(result.commentId).toBe('comment-123');
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entryId: 'entry-123',
          contentHtml: '<p>Test comment</p>', // XSS should be sanitized
          authorId: 'user-123',
          authorName: null
        })
      });
    });

    it('should create anonymous comment with rate limiting', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      mockPrisma.entry.findUnique.mockResolvedValue(mockEntry);
      mockPrisma.comment.create.mockResolvedValue({
        id: 'comment-123',
        entryId: 'entry-123',
        authorId: null,
        authorName: 'Anonymous User',
        contentHtml: '<p>Anonymous comment</p>',
        parentId: null,
        state: CommentState.VISIBLE,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await createComment({
        entryId: 'entry-123',
        contentHtml: '<p>Anonymous comment</p>',
        authorName: 'Anonymous User'
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entryId: 'entry-123',
          contentHtml: '<p>Anonymous comment</p>',
          authorId: null,
          authorName: 'Anonymous User'
        })
      });
    });

    it('should deny comments on private entries from non-owners', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.entry.findUnique.mockResolvedValue({
        ...mockEntry,
        security: Security.PRIVATE,
        userId: 'different-owner-789'
      });

      const result = await createComment({
        entryId: 'entry-123',
        contentHtml: '<p>Should be denied</p>'
      });

      expect(result.error).toBe('Cannot comment on private entry');
      expect(mockPrisma.comment.create).not.toHaveBeenCalled();
    });

    it('should deny comments on friends-only entries from non-friends', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.entry.findUnique.mockResolvedValue({
        ...mockEntry,
        security: Security.FRIENDS,
        userId: 'different-owner-789'
      });

      const result = await createComment({
        entryId: 'entry-123',
        contentHtml: '<p>Should be denied</p>'
      });

      expect(result.error).toBe('Cannot comment on friends-only entry');
      expect(mockPrisma.comment.create).not.toHaveBeenCalled();
    });

    it('should enforce rate limiting for anonymous users', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      mockPrisma.entry.findUnique.mockResolvedValue(mockEntry);
      
      // Create multiple comments quickly to trigger rate limit
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(createComment({
          entryId: 'entry-123',
          contentHtml: `<p>Comment ${i}</p>`,
          authorName: 'Anonymous User'
        }));
      }

      const results = await Promise.all(promises);
      
      // First 5 should succeed, 6th should be rate limited
      const successCount = results.filter(r => r.success).length;
      const rateLimitedCount = results.filter(r => r.error?.includes('Rate limit')).length;
      
      expect(successCount).toBeLessThanOrEqual(5);
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('should sanitize HTML content', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.entry.findUnique.mockResolvedValue(mockEntry);
      mockPrisma.comment.create.mockResolvedValue({
        id: 'comment-123',
        entryId: 'entry-123',
        authorId: 'user-123',
        authorName: null,
        contentHtml: '<p>Safe content</p>',
        parentId: null,
        state: CommentState.VISIBLE,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await createComment({
        entryId: 'entry-123',
        contentHtml: '<p>Safe content</p><script>alert("xss")</script><img src="x" onerror="alert(1)">'
      });

      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentHtml: '<p>Safe content</p>' // Dangerous content removed
        })
      });
    });
  });

  describe('updateCommentState', () => {
    const mockUser = {
      id: 'entry-owner-123',
      username: 'entryowner',
      email: 'owner@example.com',
      displayName: 'Entry Owner'
    };

    const mockComment = {
      id: 'comment-123',
      entryId: 'entry-123',
      entry: {
        userId: 'entry-owner-123',
        user: { username: 'entryowner' }
      }
    };

    it('should allow entry owner to moderate comments', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue({
        id: 'comment-123',
        state: CommentState.SCREENED,
        entryId: 'entry-123',
        authorId: 'commenter-456',
        authorName: null,
        contentHtml: '<p>Comment content</p>',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await updateCommentState('comment-123', 'SCREENED');

      expect(result.success).toBe(true);
      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-123' },
        data: { state: CommentState.SCREENED }
      });
    });

    it('should deny comment moderation to non-entry-owners', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'other-user-456',
        username: 'otheruser',
        email: 'other@example.com',
        displayName: 'Other User'
      });
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);

      const result = await updateCommentState('comment-123', 'SCREENED');

      expect(result.error).toBe('Only entry owner can moderate comments');
      expect(mockPrisma.comment.update).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await updateCommentState('comment-123', 'SCREENED');

      expect(result.error).toBe('Authentication required');
      expect(mockPrisma.comment.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    const mockCommentOwner = {
      id: 'comment-author-123',
      username: 'commentauthor',
      email: 'author@example.com',
      displayName: 'Comment Author'
    };

    const mockEntryOwner = {
      id: 'entry-owner-456',
      username: 'entryowner',
      email: 'owner@example.com',
      displayName: 'Entry Owner'
    };

    const mockComment = {
      id: 'comment-123',
      authorId: 'comment-author-123',
      entryId: 'entry-123',
      entry: {
        userId: 'entry-owner-456',
        user: { username: 'entryowner' }
      }
    };

    it('should allow comment author to delete their own comment', async () => {
      mockGetCurrentUser.mockResolvedValue(mockCommentOwner);
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue({
        id: 'comment-123',
        state: CommentState.DELETED,
        entryId: 'entry-123',
        authorId: 'comment-author-123',
        authorName: null,
        contentHtml: '<p>Deleted</p>',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await deleteComment('comment-123');

      expect(result.success).toBe(true);
      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-123' },
        data: { state: CommentState.DELETED }
      });
    });

    it('should allow entry owner to delete any comment on their entry', async () => {
      mockGetCurrentUser.mockResolvedValue(mockEntryOwner);
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);
      mockPrisma.comment.update.mockResolvedValue({
        id: 'comment-123',
        state: CommentState.DELETED,
        entryId: 'entry-123',
        authorId: 'comment-author-123',
        authorName: null,
        contentHtml: '<p>Deleted</p>',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await deleteComment('comment-123');

      expect(result.success).toBe(true);
    });

    it('should deny deletion to users who are neither comment author nor entry owner', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'random-user-789',
        username: 'randomuser',
        email: 'random@example.com',
        displayName: 'Random User'
      });
      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);

      const result = await deleteComment('comment-123');

      expect(result.error).toBe('Permission denied');
      expect(mockPrisma.comment.update).not.toHaveBeenCalled();
    });
  });
});