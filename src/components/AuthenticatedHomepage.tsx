import Link from 'next/link';
import { getStats } from '@/lib/actions/stats';
import { getRecentPublicEntries } from '@/lib/actions/journal';

export async function AuthenticatedHomepage() {
  const [stats, { entries }] = await Promise.all([
    getStats(),
    getRecentPublicEntries(5)
  ]);

  return (
    <div>
      {/* Welcome Header */}
      <div className="lj-profile-header" style={{ marginBottom: '10px' }}>
        <div className="lj-profile-title">
          <h1 style={{ margin: 0 }}>Welcome to MyJournal</h1>
        </div>
        <div className="lj-profile-content">
          <p style={{ margin: 0 }}>
            A place to share your thoughts, connect with friends, and keep a personal journal online.
          </p>
        </div>
      </div>

      {/* Quick Actions for logged-in users */}
      <div className="lj-box">
        <div className="lj-box-header">Quick Actions</div>
        <div className="lj-box-content">
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/update" className="lj-button lj-button-primary">
              Post New Entry
            </Link>
            <Link href="/friends" className="lj-button">
              Friends Feed
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="lj-box">
        <div className="lj-box-header">Recent Posts</div>
        <div className="lj-box-content">
          {entries.length === 0 ? (
            <p className="text-small text-muted">No posts yet. Be the first!</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="lj-box-inner" style={{ marginBottom: '8px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <Link href={`/journal/${entry.user.username}`} className="text-small font-bold">
                    {entry.user.displayName}
                  </Link>
                  <span className="text-tiny text-muted" style={{ marginLeft: '8px' }}>
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-small" style={{ margin: '4px 0' }}>
                  <Link href={`/journal/${entry.user.username}/entry/${entry.id}`}>
                    {entry.subject || 'Untitled'}
                  </Link>
                </p>
                {entry.mood && (
                  <div className="text-tiny" style={{ fontStyle: 'italic', color: 'var(--lj-text-gray)' }}>
                    mood: {entry.mood}
                  </div>
                )}
              </div>
            ))
          )}
          <div style={{ marginTop: '8px' }}>
            <Link href="/recent" className="text-small">View all recent posts</Link>
          </div>
        </div>
      </div>

      {/* Site Stats */}
      <div className="lj-box">
        <div className="lj-box-header">Site Stats</div>
        <div className="lj-box-content">
          <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Total Users:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.totalUsers.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Active Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.activeToday.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Posts Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.postsToday.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Comments Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.commentsToday.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="lj-footer">
        <div>
          MyJournal |
          <Link href="/about" style={{ margin: '0 8px' }}>About</Link> |
          <Link href="/faq" style={{ margin: '0 8px' }}>FAQ</Link> |
          <Link href="/help" style={{ margin: '0 8px' }}>Support</Link>
        </div>
      </div>
    </div>
  );
}
