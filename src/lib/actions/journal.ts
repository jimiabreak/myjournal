'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Security } from '@/generated/prisma';
import { revalidatePath } from 'next/cache';
import { journalEntrySchema, sanitizeHtml } from '@/lib/validation';
import { getFriendIds } from './friends';

// Legacy schema mapping to new validation structure
const entrySchema = z.object({
  subject: z.string().optional(),
  contentHtml: z.string().min(1, 'Entry content is required'),
  security: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
  mood: z.string().optional(),
  music: z.string().optional(),
  location: z.string().optional(),
}).transform((data) => ({
  title: data.subject || 'Untitled Entry',
  content: data.contentHtml,
  visibility: data.security,
  allowComments: true, // default
  mood: data.mood,
  music: data.music,
  location: data.location
}));

export type EntryInput = z.infer<typeof entrySchema>;

export async function createEntry(data: EntryInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    // First validate with legacy schema, then with enhanced validation
    const legacyValidated = entrySchema.parse(data);
    const enhancedValidated = journalEntrySchema.parse(legacyValidated);
    
    // Sanitize HTML content
    const sanitizedContent = sanitizeHtml(enhancedValidated.content);

    const entry = await prisma.entry.create({
      data: {
        userId: user.id,
        subject: enhancedValidated.title === 'Untitled Entry' ? null : enhancedValidated.title,
        contentHtml: sanitizedContent,
        security: enhancedValidated.visibility as Security,
        mood: legacyValidated.mood || null,
        music: legacyValidated.music || null,
        location: legacyValidated.location || null,
      },
    });

    revalidatePath(`/journal/${user.username}`);
    return { success: true, entryId: entry.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Invalid input data', details: error.issues };
    }
    console.error('Create entry error:', error);
    return { error: 'Failed to create entry' };
  }
}

export async function updateEntry(entryId: string, data: EntryInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    // Check if user owns the entry first
    const existingEntry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { userId: true, user: { select: { username: true } } },
    });

    if (!existingEntry) {
      return { error: 'Entry not found' };
    }

    if (existingEntry.userId !== user.id) {
      return { error: 'Permission denied' };
    }

    // Validate and sanitize after ownership check
    const legacyValidated = entrySchema.parse(data);
    const enhancedValidated = journalEntrySchema.parse(legacyValidated);
    
    // Sanitize HTML content
    const sanitizedContent = sanitizeHtml(enhancedValidated.content);

    const entry = await prisma.entry.update({
      where: { id: entryId },
      data: {
        subject: enhancedValidated.title === 'Untitled Entry' ? null : enhancedValidated.title,
        contentHtml: sanitizedContent,
        security: enhancedValidated.visibility as Security,
        mood: legacyValidated.mood || null,
        music: legacyValidated.music || null,
        location: legacyValidated.location || null,
      },
    });

    revalidatePath(`/journal/${existingEntry.user.username}`);
    revalidatePath(`/journal/${existingEntry.user.username}/entry/${entryId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Invalid input data', details: error.issues };
    }
    console.error('Update entry error:', error);
    return { error: 'Failed to update entry' };
  }
}

export async function deleteEntry(entryId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    // Check if user owns the entry
    const existingEntry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { userId: true, user: { select: { username: true } } },
    });

    if (!existingEntry) {
      return { error: 'Entry not found' };
    }

    if (existingEntry.userId !== user.id) {
      return { error: 'Permission denied' };
    }

    await prisma.entry.delete({
      where: { id: entryId },
    });

    revalidatePath(`/journal/${existingEntry.user.username}`);
    return { success: true };
  } catch (error) {
    console.error('Delete entry error:', error);
    return { error: 'Failed to delete entry' };
  }
}

export async function getUserEntries(username: string, currentUserId?: string, limit = 10, offset = 0) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return { error: 'User not found', entries: [], totalCount: 0, hasMore: false };
    }

    // Determine which entries the current user can see
    let securityFilter: any = { security: Security.PUBLIC };

    if (currentUserId) {
      if (currentUserId === user.id) {
        // User can see all their own entries
        securityFilter = {};
      } else {
        // For now, just show public entries. In a real app, you'd check friendship
        securityFilter = { security: Security.PUBLIC };
      }
    }

    const whereClause = {
      userId: user.id,
      ...securityFilter,
    };

    const [entries, totalCount] = await Promise.all([
      prisma.entry.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
              userpicUrl: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.entry.count({ where: whereClause }),
    ]);

    return {
      entries,
      totalCount,
      hasMore: offset + entries.length < totalCount
    };
  } catch (error) {
    console.error('Get user entries error:', error);
    return { error: 'Failed to fetch entries', entries: [], totalCount: 0, hasMore: false };
  }
}

export async function getFriendsFeed(limit = 20, offset = 0) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Authentication required', entries: [] };
    }

    const friendIds = await getFriendIds(user.id);

    // Include own entries + friends' PUBLIC and FRIENDS entries
    const entries = await prisma.entry.findMany({
      where: {
        OR: [
          // Own entries (all)
          { userId: user.id },
          // Friends' public entries
          {
            userId: { in: friendIds },
            security: 'PUBLIC',
          },
          // Friends' friends-only entries
          {
            userId: { in: friendIds },
            security: 'FRIENDS',
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            userpicUrl: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return { entries };
  } catch (error) {
    console.error('Get friends feed error:', error);
    return { error: 'Failed to load feed', entries: [] };
  }
}

export async function getRecentPublicEntries(limit = 20, offset = 0) {
  try {
    const entries = await prisma.entry.findMany({
      where: {
        security: 'PUBLIC',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            userpicUrl: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return { entries };
  } catch (error) {
    console.error('Get recent entries error:', error);
    return { error: 'Failed to load entries', entries: [] };
  }
}

export async function getEntry(entryId: string, currentUserId?: string) {
  try {
    // First get basic entry info to check ownership
    const basicEntry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { userId: true },
    });

    if (!basicEntry) {
      return { error: 'Entry not found' };
    }

    const isOwner = currentUserId === basicEntry.userId;
    
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            userpicUrl: true,
          },
        },
        _count: {
          select: { comments: true },
        },
        comments: {
          where: {
            parentId: null, // Only top-level comments
            ...(isOwner ? {} : { state: 'VISIBLE' }), // Entry owner sees all comments
          },
          include: {
            author: {
              select: {
                username: true,
                displayName: true,
                userpicUrl: true,
              },
            },
            replies: {
              where: isOwner ? {} : { state: 'VISIBLE' },
              include: {
                author: {
                  select: {
                    username: true,
                    displayName: true,
                    userpicUrl: true,
                  },
                },
                replies: {
                  where: isOwner ? {} : { state: 'VISIBLE' },
                  include: {
                    author: {
                      select: {
                        username: true,
                        displayName: true,
                        userpicUrl: true,
                      },
                    },
                  },
                  orderBy: { createdAt: 'asc' },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!entry) {
      return { error: 'Entry not found' };
    }

    // Check permissions
    if (entry.security === Security.PRIVATE && entry.userId !== currentUserId) {
      return { error: 'Permission denied' };
    }

    if (entry.security === Security.FRIENDS) {
      if (!currentUserId) {
        return { error: 'This entry is friends-only' };
      }
      if (entry.userId !== currentUserId) {
        const friendIds = await getFriendIds(entry.userId);
        if (!friendIds.includes(currentUserId)) {
          return { error: 'This entry is friends-only' };
        }
      }
    }

    return { entry };
  } catch (error) {
    console.error('Get entry error:', error);
    return { error: 'Failed to fetch entry' };
  }
}