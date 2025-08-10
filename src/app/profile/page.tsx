import { requireAuth } from '@/lib/auth';

export default async function ProfilePage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6">
      <div className="bg-lj-blue-4 border border-lj-blue-2 rounded p-4">
        <h1 className="text-lj-purple font-bold text-lg mb-4">
          Profile Settings
        </h1>
        <p className="text-lj-ink">
          This is another protected page that requires authentication to access.
        </p>
        <div className="mt-4 text-sm text-lj-gray">
          <p>You are logged in as <strong>{user.displayName}</strong></p>
        </div>
      </div>
    </div>
  );
}