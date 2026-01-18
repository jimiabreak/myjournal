import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getFriendsFeed } from '@/lib/actions/journal';
import { EntryCard } from '@/components/EntryCard';
import Link from 'next/link';

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { entries, error } = await getFriendsFeed();

  return (
    <div>
      <div className="lj-box">
        <div className="lj-box-header">Friends Feed</div>
        <div className="lj-box-content">
          <p className="text-small">
            Recent entries from you and the people you follow.
          </p>
        </div>
      </div>

      {error && (
        <div className="lj-box">
          <div className="lj-box-content" style={{ color: 'var(--lj-orange)' }}>
            {error}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="lj-box">
          <div className="lj-box-content lj-empty-state">
            <p>No entries yet.</p>
            <p className="text-small text-muted" style={{ marginTop: '8px' }}>
              <Link href="/journal/new">Write your first entry</Link> or{' '}
              <Link href="/">find people to follow</Link>.
            </p>
          </div>
        </div>
      ) : (
        entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={{
              ...entry,
              createdAt: new Date(entry.createdAt),
            }}
            currentUserId={user.id}
          />
        ))
      )}

      <div className="lj-footer">
        <Link href="/">Home</Link> | <Link href="/friends">Manage Friends</Link>
      </div>
    </div>
  );
}
