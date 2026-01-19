'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProfile, updateProfile } from '@/lib/actions/profile';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type SocialLinks = {
  twitter?: string;
  instagram?: string;
  bluesky?: string;
  customUrl?: string;
  customLabel?: string;
};

type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  userpicUrl: string | null;
  email: string;
  createdAt: Date;
  name: string | null;
  birthday: Date | null;
  location: string | null;
  website: string | null;
  contactEmail: string | null;
  socialLinks: SocialLinks | null;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    name: '',
    birthday: '',
    location: '',
    website: '',
    contactEmail: '',
    twitter: '',
    instagram: '',
    bluesky: '',
    customUrl: '',
    customLabel: '',
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

    const u = result.user!;
    setUser(u as User);

    // Format birthday for date input
    const birthdayStr = u.birthday
      ? new Date(u.birthday).toISOString().split('T')[0]
      : '';

    setFormData({
      displayName: u.displayName,
      bio: u.bio || '',
      name: u.name || '',
      birthday: birthdayStr,
      location: u.location || '',
      website: u.website || '',
      contactEmail: u.contactEmail || '',
      twitter: u.socialLinks?.twitter || '',
      instagram: u.socialLinks?.instagram || '',
      bluesky: u.socialLinks?.bluesky || '',
      customUrl: u.socialLinks?.customUrl || '',
      customLabel: u.socialLinks?.customLabel || '',
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
    setSuccessMessage('');
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
    const formDataObj = new FormData();
    formDataObj.append('userpic', userpicFile);

    try {
      const response = await fetch('/api/upload/userpic', {
        method: 'POST',
        body: formDataObj,
      });

      const result = await response.json();

      if (result.success) {
        setUser(prev => prev ? { ...prev, userpicUrl: result.userpicUrl } : null);
        setUserpicFile(null);
        setUserpicPreview(null);
        setSuccessMessage('Userpic uploaded successfully!');
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
        setSuccessMessage('Userpic deleted successfully!');
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
    setSuccessMessage('');

    // Build socialLinks object
    const socialLinks = {
      twitter: formData.twitter || undefined,
      instagram: formData.instagram || undefined,
      bluesky: formData.bluesky || undefined,
      customUrl: formData.customUrl || undefined,
      customLabel: formData.customLabel || undefined,
    };

    // Check if any social links are set
    const hasSocialLinks = Object.values(socialLinks).some(v => v);

    const result = await updateProfile({
      displayName: formData.displayName,
      bio: formData.bio || null,
      name: formData.name || null,
      birthday: formData.birthday || null,
      location: formData.location || null,
      website: formData.website || null,
      contactEmail: formData.contactEmail || null,
      socialLinks: hasSocialLinks ? socialLinks : null,
    });

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
      setSuccessMessage('Profile updated successfully!');
      // Refresh user data
      await loadProfile();
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

  return (
    <div>
      {/* Page Header */}
      <div className="lj-box">
        <div className="lj-box-header">
          Edit Profile
        </div>
        <div className="lj-box-content">
          <p className="text-small">
            Update your profile information.{' '}
            <Link href={`/profile/${user.username}`}>View your public profile</Link>
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="lj-box" style={{ borderColor: 'var(--lj-green)' }}>
          <div className="lj-box-content" style={{ color: 'var(--lj-green)' }}>
            {successMessage}
          </div>
        </div>
      )}

      {errors.general && (
        <div className="lj-box" style={{ borderColor: 'var(--lj-orange)' }}>
          <div className="lj-box-content" style={{ color: 'var(--lj-orange)' }}>
            {errors.general}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Userpic Section */}
        <div className="lj-box">
          <div className="lj-box-header">Userpic</div>
          <div className="lj-box-content">
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
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
              </div>
              <div>
                <input
                  type="file"
                  id="userpic"
                  accept="image/*"
                  onChange={handleUserpicChange}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="userpic"
                  className="lj-button"
                  style={{ cursor: 'pointer', display: 'inline-block' }}
                >
                  Choose New Userpic
                </label>

                {userpicFile && (
                  <button
                    type="button"
                    onClick={uploadUserpic}
                    disabled={uploadingUserpic}
                    className="lj-button lj-button-primary"
                    style={{ marginLeft: '8px' }}
                  >
                    {uploadingUserpic ? 'Uploading...' : 'Upload'}
                  </button>
                )}

                {user.userpicUrl && !userpicFile && (
                  <button
                    type="button"
                    onClick={deleteUserpic}
                    className="lj-button"
                    style={{ marginLeft: '8px' }}
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
        </div>

        {/* Basic Info Section */}
        <div className="lj-box">
          <div className="lj-box-header">Basic Info</div>
          <div className="lj-box-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label htmlFor="displayName" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                  <strong>Display Name:</strong> <span style={{ color: 'var(--lj-orange)' }}>*</span>
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                  maxLength={50}
                  required
                />
                {errors.displayName && (
                  <p className="text-tiny" style={{ color: 'var(--lj-orange)', marginTop: '4px' }}>
                    {errors.displayName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="name" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                  <strong>Full Name:</strong>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="birthday" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                  <strong>Birthday:</strong>
                </label>
                <input
                  type="date"
                  id="birthday"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label htmlFor="location" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                  <strong>Location:</strong>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                  maxLength={100}
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label htmlFor="website" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                  <strong>Website:</strong>
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                  maxLength={500}
                  placeholder="https://yoursite.com"
                />
                {errors.website && (
                  <p className="text-tiny" style={{ color: 'var(--lj-orange)', marginTop: '4px' }}>
                    {errors.website}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Social Section */}
        <div className="lj-box">
          <div className="lj-box-header">Contact & Social</div>
          <div className="lj-box-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label htmlFor="contactEmail" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                  <strong>Contact Email:</strong>
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                  maxLength={320}
                  placeholder="public@email.com"
                />
                <p className="text-tiny text-muted" style={{ marginTop: '2px' }}>
                  This will be visible on your profile
                </p>
                {errors.contactEmail && (
                  <p className="text-tiny" style={{ color: 'var(--lj-orange)', marginTop: '4px' }}>
                    {errors.contactEmail}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="twitter" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                  <strong>Twitter/X:</strong>
                </label>
                <input
                  type="text"
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                  maxLength={50}
                  placeholder="username (without @)"
                />
              </div>

              <div>
                <label htmlFor="instagram" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                  <strong>Instagram:</strong>
                </label>
                <input
                  type="text"
                  id="instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                  maxLength={50}
                  placeholder="username (without @)"
                />
              </div>

              <div>
                <label htmlFor="bluesky" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                  <strong>Bluesky:</strong>
                </label>
                <input
                  type="text"
                  id="bluesky"
                  name="bluesky"
                  value={formData.bluesky}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                  maxLength={100}
                  placeholder="handle.bsky.social"
                />
              </div>

              <div>
                <label htmlFor="customUrl" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                  <strong>Custom Link URL:</strong>
                </label>
                <input
                  type="url"
                  id="customUrl"
                  name="customUrl"
                  value={formData.customUrl}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                  maxLength={500}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label htmlFor="customLabel" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
                  <strong>Custom Link Label:</strong>
                </label>
                <input
                  type="text"
                  id="customLabel"
                  name="customLabel"
                  value={formData.customLabel}
                  onChange={handleInputChange}
                  style={{ width: '100%' }}
                  maxLength={50}
                  placeholder="Portfolio, GitHub, etc."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="lj-box">
          <div className="lj-box-header">Bio</div>
          <div className="lj-box-content">
            <label htmlFor="bio" className="text-small" style={{ display: 'block', marginBottom: '4px' }}>
              <strong>About you:</strong>
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={6}
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
        </div>

        {/* Submit Buttons */}
        <div className="lj-box">
          <div className="lj-box-content">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                disabled={isSaving}
                className="lj-button lj-button-primary"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link href={`/profile/${user.username}`} className="lj-button">
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>

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
