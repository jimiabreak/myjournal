'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { z } from 'zod';

const signupSchema = z.object({
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

type SignupInput = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupInput>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validatedData = signupSchema.parse(formData);
      
      // Call the signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          const fieldErrors: Record<string, string> = {};
          result.details.forEach((error: z.ZodIssue) => {
            fieldErrors[error.path[0]] = error.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: result.error });
        }
        setIsLoading(false);
        return;
      }

      // Auto-login after successful signup
      const loginResult = await signIn('credentials', {
        identifier: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (loginResult?.ok) {
        router.push('/');
        router.refresh();
      } else {
        router.push('/login?message=Account created successfully. Please log in.');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-6">
        <h1 className="text-lj-purple font-bold text-xl mb-6 text-center">
          Create Your LiveJournal Account
        </h1>

        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-bold text-lj-ink mb-1">
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue"
              placeholder="Enter your username"
            />
            {errors.username && (
              <p className="text-red-600 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-lj-ink mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-bold text-lj-ink mb-1">
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue"
              placeholder="Enter your display name"
            />
            {errors.displayName && (
              <p className="text-red-600 text-sm mt-1">{errors.displayName}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-lj-ink mb-1">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-lj-ink mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue"
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-lj-blue text-white py-2 px-4 rounded hover:bg-lj-blue-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-lj-gray">
            Already have an account?{' '}
            <a href="/login" className="text-lj-blue hover:text-lj-blue-2 underline">
              Log in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}