'use client';

import { useState } from 'react';
import { followUser, unfollowUser } from '@/lib/actions/friends';

type FollowButtonProps = {
  userId: string;
  initialIsFollowing: boolean;
};

export function FollowButton({ userId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    if (isFollowing) {
      const result = await unfollowUser(userId);
      if (!result.error) {
        setIsFollowing(false);
      } else {
        alert(result.error);
      }
    } else {
      const result = await followUser(userId);
      if (!result.error) {
        setIsFollowing(true);
      } else {
        alert(result.error);
      }
    }

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={isFollowing ? 'lj-button' : 'lj-button lj-button-primary'}
      style={{ fontSize: '10px' }}
    >
      {isLoading ? '...' : isFollowing ? 'Unfollow' : 'Add Friend'}
    </button>
  );
}
