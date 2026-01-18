import Link from 'next/link';

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <div className="lj-profile-header" style={{ marginBottom: '10px' }}>
        <div className="lj-profile-title">
          <h1 style={{ margin: 0 }}>a quieter corner of the internet</h1>
        </div>
        <div className="lj-profile-content">
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            MyJournal is a place to write, reflect, and connect with people who care about what you have to say. No algorithms. No ads. No infinite scroll designed to steal your afternoon.
          </p>
          <p style={{ margin: '12px 0 0 0', fontStyle: 'italic' }}>
            You write. Your friends read. That's it.
          </p>
        </div>
      </div>

      {/* Why we built this */}
      <div className="lj-box">
        <div className="lj-box-header">why we built this</div>
        <div className="lj-box-content">
          <p className="text-small" style={{ marginBottom: '10px', lineHeight: 1.6 }}>
            The internet used to feel smaller. You had a blog, your friends had blogs, and you'd check in on each other. Comments meant something. Connections were real.
          </p>
          <p className="text-small" style={{ marginBottom: '10px', lineHeight: 1.6 }}>
            Somewhere along the way, that got buried under sponsored posts, engagement metrics, and platforms optimized for outrage instead of honesty.
          </p>
          <p className="text-small" style={{ margin: 0, lineHeight: 1.6 }}>
            MyJournal brings back that energy. A simple journal. A friends list. A feed of people you chose to follow. Nothing more, nothing less.
          </p>
        </div>
      </div>

      {/* What you'll find here */}
      <div className="lj-box">
        <div className="lj-box-header">what you'll find here</div>
        <div className="lj-box-content">
          <div className="lj-box-inner" style={{ marginBottom: '8px' }}>
            <p className="text-small" style={{ margin: 0 }}>
              <strong>your journal</strong><br />
              Write public entries, friends-only posts, or private thoughts nobody else sees.
            </p>
          </div>
          <div className="lj-box-inner" style={{ marginBottom: '8px' }}>
            <p className="text-small" style={{ margin: 0 }}>
              <strong>your people</strong><br />
              Follow friends and read their updates in one calm feed.
            </p>
          </div>
          <div className="lj-box-inner">
            <p className="text-small" style={{ margin: 0 }}>
              <strong>your space</strong><br />
              No ads, no trends, no pressure to perform.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="lj-box">
        <div className="lj-box-header">ready to slow down?</div>
        <div className="lj-box-content" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="lj-button lj-button-primary">
              Create your journal
            </Link>
            <Link href="/faq" className="lj-button">
              Read the FAQ
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="lj-footer">
        <div>
          myjournal |
          <Link href="/faq" style={{ margin: '0 8px' }}>FAQ</Link> |
          <Link href="/help" style={{ margin: '0 8px' }}>Help</Link>
        </div>
      </div>
    </div>
  );
}
