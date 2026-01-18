'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const entrySchema = z.object({
  subject: z.string().optional(),
  contentHtml: z.string().min(1, 'Entry content is required'),
  security: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']),
  mood: z.string().optional(),
  music: z.string().optional(),
  location: z.string().optional(),
});

export type EntryInput = z.infer<typeof entrySchema>;

type SubmitResult = {
  success?: boolean;
  error?: string;
  details?: z.ZodIssue[];
  entryId?: string;
  username?: string;
};

type EntryFormProps = {
  initialData?: Partial<EntryInput>;
  mode: 'create' | 'edit';
  entryId?: string;
  onSubmitAction: (data: EntryInput) => Promise<SubmitResult>;
};

export function EntryForm({ initialData, mode, entryId, onSubmitAction }: EntryFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<EntryInput>({
    subject: initialData?.subject || '',
    contentHtml: initialData?.contentHtml || '',
    security: initialData?.security || 'PUBLIC',
    mood: initialData?.mood || '',
    music: initialData?.music || '',
    location: initialData?.location || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validatedData = entrySchema.parse(formData);
      const result = await onSubmitAction(validatedData);

      if (result.error) {
        if (result.details) {
          const fieldErrors: Record<string, string> = {};
          result.details.forEach((error: z.ZodIssue) => {
            const field = error.path[0] as string;
            if (field) {
              fieldErrors[field] = error.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: result.error });
        }
        setIsLoading(false);
        return;
      }

      // Success - redirect based on mode
      if (mode === 'create' && result.entryId) {
        router.push(`/journal/${result.username || 'user'}/entry/${result.entryId}`);
      } else if (mode === 'edit' && entryId) {
        router.push(`/journal/${result.username || 'user'}/entry/${entryId}`);
      } else {
        router.push('/journal');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="bg-lj-blue-3 border border-lj-blue-2 rounded">
      <div className="bg-lj-steel px-4 py-3 border-b border-lj-blue-2">
        <h1 className="text-white font-bold text-xl">
          {mode === 'create' ? 'New Journal Entry' : 'Edit Entry'}
        </h1>
      </div>

      <div className="p-6">
        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-bold text-lj-ink mb-2">
              Subject (optional)
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue"
              placeholder="Enter a subject for your entry"
            />
            {errors.subject && (
              <p className="text-red-600 text-sm mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="contentHtml" className="block text-sm font-bold text-lj-ink mb-2">
              Entry Content *
            </label>
            <textarea
              id="contentHtml"
              name="contentHtml"
              value={formData.contentHtml}
              onChange={handleChange}
              rows={12}
              className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue font-mono text-sm"
              placeholder="Write your journal entry here. You can use HTML tags for formatting."
            />
            <p className="text-xs text-lj-gray mt-1">
              You can use basic HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, etc.
            </p>
            {errors.contentHtml && (
              <p className="text-red-600 text-sm mt-1">{errors.contentHtml}</p>
            )}
          </div>

          {/* Security */}
          <div>
            <label htmlFor="security" className="block text-sm font-bold text-lj-ink mb-2">
              Security Level *
            </label>
            <select
              id="security"
              name="security"
              value={formData.security}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue"
            >
              <option value="PUBLIC">Public (everyone can read)</option>
              <option value="FRIENDS">Friends Only</option>
              <option value="PRIVATE">Private (only you can read)</option>
            </select>
            {errors.security && (
              <p className="text-red-600 text-sm mt-1">{errors.security}</p>
            )}
          </div>

          {/* Optional Metadata */}
          <div className="bg-lj-blue-4 p-4 rounded border border-lj-blue-2">
            <h3 className="text-lj-purple font-bold mb-3">Optional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="mood" className="block text-sm font-bold text-lj-ink mb-1">
                  Current Mood
                </label>
                <input
                  type="text"
                  id="mood"
                  name="mood"
                  value={formData.mood}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue text-sm"
                  placeholder="e.g., happy, contemplative"
                />
              </div>

              <div>
                <label htmlFor="music" className="block text-sm font-bold text-lj-ink mb-1">
                  Current Music
                </label>
                <input
                  type="text"
                  id="music"
                  name="music"
                  value={formData.music}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue text-sm"
                  placeholder="e.g., Artist - Song Title"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-bold text-lj-ink mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue text-sm"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-lj-blue-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-lj-gray hover:text-lj-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-lj-blue text-white px-6 py-2 rounded hover:bg-lj-blue-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? mode === 'create'
                  ? 'Publishing...'
                  : 'Saving...'
                : mode === 'create'
                ? 'Publish Entry'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}