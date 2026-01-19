'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Userpic } from './Userpic';
import { UsernameLink } from './UsernameLink';

export function UserSidebar() {
  const { user, isSignedIn } = useUser();

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
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.username || 'User';

  return (
    <div className="lj-box">
      <div className="lj-box-header">My Journal</div>
      <div className="lj-box-content">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {/* Userpic */}
          <div style={{ flexShrink: 0 }}>
            <Userpic
              src={user?.imageUrl}
              alt={`${displayName}'s userpic`}
              size="large"
            />
          </div>

          {/* User Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: '4px' }}>
              <UsernameLink
                username={username}
                displayName={displayName}
                className="font-bold text-small"
              />
              <p className="text-tiny" style={{ color: 'var(--lj-text-gray)' }}>
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
