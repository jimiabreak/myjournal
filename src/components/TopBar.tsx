'use client';

import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getProfile } from '@/lib/actions/profile';

export function TopBar() {
  const { user, isLoaded } = useUser();
  const [dbUserpic, setDbUserpic] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      getProfile().then((result) => {
        if (result.user?.userpicUrl) {
          setDbUserpic(result.user.userpicUrl);
        }
      });
    }
  }, [isLoaded, user]);

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
                  M<span style={{ fontSize: '14px' }}>Y</span>J<span style={{ fontSize: '14px' }}>OURNAL</span>
                </span>
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
                        style={{ color: 'white', fontWeight: 'bold', textDecoration: 'none' }}
                      >
                        <Image
                          src="/icons/userinfo.svg"
                          alt=""
                          width={16}
                          height={16}
                          style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }}
                        />
                        {user?.username || user?.firstName || 'User'}
                      </Link>
                    </span>
                    <span style={{ color: '#99BBDD' }}>|</span>
                    <Link href="/profile" style={{ display: 'flex', alignItems: 'center' }}>
                      {dbUserpic ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={dbUserpic}
                          alt="Your userpic"
                          style={{ width: '28px', height: '28px', objectFit: 'cover', border: '1px solid #99BBDD' }}
                        />
                      ) : (
                        <Image
                          src="/icons/userinfo.svg"
                          alt="Profile"
                          width={28}
                          height={28}
                        />
                      )}
                    </Link>
                  </div>
                </SignedIn>
                <SignedOut>
                  <div className="flex items-center gap-2" style={{ fontSize: '10px' }}>
                    <Link href="/login" className="lj-button-yellow" style={{ padding: '2px 10px', fontSize: '10px' }}>
                      Login
                    </Link>
                    <Link href="/signup" style={{ color: 'white', textDecoration: 'underline', fontSize: '10px' }}>
                      Create Account
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
