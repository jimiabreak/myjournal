'use client';

import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '@/lib/actions/profile';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  userpicUrl: string | null;
  email: string;
  createdAt: Date;
};

export default function ProfilePage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
  });

  const [userpicFile, setUserpicFile] = useState<File | null>(null);
  const [userpicPreview, setUserpicPreview] = useState<string | null>(null);
  const [uploadingUserpic, setUploadingUserpic] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const result = await getProfile();
    if (result.error) {
      router.push('/login');
      return;
    }
    
    setUser(result.user!);
    setFormData({
      displayName: result.user!.displayName,
      bio: result.user!.bio || '',
    });
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleUserpicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserpicFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setUserpicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadUserpic = async () => {
    if (!userpicFile) return;

    setUploadingUserpic(true);
    const formData = new FormData();
    formData.append('userpic', userpicFile);

    try {
      const response = await fetch('/api/upload/userpic', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setUser(prev => prev ? { ...prev, userpicUrl: result.userpicUrl } : null);
        setUserpicFile(null);
        setUserpicPreview(null);
        // Update session to reflect userpic change in sidebar
        await updateSession();
      } else {
        setErrors({ userpic: result.error });
      }
    } catch (error) {
      setErrors({ userpic: 'Failed to upload userpic' });
    } finally {
      setUploadingUserpic(false);
    }
  };

  const deleteUserpic = async () => {
    if (!confirm('Are you sure you want to delete your userpic?')) return;

    try {
      const response = await fetch('/api/upload/userpic', {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        setUser(prev => prev ? { ...prev, userpicUrl: null } : null);
        // Update session to reflect userpic deletion in sidebar
        await updateSession();
      } else {
        setErrors({ userpic: result.error });
      }
    } catch (error) {
      setErrors({ userpic: 'Failed to delete userpic' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});

    const result = await updateProfile(formData);

    if (result.error) {
      if (result.details) {
        const fieldErrors: Record<string, string> = {};
        result.details.forEach((error: any) => {
          const field = error.path[0] as string;
          if (field) {
            fieldErrors[field] = error.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: result.error });
      }
    } else {
      setUser(prev => prev ? { ...prev, displayName: formData.displayName, bio: formData.bio } : null);
      setIsEditing(false);
      // Update session to reflect changes in sidebar
      await updateSession();
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-4">
        <p className="text-lj-ink">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-4">
        <p className="text-lj-ink">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-lj-blue-3 border border-lj-blue-2 rounded">
        <div className="bg-lj-steel px-4 py-3 border-b border-lj-blue-2">
          <h1 className="text-white font-bold text-xl">Edit Personal Info</h1>
        </div>
        
        <div className="p-4">
          <div className="flex items-start space-x-6">
            {/* Userpic Section */}
            <div className="flex-shrink-0">
              <div className="space-y-3">
                {user.userpicUrl || userpicPreview ? (
                  <div className="lj-userpic">
                    <img
                      src={userpicPreview || user.userpicUrl!}
                      alt={`${user.displayName}'s userpic`}
                    />
                  </div>
                ) : (
                  <div className="lj-userpic lj-userpic-placeholder">
                    <span className="text-lj-gray text-xs">No userpic</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <input
                      type="file"
                      id="userpic"
                      accept="image/*"
                      onChange={handleUserpicChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="userpic"
                      className="cursor-pointer bg-lj-blue text-white px-3 py-1 rounded text-sm hover:bg-lj-blue-2"
                    >
                      Choose Userpic
                    </label>
                  </div>

                  {userpicFile && (
                    <button
                      onClick={uploadUserpic}
                      disabled={uploadingUserpic}
                      className="bg-lj-purple text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                      {uploadingUserpic ? 'Uploading...' : 'Upload'}
                    </button>
                  )}

                  {user.userpicUrl && (
                    <button
                      onClick={deleteUserpic}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}

                  {errors.userpic && (
                    <p className="text-red-600 text-xs">{errors.userpic}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lj-purple font-bold text-lg">{user.displayName}</h2>
                    <p className="text-lj-gray text-sm">@{user.username}</p>
                  </div>
                  
                  {user.bio && (
                    <div>
                      <h3 className="text-lj-ink font-semibold text-sm mb-1">Bio</h3>
                      <p className="text-lj-ink text-sm whitespace-pre-wrap">{user.bio}</p>
                    </div>
                  )}

                  <div className="text-lj-gray text-xs">
                    <p>Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
                    <p>Email: {user.email}</p>
                  </div>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-lj-blue text-white px-4 py-2 rounded text-sm hover:bg-lj-blue-2"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="displayName" className="block text-lj-ink font-semibold text-sm mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue"
                      maxLength={50}
                    />
                    {errors.displayName && (
                      <p className="text-red-600 text-xs mt-1">{errors.displayName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-lj-ink font-semibold text-sm mb-1">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue"
                      maxLength={500}
                      placeholder="Tell us about yourself..."
                    />
                    <div className="flex justify-between mt-1">
                      {errors.bio && (
                        <p className="text-red-600 text-xs">{errors.bio}</p>
                      )}
                      <p className="text-lj-gray text-xs ml-auto">
                        {formData.bio.length}/500
                      </p>
                    </div>
                  </div>

                  {errors.general && (
                    <p className="text-red-600 text-sm">{errors.general}</p>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-lj-blue text-white px-4 py-2 rounded text-sm hover:bg-lj-blue-2 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          displayName: user.displayName,
                          bio: user.bio || '',
                        });
                        setErrors({});
                      }}
                      className="bg-lj-gray text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}