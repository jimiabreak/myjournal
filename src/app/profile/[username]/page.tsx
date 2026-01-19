import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getProfileByUsername } from '@/lib/actions/profile';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { FollowButton } from '@/components/FollowButton';

type Props = {
  params: Promise<{ username: string }>;
};

export default async function ProfileViewPage({ params }: Props) {
  const { username } = await params;
  const result = await getProfileByUsername(username);

  if (result.error || !result.user) {
    notFound();
  }

  const { user, isOwnProfile, isFollowing } = result;

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const birthdayFormatted = user.birthday
    ? new Date(user.birthday).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const hasSocialLinks = user.socialLinks && (
    user.socialLinks.twitter ||
    user.socialLinks.instagram ||
    user.socialLinks.bluesky ||
    user.socialLinks.customUrl
  );

  return (
    <div>
      {/* Profile Header */}
      <div className="lj-profile-header">
        <div className="lj-profile-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Image
              src="/icons/userinfo.svg"
              alt=""
              width={16}
              height={16}
            />
            <h1 style={{ margin: 0 }}>{user.displayName}</h1>
          </div>
          <div className="text-small" style={{ color: 'white', opacity: 0.9, marginTop: '2px' }}>
            @{user.username}
          </div>
        </div>

        <div className="lj-profile-content">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
            {/* Userpic */}
            <div style={{ flexShrink: 0 }}>
              {user.userpicUrl ? (
                <div className="lj-userpic">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.userpicUrl}
                    alt={`${user.displayName}'s userpic`}
                  />
                </div>
              ) : (
                <div className="lj-userpic lj-userpic-placeholder">
                  <span className="text-tiny">no pic</span>
                </div>
              )}
            </div>

            {/* Header Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="lj-online-status" style={{ marginBottom: '8px' }}>
                online now
              </div>

              <div className="text-small" style={{ marginBottom: '8px' }}>
                <strong>Member since:</strong> {memberSince}
              </div>

              <div className="lj-stats" style={{ marginBottom: '10px' }}>
                <div className="lj-stat-item">
                  <div className="lj-stat-value">{user.entryCount}</div>
                  <div className="lj-stat-label">Entries</div>
                </div>
                <div className="lj-stat-item">
                  <div className="lj-stat-value">{user.commentCount}</div>
                  <div className="lj-stat-label">Comments</div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {isOwnProfile ? (
                  <Link href="/profile/edit" className="lj-button lj-button-primary">
                    Edit Profile
                  </Link>
                ) : (
                  <FollowButton
                    userId={user.id}
                    initialIsFollowing={isFollowing ?? false}
                  />
                )}
                <Link href={`/journal/${user.username}`} className="lj-button">
                  View Journal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Info Section */}
      {(user.name || user.birthday || user.location || user.website || user.contactEmail) && (
        <CollapsibleSection title="Basic Info" defaultOpen>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              {user.name && (
                <div className="text-small" style={{ marginBottom: '6px' }}>
                  <strong>Name:</strong> {user.name}
                </div>
              )}
              {birthdayFormatted && (
                <div className="text-small" style={{ marginBottom: '6px' }}>
                  <strong>Birthdate:</strong> {birthdayFormatted}
                </div>
              )}
              {user.location && (
                <div className="text-small" style={{ marginBottom: '6px' }}>
                  <strong>Location:</strong> {user.location}
                </div>
              )}
              {user.website && (
                <div className="text-small" style={{ marginBottom: '6px' }}>
                  <strong>Website:</strong>{' '}
                  <a href={user.website} target="_blank" rel="noopener noreferrer">
                    {user.website}
                  </a>
                </div>
              )}
            </div>
            <div>
              {user.contactEmail && (
                <div className="text-small" style={{ marginBottom: '6px' }}>
                  <strong>Contact:</strong>{' '}
                  <a href={`mailto:${user.contactEmail}`}>{user.contactEmail}</a>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Bio Section */}
      {user.bio && (
        <CollapsibleSection title="Bio" defaultOpen>
          <div className="text-small lj-prose" style={{ whiteSpace: 'pre-wrap' }}>
            {user.bio}
          </div>
        </CollapsibleSection>
      )}

      {/* Connect Section */}
      {hasSocialLinks && (
        <CollapsibleSection title="Connect" defaultOpen>
          <div className="text-small">
            {user.socialLinks?.twitter && (
              <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 'bold', width: '70px' }}>Twitter/X:</span>
                <a
                  href={`https://twitter.com/${user.socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{user.socialLinks.twitter}
                </a>
              </div>
            )}
            {user.socialLinks?.instagram && (
              <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 'bold', width: '70px' }}>Instagram:</span>
                <a
                  href={`https://instagram.com/${user.socialLinks.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{user.socialLinks.instagram}
                </a>
              </div>
            )}
            {user.socialLinks?.bluesky && (
              <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 'bold', width: '70px' }}>Bluesky:</span>
                <a
                  href={`https://bsky.app/profile/${user.socialLinks.bluesky}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{user.socialLinks.bluesky}
                </a>
              </div>
            )}
            {user.socialLinks?.customUrl && (
              <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 'bold', width: '70px' }}>
                  {user.socialLinks.customLabel || 'Link'}:
                </span>
                <a
                  href={user.socialLinks.customUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {user.socialLinks.customUrl}
                </a>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

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
