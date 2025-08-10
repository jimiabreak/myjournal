export function TopBar() {
  return (
    <div className="bg-lj-steel border-b border-lj-blue-2 px-4 py-2">
      <div className="lj-content flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="text-white font-bold text-lg">
            LiveJournal
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search LiveJournal"
              className="px-2 py-1 text-sm border border-lj-blue-2 rounded"
            />
            <button className="px-3 py-1 bg-lj-blue text-white text-sm rounded hover:bg-lj-blue-2">
              Go
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Username"
            className="px-2 py-1 text-sm border border-lj-blue-2 rounded w-20"
          />
          <input
            type="password"
            placeholder="Password"
            className="px-2 py-1 text-sm border border-lj-blue-2 rounded w-20"
          />
          <button className="px-3 py-1 bg-lj-blue text-white text-sm rounded hover:bg-lj-blue-2">
            Login
          </button>
        </div>
      </div>
    </div>
  );
}