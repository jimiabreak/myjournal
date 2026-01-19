'use client';

type Comment = {
  id: string;
  contentHtml: string;
  authorName: string | null;
  createdAt: Date;
  state: 'VISIBLE' | 'SCREENED' | 'DELETED';
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
  entryId: string;
  entryOwnerId: string;
  currentUserId?: string;
};

import { useState } from 'react';
import { createComment, updateCommentState } from '@/lib/actions/comments';
import { Userpic } from './Userpic';
import { UsernameLink } from './UsernameLink';

export function CommentThread({ 
  comments, 
  level = 0, 
  entryId, 
  entryOwnerId, 
  currentUserId 
}: CommentThreadProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isEntryOwner = currentUserId === entryOwnerId;

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  const handleScreenComment = async (commentId: string) => {
    await updateCommentState(commentId, 'SCREENED');
  };

  const handleDeleteComment = async (commentId: string) => {
    await updateCommentState(commentId, 'DELETED');
  };

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className={level > 0 ? 'lj-comment-reply' : ''}>
      {comments.map((comment) => (
        <div key={comment.id} className="lj-comment">
          {/* Comment Header */}
          <div className="lj-comment-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Userpic
                  src={comment.author?.userpicUrl}
                  alt={`${comment.author?.displayName || comment.authorName}'s userpic`}
                  size="small"
                />
                {comment.author ? (
                  <UsernameLink
                    username={comment.author.username}
                    displayName={comment.author.displayName}
                    className="text-tiny"
                  />
                ) : (
                  <span className="text-white font-bold text-tiny">
                    {comment.authorName}
                  </span>
                )}
                <span className="text-tiny" style={{ color: 'var(--lj-blue-4)' }}>
                  • {formatDate(comment.createdAt)}
                </span>
                {comment.state === 'SCREENED' && (
                  <span className="lj-accent">(screened)</span>
                )}
              </div>
              
              {/* Moderation buttons for entry owner */}
              {isEntryOwner && comment.state === 'VISIBLE' && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleScreenComment(comment.id)}
                    className="lj-accent text-tiny"
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                  >
                    Screen
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="lj-accent text-tiny"
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comment Content */}
          <div className="lj-comment-content">
            {comment.state === 'SCREENED' ? (
              <div className="text-tiny" style={{ color: 'var(--lj-gray)', fontStyle: 'italic' }}>
                Comment screened by entry owner
              </div>
            ) : (
              <div
                className="lj-prose"
                dangerouslySetInnerHTML={{ __html: comment.contentHtml }}
              />
            )}
            
            {/* Reply Button */}
            <div className="lj-separator">
              <button 
                onClick={() => handleReply(comment.id)}
                className="text-tiny"
                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}
              >
                Reply
              </button>
            </div>
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div style={{ marginTop: '5px', marginLeft: '15px' }}>
              <CommentForm
                entryId={entryId}
                parentId={comment.id}
                currentUserId={currentUserId}
                onCancel={() => setReplyingTo(null)}
              />
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <CommentThread 
              comments={comment.replies} 
              level={level + 1}
              entryId={entryId}
              entryOwnerId={entryOwnerId}
              currentUserId={currentUserId}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Comment Form Component
type CommentFormProps = {
  entryId: string;
  parentId?: string;
  currentUserId?: string;
  onCancel?: () => void;
};

export function CommentForm({ entryId, parentId, currentUserId, onCancel }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const result = await createComment({
      entryId,
      parentId,
      contentHtml: content,
      authorName: currentUserId ? undefined : authorName,
    });

    if (result.success) {
      setContent('');
      setAuthorName('');
      onCancel?.();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="lj-box-inner">
      <h3 className="font-bold mb-2 text-small" style={{ color: 'var(--lj-purple)' }}>
        {parentId ? 'Reply' : 'Leave a Comment'}
      </h3>
      
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full"
              placeholder="Write your comment..."
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-tiny" style={{ color: 'var(--lj-gray)' }}>
              Posting as registered user
            </div>
            <div className="space-x-1">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="lj-button"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="lj-button lj-button-primary"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <label htmlFor="authorName" className="block text-tiny mb-1" style={{ color: 'var(--lj-gray)' }}>
              Your name:
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Anonymous"
              required
            />
          </div>
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full"
              placeholder="Write your comment..."
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-tiny" style={{ color: 'var(--lj-gray)' }}>
              Posting as anonymous user
            </div>
            <div className="space-x-1">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="lj-button"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !content.trim() || !authorName.trim()}
                className="lj-button lj-button-primary"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}