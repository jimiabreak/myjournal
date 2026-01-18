import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      displayName: string;
      image?: string | null;
    };
  }

  interface User {
    username: string;
    displayName: string;
    userpicUrl?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username: string;
    displayName: string;
    userpicUrl?: string | null;
  }
}

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          const { identifier, password } = loginSchema.parse(credentials);

          // Find user by username or email
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: identifier },
                { email: identifier },
              ],
            },
            select: {
              id: true,
              username: true,
              email: true,
              displayName: true,
              userpicUrl: true,
              passwordHash: true,
            },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            userpicUrl: user.userpicUrl,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.username = user.username;
        token.displayName = user.displayName;
        token.userpicUrl = user.userpicUrl;
      }
      
      // Refresh user data from database on update
      if (trigger === 'update' || (trigger === 'signIn' && token.sub)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            username: true,
            displayName: true,
            userpicUrl: true,
          },
        });
        
        if (dbUser) {
          token.username = dbUser.username;
          token.displayName = dbUser.displayName;
          token.userpicUrl = dbUser.userpicUrl;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.username = token.username;
        session.user.displayName = token.displayName;
        session.user.image = token.userpicUrl;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }
  return session.user;
}