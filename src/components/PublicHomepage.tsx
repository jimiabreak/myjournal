import Link from 'next/link';
import Image from 'next/image';
import { getStats } from '@/lib/actions/stats';
import { getRecentPublicEntries } from '@/lib/actions/journal';

export async function PublicHomepage() {
  const [stats, { entries }] = await Promise.all([
    getStats(),
    getRecentPublicEntries(5)
  ]);

  return (
    <div>
      {/* Welcome Hero Section */}
      <div className="lj-profile-header" style={{ marginBottom: '10px' }}>
        <div className="lj-profile-title">
          <h1 style={{ margin: 0 }}>Welcome to MyJournal</h1>
        </div>
        <div className="lj-profile-content">
          <div className="lj-welcome-hero">
            <div className="lj-welcome-text">
              <p>
                MyJournal lets you express yourself, share your life, and connect with friends online.
              </p>
              <p>
                You can use MyJournal in many different ways: as a private journal,
                a blog, a discussion forum, a social network, and more.
              </p>
            </div>
            <div className="lj-welcome-cta">
              <Link href="/signup" className="lj-button-cta">
                Create a Journal
              </Link>
              <div className="lj-welcome-cta-subtitle">
                Joining MyJournal is completely free.
              </div>
            </div>
          </div>

          {/* Feature Boxes */}
          <div className="lj-feature-boxes">
            <div className="lj-feature-box">
              <Image src="/icons/community.svg" alt="Community" width={64} height={64} />
              <div className="lj-feature-box-label">True Community</div>
            </div>
            <div className="lj-feature-box">
              <Image src="/icons/content.svg" alt="Content" width={64} height={64} />
              <div className="lj-feature-box-label">Content You Care About</div>
            </div>
            <div className="lj-feature-box">
              <Image src="/icons/connect.svg" alt="Connect" width={64} height={64} />
              <div className="lj-feature-box-label">Staying in Touch</div>
            </div>
            <div className="lj-feature-box">
              <Image src="/icons/journal.svg" alt="Journal" width={64} height={64} />
              <div className="lj-feature-box-label">Your Personal Journal</div>
            </div>
          </div>
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
