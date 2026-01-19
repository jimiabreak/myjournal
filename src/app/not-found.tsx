import Link from 'next/link';

// This page must be statically renderable without database access
export default function NotFound() {
  return (
    <div>
      <div className="lj-box">
        <div className="lj-box-header">Page Not Found</div>
        <div className="lj-box-content">
          <div className="lj-empty-state">
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>404</p>
            <p>The page you are looking for does not exist.</p>
            <p className="text-small text-muted" style={{ marginTop: '8px' }}>
              It may have been moved or deleted.
            </p>
            <div style={{ marginTop: '20px' }}>
              <Link href="/" className="lj-button lj-button-primary">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="lj-footer">
        <div>
          MyJournal |
          <Link href="/about" style={{ margin: '0 8px' }}>About</Link> |
          <Link href="/help" style={{ margin: '0 8px' }}>Help</Link>
        </div>
      </div>
    </div>
  );
}
