import { getEntry } from '@/lib/actions/journal';
import { getCurrentUser } from '@/lib/auth';
import { EntryCard } from '@/components/EntryCard';
import { CommentThread, CommentForm } from '@/components/CommentThread';
import { DayNavigation } from '@/components/Calendar';
import { notFound } from 'next/navigation';

type CommentWithReplies = {
  replies?: CommentWithReplies[];
};

// Helper function to count all comments recursively
function countComments(comments: CommentWithReplies[]): number {
  return comments.reduce((total, comment) => {
    return total + 1 + countComments(comment.replies || []);
  }, 0);
}

type PageProps = {
  params: Promise<{
    username: string;
    id: string;
  }>;
};

export default async function EntryPage({ params }: PageProps) {
  const { username, id } = await params;
  const currentUser = await getCurrentUser();
  const result = await getEntry(id, currentUser?.id);

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
  if (entry.user.username !== username) {
    notFound();
  }

  // Count all comments recursively
  const totalCommentCount = countComments(entry.comments);

  return (
    <div>
      <DayNavigation />
      
      {/* Entry */}
      <EntryCard
        entry={entry}
        showFullContent={true}
        currentUserId={currentUser?.id}
      />

      {/* Comments Section */}
      <div className="lj-comments">
        <div className="lj-box-header">
          {totalCommentCount === 0 
            ? 'No comments' 
            : totalCommentCount === 1 
              ? '1 comment' 
              : `${totalCommentCount} comments`
          }
        </div>
        
        <div className="lj-box-content">
          {entry.comments.length === 0 ? (
            <div className="text-center text-small" style={{ color: 'var(--lj-gray)', padding: '15px 0' }}>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <CommentThread 
              comments={entry.comments}
              entryId={entry.id}
              entryOwnerId={entry.userId}
              currentUserId={currentUser?.id}
            />
          )}

          {/* Main Comment Form */}
          <div className="lj-separator">
            <CommentForm 
              entryId={entry.id}
              currentUserId={currentUser?.id}
            />
          </div>
        </div>
      </div>
      
      <div className="lj-footer">
        <div>
          LiveJournal 2003 clone • 
          <span className="lj-accent"> Baaaah!</span>
        </div>
      </div>
    </div>
  );
}