'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { profileUpdateSchema, sanitizeHtml } from '@/lib/validation';

// Legacy profile schema for backward compatibility
const legacyProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters'),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
});

export type ProfileInput = z.infer<typeof legacyProfileSchema>;

export async function updateProfile(data: ProfileInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Authentication required' };
    }

    // Validate with both legacy and enhanced schemas
    const legacyValidated = legacyProfileSchema.parse(data);
    const enhancedValidated = profileUpdateSchema.parse({
      displayName: legacyValidated.displayName,
      bio: legacyValidated.bio
    });

    // Sanitize bio content if it exists
    const sanitizedBio = enhancedValidated.bio ? sanitizeHtml(enhancedValidated.bio) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: enhancedValidated.displayName,
        bio: sanitizedBio,
      },
    });

    revalidatePath('/profile');
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
      },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    // Only return email if viewing own profile
    const isOwnProfile = currentUser?.id === user.id;
    if (!isOwnProfile) {
      user.email = '';
    }

    return { user };

  } catch (error) {
    console.error('Get profile error:', error);
    return { error: 'Failed to fetch profile' };
  }
}