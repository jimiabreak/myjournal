'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Userpic } from './Userpic';
import { UsernameLink } from './UsernameLink';
import { getProfile } from '@/lib/actions/profile';

export function UserSidebar() {
  const { user, isSignedIn } = useUser();
  const [dbUser, setDbUser] = useState<{ userpicUrl: string | null; displayName: string } | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      getProfile().then((result) => {
        if (result.user) {
          setDbUser({ userpicUrl: result.user.userpicUrl, displayName: result.user.displayName });
        }
      });
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    // Show welcome box for logged out users
    return (
      <div className="lj-box">
        <div className="lj-box-header">Welcome!</div>
        <div className="lj-box-content">
          <div className="text-center">
            <p className="text-tiny" style={{ marginBottom: '8px' }}>
              Join the community
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/login" className="lj-button lj-button-primary" style={{ display: 'block', textAlign: 'center' }}>
                Login
              </Link>
              <Link href="/signup" className="lj-button" style={{ display: 'block', textAlign: 'center' }}>
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const username = user?.username || user?.id;
  const displayName = dbUser?.displayName || user?.firstName
    ? `${user?.firstName}${user?.lastName ? ' ' + user.lastName : ''}`
    : user?.username || 'User';

  return (
    <div className="lj-box">
      <div className="lj-box-header">My Journal</div>
      <div className="lj-box-content">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {/* Userpic */}
          <div style={{ flexShrink: 0 }}>
            <Userpic
              src={dbUser?.userpicUrl || user?.imageUrl}
              alt={`${displayName}'s userpic`}
              size="large"
            />
          </div>

          {/* User Info */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ marginBottom: '4px' }}>
              <UsernameLink
                username={username}
                displayName={displayName}
                className="font-bold text-small"
                style={{ wordBreak: 'break-word' }}
              />
              <p className="text-tiny" style={{ color: 'var(--lj-text-gray)', wordBreak: 'break-word' }}>
                @{username}
              </p>
            </div>

            {/* Online status */}
            <div className="lj-online-status">
              online now
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="lj-separator" />

        {/* Quick Links */}
        <div style={{ lineHeight: '1.6' }}>
          <div>
            <Link href="/journal/new" className="text-tiny">
              Update Journal
            </Link>
          </div>
          <div>
            <Link href={`/journal/${username}`} className="text-tiny">
              View My Journal
            </Link>
          </div>
          <div>
            <Link href="/friends" className="text-tiny">
              Edit Friends
            </Link>
          </div>
          <div>
            <Link href="/feed" className="text-tiny">
              Friends Feed
            </Link>
          </div>
          <div>
            <Link href="/profile" className="text-tiny">
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
