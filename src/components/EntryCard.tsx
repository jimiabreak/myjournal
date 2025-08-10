'use client';

import Link from 'next/link';

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
    <div className="bg-lj-blue-3 border border-lj-blue-2 rounded mb-6">
      {/* Entry Header */}
      <div className="bg-lj-steel px-4 py-2 border-b border-lj-blue-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {entry.user.userpicUrl && (
              <img
                src={entry.user.userpicUrl}
                alt={`${entry.user.displayName}'s userpic`}
                className="w-8 h-8 rounded border border-lj-blue-2"
              />
            )}
            <div>
              <Link
                href={`/journal/${entry.user.username}`}
                className="text-white font-bold hover:text-lj-blue-4"
              >
                {entry.user.displayName}
              </Link>
              <div className="text-lj-blue-4 text-xs">
                {entry.user.username}
              </div>
            </div>
          </div>
          <div className="text-lj-blue-4 text-sm">
            {getSecurityIcon(entry.security)} {entry.security.toLowerCase()}
          </div>
        </div>
      </div>

      {/* Entry Content */}
      <div className="p-4">
        {entry.subject && (
          <h2 className="text-lj-purple font-bold text-lg mb-3">
            {showFullContent ? (
              entry.subject
            ) : (
              <Link
                href={`/journal/${entry.user.username}/entry/${entry.id}`}
                className="hover:text-lj-blue"
              >
                {entry.subject}
              </Link>
            )}
          </h2>
        )}

        <div
          className="text-lj-ink mb-4 prose prose-sm max-w-none"
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
          <div className="bg-lj-blue-4 p-2 rounded mb-4 text-sm">
            {entry.mood && (
              <div>
                <span className="text-lj-gray">Current mood:</span>{' '}
                <span className="text-lj-ink">{entry.mood}</span>
              </div>
            )}
            {entry.music && (
              <div>
                <span className="text-lj-gray">Current music:</span>{' '}
                <span className="text-lj-ink">{entry.music}</span>
              </div>
            )}
            {entry.location && (
              <div>
                <span className="text-lj-gray">Location:</span>{' '}
                <span className="text-lj-ink">{entry.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Entry Footer */}
        <div className="text-xs text-lj-gray border-t border-lj-blue-2 pt-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span>posted at {formatDate(entry.createdAt)}</span>
            <span>|</span>
            <Link
              href={`/journal/${entry.user.username}/entry/${entry.id}`}
              className="text-lj-blue hover:text-lj-blue-2"
            >
              {entry._count.comments} comment{entry._count.comments !== 1 ? 's' : ''}
            </Link>
            {isOwner && (
              <>
                <span>|</span>
                <Link
                  href={`/journal/${entry.id}/edit`}
                  className="text-lj-blue hover:text-lj-blue-2"
                >
                  edit
                </Link>
                <span>|</span>
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
                      // TODO: Implement delete functionality
                      console.log('Delete entry:', entry.id);
                    }
                  }}
                  className="text-lj-blue hover:text-lj-blue-2"
                >
                  delete
                </button>
              </>
            )}
          </div>
          {!showFullContent && entry.contentHtml.length > 500 && (
            <Link
              href={`/journal/${entry.user.username}/entry/${entry.id}`}
              className="text-lj-blue hover:text-lj-blue-2"
            >
              read more →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}