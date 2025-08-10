export default function Home() {
  return (
    <div className="space-y-6">
      <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-4">
        <h1 className="text-lj-purple font-bold text-lg mb-4">
          Welcome to LiveJournal 2003
        </h1>
        <p className="text-lj-ink mb-4">
          This is a nostalgic recreation of the classic LiveJournal interface from 2003.
          Share your thoughts, connect with friends, and relive the early days of social blogging.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-lj-gray">
            <strong>New to LiveJournal?</strong> Create your free account today!
          </p>
          <p className="text-sm text-lj-gray">
            <strong>Returning user?</strong> Log in above to access your journal.
          </p>
        </div>
      </div>

      <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-4">
        <h2 className="text-lj-purple font-bold mb-3">Recent Community Posts</h2>
        <div className="space-y-3">
          <div className="border-b border-lj-blue-2 pb-2">
            <div className="flex items-center space-x-2 mb-1">
              <a href="/users/example_user" className="text-lj-blue font-bold text-sm">
                example_user
              </a>
              <span className="text-lj-gray text-xs">2 hours ago</span>
            </div>
            <p className="text-sm text-lj-ink">
              Just discovered this amazing coffee shop downtown! The vibes are immaculate ☕
            </p>
          </div>
          <div className="border-b border-lj-blue-2 pb-2">
            <div className="flex items-center space-x-2 mb-1">
              <a href="/users/music_lover" className="text-lj-blue font-bold text-sm">
                music_lover
              </a>
              <span className="text-lj-gray text-xs">5 hours ago</span>
            </div>
            <p className="text-sm text-lj-ink">
              Anyone else obsessed with the new album from The Strokes? Can't stop listening...
            </p>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <a href="/users/bookworm23" className="text-lj-blue font-bold text-sm">
                bookworm23
              </a>
              <span className="text-lj-gray text-xs">1 day ago</span>
            </div>
            <p className="text-sm text-lj-ink">
              Finished reading "The Time Traveler's Wife" - absolutely devastated but in the best way 📚
            </p>
          </div>
        </div>
      </div>

      <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-4">
        <h2 className="text-lj-purple font-bold mb-3">LiveJournal Stats</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-lj-gray">Total Users:</div>
            <div className="text-lj-ink font-bold">1,247,893</div>
          </div>
          <div>
            <div className="text-lj-gray">Active Today:</div>
            <div className="text-lj-ink font-bold">12,439</div>
          </div>
          <div>
            <div className="text-lj-gray">Posts Today:</div>
            <div className="text-lj-ink font-bold">8,291</div>
          </div>
          <div>
            <div className="text-lj-gray">Comments Today:</div>
            <div className="text-lj-ink font-bold">23,847</div>
          </div>
        </div>
      </div>
    </div>
  );
}
