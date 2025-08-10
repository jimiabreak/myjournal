import { getEntry } from '@/lib/actions/journal';
import { getCurrentUser } from '@/lib/auth';
import { EntryCard } from '@/components/EntryCard';
import { CommentThread } from '@/components/CommentThread';
import { notFound } from 'next/navigation';

type PageProps = {
  params: {
    username: string;
    id: string;
  };
};

export default async function EntryPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();
  const result = await getEntry(params.id, currentUser?.id);

  if (result.error) {
    if (result.error === 'Entry not found' || result.error === 'Permission denied') {
      notFound();
    }
    return (
      <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-4">
        <p className="text-lj-ink">Error loading entry: {result.error}</p>
      </div>
    );
  }

  const entry = result.entry!;

  // Verify the username matches the entry owner
  if (entry.user.username !== params.username) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Entry */}
      <EntryCard
        entry={entry}
        showFullContent={true}
        currentUserId={currentUser?.id}
      />

      {/* Comments Section */}
      <div className="bg-lj-blue-3 border border-lj-blue-2 rounded">
        <div className="bg-lj-steel px-4 py-3 border-b border-lj-blue-2">
          <h2 className="text-white font-bold">
            Comments ({entry.comments.length})
          </h2>
        </div>
        
        <div className="p-4">
          {entry.comments.length === 0 ? (
            <p className="text-lj-gray text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <CommentThread comments={entry.comments} />
          )}

          {/* Comment Form */}
          <div className="mt-6 pt-4 border-t border-lj-blue-2">
            <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-4">
              <h3 className="text-lj-purple font-bold mb-3">Leave a Comment</h3>
              {currentUser ? (
                <form className="space-y-3">
                  <div>
                    <label htmlFor="comment" className="sr-only">
                      Comment
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows={4}
                      className="w-full px-3 py-2 border border-lj-blue-2 rounded focus:outline-none focus:border-lj-blue"
                      placeholder="Write your comment..."
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-lj-gray">
                      Posting as <strong>{currentUser.displayName}</strong>
                    </div>
                    <button
                      type="submit"
                      className="bg-lj-blue text-white px-4 py-2 rounded hover:bg-lj-blue-2 text-sm"
                    >
                      Post Comment
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-lj-gray mb-3">
                    You must be logged in to leave a comment.
                  </p>
                  <a
                    href="/login"
                    className="bg-lj-blue text-white px-4 py-2 rounded hover:bg-lj-blue-2 text-sm"
                  >
                    Log In
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}