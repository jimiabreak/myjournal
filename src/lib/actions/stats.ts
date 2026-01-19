'use server';

import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export type SiteStats = {
  totalUsers: number;
  activeUsers: number;
  activeToday: number;
  postsToday: number;
  commentsToday: number;
  postsPerHour: number;
  postsPerMinute: number;
};

async function fetchStats(): Promise<SiteStats> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    activeToday,
    postsToday,
    commentsToday,
    postsLastHour,
    postsLastFiveMin
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        entries: {
          some: {
            createdAt: { gte: thirtyDaysAgo }
          }
        }
      }
    }),
    prisma.user.count({
      where: {
        entries: {
          some: {
            createdAt: { gte: todayStart }
          }
        }
      }
    }),
    prisma.entry.count({
      where: {
        createdAt: { gte: todayStart }
      }
    }),
    prisma.comment.count({
      where: {
        createdAt: { gte: todayStart }
      }
    }),
    prisma.entry.count({
      where: {
        createdAt: { gte: oneHourAgo }
      }
    }),
    prisma.entry.count({
      where: {
        createdAt: { gte: fiveMinutesAgo }
      }
    })
  ]);

  return {
    totalUsers,
    activeUsers,
    activeToday,
    postsToday,
    commentsToday,
    postsPerHour: postsLastHour,
    postsPerMinute: Math.round(postsLastFiveMin / 5)
  };
}

export const getStats = unstable_cache(
  fetchStats,
  ['site-stats'],
  { revalidate: 60 }
);
