import { getUserEntries } from '@/lib/actions/journal';
import { getCurrentUser } from '@/lib/auth';
import { EntryCard } from '@/components/EntryCard';
import { Userpic } from '@/components/Userpic';
import { FollowButton } from '@/components/FollowButton';
import { isFollowing } from '@/lib/actions/friends';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

async function getUserProfile(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      userpicUrl: true,
      createdAt: true,
      _count: {
        select: {
          entries: true,
          comments: true,
        },
      },
    },
  });
}

export default async function UserJournalPage({ params }: PageProps) {
  const { username } = await params;
  const currentUser = await getCurrentUser();
  const [result, profile] = await Promise.all([
    getUserEntries(username, currentUser?.id),
    getUserProfile(username),
  ]);

  if (result.error || !profile) {
    if (result.error === 'User not found' || !profile) {
      notFound();
    }
    return (
      <div className="lj-box">
        <div className="lj-box-header">error</div>
        <div className="lj-box-content">
          <p>Error loading journal: {result.error}</p>
        </div>
      </div>
    );
  }

  const entries = result.entries!;
  const isOwnJournal = currentUser?.id === profile.id;
  const following = currentUser && profile && !isOwnJournal
    ? await isFollowing(profile.id)
    : false;
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      {/* ✧ Profile Header Box - MySpace vibes ✧ */}
      <div className="lj-profile-header">
        <div className="lj-profile-title">
          <div className="flex items-start gap-4">
            {/* Userpic with decorative frame */}
            <div className="flex-shrink-0">
              <Userpic
                src={profile.userpicUrl}
                alt={`${profile.displayName}'s userpic`}
                size="large"
              />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg mb-1" style={{ margin: 0 }}>
                {profile.displayName}&apos;s Journal
              </h1>
              <div className="text-small text-muted mb-2">
                @{profile.username}
              </div>

              {/* Online status indicator */}
              <div className="lj-online-status mb-2">
                online now
              </div>

              {/* Stats row */}
              <div className="lj-stats">
                <div className="lj-stat-item">
                  <span className="lj-stat-value">{profile._count.entries}</span>
                  <span className="lj-stat-label">entries</span>
                </div>
                <div className="lj-stat-item">
                  <span className="lj-stat-value">{profile._count.comments}</span>
                  <span className="lj-stat-label">comments</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex-shrink-0">
              {isOwnJournal ? (
                <Link href="/journal/new" className="lj-button lj-button-primary">
                  update journal
                </Link>
              ) : currentUser && (
                <FollowButton userId={profile.id} initialIsFollowing={following} />
              )}
            </div>
          </div>
        </div>

        {/* Bio section */}
        {profile.bio && (
          <div className="lj-profile-content">
            <div className="lj-away-message">
              {profile.bio}
            </div>
          </div>
        )}

        {/* Member since & blinkies */}
        <div className="lj-profile-content" style={{ paddingTop: 0 }}>
          <div className="text-tiny text-muted mb-2">
            member since {memberSince}
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="lj-blinkie">journal keeper</span>
            {profile._count.entries >= 10 && (
              <span className="lj-blinkie">prolific writer</span>
            )}
            {profile._count.comments >= 5 && (
              <span className="lj-blinkie">friendly</span>
            )}
          </div>
        </div>
      </div>

      {/* ✧ Decorative divider ✧ */}
      <div className="lj-wave-divider" />

      {/* ✧ Journal Navigation ✧ */}
      <div className="lj-nav">
        <span className="text-muted">
          viewing {entries.length} of {profile._count.entries} entries
        </span>
        <div>
          {isOwnJournal && (
            <Link href="/journal/new" className="text-small">
              post new entry
            </Link>
          )}
        </div>
      </div>

      {/* ✧ Entries List ✧ */}
      {entries.length === 0 ? (
        <div className="lj-box">
          <div className="lj-box-content lj-empty-state">
            <p>
              {isOwnJournal
                ? "you haven't posted any entries yet..."
                : "this user hasn't posted any entries yet..."}
            </p>
            {isOwnJournal && (
              <div style={{ marginTop: '15px' }}>
                <Link href="/journal/new" className="lj-button lj-button-primary">
                  write your first entry
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              currentUserId={currentUser?.id}
            />
          ))}
        </div>
      )}

      {/* ✧ Pagination ✧ */}
      {entries.length > 0 && (
        <div className="lj-nav">
          <a href="#" onClick={(e) => e.preventDefault()}>
            « earlier entries
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>
            later entries »
          </a>
        </div>
      )}

      {/* ✧ Footer ✧ */}
      <div className="lj-footer">
        <div>
          livejournal 2004 •
          <span className="lj-accent"> where the heart posts</span>
        </div>
      </div>
    </div>
  );
}
