'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Userpic } from './Userpic';

export function UserSidebar() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <div className="lj-box">
      <div className="lj-box-header">User</div>
      <div className="lj-box-content">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <Userpic
              src={user.image}
              alt={`${user.displayName}'s userpic`}
              size="large"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <Link
                href={`/journal/${user.username}`}
                className="font-bold text-small hover:underline block break-words"
              >
                {user.displayName}
              </Link>
              <p className="text-tiny break-words" style={{ color: '#666666' }}>
                @{user.username}
              </p>
            </div>
            
            <div className="space-y-0">
              <div>
                <Link href="/journal/new" className="text-tiny">
                  Update Journal
                </Link>
              </div>
              <div>
                <Link
                  href="#"
                  className="text-tiny"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Edit Friends functionality coming soon!');
                  }}
                >
                  Edit Friends
                </Link>
              </div>
              <div>
                <Link href="/profile" className="text-tiny">
                  Edit Personal Info
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}