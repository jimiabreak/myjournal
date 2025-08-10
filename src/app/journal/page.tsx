import { requireAuth } from '@/lib/auth';

export default async function JournalPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6">
      <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-4">
        <h1 className="text-lj-purple font-bold text-lg mb-4">
          {user.displayName}'s Journal
        </h1>
        <p className="text-lj-ink">
          Welcome to your protected journal area! This page requires authentication.
        </p>
        <div className="mt-4 text-sm text-lj-gray">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      </div>
    </div>
  );
}