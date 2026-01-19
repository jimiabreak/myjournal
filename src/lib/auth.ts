import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      userpicUrl: true,
      bio: true,
    },
  });

  // If user doesn't exist in our DB but is authenticated with Clerk,
  // create them on-demand (handles webhook race condition and localhost dev)
  if (!user) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress || `${userId}@clerk.local`;
      const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ')
        || clerkUser.username
        || 'User';
      const username = clerkUser.username || userId;

      try {
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            username,
            email,
            passwordHash: '',
            displayName,
          },
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            userpicUrl: true,
            bio: true,
          },
        });
      } catch (error) {
        // User might have been created by webhook in the meantime
        console.error('Error creating user on-demand:', error);
        user = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            userpicUrl: true,
            bio: true,
          },
        });
      }
    }
  }

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function getClerkUser() {
  return await currentUser();
}
