'use client';

import { useState } from 'react';
import { unfollowUser } from '@/lib/actions/friends';

export function UnfollowButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUnfollow = async () => {
    if (!confirm('Unfollow this user?')) return;

    setIsLoading(true);
    const result = await unfollowUser(userId);
    if (result.error) {
      alert(result.error);
    }
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleUnfollow}
      disabled={isLoading}
      className="lj-button"
      style={{ fontSize: '10px' }}
    >
      {isLoading ? '...' : 'Unfollow'}
    </button>
  );
}
