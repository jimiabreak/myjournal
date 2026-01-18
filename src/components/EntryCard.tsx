'use client';

import Link from 'next/link';
import { Userpic } from './Userpic';
import { deleteEntry } from '@/lib/actions/journal';

type Entry = {
  id: string;
  userId?: string;
  subject: string | null;
  contentHtml: string;
  security: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  mood: string | null;
  music: string | null;
  location: string | null;
  createdAt: Date;
  user: {
    id?: string;
    username: string;
    displayName: string;
    userpicUrl: string | null;
  };
  _count: {
    comments: number;
  };
};

type EntryCardProps = {
  entry: Entry;
  showFullContent?: boolean;
  currentUserId?: string;
};

export function EntryCard({ entry, showFullContent = false, currentUserId }: EntryCardProps) {
  const isOwner = currentUserId && (currentUserId === entry.userId || currentUserId === entry.user.id);

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getSecurityBadge = (security: string) => {
    switch (security) {
      case 'PRIVATE':
        return (
          <span className="lj-security-badge lj-security-private">
            private
          </span>
        );
      case 'FRIENDS':
        return (
          <span className="lj-security-badge lj-security-friends">
            friends only
          </span>
        );
      default:
        return (
          <span className="lj-security-badge lj-security-public">
            public
          </span>
        );
    }
  };

  // Map moods to cute emoticon-style display
  const getMoodDisplay = (mood: string) => {
    const moodEmotes: Record<string, string> = {
      happy: '(^_^)',
      sad: '(;_;)',
      excited: '(\\^o^/)',
      tired: '(-_-) zzz',
      angry: '(>_<)',
      contemplative: '(._. )',
      creative: '(*^_^*)',
      loved: '(♥‿♥)',
      anxious: '(°_°)',
      peaceful: '(◡‿◡)',
    };
    const lowerMood = mood.toLowerCase();
    return moodEmotes[lowerMood] || `(${mood})`;
  };

  return (
    <div className="lj-entry">
      {/* ✧ Entry Header ✧ */}
      <div className="lj-entry-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Userpic
              src={entry.user.userpicUrl}
              alt={`${entry.user.displayName}'s userpic`}
              size="medium"
            />
            <div>
              <Link
                href={`/journal/${entry.user.username}`}
                className="font-bold hover:underline text-small"
                style={{ color: 'var(--lj-link)' }}
              >
                {entry.user.displayName}
              </Link>
              <div className="text-tiny" style={{ color: 'var(--lj-text-gray)' }}>
                @{entry.user.username}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getSecurityBadge(entry.security)}
          </div>
        </div>
      </div>

      {/* ✧ Entry Content ✧ */}
      <div className="lj-entry-content">
        {entry.subject && (
          <div className="lj-entry-subject">
            {showFullContent ? (
              entry.subject
            ) : (
              <Link
                href={`/journal/${entry.user.username}/entry/${entry.id}`}
                className="hover:underline"
              >
                {entry.subject}
              </Link>
            )}
          </div>
        )}

        <div
          className="lj-prose mb-3"
          dangerouslySetInnerHTML={{
            __html: showFullContent
              ? entry.contentHtml
              : entry.contentHtml.length > 500
              ? entry.contentHtml.substring(0, 500) + '...'
              : entry.contentHtml,
          }}
        />

        {/* ✧ Mood/Music/Location Box - That classic LJ feel ✧ */}
        {(entry.mood || entry.music || entry.location) && (
          <div className="lj-metadata-box">
            {entry.mood && (
              <div className="mb-1">
                <span className="lj-metadata-label">current mood:</span>
                <span className="lj-mood-indicator">
                  {entry.mood} {getMoodDisplay(entry.mood)}
                </span>
              </div>
            )}
            {entry.music && (
              <div className="mb-1">
                <span className="lj-metadata-label">current music:</span>
                <span className="lj-metadata-value">{entry.music}</span>
              </div>
            )}
            {entry.location && (
              <div>
                <span className="lj-metadata-label">location:</span>
                <span className="lj-metadata-value">{entry.location}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✧ Entry Footer ✧ */}
      <div className="lj-entry-meta">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-tiny">
            <span style={{ color: 'var(--lj-text-gray)' }}>
              posted @ {formatTime(entry.createdAt)}
            </span>
            <span style={{ color: 'var(--lj-text-gray)' }}>|</span>
            <span>{formatDate(entry.createdAt).split(',')[0]}</span>
            <span style={{ color: 'var(--lj-text-gray)' }}>|</span>
            <Link
              href={`/journal/${entry.user.username}/entry/${entry.id}`}
              style={{ color: 'var(--lj-link)' }}
            >
              {entry._count.comments} comment{entry._count.comments !== 1 ? 's' : ''}
            </Link>
            {isOwner && (
              <>
                <span style={{ color: 'var(--lj-text-gray)' }}>|</span>
                <Link
                  href={`/journal/${entry.user.username}/entry/${entry.id}/edit`}
                  style={{ color: 'var(--lj-link)' }}
                >
                  edit
                </Link>
                <span style={{ color: 'var(--lj-text-gray)' }}>|</span>
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this entry?')) {
                      const result = await deleteEntry(entry.id);
                      if (result.error) {
                        alert(result.error);
                      }
                      // Page will revalidate automatically from server action
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    color: 'var(--lj-orange)',
                    cursor: 'pointer',
                    fontSize: 'inherit',
                    textDecoration: 'underline',
                  }}
                >
                  delete
                </button>
              </>
            )}
          </div>
          {!showFullContent && entry.contentHtml.length > 500 && (
            <Link
              href={`/journal/${entry.user.username}/entry/${entry.id}`}
              className="text-tiny"
              style={{ color: 'var(--lj-link)' }}
            >
              read more ~
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
