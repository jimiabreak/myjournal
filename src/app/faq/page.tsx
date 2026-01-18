import Link from 'next/link';

type FAQItemProps = {
  question: string;
  children: React.ReactNode;
};

function FAQItem({ question, children }: FAQItemProps) {
  return (
    <div className="lj-box-inner" style={{ marginBottom: '10px' }}>
      <p className="text-small" style={{ margin: 0, marginBottom: '6px' }}>
        <strong>{question}</strong>
      </p>
      <p className="text-small" style={{ margin: 0, lineHeight: 1.6 }}>
        {children}
      </p>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div>
      {/* Header */}
      <div className="lj-profile-header" style={{ marginBottom: '10px' }}>
        <div className="lj-profile-title">
          <h1 style={{ margin: 0 }}>frequently asked questions</h1>
        </div>
        <div className="lj-profile-content">
          <p style={{ margin: 0 }}>
            Got questions? Here are the ones we hear most.
          </p>
        </div>
      </div>

      {/* FAQ Items */}
      <div className="lj-box">
        <div className="lj-box-header">the basics</div>
        <div className="lj-box-content">
          <FAQItem question="What is MyJournal?">
            A simple online journal where you can write entries, follow friends, and read what they're up to. Think blogging, but personal.
          </FAQItem>

          <FAQItem question="Is it free?">
            Yes. MyJournal is free to use. No hidden fees, no premium tiers, no "upgrade to unlock" nonsense.
          </FAQItem>

          <FAQItem question="How is this different from social media?">
            No ads. No algorithm deciding what you see. No likes or follower counts on display. You write, your friends read. The feed shows posts in order; newest first.
          </FAQItem>
        </div>
      </div>

      <div className="lj-box">
        <div className="lj-box-header">privacy & content</div>
        <div className="lj-box-content">
          <FAQItem question="Who can see what I write?">
            You decide. Every entry can be public (anyone), friends-only (people you follow who follow you back), or private (only you). You pick the privacy level each time you post.
          </FAQItem>

          <FAQItem question="Can I edit or delete my entries?">
            Yes. Your entries, your rules. Edit or delete anytime from your journal.
          </FAQItem>

          <FAQItem question="What's a userpic?">
            Your profile picture. It shows up next to your entries and comments. You can upload one from your profile page.
          </FAQItem>
        </div>
      </div>

      <div className="lj-box">
        <div className="lj-box-header">connecting with others</div>
        <div className="lj-box-content">
          <FAQItem question="How do I follow someone?">
            Visit their journal and click the follow button. Their public and friends-only posts will show up in your feed. If they follow you back, you'll see each other's friends-only entries too.
          </FAQItem>

          <FAQItem question="Something's broken. How do I get help?">
            Check the <Link href="/help">help page</Link> for guides on common tasks. If you're still stuck, reach out and we'll sort it out.
          </FAQItem>
        </div>
      </div>

      {/* CTA */}
      <div className="lj-box">
        <div className="lj-box-content" style={{ textAlign: 'center' }}>
          <p className="text-small" style={{ margin: 0, marginBottom: '10px' }}>
            Ready to start writing?
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="lj-button lj-button-primary">
              Create your journal
            </Link>
            <Link href="/help" className="lj-button">
              Read the help guides
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="lj-footer">
        <div>
          myjournal |
          <Link href="/about" style={{ margin: '0 8px' }}>About</Link> |
          <Link href="/help" style={{ margin: '0 8px' }}>Help</Link>
        </div>
      </div>
    </div>
  );
}
