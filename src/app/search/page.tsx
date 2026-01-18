'use client';

import { useState } from 'react';
import { searchEntries, searchUsers } from '@/lib/actions/search';
import { EntryCard } from '@/components/EntryCard';
import { Userpic } from '@/components/Userpic';
import Link from 'next/link';

type Entry = {
  id: string;
  subject: string | null;
  contentHtml: string;
  security: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  mood: string | null;
  music: string | null;
  location: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    userpicUrl: string | null;
  };
  _count: {
    comments: number;
  };
};

type User = {
  id: string;
  username: string;
  displayName: string;
  userpicUrl: string | null;
  _count: {
    entries: number;
  };
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }

    setIsSearching(true);
    setError(null);

    const [entryResults, userResults] = await Promise.all([
      searchEntries(query),
      searchUsers(query),
    ]);

    if (entryResults.error) {
      setError(entryResults.error);
    }

    setEntries(entryResults.entries.map((e: any) => ({
      id: e.id,
      subject: e.subject,
      contentHtml: e.contentHtml,
      security: e.security,
      mood: e.mood,
      music: e.music,
      location: e.location,
      createdAt: new Date(e.createdAt),
      user: e.user,
      _count: e._count,
    })) as Entry[]);
    setUsers(userResults.users);
    setHasSearched(true);
    setIsSearching(false);
  };

  return (
    <div>
      <div className="lj-box">
        <div className="lj-box-header">Search</div>
        <div className="lj-box-content">
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search entries and users..."
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={isSearching}
                className="lj-button lj-button-primary"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          {error && (
            <p className="text-small" style={{ color: 'var(--lj-orange)', marginTop: '8px' }}>
              {error}
            </p>
          )}
        </div>
      </div>

      {hasSearched && (
        <>
          {/* Users Results */}
          {users.length > 0 && (
            <div className="lj-box">
              <div className="lj-box-header">Users ({users.length})</div>
              <div className="lj-box-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {users.map((user) => (
                    <div key={user.id} className="lj-box-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Userpic src={user.userpicUrl} alt={user.displayName} size="small" />
                      <div style={{ flex: 1 }}>
                        <Link href={`/journal/${user.username}`} className="text-small font-bold">
                          {user.displayName}
                        </Link>
                        <div className="text-tiny text-muted">
                          @{user.username} - {user._count.entries} entries
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Entry Results */}
          <div className="lj-box">
            <div className="lj-box-header">Entries ({entries.length})</div>
            <div className="lj-box-content">
              {entries.length === 0 ? (
                <p className="text-small text-muted">No entries found.</p>
              ) : (
                <p className="text-small text-muted" style={{ marginBottom: '8px' }}>
                  Found {entries.length} matching entries
                </p>
              )}
            </div>
          </div>

          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </>
      )}

      <div className="lj-footer">
        <Link href="/">Home</Link>
      </div>
    </div>
  );
}
