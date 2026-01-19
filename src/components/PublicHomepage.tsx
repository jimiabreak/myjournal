import Link from 'next/link';
import Image from 'next/image';

export function PublicHomepage() {
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

      {/* About MyJournal */}
      <div className="lj-box">
        <div className="lj-box-header">About MyJournal</div>
        <div className="lj-box-content">
          <p className="text-small" style={{ marginBottom: '8px' }}>
            MyJournal is a simple-to-use (but extremely powerful and customizable)
            personal publishing tool, inspired by the classic blogging platforms of the early 2000s.
          </p>
          <p className="text-small" style={{ marginBottom: '8px' }}>
            <strong>Features include:</strong>
          </p>
          <ul className="text-small" style={{ margin: '0 0 8px 20px', paddingLeft: '0' }}>
            <li>Private journaling with customizable privacy settings</li>
            <li>Connect with friends and share your thoughts</li>
            <li>Mood tracking and music/location metadata</li>
            <li>Threaded comments and discussions</li>
            <li>Classic 2003-era aesthetic</li>
          </ul>
          <p className="text-small">
            <Link href="/about">Learn more about MyJournal</Link> |
            <Link href="/faq" style={{ marginLeft: '8px' }}>Read the FAQ</Link>
          </p>
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
