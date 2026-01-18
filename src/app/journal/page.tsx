import { requireAuth } from '@/lib/auth';
import Link from 'next/link';

export default async function JournalPage() {
  const user = await requireAuth();

  return (
    <div>
      {/* ✧ Welcome Back Header ✧ */}
      <div className="lj-profile-header">
        <div className="lj-profile-title">
          <div className="flex items-center gap-3">
            <span className="lj-star-burst" style={{ fontSize: '24px' }}>✧</span>
            <div>
              <h1 style={{ margin: 0 }}>
                welcome back, {user.displayName}!
              </h1>
              <div className="lj-online-status mt-1">
                online now
              </div>
            </div>
          </div>
        </div>
        <div className="lj-profile-content">
          <div className="lj-away-message">
            &quot;every day is a new page in your journal. what will you write today?&quot;
          </div>
        </div>
      </div>

      {/* ✧ Quick Actions ✧ */}
      <div className="lj-box">
        <div className="lj-box-header">quick actions</div>
        <div className="lj-box-content">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/journal/new" className="lj-box-inner text-center block" style={{ textDecoration: 'none' }}>
              <div style={{ color: 'var(--lj-gold-star)', fontSize: '20px' }}>✎</div>
              <div className="text-small" style={{ color: 'var(--lj-soft-pink)' }}>post new entry</div>
            </Link>
            <Link href={`/journal/${user.username}`} className="lj-box-inner text-center block" style={{ textDecoration: 'none' }}>
              <div style={{ color: 'var(--lj-periwinkle)', fontSize: '20px' }}>✧</div>
              <div className="text-small" style={{ color: 'var(--lj-soft-pink)' }}>view my journal</div>
            </Link>
            <Link href="/profile" className="lj-box-inner text-center block" style={{ textDecoration: 'none' }}>
              <div style={{ color: 'var(--lj-electric-blue)', fontSize: '20px' }}>☆</div>
              <div className="text-small" style={{ color: 'var(--lj-soft-pink)' }}>edit profile</div>
            </Link>
            <Link href="#" className="lj-box-inner text-center block" style={{ textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>
              <div style={{ color: 'var(--lj-hot-pink)', fontSize: '20px' }}>♥</div>
              <div className="text-small" style={{ color: 'var(--lj-soft-pink)' }}>friends</div>
              <div className="text-tiny text-muted">(coming soon)</div>
            </Link>
          </div>
        </div>
      </div>

      {/* ✧ Decorative Divider ✧ */}
      <div className="lj-wave-divider" />

      {/* ✧ Your Info ✧ */}
      <div className="lj-box">
        <div className="lj-box-header">your account</div>
        <div className="lj-box-content">
          <div className="space-y-2 text-small">
            <div className="flex justify-between">
              <span className="text-muted">username:</span>
              <span>@{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">email:</span>
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✧ Blinkies ✧ */}
      <div className="lj-box">
        <div className="lj-box-header">your blinkies</div>
        <div className="lj-box-content">
          <div className="flex flex-wrap gap-1 justify-center">
            <span className="lj-blinkie">journal keeper</span>
            <span className="lj-blinkie">online</span>
            <span className="lj-blinkie">dreamer</span>
          </div>
        </div>
      </div>

      {/* ✧ Footer ✧ */}
      <div className="lj-footer">
        <div>
          livejournal 2004 •
          <span className="lj-accent"> your personal corner of the internet</span>
        </div>
      </div>
    </div>
  );
}
