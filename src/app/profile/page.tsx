'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProfile, updateProfile } from '@/lib/actions/profile';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  const loadProfile = useCallback(async () => {
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
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
      } else {
        setErrors({ userpic: result.error });
      }
    } catch {
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
      } else {
        setErrors({ userpic: result.error });
      }
    } catch {
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
        result.details.forEach((error) => {
          const field = String(error.path[0]);
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
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="lj-box">
        <div className="lj-box-content lj-loading">
          Loading your profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="lj-box">
        <div className="lj-box-content lj-empty-state">
          Profile not found
        </div>
      </div>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      {/* Page Header */}
      <div className="lj-box">
        <div className="lj-box-header">
          Edit Personal Info
        </div>
        <div className="lj-box-content">
          <p className="text-small">
            Customize your journal profile.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="lj-profile-header">
        <div className="lj-profile-title">
          <h1 style={{ margin: 0, marginBottom: '4px' }}>
            {user.displayName}
          </h1>
          <div className="text-small" style={{ color: 'white', opacity: 0.9 }}>@{user.username}</div>
        </div>

        <div className="lj-profile-content">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
            {/* Userpic Section */}
            <div style={{ flexShrink: 0 }}>
              <div>
                {user.userpicUrl || userpicPreview ? (
                  <div className="lj-userpic">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={userpicPreview || user.userpicUrl!}
                      alt={`${user.displayName}'s userpic`}
                    />
                  </div>
                ) : (
                  <div className="lj-userpic lj-userpic-placeholder">
                    <span className="text-tiny">no pic</span>
                  </div>
                )}

                <div style={{ marginTop: '8px' }}>
                  <div>
                    <input
                      type="file"
                      id="userpic"
                      accept="image/*"
                      onChange={handleUserpicChange}
                      className="hidden"
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="userpic"
                      className="lj-button"
                      style={{ fontSize: '10px', cursor: 'pointer', display: 'block', textAlign: 'center' }}
                    >
                      Choose Userpic
                    </label>
                  </div>

                  {userpicFile && (
                    <button
                      onClick={uploadUserpic}
                      disabled={uploadingUserpic}
                      className="lj-button lj-button-primary"
                      style={{ fontSize: '10px', width: '100%', marginTop: '4px' }}
                    >
                      {uploadingUserpic ? 'Uploading...' : 'Upload'}
                    </button>
                  )}

                  {user.userpicUrl && !userpicFile && (
                    <button
                      onClick={deleteUserpic}
                      className="lj-button"
                      style={{ fontSize: '10px', width: '100%', marginTop: '4px' }}
                    >
                      Delete Userpic
                    </button>
                  )}

                  {errors.userpic && (
                    <p className="text-tiny" style={{ color: 'var(--lj-orange)', marginTop: '4px' }}>
                      {errors.userpic}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {!isEditing ? (
                <div>
                  {/* Online status */}
                  <div className="lj-online-status" style={{ marginBottom: '8px' }}>
                    online now
                  </div>

                  {/* Bio */}
                  {user.bio ? (
                    <div className="lj-away-message" style={{ marginBottom: '10px' }}>
                      {user.bio}
                    </div>
                  ) : (
                    <div className="lj-box-inner" style={{ marginBottom: '10px', fontStyle: 'italic' }}>
                      <span className="text-muted">
                        No bio yet. Click edit to add one.
                      </span>
                    </div>
                  )}

                  {/* Stats & Info */}
                  <div className="lj-bio-section" style={{ marginBottom: '10px' }}>
                    <h3>About Me</h3>
                    <table style={{ fontSize: '10px' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '2px 8px 2px 0' }}><strong>Email:</strong></td>
                          <td>{user.email}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '2px 8px 2px 0' }}><strong>Member Since:</strong></td>
                          <td>{memberSince}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="lj-button lj-button-primary"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="displayName" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                      <strong>Display Name:</strong>
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                      maxLength={50}
                      placeholder="What should we call you?"
                    />
                    {errors.displayName && (
                      <p className="text-tiny" style={{ color: 'var(--lj-orange)', marginTop: '4px' }}>
                        {errors.displayName}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="bio" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                      <strong>Bio:</strong>
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={5}
                      style={{ width: '100%' }}
                      maxLength={500}
                      placeholder="Tell us about yourself..."
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      {errors.bio && (
                        <p className="text-tiny" style={{ color: 'var(--lj-orange)' }}>
                          {errors.bio}
                        </p>
                      )}
                      <p className="text-tiny text-muted" style={{ marginLeft: 'auto' }}>
                        {formData.bio.length}/500
                      </p>
                    </div>
                  </div>

                  {errors.general && (
                    <div className="lj-box-inner" style={{ marginBottom: '10px', borderColor: 'var(--lj-orange)' }}>
                      <p className="text-small" style={{ color: 'var(--lj-orange)' }}>
                        {errors.general}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="lj-button lj-button-primary"
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
                      className="lj-button"
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

      {/* Quick Links */}
      <div className="lj-box">
        <div className="lj-box-header">Quick Links</div>
        <div className="lj-box-content">
          <div style={{ lineHeight: '1.6' }}>
            <div>
              <Link href={`/journal/${user.username}`} className="text-small">
                View My Journal
              </Link>
            </div>
            <div>
              <Link href="/journal/new" className="text-small">
                Post New Entry
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="lj-footer">
        <div>
          MyJournal |
          <Link href="/about" style={{ margin: '0 8px' }}>About</Link> |
          <Link href="/faq" style={{ margin: '0 8px' }}>FAQ</Link>
        </div>
      </div>
    </div>
  );
}
