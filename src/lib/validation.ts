import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance for server-side sanitization
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Configure allowed HTML tags and attributes
const ALLOWED_TAGS = ['b', 'i', 'u', 'a', 'p', 'br', 'strong', 'em'];
const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title']
};

// HTML sanitization function
export function sanitizeHtml(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: Object.keys(ALLOWED_ATTRIBUTES),
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    KEEP_CONTENT: true
  });
}

// Validation schemas
export const journalEntrySchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  content: z.string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be less than 50,000 characters'),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS'], {
    message: 'Visibility must be PUBLIC, PRIVATE, or FRIENDS'
  }),
  allowComments: z.boolean()
});

export const commentSchema = z.object({
  entryId: z.string()
    .min(1, 'Entry ID is required'),
  parentId: z.string()
    .optional()
    .nullable(),
  contentHtml: z.string()
    .min(1, 'Comment content is required')
    .max(5000, 'Comment must be less than 5,000 characters'),
  authorName: z.string()
    .min(1, 'Author name is required for anonymous comments')
    .max(100, 'Author name must be less than 100 characters')
    .optional()
});

export const socialLinksSchema = z.object({
  twitter: z.string().max(50).optional(),
  instagram: z.string().max(50).optional(),
  bluesky: z.string().max(100).optional(),
  customUrl: z.string().url().max(500).optional().or(z.literal('')),
  customLabel: z.string().max(50).optional(),
}).optional().nullable();

export type SocialLinks = z.infer<typeof socialLinksSchema>;

export const profileUpdateSchema = z.object({
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters')
    .trim(),
  bio: z.string()
    .max(1000, 'Bio must be less than 1,000 characters')
    .optional()
    .nullable(),
  name: z.string()
    .max(100, 'Name must be less than 100 characters')
    .optional()
    .nullable(),
  birthday: z.string()
    .optional()
    .nullable(),
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .optional()
    .nullable(),
  website: z.string()
    .url('Invalid website URL')
    .max(500, 'Website URL must be less than 500 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  contactEmail: z.string()
    .email('Invalid contact email')
    .max(320, 'Email must be less than 320 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  socialLinks: socialLinksSchema,
});

export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const emailSchema = z.string()
  .email('Invalid email address')
  .max(320, 'Email must be less than 320 characters');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters');

export const registrationSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters')
    .trim()
});

export const loginSchema = z.object({
  identifier: z.string()
    .min(1, 'Username or email is required')
    .max(320, 'Identifier too long'),
  password: z.string()
    .min(1, 'Password is required')
});

// Rate limiting types
export interface RateLimitState {
  count: number;
  resetTime: number;
}

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, RateLimitState>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number, 
  windowMs: number
): { success: boolean; resetTime?: number } {
  const now = Date.now();
  const current = rateLimitStore.get(identifier);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return { success: true };
  }

  if (current.count >= maxRequests) {
    return { success: false, resetTime: current.resetTime };
  }

  current.count++;
  return { success: true };
}

// Clean up expired rate limit entries
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}