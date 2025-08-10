import { getUserEntries } from '@/lib/actions/journal';
import { getCurrentUser } from '@/lib/auth';
import { EntryCard } from '@/components/EntryCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type PageProps = {
  params: {
    username: string;
  };
};

export default async function UserJournalPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();
  const result = await getUserEntries(params.username, currentUser?.id);

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
  const isOwnJournal = currentUser?.username === params.username;

  return (
    <div className="space-y-6">
      {/* Journal Header */}
      <div className="bg-lj-blue-3 border border-lj-blue-2 rounded">
        <div className="bg-lj-steel px-4 py-3 border-b border-lj-blue-2">
          <h1 className="text-white font-bold text-xl">
            {params.username}'s Journal
          </h1>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-lj-ink">
              {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} total
            </p>
            {isOwnJournal && (
              <Link
                href="/journal/new"
                className="bg-lj-blue text-white px-4 py-2 rounded hover:bg-lj-blue-2 text-sm font-bold"
              >
                Post New Entry
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-6 text-center">
          <p className="text-lj-gray">
            {isOwnJournal ? "You haven't posted any entries yet." : "This user hasn't posted any entries yet."}
          </p>
          {isOwnJournal && (
            <Link
              href="/journal/new"
              className="inline-block mt-4 bg-lj-blue text-white px-4 py-2 rounded hover:bg-lj-blue-2 text-sm"
            >
              Create Your First Entry
            </Link>
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

      {/* Pagination would go here in a real app */}
    </div>
  );
}