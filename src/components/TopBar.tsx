'use client';

import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

export function TopBar() {
  const { user, isLoaded } = useUser();

  return (
    <>
      {/* Main Header Bar */}
      <div className="lj-topbar">
        <div className="lj-container">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div className="flex items-center gap-1">
                <span style={{ color: '#6699CC', fontSize: '11px' }}>✎</span>
                <span
                  style={{
                    fontFamily: 'Verdana, Arial, sans-serif',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    letterSpacing: '2px',
                  }}
                >
                  L<span style={{ fontSize: '14px' }}>IVE</span>J<span style={{ fontSize: '14px' }}>OURNAL</span>
                </span>
                <span style={{ fontSize: '9px', color: '#99BBDD', verticalAlign: 'super' }}>™</span>
              </div>
            </Link>

            {/* Login Area */}
            {!isLoaded ? (
              <span className="text-small" style={{ color: 'white' }}>Loading...</span>
            ) : (
              <>
                <SignedIn>
                  <div className="flex items-center gap-2" style={{ fontSize: '10px' }}>
                    <span style={{ color: 'white' }}>
                      Logged in as{' '}
                      <Link
                        href={`/journal/${user?.username || user?.id}`}
                        style={{ color: 'white', fontWeight: 'bold' }}
                      >
                        {user?.username || user?.firstName || 'User'}
                      </Link>
                    </span>
                    <span style={{ color: '#99BBDD' }}>|</span>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: 'w-6 h-6',
                        },
                      }}
                    />
                  </div>
                </SignedIn>
                <SignedOut>
                  <div className="flex items-center gap-2" style={{ fontSize: '10px' }}>
                    <span style={{ color: 'white' }}>Username:</span>
                    <input
                      type="text"
                      style={{ width: '80px', padding: '1px 3px', fontSize: '10px' }}
                    />
                    <span style={{ color: 'white' }}>Password:</span>
                    <input
                      type="password"
                      style={{ width: '80px', padding: '1px 3px', fontSize: '10px' }}
                    />
                    <Link href="/login" className="lj-button-yellow" style={{ padding: '1px 8px', fontSize: '10px' }}>
                      Login?
                    </Link>
                  </div>
                </SignedOut>
              </>
            )}
          </div>

          {/* Language links */}
          <div className="text-right" style={{ fontSize: '9px', marginTop: '4px' }}>
            <span style={{ color: '#99BBDD' }}>
              English • Español • Deutsch • Français • Русский •{' '}
              <Link href="#" style={{ color: '#99BBDD' }}>→</Link>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="lj-navbar">
        <div className="lj-container">
          <Link href="/">Welcome</Link>
          <Link href="/search">Search</Link>
          <Link href="/help">Help</Link>
          <Link href="/about">About</Link>
          <SignedIn>
            <span style={{ color: '#99BBDD' }}>|</span>
            <Link href={`/journal/${user?.username || user?.id}`}>My Journal</Link>
            <Link href="/journal/new">Post</Link>
            <Link href="/profile">Profile</Link>
          </SignedIn>
        </div>
      </div>
    </>
  );
}
