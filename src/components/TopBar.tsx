'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export function TopBar() {
  const { data: session, status } = useSession();

  return (
    <div className="lj-topbar">
      <div className="lj-container flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-white font-bold hover:text-lj-blue-4">
            LiveJournal
          </Link>
          <div className="flex items-center space-x-1">
            <input
              type="text"
              placeholder="Search LiveJournal"
              className="text-tiny"
              style={{ width: '120px', padding: '1px 3px' }}
            />
            <button className="lj-button lj-button-primary text-tiny">
              Go
            </button>
          </div>
        </div>

        {status === 'loading' ? (
          <div className="text-lj-blue-4 text-small">Loading...</div>
        ) : session ? (
          <div className="flex items-center space-x-2 text-small">
            <span className="text-white">
              Logged in as <strong>{session.user.displayName}</strong> ({session.user.username})
            </span>
            <span className="text-lj-blue-4">|</span>
            <button
              onClick={() => signOut()}
              className="text-lj-blue-4 hover:text-white"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <Link href="/login" className="lj-button lj-button-primary">
              Login
            </Link>
            <Link href="/signup" className="lj-button">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}