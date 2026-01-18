import { getRecentPublicEntries } from '@/lib/actions/journal';
import { getCurrentUser } from '@/lib/auth';
import { EntryCard } from '@/components/EntryCard';
import Link from 'next/link';

export default async function RecentPage() {
  const user = await getCurrentUser();
  const { entries, error } = await getRecentPublicEntries();

  return (
    <div>
      <div className="lj-box">
        <div className="lj-box-header">Recent Public Entries</div>
        <div className="lj-box-content">
          <p className="text-small">
            The latest public entries from the community.
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
            No public entries yet. Be the first to post!
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
            currentUserId={user?.id}
          />
        ))
      )}

      <div className="lj-footer">
        <Link href="/">Home</Link>
      </div>
    </div>
  );
}
