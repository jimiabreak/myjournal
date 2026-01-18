import Link from 'next/link';
import { getRecentPublicEntries } from '@/lib/actions/journal';

export default async function Home() {
  const { entries } = await getRecentPublicEntries(5);

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

      {/* Get Started */}
      <div className="lj-box">
        <div className="lj-box-header">Get Started</div>
        <div className="lj-box-content">
          <div className="lj-box-inner" style={{ marginBottom: '8px' }}>
            <p className="text-small" style={{ marginBottom: '8px' }}>
              <strong>New to MyJournal?</strong><br />
              Create your free account and start journaling today!
            </p>
            <Link href="/signup" className="lj-button lj-button-primary">
              Create Your Journal
            </Link>
          </div>

          <div className="lj-box-inner">
            <p className="text-small" style={{ marginBottom: '8px' }}>
              <strong>Returning User?</strong><br />
              Welcome back! Log in to access your journal.
            </p>
            <Link href="/login" className="lj-button">
              Login
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
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>1,337</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Active Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>42</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Posts Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>128</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Comments Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>256</td>
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
          <Link href="/support" style={{ margin: '0 8px' }}>Support</Link>
        </div>
      </div>
    </div>
  );
}
