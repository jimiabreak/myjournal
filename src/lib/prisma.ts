import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // During build time, DATABASE_URL might not be available
  // Return a proxy that will fail gracefully if used
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not found - database operations will fail');
    // Return a proxy that throws helpful errors
    return new Proxy({} as PrismaClient, {
      get(target, prop) {
        if (prop === 'then' || prop === 'catch') {
          return undefined;
        }
        return new Proxy(() => {}, {
          get() {
            throw new Error('Database not available - DATABASE_URL is not configured');
          },
          apply() {
            throw new Error('Database not available - DATABASE_URL is not configured');
          }
        });
      }
    });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  globalForPrisma.prisma = prisma;
}