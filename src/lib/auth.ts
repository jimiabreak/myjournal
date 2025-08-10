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
    };
  }

  interface User {
    username: string;
    displayName: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username: string;
    displayName: string;
  }
}

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.displayName = user.displayName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.username = token.username;
        session.user.displayName = token.displayName;
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