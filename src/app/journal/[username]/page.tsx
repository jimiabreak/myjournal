import { getUserEntries } from '@/lib/actions/journal';
import { getCurrentUser } from '@/lib/auth';
import { EntryCard } from '@/components/EntryCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function UserJournalPage({ params }: PageProps) {
  const { username } = await params;
  const currentUser = await getCurrentUser();
  const result = await getUserEntries(username, currentUser?.id);

  if (result.error) {
    if (result.error === 'User not found') {
      notFound();
    }
    return (
      <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-4">
        <p className="text-lj-ink">Error loading journal: {result.error}</p>
      </div>
    );
  }

  const entries = result.entries!;
  const isOwnJournal = currentUser?.username === username;

  return (
    <div>
      {/* Journal Header */}
      <div className="lj-box">
        <div className="lj-box-header">
          {username}&apos;s Journal
        </div>
        <div className="lj-box-content">
          <div className="flex items-center justify-between">
            <p className="text-small">
              {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} total
            </p>
            {isOwnJournal && (
              <Link href="/journal/new" className="lj-button lj-button-primary">
                Post New Entry
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="lj-box-inner text-center" style={{ padding: '20px' }}>
          <p className="text-small" style={{ color: 'var(--lj-gray)' }}>
            {isOwnJournal ? "You haven&apos;t posted any entries yet." : "This user hasn&apos;t posted any entries yet."}
          </p>
          {isOwnJournal && (
            <div style={{ marginTop: '10px' }}>
              <Link href="/journal/new" className="lj-button lj-button-primary">
                Create Your First Entry
              </Link>
            </div>
          )}
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

      {/* Pagination placeholder */}
      <div className="lj-nav">
        <a href="#" onClick={(e) => e.preventDefault()}>« Previous 20</a>
        <a href="#" onClick={(e) => e.preventDefault()}>Next 20 »</a>
      </div>
      
      <div className="lj-footer">
        <div>
          LiveJournal 2003 clone • 
          <span className="lj-accent"> Moo!</span>
        </div>
      </div>
    </div>
  );
}