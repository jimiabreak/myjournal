import Link from 'next/link';

type HelpSectionProps = {
  title: string;
  children: React.ReactNode;
};

function HelpSection({ title, children }: HelpSectionProps) {
  return (
    <div className="lj-box-inner" style={{ marginBottom: '12px' }}>
      <p className="text-small" style={{ margin: 0, marginBottom: '6px' }}>
        <strong>{title}</strong>
      </p>
      <p className="text-small" style={{ margin: 0, lineHeight: 1.6 }}>
        {children}
      </p>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div>
      {/* Header */}
      <div className="lj-profile-header" style={{ marginBottom: '10px' }}>
        <div className="lj-profile-title">
          <h1 style={{ margin: 0 }}>help & how-tos</h1>
        </div>
        <div className="lj-profile-content">
          <p style={{ margin: 0 }}>
            Everything you need to know about using MyJournal. Pick a topic below.
          </p>
        </div>
      </div>

      {/* Getting Started */}
      <div className="lj-box">
        <div className="lj-box-header">getting started</div>
        <div className="lj-box-content">
          <HelpSection title="Setting up your profile">
            Head to your <Link href="/profile">profile page</Link> and click "Edit Profile." Add a display name, write a short bio, and upload a userpic. This is what people see when they visit your journal.
          </HelpSection>

          <HelpSection title="Uploading a userpic">
            From your profile, click "Choose Userpic" and select an image from your device. Keep it under 2MB. JPG, PNG, and GIF all work.
          </HelpSection>
        </div>
      </div>

      {/* Writing Entries */}
      <div className="lj-box">
        <div className="lj-box-header">writing entries</div>
        <div className="lj-box-content">
          <HelpSection title="Creating your first entry">
            Click "Post" in the navigation bar or "Update Journal" from the sidebar. Give it a subject (optional), write your thoughts, pick a privacy level, and hit publish.
          </HelpSection>

          <HelpSection title="Privacy levels explained">
            <strong>Public</strong> means anyone on the internet can read it. <strong>Friends</strong> means only mutual follows can see it (you follow them, they follow you). <strong>Private</strong> means only you can see it; your personal archive.
          </HelpSection>

          <HelpSection title="Adding mood, music, and location">
            These are optional fields below the main entry box. Fill them in to give your post extra context. They'll display at the bottom of your entry.
          </HelpSection>

          <HelpSection title="Editing or deleting an entry">
            Open any entry you've written and click the edit or delete button. Changes save right away.
          </HelpSection>
        </div>
      </div>

      {/* Connecting */}
      <div className="lj-box">
        <div className="lj-box-header">connecting with others</div>
        <div className="lj-box-content">
          <HelpSection title="Following someone">
            Visit their journal and click the follow button. You'll see their public posts in your feed right away. If they follow you back, you'll also see their friends-only posts.
          </HelpSection>

          <HelpSection title="Your friends feed">
            Click "Friends Feed" in the sidebar to see recent entries from everyone you follow, newest first. No algorithm; posts appear in the order they were written.
          </HelpSection>

          <HelpSection title="Leaving a comment">
            Scroll to the bottom of any entry and type your reply. You can comment as a logged-in user or anonymously (if the journal owner allows it).
          </HelpSection>
        </div>
      </div>

      {/* Finding People */}
      <div className="lj-box">
        <div className="lj-box-header">finding people and posts</div>
        <div className="lj-box-content">
          <HelpSection title="Using search">
            The <Link href="/search">search page</Link> lets you find entries by keyword or discover users by username. Type what you're looking for and browse the results.
          </HelpSection>
        </div>
      </div>

      {/* Still stuck */}
      <div className="lj-box">
        <div className="lj-box-header">still stuck?</div>
        <div className="lj-box-content">
          <p className="text-small" style={{ margin: 0, lineHeight: 1.6 }}>
            Check the <Link href="/faq">FAQ</Link> for quick answers to common questions. If something's broken or confusing, we want to know about it.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="lj-footer">
        <div>
          myjournal |
          <Link href="/about" style={{ margin: '0 8px' }}>About</Link> |
          <Link href="/faq" style={{ margin: '0 8px' }}>FAQ</Link>
        </div>
      </div>
    </div>
  );
}
