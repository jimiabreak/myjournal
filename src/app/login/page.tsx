'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams?.get('message');
  
  const [formData, setFormData] = useState<LoginInput>({
    identifier: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validatedData = loginSchema.parse(formData);
      
      const result = await signIn('credentials', {
        identifier: validatedData.identifier,
        password: validatedData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({ general: 'Invalid username/email or password' });
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        router.push('/');
        router.refresh();
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
          Login to LiveJournal
        </h1>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-bold text-lj-ink mb-1">
              Username or Email
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue"
              placeholder="Enter your username or email"
            />
            {errors.identifier && (
              <p className="text-red-600 text-sm mt-1">{errors.identifier}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-lj-ink mb-1">
              Password
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-lj-blue text-white py-2 px-4 rounded hover:bg-lj-blue-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-lj-gray">
            Don't have an account?{' '}
            <a href="/signup" className="text-lj-blue hover:text-lj-blue-2 underline">
              Create one here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}