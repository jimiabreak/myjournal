type Comment = {
  id: string;
  contentHtml: string;
  authorName: string | null;
  createdAt: Date;
  author: {
    username: string;
    displayName: string;
    userpicUrl: string | null;
  } | null;
  replies: Comment[];
};

type CommentThreadProps = {
  comments: Comment[];
  level?: number;
};

export function CommentThread({ comments, level = 0 }: CommentThreadProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className={level > 0 ? 'ml-8 border-l-2 border-lj-blue-2 pl-4' : ''}>
      {comments.map((comment) => (
        <div key={comment.id} className="mb-4">
          <div className="bg-lj-blue-4 border border-lj-blue-2 rounded">
            {/* Comment Header */}
            <div className="bg-lj-steel px-3 py-2 border-b border-lj-blue-2">
              <div className="flex items-center space-x-2">
                {comment.author?.userpicUrl && (
                  <img
                    src={comment.author.userpicUrl}
                    alt={`${comment.author.displayName}'s userpic`}
                    className="w-6 h-6 rounded border border-lj-blue-2"
                  />
                )}
                <span className="text-white font-bold text-sm">
                  {comment.author ? comment.author.displayName : comment.authorName}
                </span>
                {comment.author && (
                  <span className="text-lj-blue-4 text-xs">
                    ({comment.author.username})
                  </span>
                )}
                <span className="text-lj-blue-4 text-xs">
                  • {formatDate(comment.createdAt)}
                </span>
              </div>
            </div>

            {/* Comment Content */}
            <div className="p-3">
              <div
                className="text-lj-ink text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: comment.contentHtml }}
              />
              
              {/* Reply Button */}
              <div className="mt-2 pt-2 border-t border-lj-blue-2">
                <button className="text-lj-blue text-xs hover:text-lj-blue-2">
                  Reply
                </button>
              </div>
            </div>
          </div>

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              <CommentThread comments={comment.replies} level={level + 1} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}