'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Userpic } from './Userpic';

export function UserSidebar() {
  const { data: session } = useSession();

  if (!session?.user) {
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

  const user = session.user;

  return (
    <div className="lj-box">
      <div className="lj-box-header">My Journal</div>
      <div className="lj-box-content">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {/* Userpic */}
          <div style={{ flexShrink: 0 }}>
            <Userpic
              src={user.image}
              alt={`${user.displayName}'s userpic`}
              size="large"
            />
          </div>

          {/* User Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: '4px' }}>
              <Link
                href={`/journal/${user.username}`}
                className="font-bold text-small"
              >
                {user.displayName}
              </Link>
              <p className="text-tiny" style={{ color: 'var(--lj-text-gray)' }}>
                @{user.username}
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
            <Link href={`/journal/${user.username}`} className="text-tiny">
              View My Journal
            </Link>
          </div>
          <div>
            <Link href="/friends" className="text-tiny">
              Edit Friends
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
