'use server';

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
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

// Userpic upload server action
export async function uploadUserpic(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Authentication required' };
    }

    const file = formData.get('userpic') as File;
    if (!file) {
      return { error: 'No file provided' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { error: 'Only JPEG, PNG, and GIF files are allowed' };
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return { error: 'File size must be less than 2MB' };
    }

    // Generate filename
    const ext = path.extname(file.name);
    const fileName = `${user.id}-${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'userpics');
    const filePath = path.join(uploadDir, fileName);

    // Ensure upload directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Get current userpic to delete
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userpicUrl: true }
    });

    // Delete old userpic if exists
    if (currentUser?.userpicUrl) {
      const oldFileName = currentUser.userpicUrl.match(/\/userpics\/(.+)$/)?.[1];
      if (oldFileName) {
        const oldPath = path.join(uploadDir, oldFileName);
        try {
          await fs.unlink(oldPath);
        } catch {
          // Ignore if file doesn't exist
        }
      }
    }

    // Update user with new userpic URL
    const newUserpicUrl = `/userpics/${fileName}`;
    await prisma.user.update({
      where: { id: user.id },
      data: { userpicUrl: newUserpicUrl }
    });

    revalidatePath('/profile');
    revalidatePath(`/profile/${user.username}`);
    return { success: true, userpicUrl: newUserpicUrl };

  } catch (error) {
    console.error('Upload userpic error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: `Failed to upload userpic: ${errorMessage}` };
  }
}

// Userpic delete server action
export async function deleteUserpic() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Authentication required' };
    }

    // Get current userpic
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userpicUrl: true }
    });

    // Delete file if exists
    if (currentUser?.userpicUrl) {
      const fileName = currentUser.userpicUrl.match(/\/userpics\/(.+)$/)?.[1];
      if (fileName) {
        const uploadDir = path.join(process.cwd(), 'public', 'userpics');
        const filePath = path.join(uploadDir, fileName);
        try {
          await fs.unlink(filePath);
        } catch {
          // Ignore if file doesn't exist
        }
      }
    }

    // Clear userpic URL
    await prisma.user.update({
      where: { id: user.id },
      data: { userpicUrl: null }
    });

    revalidatePath('/profile');
    revalidatePath(`/profile/${user.username}`);
    return { success: true };

  } catch (error) {
    console.error('Delete userpic error:', error);
    return { error: 'Failed to delete userpic' };
  }
}
