'use server';

import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { signIn } from 'next-auth/react';

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export async function createAccount(data: SignupInput) {
  try {
    const validatedData = signupSchema.parse(data);

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });

    if (existingUsername) {
      return { error: 'Username already taken' };
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmail) {
      return { error: 'Email already registered' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        passwordHash,
        displayName: validatedData.displayName,
      },
    });

    return { success: true, userId: user.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Invalid input data', details: error.errors };
    }
    console.error('Signup error:', error);
    return { error: 'Failed to create account' };
  }
}

export async function authenticateUser(data: LoginInput) {
  try {
    const validatedData = loginSchema.parse(data);
    
    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: validatedData.identifier },
          { email: validatedData.identifier },
        ],
      },
    });

    if (!user) {
      return { error: 'Invalid credentials' };
    }

    const isPasswordValid = await bcrypt.compare(validatedData.password, user.passwordHash);

    if (!isPasswordValid) {
      return { error: 'Invalid credentials' };
    }

    return { success: true, user: { id: user.id, username: user.username, email: user.email } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: 'Invalid input data', details: error.errors };
    }
    console.error('Login error:', error);
    return { error: 'Authentication failed' };
  }
}