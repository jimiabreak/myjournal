import { UserSidebar } from './UserSidebar';
import { Calendar } from './Calendar';
import Link from 'next/link';

export function Sidebar() {
  return (
    <div className="lj-sidebar">
      {/* User Box */}
      <UserSidebar />

      {/* Calendar */}
      <Calendar />

      {/* User Stats - like the screenshot */}
      <div className="lj-user-stats">
        <div className="lj-user-stats-header">User Stats</div>
        <div className="lj-user-stats-content">
          <div className="lj-user-stats-row">
            <span className="lj-user-stats-label">Total:</span>
            <span className="lj-user-stats-value">1378751</span>
          </div>
          <div className="lj-user-stats-row">
            <span className="lj-user-stats-label">Active:</span>
            <span className="lj-user-stats-value">650079</span>
          </div>
        </div>
      </div>

      {/* Live Post Stats */}
      <div className="lj-user-stats">
        <div className="lj-user-stats-header">Live Post Stats</div>
        <div className="lj-user-stats-content">
          <div className="lj-user-stats-row">
            <span className="lj-user-stats-label">Per Hour:</span>
            <span className="lj-user-stats-value">8654</span>
          </div>
          <div className="lj-user-stats-row">
            <span className="lj-user-stats-label">Per Minute:</span>
            <span className="lj-user-stats-value">144</span>
          </div>
          <div style={{ marginTop: '4px' }}>
            <Link href="/latest">Latest Posts</Link>
            <span style={{
              background: '#FF6600',
              color: 'white',
              padding: '0 4px',
              fontSize: '9px',
              marginLeft: '4px',
              fontWeight: 'bold'
            }}>
              XML
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="lj-box">
        <div className="lj-box-header">Navigation</div>
        <div className="lj-box-content">
          <div style={{ lineHeight: '1.6' }}>
            <div><Link href="/">Home</Link></div>
            <div><Link href="/random">Random</Link></div>
            <div><Link href="/search">Search</Link></div>
            <div><Link href="/directory">Directory</Link></div>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="lj-box">
        <div className="lj-box-header">Help</div>
        <div className="lj-box-content">
          <div style={{ lineHeight: '1.6' }}>
            <div><Link href="/faq">FAQ</Link></div>
            <div><Link href="/support">Support</Link></div>
            <div><Link href="/howto">How To</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}
