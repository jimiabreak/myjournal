'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { profileUpdateSchema, sanitizeHtml, SocialLinks } from '@/lib/validation';

export type ProfileInput = z.infer<typeof profileUpdateSchema>;

export async function updateProfile(data: ProfileInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Authentication required' };
    }

    const validated = profileUpdateSchema.parse(data);

    // Sanitize bio content if it exists
    const sanitizedBio = validated.bio ? sanitizeHtml(validated.bio) : null;

    // Parse birthday as Date if provided
    let birthday: Date | null = null;
    if (validated.birthday) {
      birthday = new Date(validated.birthday);
      if (isNaN(birthday.getTime())) {
        birthday = null;
      }
    }

    // Serialize socialLinks to JSON string if provided
    const socialLinksJson = validated.socialLinks
      ? JSON.stringify(validated.socialLinks)
      : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: validated.displayName,
        bio: sanitizedBio,
        name: validated.name || null,
        birthday,
        location: validated.location || null,
        website: validated.website || null,
        contactEmail: validated.contactEmail || null,
        socialLinks: socialLinksJson,
      },
    });

    revalidatePath('/profile');
    revalidatePath(`/profile/${user.username}`);
    revalidatePath(`/journal/${user.username}`);
    return { success: true };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Invalid input data', details: error.issues };
    }
    console.error('Update profile error:', error);
    return { error: 'Failed to update profile' };
  }
}

export async function getProfile(userId?: string) {
  try {
    const currentUser = await getCurrentUser();
    const targetUserId = userId || currentUser?.id;

    if (!targetUserId) {
      return { error: 'User not found' };
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        userpicUrl: true,
        email: true,
        createdAt: true,
        name: true,
        birthday: true,
        location: true,
        website: true,
        contactEmail: true,
        socialLinks: true,
        _count: {
          select: {
            entries: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    // Only return email if viewing own profile
    const isOwnProfile = currentUser?.id === user.id;

    // Parse socialLinks from JSON string
    let socialLinks: SocialLinks = null;
    if (user.socialLinks) {
      try {
        socialLinks = JSON.parse(user.socialLinks);
      } catch {
        socialLinks = null;
      }
    }

    return {
      user: {
        ...user,
        email: isOwnProfile ? user.email : '',
        socialLinks,
        entryCount: user._count.entries,
        commentCount: user._count.comments,
      },
      isOwnProfile,
    };

  } catch (error) {
    console.error('Get profile error:', error);
    return { error: 'Failed to fetch profile' };
  }
}

export async function getProfileByUsername(username: string) {
  try {
    const currentUser = await getCurrentUser();

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        userpicUrl: true,
        email: true,
        createdAt: true,
        name: true,
        birthday: true,
        location: true,
        website: true,
        contactEmail: true,
        socialLinks: true,
        _count: {
          select: {
            entries: true,
            comments: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const isOwnProfile = currentUser?.id === user.id;

    // Check if current user is following this profile
    let isFollowing = false;
    if (currentUser && !isOwnProfile) {
      const friendship = await prisma.friendship.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!friendship;
    }

    // Parse socialLinks from JSON string
    let socialLinks: SocialLinks = null;
    if (user.socialLinks) {
      try {
        socialLinks = JSON.parse(user.socialLinks);
      } catch {
        socialLinks = null;
      }
    }

    return {
      user: {
        ...user,
        email: isOwnProfile ? user.email : '',
        socialLinks,
        entryCount: user._count.entries,
        commentCount: user._count.comments,
        followerCount: user._count.followers,
        followingCount: user._count.following,
      },
      isOwnProfile,
      isFollowing,
    };

  } catch (error) {
    console.error('Get profile by username error:', error);
    return { error: 'Failed to fetch profile' };
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Authentication required' };
    }

    if (user.id === targetUserId) {
      return { error: 'Cannot follow yourself' };
    }

    // Check if already following
    const existingFollow = await prisma.friendship.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.friendship.delete({
        where: {
          id: existingFollow.id,
        },
      });
      return { success: true, following: false };
    } else {
      // Follow
      await prisma.friendship.create({
        data: {
          followerId: user.id,
          followingId: targetUserId,
        },
      });
      return { success: true, following: true };
    }

  } catch (error) {
    console.error('Toggle follow error:', error);
    return { error: 'Failed to update follow status' };
  }
}
