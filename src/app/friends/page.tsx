import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getFollowing, getFollowers } from '@/lib/actions/friends';
import Link from 'next/link';
import { Userpic } from '@/components/Userpic';
import { UnfollowButton } from '@/components/UnfollowButton';

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [following, followers] = await Promise.all([
    getFollowing(user.id),
    getFollowers(user.id),
  ]);

  return (
    <div>
      <div className="lj-box">
        <div className="lj-box-header">Manage Friends</div>
        <div className="lj-box-content">
          <p className="text-small">
            Add friends to see their entries in your friends feed.
          </p>
        </div>
      </div>

      {/* Following */}
      <div className="lj-box">
        <div className="lj-box-header">Following ({following.length})</div>
        <div className="lj-box-content">
          {following.length === 0 ? (
            <p className="text-small text-muted">
              You are not following anyone yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {following.map((friend) => (
                <div key={friend.id} className="lj-box-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Userpic src={friend.userpicUrl} alt={friend.displayName} size="small" />
                  <div style={{ flex: 1 }}>
                    <Link href={`/journal/${friend.username}`} className="text-small font-bold">
                      {friend.displayName}
                    </Link>
                    <div className="text-tiny text-muted">@{friend.username}</div>
                  </div>
                  <UnfollowButton userId={friend.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Followers */}
      <div className="lj-box">
        <div className="lj-box-header">Followers ({followers.length})</div>
        <div className="lj-box-content">
          {followers.length === 0 ? (
            <p className="text-small text-muted">
              No one is following you yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {followers.map((follower) => (
                <div key={follower.id} className="lj-box-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Userpic src={follower.userpicUrl} alt={follower.displayName} size="small" />
                  <div style={{ flex: 1 }}>
                    <Link href={`/journal/${follower.username}`} className="text-small font-bold">
                      {follower.displayName}
                    </Link>
                    <div className="text-tiny text-muted">@{follower.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lj-footer">
        <Link href="/">Back to Home</Link>
      </div>
    </div>
  );
}
