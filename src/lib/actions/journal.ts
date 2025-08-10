'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Security } from '@/generated/prisma';
import { revalidatePath } from 'next/cache';

const entrySchema = z.object({
  subject: z.string().optional(),
  contentHtml: z.string().min(1, 'Entry content is required'),
  security: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
  mood: z.string().optional(),
  music: z.string().optional(),
  location: z.string().optional(),
});

export type EntryInput = z.infer<typeof entrySchema>;

export async function createEntry(data: EntryInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    const validatedData = entrySchema.parse(data);

    const entry = await prisma.entry.create({
      data: {
        userId: user.id,
        subject: validatedData.subject || null,
        contentHtml: validatedData.contentHtml,
        security: validatedData.security as Security,
        mood: validatedData.mood || null,
        music: validatedData.music || null,
        location: validatedData.location || null,
      },
    });

    revalidatePath(`/journal/${user.username}`);
    return { success: true, entryId: entry.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Invalid input data', details: error.errors };
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

    const validatedData = entrySchema.parse(data);

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

    const entry = await prisma.entry.update({
      where: { id: entryId },
      data: {
        subject: validatedData.subject || null,
        contentHtml: validatedData.contentHtml,
        security: validatedData.security as Security,
        mood: validatedData.mood || null,
        music: validatedData.music || null,
        location: validatedData.location || null,
      },
    });

    revalidatePath(`/journal/${existingEntry.user.username}`);
    revalidatePath(`/journal/${existingEntry.user.username}/entry/${entryId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Invalid input data', details: error.errors };
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

export async function getUserEntries(username: string, currentUserId?: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return { error: 'User not found' };
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

    const entries = await prisma.entry.findMany({
      where: {
        userId: user.id,
        ...securityFilter,
      },
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
    });

    return { entries };
  } catch (error) {
    console.error('Get user entries error:', error);
    return { error: 'Failed to fetch entries' };
  }
}

export async function getEntry(entryId: string, currentUserId?: string) {
  try {
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
        comments: {
          where: { state: 'VISIBLE' },
          include: {
            author: {
              select: {
                username: true,
                displayName: true,
                userpicUrl: true,
              },
            },
            replies: {
              where: { state: 'VISIBLE' },
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
          where: { parentId: null }, // Only top-level comments
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

    if (entry.security === Security.FRIENDS && entry.userId !== currentUserId) {
      // In a real app, you'd check friendship here
      return { error: 'Permission denied' };
    }

    return { entry };
  } catch (error) {
    console.error('Get entry error:', error);
    return { error: 'Failed to fetch entry' };
  }
}