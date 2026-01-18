'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function followUser(userId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Authentication required' };
    }

    if (currentUser.id === userId) {
      return { error: 'Cannot follow yourself' };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return { error: 'User not found' };
    }

    const existing = await prisma.friendship.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userId,
        },
      },
    });

    if (existing) {
      return { error: 'Already following this user' };
    }

    await prisma.friendship.create({
      data: {
        followerId: currentUser.id,
        followingId: userId,
      },
    });

    revalidatePath(`/journal/${targetUser.username}`);
    revalidatePath('/friends');
    return { success: true };
  } catch (error) {
    console.error('Follow user error:', error);
    return { error: 'Failed to follow user' };
  }
}

export async function unfollowUser(userId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Authentication required' };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    await prisma.friendship.delete({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userId,
        },
      },
    });

    if (targetUser) {
      revalidatePath(`/journal/${targetUser.username}`);
    }
    revalidatePath('/friends');
    return { success: true };
  } catch (error) {
    console.error('Unfollow user error:', error);
    return { error: 'Failed to unfollow user' };
  }
}

export async function isFollowing(userId: string): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const friendship = await prisma.friendship.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userId,
        },
      },
    });

    return !!friendship;
  } catch {
    return false;
  }
}

export async function getFollowers(userId: string) {
  try {
    const followers = await prisma.friendship.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            userpicUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return followers.map((f) => f.follower);
  } catch (error) {
    console.error('Get followers error:', error);
    return [];
  }
}

export async function getFollowing(userId: string) {
  try {
    const following = await prisma.friendship.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            userpicUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return following.map((f) => f.following);
  } catch (error) {
    console.error('Get following error:', error);
    return [];
  }
}

export async function getFriendIds(userId: string): Promise<string[]> {
  try {
    const following = await prisma.friendship.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    return following.map((f) => f.followingId);
  } catch {
    return [];
  }
}
