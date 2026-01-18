'use client';

import Link from 'next/link';
import { Userpic } from './Userpic';

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

  const getSecurityIcon = (security: string) => {
    switch (security) {
      case 'PRIVATE':
        return '🔒';
      case 'FRIENDS':
        return '👥';
      default:
        return '';
    }
  };

  return (
    <div className="lj-entry">
      {/* Entry Header */}
      <div className="lj-entry-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Userpic
              src={entry.user.userpicUrl}
              alt={`${entry.user.displayName}'s userpic`}
              size="medium"
            />
            <div>
              <Link
                href={`/journal/${entry.user.username}`}
                className="text-white font-bold hover:underline text-small"
              >
                {entry.user.displayName}
              </Link>
              <div className="text-tiny" style={{ color: 'var(--lj-blue-4)' }}>
                {entry.user.username}
              </div>
            </div>
          </div>
          <div className="text-tiny" style={{ color: 'var(--lj-blue-4)' }}>
            {getSecurityIcon(entry.security)} {entry.security.toLowerCase()}
          </div>
        </div>
      </div>

      {/* Entry Content */}
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
          className="lj-prose mb-2"
          dangerouslySetInnerHTML={{
            __html: showFullContent
              ? entry.contentHtml
              : entry.contentHtml.length > 500
              ? entry.contentHtml.substring(0, 500) + '...'
              : entry.contentHtml,
          }}
        />

        {/* Entry Metadata */}
        {(entry.mood || entry.music || entry.location) && (
          <div className="lj-box-inner mb-2 text-small">
            {entry.mood && (
              <div>
                <span style={{ color: 'var(--lj-gray)' }}>Current mood:</span>{' '}
                <span>{entry.mood}</span>
              </div>
            )}
            {entry.music && (
              <div>
                <span style={{ color: 'var(--lj-gray)' }}>Current music:</span>{' '}
                <span>{entry.music}</span>
              </div>
            )}
            {entry.location && (
              <div>
                <span style={{ color: 'var(--lj-gray)' }}>Location:</span>{' '}
                <span>{entry.location}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entry Footer */}
      <div className="lj-entry-meta">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-tiny">
            <span>posted at {formatDate(entry.createdAt)}</span>
            <span>|</span>
            <Link
              href={`/journal/${entry.user.username}/entry/${entry.id}`}
            >
              {entry._count.comments} comment{entry._count.comments !== 1 ? 's' : ''}
            </Link>
            {isOwner && (
              <>
                <span>|</span>
                <Link
                  href={`/journal/${entry.user.username}/entry/${entry.id}/edit`}
                >
                  edit
                </Link>
                <span>|</span>
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
                      console.log('Delete entry:', entry.id);
                    }
                  }}
                  style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit' }}
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
            >
              read more →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}