'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CommentState, Security } from '@/generated/prisma';
import { revalidatePath } from 'next/cache';
import { commentSchema, sanitizeHtml, checkRateLimit } from '@/lib/validation';
import { headers } from 'next/headers';
import { getFriendIds } from './friends';

// Legacy comment schema for backward compatibility
const legacyCommentSchema = z.object({
  entryId: z.string(),
  parentId: z.string().optional(),
  contentHtml: z.string().min(1, 'Comment content is required'),
  authorName: z.string().optional(),
});

export type CommentInput = z.infer<typeof legacyCommentSchema>;

export async function createComment(data: CommentInput) {
  try {
    const user = await getCurrentUser();
    const headersList = await headers();
    const userIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

    // Rate limiting for unauthenticated users
    if (!user) {
      const rateLimitKey = `comment_${userIp}`;
      const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000); // 5 comments per 15 minutes
      
      if (!rateLimit.success) {
        const resetInMinutes = Math.ceil((rateLimit.resetTime! - Date.now()) / 60000);
        return { error: `Rate limit exceeded. Try again in ${resetInMinutes} minutes.` };
      }
    }

    // Validate with legacy schema first, then enhanced validation
    const legacyValidated = legacyCommentSchema.parse(data);
    const enhancedValidated = commentSchema.parse({
      entryId: legacyValidated.entryId,
      parentId: legacyValidated.parentId,
      contentHtml: legacyValidated.contentHtml,
      authorName: legacyValidated.authorName
    });

    // Sanitize HTML content
    const sanitizedContent = sanitizeHtml(enhancedValidated.contentHtml);

    // Check if entry exists and get its security settings
    const entry = await prisma.entry.findUnique({
      where: { id: enhancedValidated.entryId },
      select: { 
        id: true, 
        security: true, 
        userId: true,
        user: { select: { username: true } }
      },
    });

    if (!entry) {
      return { error: 'Entry not found' };
    }

    // Check visibility permissions
    if (entry.security === Security.PRIVATE && entry.userId !== user?.id) {
      return { error: 'Cannot comment on private entry' };
    }

    if (entry.security === Security.FRIENDS) {
      if (!user) {
        return { error: 'You must be logged in to comment on friends-only entries' };
      }
      if (entry.userId !== user.id) {
        const friendIds = await getFriendIds(entry.userId);
        if (!friendIds.includes(user.id)) {
          return { error: 'Only friends can comment on this entry' };
        }
      }
    }

    // Prepare comment data
    const commentData: any = {
      entryId: enhancedValidated.entryId,
      contentHtml: sanitizedContent,
      parentId: enhancedValidated.parentId || null,
    };

    if (user) {
      commentData.authorId = user.id;
      commentData.authorName = null;
    } else {
      if (!enhancedValidated.authorName) {
        return { error: 'Author name is required for anonymous comments' };
      }
      commentData.authorId = null;
      commentData.authorName = enhancedValidated.authorName;
    }

    const comment = await prisma.comment.create({
      data: commentData,
    });

    revalidatePath(`/journal/${entry.user.username}/entry/${enhancedValidated.entryId}`);
    return { success: true, commentId: comment.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Invalid input data', details: error.issues };
    }
    console.error('Create comment error:', error);
    return { error: 'Failed to create comment' };
  }
}

export async function updateCommentState(commentId: string, state: 'VISIBLE' | 'SCREENED' | 'DELETED') {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Authentication required' };
    }

    // Check if user owns the entry this comment belongs to
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        entry: {
          select: { 
            userId: true,
            user: { select: { username: true } }
          }
        }
      },
    });

    if (!comment) {
      return { error: 'Comment not found' };
    }

    if (comment.entry.userId !== user.id) {
      return { error: 'Only entry owner can moderate comments' };
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { state: state as CommentState },
    });

    revalidatePath(`/journal/${comment.entry.user.username}/entry/${comment.entryId}`);
    return { success: true };
  } catch (error) {
    console.error('Update comment state error:', error);
    return { error: 'Failed to update comment state' };
  }
}

export async function deleteComment(commentId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Authentication required' };
    }

    // Check if user owns the comment or the entry
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        entry: {
          select: { 
            userId: true,
            user: { select: { username: true } }
          }
        }
      },
    });

    if (!comment) {
      return { error: 'Comment not found' };
    }

    const canDelete = comment.authorId === user.id || comment.entry.userId === user.id;
    if (!canDelete) {
      return { error: 'Permission denied' };
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { state: CommentState.DELETED },
    });

    revalidatePath(`/journal/${comment.entry.user.username}/entry/${comment.entryId}`);
    return { success: true };
  } catch (error) {
    console.error('Delete comment error:', error);
    return { error: 'Failed to delete comment' };
  }
}