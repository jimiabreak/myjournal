'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export function TopBar() {
  const { data: session, status } = useSession();

  return (
    <div className="bg-lj-steel border-b border-lj-blue-2 px-4 py-2">
      <div className="lj-content flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-white font-bold text-lg hover:text-lj-blue-4">
            LiveJournal
          </Link>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search LiveJournal"
              className="px-2 py-1 text-sm border border-lj-blue-2 rounded"
            />
            <button className="px-3 py-1 bg-lj-blue text-white text-sm rounded hover:bg-lj-blue-2">
              Go
            </button>
          </div>
        </div>

        {status === 'loading' ? (
          <div className="text-white text-sm">Loading...</div>
        ) : session ? (
          <div className="flex items-center space-x-3">
            <span className="text-white text-sm">
              Logged in as <strong>{session.user.displayName}</strong> ({session.user.username})
            </span>
            <span className="text-lj-blue-4">|</span>
            <button
              onClick={() => signOut()}
              className="text-white text-sm hover:text-lj-blue-4 underline"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              href="/login"
              className="px-3 py-1 bg-lj-blue text-white text-sm rounded hover:bg-lj-blue-2"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1 bg-lj-purple text-white text-sm rounded hover:opacity-80"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}