'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getFriendIds } from './friends';
import { Security } from '@/generated/prisma';

export async function searchEntries(query: string, limit = 20) {
  if (!query || query.trim().length < 2) {
    return { entries: [], error: 'Search query must be at least 2 characters' };
  }

  try {
    const user = await getCurrentUser();
    const friendIds = user ? await getFriendIds(user.id) : [];

    // Build security filter conditions
    const securityConditions: Array<{ security?: Security; userId?: string | { in: string[] } }> = [
      // Public entries
      { security: Security.PUBLIC },
    ];

    // Own entries
    if (user) {
      securityConditions.push({ userId: user.id });
    }

    // Friends' FRIENDS entries
    if (user && friendIds.length > 0) {
      securityConditions.push({ userId: { in: friendIds }, security: Security.FRIENDS });
    }

    // SQLite uses LIKE for text search
    const entries = await prisma.entry.findMany({
      where: {
        AND: [
          {
            OR: [
              { subject: { contains: query.trim() } },
              { contentHtml: { contains: query.trim() } },
            ],
          },
          {
            OR: securityConditions,
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
    });

    return { entries };
  } catch (error) {
    console.error('Search error:', error);
    return { entries: [], error: 'Search failed' };
  }
}

export async function searchUsers(query: string, limit = 10) {
  if (!query || query.trim().length < 2) {
    return { users: [] };
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query.trim() } },
          { displayName: { contains: query.trim() } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        userpicUrl: true,
        _count: {
          select: { entries: true },
        },
      },
      take: limit,
    });

    return { users };
  } catch (error) {
    console.error('User search error:', error);
    return { users: [] };
  }
}
