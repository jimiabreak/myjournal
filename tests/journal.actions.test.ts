import { createEntry, updateEntry, deleteEntry, getUserEntries, getEntry } from '@/lib/actions/journal';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Security } from '@/generated/prisma';

// Mock the dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/prisma');

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Journal Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEntry', () => {
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    it('should create an entry successfully', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.entry.create.mockResolvedValue({
        id: 'entry-123',
        userId: 'user-123',
        subject: 'Test Entry',
        contentHtml: '<p>Test content</p>',
        security: Security.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
        mood: null,
        music: null,
        location: null
      });

      const result = await createEntry({
        subject: 'Test Entry',
        contentHtml: '<p>Test content</p><script>alert("xss")</script>',
        security: 'PUBLIC',
        mood: 'happy',
        music: 'rock',
        location: 'home'
      });

      expect(result.success).toBe(true);
      expect(result.entryId).toBe('entry-123');
      expect(mockPrisma.entry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          subject: 'Test Entry',
          contentHtml: '<p>Test content</p>', // XSS should be sanitized
          security: Security.PUBLIC,
          mood: 'happy',
          music: 'rock',
          location: 'home'
        })
      });
    });

    it('should require authentication', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await createEntry({
        subject: 'Test',
        contentHtml: '<p>Test</p>',
        security: 'PUBLIC'
      });

      expect(result.error).toBe('Failed to create entry');
      expect(mockPrisma.entry.create).not.toHaveBeenCalled();
    });

    it('should validate input data', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await createEntry({
        subject: 'Test',
        contentHtml: '', // Empty content should fail
        security: 'PUBLIC'
      });

      expect(result.error).toBe('Invalid input data');
      expect(result.details).toBeDefined();
      expect(mockPrisma.entry.create).not.toHaveBeenCalled();
    });

    it('should sanitize HTML content', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.entry.create.mockResolvedValue({
        id: 'entry-123',
        userId: 'user-123',
        subject: 'Test',
        contentHtml: '<p>Safe content</p>',
        security: Security.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
        mood: null,
        music: null,
        location: null
      });

      await createEntry({
        subject: 'Test',
        contentHtml: '<p>Safe content</p><script>alert("xss")</script><img src="x" onerror="alert(1)">',
        security: 'PUBLIC'
      });

      expect(mockPrisma.entry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentHtml: '<p>Safe content</p>' // Dangerous content removed
        })
      });
    });
  });

  describe('updateEntry', () => {
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    it('should update entry successfully when user owns it', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.entry.findUnique.mockResolvedValue({
        userId: 'user-123',
        user: { username: 'testuser' }
      });
      mockPrisma.entry.update.mockResolvedValue({
        id: 'entry-123',
        userId: 'user-123',
        subject: 'Updated Entry',
        contentHtml: '<p>Updated content</p>',
        security: Security.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
        mood: null,
        music: null,
        location: null
      });

      const result = await updateEntry('entry-123', {
        subject: 'Updated Entry',
        contentHtml: '<p>Updated content</p>',
        security: 'PUBLIC'
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.entry.update).toHaveBeenCalledWith({
        where: { id: 'entry-123' },
        data: expect.objectContaining({
          subject: 'Updated Entry',
          contentHtml: '<p>Updated content</p>',
          security: Security.PUBLIC
        })
      });
    });

    it('should deny access to entries owned by other users', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.entry.findUnique.mockResolvedValue({
        userId: 'other-user-456',
        user: { username: 'otheruser' }
      });

      const result = await updateEntry('entry-123', {
        subject: 'Hacked Entry',
        contentHtml: '<p>Hacked</p>',
        security: 'PUBLIC'
      });

      expect(result.error).toBe('Permission denied');
      expect(mockPrisma.entry.update).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await updateEntry('entry-123', {
        subject: 'Test',
        contentHtml: '<p>Test</p>',
        security: 'PUBLIC'
      });

      expect(result.error).toBe('Failed to update entry');
      expect(mockPrisma.entry.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('deleteEntry', () => {
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    it('should delete entry successfully when user owns it', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.entry.findUnique.mockResolvedValue({
        userId: 'user-123',
        user: { username: 'testuser' }
      });
      mockPrisma.entry.delete.mockResolvedValue({
        id: 'entry-123',
        userId: 'user-123',
        subject: 'Deleted Entry',
        contentHtml: '<p>Deleted</p>',
        security: Security.PUBLIC,
        createdAt: new Date(),
        updatedAt: new Date(),
        mood: null,
        music: null,
        location: null
      });

      const result = await deleteEntry('entry-123');

      expect(result.success).toBe(true);
      expect(mockPrisma.entry.delete).toHaveBeenCalledWith({
        where: { id: 'entry-123' }
      });
    });

    it('should deny deletion of entries owned by other users', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.entry.findUnique.mockResolvedValue({
        userId: 'other-user-456',
        user: { username: 'otheruser' }
      });

      const result = await deleteEntry('entry-123');

      expect(result.error).toBe('Permission denied');
      expect(mockPrisma.entry.delete).not.toHaveBeenCalled();
    });
  });

  describe('getEntry', () => {
    it('should allow owner to view private entry', async () => {
      mockPrisma.entry.findUnique
        .mockResolvedValueOnce({ userId: 'user-123' }) // First call for ownership check
        .mockResolvedValueOnce({ // Second call for full data
          id: 'entry-123',
          userId: 'user-123',
          subject: 'Private Entry',
          contentHtml: '<p>Private content</p>',
          security: Security.PRIVATE,
          user: {
            id: 'user-123',
            username: 'testuser',
            displayName: 'Test User',
            userpicUrl: null
          },
          comments: [],
          _count: { comments: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
          mood: null,
          music: null,
          location: null
        });

      const result = await getEntry('entry-123', 'user-123');

      expect(result.entry).toBeDefined();
      expect(result.entry!.security).toBe(Security.PRIVATE);
    });

    it('should deny non-owner access to private entry', async () => {
      mockPrisma.entry.findUnique
        .mockResolvedValueOnce({ userId: 'user-123' })
        .mockResolvedValueOnce({
          id: 'entry-123',
          userId: 'user-123',
          security: Security.PRIVATE,
          user: { id: 'user-123', username: 'testuser', displayName: 'Test User', userpicUrl: null },
          comments: [],
          _count: { comments: 0 }
        });

      const result = await getEntry('entry-123', 'other-user-456');

      expect(result.error).toBe('Permission denied');
    });

    it('should deny access to friends-only entries for non-friends', async () => {
      mockPrisma.entry.findUnique
        .mockResolvedValueOnce({ userId: 'user-123' })
        .mockResolvedValueOnce({
          id: 'entry-123',
          userId: 'user-123',
          security: Security.FRIENDS,
          user: { id: 'user-123', username: 'testuser', displayName: 'Test User', userpicUrl: null },
          comments: [],
          _count: { comments: 0 }
        });

      const result = await getEntry('entry-123', 'other-user-456');

      expect(result.error).toBe('Permission denied');
    });
  });
});