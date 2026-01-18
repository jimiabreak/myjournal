# Beta Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the LiveJournal clone beta-ready with working social features (friends, feed, search) and migrate to Clerk auth.

**Architecture:** Two phases - (1) Fix broken features and add social layer with Friend model, feed aggregation, and basic search; (2) Replace NextAuth with Clerk for auth. SQLite stays for MVP, friend relationships stored as self-referential User relation.

**Tech Stack:** Next.js 15, Prisma/SQLite, Tailwind, Clerk (phase 2), Zod validation

---

## Phase 1: Fix Broken Features & Add Social Layer

### Task 1: Wire Up Delete Entry Button

**Files:**
- Modify: `src/components/EntryCard.tsx:208-226`

**Step 1: Import the deleteEntry action**

Add at top of file after other imports:
```typescript
import { deleteEntry } from '@/lib/actions/journal';
```

**Step 2: Replace console.log with actual delete call**

Replace lines 208-226 with:
```typescript
{isOwner && (
  <>
    <span style={{ color: 'var(--lj-text-gray)' }}>|</span>
    <Link
      href={`/journal/${entry.user.username}/entry/${entry.id}/edit`}
      style={{ color: 'var(--lj-link)' }}
    >
      edit
    </Link>
    <span style={{ color: 'var(--lj-text-gray)' }}>|</span>
    <button
      onClick={async () => {
        if (confirm('Are you sure you want to delete this entry?')) {
          const result = await deleteEntry(entry.id);
          if (result.error) {
            alert(result.error);
          }
          // Page will revalidate automatically from server action
        }
      }}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        font: 'inherit',
        color: 'var(--lj-orange)',
        cursor: 'pointer',
        fontSize: 'inherit',
        textDecoration: 'underline',
      }}
    >
      delete
    </button>
  </>
)}
```

**Step 3: Test manually**

1. Login and create a test entry
2. Click delete button
3. Confirm deletion
4. Verify entry is removed from journal

**Step 4: Commit**

```bash
git add src/components/EntryCard.tsx
git commit -m "fix: wire delete entry button to deleteEntry action"
```

---

### Task 2: Add Friend Relationship Model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add Friendship model to schema**

Add after the User model (around line 41):
```prisma
model Friendship {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower  User @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

**Step 2: Update User model relations**

Add these lines inside the User model after `sessions Session[]`:
```prisma
  following   Friendship[] @relation("Following")
  followers   Friendship[] @relation("Followers")
```

**Step 3: Run migration**

```bash
npx prisma migrate dev --name add_friendship_model
```

Expected: Migration applies successfully, new Friendship table created.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Friendship model for follow relationships"
```

---

### Task 3: Create Friends Server Actions

**Files:**
- Create: `src/lib/actions/friends.ts`
- Test: `tests/friends.actions.test.ts`

**Step 1: Write the test file**

Create `tests/friends.actions.test.ts`:
```typescript
import { followUser, unfollowUser, getFollowers, getFollowing, isFollowing } from '@/lib/actions/friends';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    friendship: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

describe('Friends Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('followUser', () => {
    it('should return error if not authenticated', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue(null);

      const result = await followUser('user123');
      expect(result.error).toBe('Authentication required');
    });

    it('should return error if trying to follow self', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue({ id: 'user123' });

      const result = await followUser('user123');
      expect(result.error).toBe('Cannot follow yourself');
    });
  });

  describe('isFollowing', () => {
    it('should return false if not authenticated', async () => {
      const { getCurrentUser } = require('@/lib/auth');
      getCurrentUser.mockResolvedValue(null);

      const result = await isFollowing('user123');
      expect(result).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/friends.actions.test.ts
```

Expected: FAIL - module not found

**Step 3: Create the friends actions file**

Create `src/lib/actions/friends.ts`:
```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function followUser(userId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Authentication required' };
    }

    if (currentUser.id === userId) {
      return { error: 'Cannot follow yourself' };
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return { error: 'User not found' };
    }

    // Check if already following
    const existing = await prisma.friendship.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userId,
        },
      },
    });

    if (existing) {
      return { error: 'Already following this user' };
    }

    await prisma.friendship.create({
      data: {
        followerId: currentUser.id,
        followingId: userId,
      },
    });

    revalidatePath(`/journal/${targetUser.username}`);
    revalidatePath('/friends');
    return { success: true };
  } catch (error) {
    console.error('Follow user error:', error);
    return { error: 'Failed to follow user' };
  }
}

export async function unfollowUser(userId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Authentication required' };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    await prisma.friendship.delete({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userId,
        },
      },
    });

    if (targetUser) {
      revalidatePath(`/journal/${targetUser.username}`);
    }
    revalidatePath('/friends');
    return { success: true };
  } catch (error) {
    console.error('Unfollow user error:', error);
    return { error: 'Failed to unfollow user' };
  }
}

export async function isFollowing(userId: string): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const friendship = await prisma.friendship.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userId,
        },
      },
    });

    return !!friendship;
  } catch {
    return false;
  }
}

export async function getFollowers(userId: string) {
  try {
    const followers = await prisma.friendship.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            userpicUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return followers.map((f) => f.follower);
  } catch (error) {
    console.error('Get followers error:', error);
    return [];
  }
}

export async function getFollowing(userId: string) {
  try {
    const following = await prisma.friendship.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            userpicUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return following.map((f) => f.following);
  } catch (error) {
    console.error('Get following error:', error);
    return [];
  }
}

export async function getFriendIds(userId: string): Promise<string[]> {
  try {
    const following = await prisma.friendship.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    return following.map((f) => f.followingId);
  } catch {
    return [];
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- tests/friends.actions.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/actions/friends.ts tests/friends.actions.test.ts
git commit -m "feat: add friends server actions (follow, unfollow, getFollowers)"
```

---

### Task 4: Update FRIENDS Security Level Logic

**Files:**
- Modify: `src/lib/actions/journal.ts:282-289`
- Modify: `src/lib/actions/comments.ts:67-73`

**Step 1: Update getEntry function in journal.ts**

Find the security check around line 282-289 and replace with:
```typescript
// Import at top of file
import { getFriendIds } from './friends';

// In getEntry function, replace the FRIENDS check:
if (entry.security === 'FRIENDS') {
  if (!currentUser) {
    return { error: 'This entry is friends-only' };
  }
  if (entry.userId !== currentUser.id) {
    const friendIds = await getFriendIds(entry.userId);
    if (!friendIds.includes(currentUser.id)) {
      return { error: 'This entry is friends-only' };
    }
  }
}
```

**Step 2: Update comments.ts similarly**

Find around line 67-73 and update:
```typescript
// Import at top of file
import { getFriendIds } from './friends';

// In createComment function, replace the FRIENDS check:
if (entry.security === 'FRIENDS') {
  if (!user) {
    return { error: 'You must be logged in to comment on friends-only entries' };
  }
  if (entry.userId !== user.id) {
    const friendIds = await getFriendIds(entry.userId);
    if (!friendIds.includes(user.id)) {
      return { error: 'Only friends can comment on this entry' };
    }
  }
}
```

**Step 3: Test manually**

1. Create two users
2. User A posts a FRIENDS-only entry
3. User B (not following) should see "friends-only" error
4. User A follows User B (or B follows A depending on your model)
5. Now User B should see the entry

**Step 4: Commit**

```bash
git add src/lib/actions/journal.ts src/lib/actions/comments.ts
git commit -m "feat: implement actual FRIENDS security level using friendship relations"
```

---

### Task 5: Create Friends Management Page

**Files:**
- Create: `src/app/friends/page.tsx`

**Step 1: Create the friends page**

Create `src/app/friends/page.tsx`:
```typescript
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getFollowing, getFollowers } from '@/lib/actions/friends';
import Link from 'next/link';
import { Userpic } from '@/components/Userpic';
import { UnfollowButton } from '@/components/UnfollowButton';

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [following, followers] = await Promise.all([
    getFollowing(user.id),
    getFollowers(user.id),
  ]);

  return (
    <div>
      <div className="lj-box">
        <div className="lj-box-header">Manage Friends</div>
        <div className="lj-box-content">
          <p className="text-small">
            Add friends to see their entries in your friends feed.
          </p>
        </div>
      </div>

      {/* Following */}
      <div className="lj-box">
        <div className="lj-box-header">Following ({following.length})</div>
        <div className="lj-box-content">
          {following.length === 0 ? (
            <p className="text-small text-muted">
              You are not following anyone yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {following.map((friend) => (
                <div key={friend.id} className="lj-box-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Userpic src={friend.userpicUrl} alt={friend.displayName} size="small" />
                  <div style={{ flex: 1 }}>
                    <Link href={`/journal/${friend.username}`} className="text-small font-bold">
                      {friend.displayName}
                    </Link>
                    <div className="text-tiny text-muted">@{friend.username}</div>
                  </div>
                  <UnfollowButton userId={friend.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Followers */}
      <div className="lj-box">
        <div className="lj-box-header">Followers ({followers.length})</div>
        <div className="lj-box-content">
          {followers.length === 0 ? (
            <p className="text-small text-muted">
              No one is following you yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {followers.map((follower) => (
                <div key={follower.id} className="lj-box-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Userpic src={follower.userpicUrl} alt={follower.displayName} size="small" />
                  <div style={{ flex: 1 }}>
                    <Link href={`/journal/${follower.username}`} className="text-small font-bold">
                      {follower.displayName}
                    </Link>
                    <div className="text-tiny text-muted">@{follower.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lj-footer">
        <Link href="/">Back to Home</Link>
      </div>
    </div>
  );
}
```

**Step 2: Create UnfollowButton component**

Create `src/components/UnfollowButton.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { unfollowUser } from '@/lib/actions/friends';

export function UnfollowButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUnfollow = async () => {
    if (!confirm('Unfollow this user?')) return;

    setIsLoading(true);
    const result = await unfollowUser(userId);
    if (result.error) {
      alert(result.error);
    }
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleUnfollow}
      disabled={isLoading}
      className="lj-button"
      style={{ fontSize: '10px' }}
    >
      {isLoading ? '...' : 'Unfollow'}
    </button>
  );
}
```

**Step 3: Update UserSidebar to link to friends page**

In `src/components/UserSidebar.tsx`, replace the alert onClick with actual navigation:
```typescript
<Link href="/friends" className="text-tiny">
  Edit Friends
</Link>
```

**Step 4: Test manually**

1. Login and go to /friends
2. Verify empty state shows correctly
3. Follow a user from their journal page (next task)
4. Verify they appear in Following list
5. Click unfollow, verify removal

**Step 5: Commit**

```bash
git add src/app/friends/page.tsx src/components/UnfollowButton.tsx src/components/UserSidebar.tsx
git commit -m "feat: add friends management page with following/followers lists"
```

---

### Task 6: Add Follow Button to Journal Pages

**Files:**
- Create: `src/components/FollowButton.tsx`
- Modify: `src/app/journal/[username]/page.tsx`

**Step 1: Create FollowButton component**

Create `src/components/FollowButton.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { followUser, unfollowUser } from '@/lib/actions/friends';

type FollowButtonProps = {
  userId: string;
  initialIsFollowing: boolean;
};

export function FollowButton({ userId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    if (isFollowing) {
      const result = await unfollowUser(userId);
      if (!result.error) {
        setIsFollowing(false);
      } else {
        alert(result.error);
      }
    } else {
      const result = await followUser(userId);
      if (!result.error) {
        setIsFollowing(true);
      } else {
        alert(result.error);
      }
    }

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={isFollowing ? 'lj-button' : 'lj-button lj-button-primary'}
      style={{ fontSize: '10px' }}
    >
      {isLoading ? '...' : isFollowing ? 'Unfollow' : 'Add Friend'}
    </button>
  );
}
```

**Step 2: Add FollowButton to journal page**

In `src/app/journal/[username]/page.tsx`, add the follow button in the journal header area. Import at top:
```typescript
import { FollowButton } from '@/components/FollowButton';
import { isFollowing } from '@/lib/actions/friends';
import { getCurrentUser } from '@/lib/auth';
```

Then in the component, after fetching the journal user, check if current user is following:
```typescript
const currentUser = await getCurrentUser();
const isOwnJournal = currentUser?.id === journalUser.id;
const following = currentUser && !isOwnJournal ? await isFollowing(journalUser.id) : false;
```

Add the button in the header section (where user info is displayed):
```typescript
{currentUser && !isOwnJournal && (
  <FollowButton userId={journalUser.id} initialIsFollowing={following} />
)}
```

**Step 3: Test manually**

1. Login as User A
2. Go to User B's journal
3. Click "Add Friend"
4. Verify button changes to "Unfollow"
5. Check /friends page shows User B
6. Click "Unfollow"
7. Verify button changes back

**Step 4: Commit**

```bash
git add src/components/FollowButton.tsx src/app/journal/[username]/page.tsx
git commit -m "feat: add follow/unfollow button to journal pages"
```

---

### Task 7: Create Friends Feed Page

**Files:**
- Create: `src/app/feed/page.tsx`
- Modify: `src/lib/actions/journal.ts` (add getFriendsFeed function)

**Step 1: Add getFriendsFeed action**

Add to `src/lib/actions/journal.ts`:
```typescript
export async function getFriendsFeed(limit = 20, offset = 0) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Authentication required', entries: [] };
    }

    const friendIds = await getFriendIds(user.id);

    // Include own entries + friends' PUBLIC and FRIENDS entries
    const entries = await prisma.entry.findMany({
      where: {
        OR: [
          // Own entries (all)
          { userId: user.id },
          // Friends' public entries
          {
            userId: { in: friendIds },
            security: 'PUBLIC',
          },
          // Friends' friends-only entries
          {
            userId: { in: friendIds },
            security: 'FRIENDS',
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            userpicUrl: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return { entries };
  } catch (error) {
    console.error('Get friends feed error:', error);
    return { error: 'Failed to load feed', entries: [] };
  }
}
```

**Step 2: Create feed page**

Create `src/app/feed/page.tsx`:
```typescript
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getFriendsFeed } from '@/lib/actions/journal';
import { EntryCard } from '@/components/EntryCard';
import Link from 'next/link';

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { entries, error } = await getFriendsFeed();

  return (
    <div>
      <div className="lj-box">
        <div className="lj-box-header">Friends Feed</div>
        <div className="lj-box-content">
          <p className="text-small">
            Recent entries from you and the people you follow.
          </p>
        </div>
      </div>

      {error && (
        <div className="lj-box">
          <div className="lj-box-content" style={{ color: 'var(--lj-orange)' }}>
            {error}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="lj-box">
          <div className="lj-box-content lj-empty-state">
            <p>No entries yet.</p>
            <p className="text-small text-muted" style={{ marginTop: '8px' }}>
              <Link href="/journal/new">Write your first entry</Link> or{' '}
              <Link href="/">find people to follow</Link>.
            </p>
          </div>
        </div>
      ) : (
        entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={{
              ...entry,
              createdAt: new Date(entry.createdAt),
            }}
            currentUserId={user.id}
          />
        ))
      )}

      <div className="lj-footer">
        <Link href="/">Home</Link> | <Link href="/friends">Manage Friends</Link>
      </div>
    </div>
  );
}
```

**Step 3: Add feed link to navigation**

Update `src/components/UserSidebar.tsx` to include feed link:
```typescript
<div>
  <Link href="/feed" className="text-tiny">
    Friends Feed
  </Link>
</div>
```

**Step 4: Test manually**

1. User A follows User B
2. User B creates a PUBLIC entry
3. User A goes to /feed
4. Verify User B's entry appears
5. User B creates a FRIENDS entry
6. Verify it also appears in User A's feed
7. User C (not following B) should NOT see B's FRIENDS entries

**Step 5: Commit**

```bash
git add src/lib/actions/journal.ts src/app/feed/page.tsx src/components/UserSidebar.tsx
git commit -m "feat: add friends feed page showing entries from followed users"
```

---

### Task 8: Create Recent/Browse Page

**Files:**
- Create: `src/app/recent/page.tsx`
- Modify: `src/lib/actions/journal.ts` (add getRecentPublicEntries)

**Step 1: Add getRecentPublicEntries action**

Add to `src/lib/actions/journal.ts`:
```typescript
export async function getRecentPublicEntries(limit = 20, offset = 0) {
  try {
    const entries = await prisma.entry.findMany({
      where: {
        security: 'PUBLIC',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            userpicUrl: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return { entries };
  } catch (error) {
    console.error('Get recent entries error:', error);
    return { error: 'Failed to load entries', entries: [] };
  }
}
```

**Step 2: Create recent page**

Create `src/app/recent/page.tsx`:
```typescript
import { getRecentPublicEntries } from '@/lib/actions/journal';
import { getCurrentUser } from '@/lib/auth';
import { EntryCard } from '@/components/EntryCard';
import Link from 'next/link';

export default async function RecentPage() {
  const user = await getCurrentUser();
  const { entries, error } = await getRecentPublicEntries();

  return (
    <div>
      <div className="lj-box">
        <div className="lj-box-header">Recent Public Entries</div>
        <div className="lj-box-content">
          <p className="text-small">
            The latest public entries from the community.
          </p>
        </div>
      </div>

      {error && (
        <div className="lj-box">
          <div className="lj-box-content" style={{ color: 'var(--lj-orange)' }}>
            {error}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="lj-box">
          <div className="lj-box-content lj-empty-state">
            No public entries yet. Be the first to post!
          </div>
        </div>
      ) : (
        entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={{
              ...entry,
              createdAt: new Date(entry.createdAt),
            }}
            currentUserId={user?.id}
          />
        ))
      )}

      <div className="lj-footer">
        <Link href="/">Home</Link>
      </div>
    </div>
  );
}
```

**Step 3: Update home page to show real recent entries**

Replace the hardcoded posts in `src/app/page.tsx` with actual data:
```typescript
import { getRecentPublicEntries } from '@/lib/actions/journal';
import Link from 'next/link';

export default async function Home() {
  const { entries } = await getRecentPublicEntries(5);

  return (
    <div>
      {/* Keep existing Welcome Header and Get Started sections */}

      {/* Recent Posts - now with real data */}
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
            <Link href="/recent" className="text-small">View all recent posts →</Link>
          </div>
        </div>
      </div>

      {/* Keep existing Stats and Footer */}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/lib/actions/journal.ts src/app/recent/page.tsx src/app/page.tsx
git commit -m "feat: add recent public entries page and live home page feed"
```

---

### Task 9: Add Basic Search

**Files:**
- Create: `src/app/search/page.tsx`
- Create: `src/lib/actions/search.ts`

**Step 1: Create search action**

Create `src/lib/actions/search.ts`:
```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getFriendIds } from './friends';

export async function searchEntries(query: string, limit = 20) {
  if (!query || query.trim().length < 2) {
    return { entries: [], error: 'Search query must be at least 2 characters' };
  }

  try {
    const user = await getCurrentUser();
    const friendIds = user ? await getFriendIds(user.id) : [];
    const searchTerm = `%${query.trim()}%`;

    // SQLite uses LIKE for text search
    const entries = await prisma.entry.findMany({
      where: {
        AND: [
          {
            OR: [
              { subject: { contains: query.trim() } },
              { contentHtml: { contains: query.trim() } },
            ],
          },
          {
            OR: [
              // Public entries
              { security: 'PUBLIC' },
              // Own entries
              ...(user ? [{ userId: user.id }] : []),
              // Friends' FRIENDS entries
              ...(user && friendIds.length > 0
                ? [{ userId: { in: friendIds }, security: 'FRIENDS' }]
                : []),
            ],
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            userpicUrl: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { entries };
  } catch (error) {
    console.error('Search error:', error);
    return { entries: [], error: 'Search failed' };
  }
}

export async function searchUsers(query: string, limit = 10) {
  if (!query || query.trim().length < 2) {
    return { users: [] };
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query.trim() } },
          { displayName: { contains: query.trim() } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        userpicUrl: true,
        _count: {
          select: { entries: true },
        },
      },
      take: limit,
    });

    return { users };
  } catch (error) {
    console.error('User search error:', error);
    return { users: [] };
  }
}
```

**Step 2: Create search page**

Create `src/app/search/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { searchEntries, searchUsers } from '@/lib/actions/search';
import { EntryCard } from '@/components/EntryCard';
import { Userpic } from '@/components/Userpic';
import Link from 'next/link';

type Entry = {
  id: string;
  subject: string | null;
  contentHtml: string;
  security: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  mood: string | null;
  music: string | null;
  location: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    userpicUrl: string | null;
  };
  _count: {
    comments: number;
  };
};

type User = {
  id: string;
  username: string;
  displayName: string;
  userpicUrl: string | null;
  _count: {
    entries: number;
  };
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }

    setIsSearching(true);
    setError(null);

    const [entryResults, userResults] = await Promise.all([
      searchEntries(query),
      searchUsers(query),
    ]);

    if (entryResults.error) {
      setError(entryResults.error);
    }

    setEntries(entryResults.entries.map(e => ({
      ...e,
      createdAt: new Date(e.createdAt),
    })));
    setUsers(userResults.users);
    setHasSearched(true);
    setIsSearching(false);
  };

  return (
    <div>
      <div className="lj-box">
        <div className="lj-box-header">Search</div>
        <div className="lj-box-content">
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search entries and users..."
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={isSearching}
                className="lj-button lj-button-primary"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          {error && (
            <p className="text-small" style={{ color: 'var(--lj-orange)', marginTop: '8px' }}>
              {error}
            </p>
          )}
        </div>
      </div>

      {hasSearched && (
        <>
          {/* Users Results */}
          {users.length > 0 && (
            <div className="lj-box">
              <div className="lj-box-header">Users ({users.length})</div>
              <div className="lj-box-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {users.map((user) => (
                    <div key={user.id} className="lj-box-inner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Userpic src={user.userpicUrl} alt={user.displayName} size="small" />
                      <div style={{ flex: 1 }}>
                        <Link href={`/journal/${user.username}`} className="text-small font-bold">
                          {user.displayName}
                        </Link>
                        <div className="text-tiny text-muted">
                          @{user.username} - {user._count.entries} entries
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Entry Results */}
          <div className="lj-box">
            <div className="lj-box-header">Entries ({entries.length})</div>
            <div className="lj-box-content">
              {entries.length === 0 ? (
                <p className="text-small text-muted">No entries found.</p>
              ) : (
                <p className="text-small text-muted" style={{ marginBottom: '8px' }}>
                  Found {entries.length} matching entries
                </p>
              )}
            </div>
          </div>

          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </>
      )}

      <div className="lj-footer">
        <Link href="/">Home</Link>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/lib/actions/search.ts src/app/search/page.tsx
git commit -m "feat: add search functionality for entries and users"
```

---

### Task 10: Add Pagination to Entry Lists

**Files:**
- Modify: `src/lib/actions/journal.ts` (update getUserEntries)
- Modify: `src/app/journal/[username]/page.tsx`

**Step 1: Update getUserEntries to support pagination**

Update the function signature and add pagination:
```typescript
export async function getUserEntries(
  username: string,
  limit = 10,
  offset = 0
) {
  // ... existing code ...

  const entries = await prisma.entry.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          userpicUrl: true,
        },
      },
      _count: {
        select: { comments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  // Get total count for pagination
  const totalCount = await prisma.entry.count({ where: whereClause });

  return {
    entries,
    totalCount,
    hasMore: offset + entries.length < totalCount,
  };
}
```

**Step 2: Update journal page with pagination controls**

Add pagination state and controls to `src/app/journal/[username]/page.tsx`:
```typescript
// Add to search params
export default async function JournalPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { username } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || '1', 10);
  const limit = 10;
  const offset = (currentPage - 1) * limit;

  // ... fetch entries with pagination ...
  const { entries, totalCount, hasMore } = await getUserEntries(username, limit, offset);
  const totalPages = Math.ceil(totalCount / limit);

  // Add pagination UI at bottom:
  {totalPages > 1 && (
    <div className="lj-nav">
      {currentPage > 1 && (
        <Link href={`/journal/${username}?page=${currentPage - 1}`}>
          ← Earlier Entries
        </Link>
      )}
      <span className="text-small text-muted">
        Page {currentPage} of {totalPages}
      </span>
      {hasMore && (
        <Link href={`/journal/${username}?page=${currentPage + 1}`}>
          Later Entries →
        </Link>
      )}
    </div>
  )}
}
```

**Step 3: Commit**

```bash
git add src/lib/actions/journal.ts src/app/journal/[username]/page.tsx
git commit -m "feat: add pagination to journal entry lists"
```

---

## Phase 2: Migrate to Clerk Auth

### Task 11: Install and Configure Clerk

**Files:**
- Modify: `package.json`
- Create: `src/middleware.ts` (replace existing)
- Modify: `.env.local`

**Step 1: Install Clerk**

```bash
npm install @clerk/nextjs
```

**Step 2: Get Clerk API keys**

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Copy the API keys

**Step 3: Add environment variables**

Add to `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/feed
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/profile
```

**Step 4: Commit configuration**

```bash
git add package.json package-lock.json
git commit -m "chore: install @clerk/nextjs"
```

---

### Task 12: Add Clerk Provider and Middleware

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/middleware.ts`

**Step 1: Wrap app with ClerkProvider**

Update `src/app/layout.tsx`:
```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Step 2: Replace middleware**

Replace `src/middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/journal/new(.*)',
  '/profile(.*)',
  '/friends(.*)',
  '/feed(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**Step 3: Commit**

```bash
git add src/app/layout.tsx src/middleware.ts
git commit -m "feat: add Clerk provider and middleware"
```

---

### Task 13: Create Clerk-Compatible Auth Pages

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup/page.tsx`

**Step 1: Replace login page with Clerk SignIn**

Replace `src/app/login/page.tsx`:
```typescript
import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="lj-box">
      <div className="lj-box-header">Login</div>
      <div className="lj-box-content" style={{ display: 'flex', justifyContent: 'center' }}>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none',
            },
          }}
        />
      </div>
    </div>
  );
}
```

**Step 2: Replace signup page with Clerk SignUp**

Replace `src/app/signup/page.tsx`:
```typescript
import { SignUp } from '@clerk/nextjs';

export default function SignupPage() {
  return (
    <div className="lj-box">
      <div className="lj-box-header">Create Account</div>
      <div className="lj-box-content" style={{ display: 'flex', justifyContent: 'center' }}>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none',
            },
          }}
        />
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/login/page.tsx src/app/signup/page.tsx
git commit -m "feat: replace auth pages with Clerk SignIn/SignUp components"
```

---

### Task 14: Sync Clerk Users to Database

**Files:**
- Create: `src/app/api/webhooks/clerk/route.ts`
- Modify: `prisma/schema.prisma` (add clerkId field)

**Step 1: Add clerkId to User model**

Add to User model in `prisma/schema.prisma`:
```prisma
model User {
  id           String  @id @default(cuid())
  clerkId      String? @unique  // Add this line
  username     String  @unique
  // ... rest of fields
}
```

Run migration:
```bash
npx prisma migrate dev --name add_clerk_id
```

**Step 2: Create webhook handler**

Create `src/app/api/webhooks/clerk/route.ts`:
```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, username, first_name, last_name } = evt.data;

    const email = email_addresses[0]?.email_address;
    const displayName = [first_name, last_name].filter(Boolean).join(' ') || username || 'User';

    await prisma.user.create({
      data: {
        clerkId: id,
        username: username || id,
        email: email || `${id}@clerk.local`,
        passwordHash: '', // Not used with Clerk
        displayName,
      },
    });
  }

  if (eventType === 'user.updated') {
    const { id, username, first_name, last_name } = evt.data;
    const displayName = [first_name, last_name].filter(Boolean).join(' ') || username || 'User';

    await prisma.user.update({
      where: { clerkId: id },
      data: {
        username: username || undefined,
        displayName,
      },
    });
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    await prisma.user.delete({
      where: { clerkId: id },
    });
  }

  return new Response('OK', { status: 200 });
}
```

**Step 3: Install svix for webhook verification**

```bash
npm install svix
```

**Step 4: Configure webhook in Clerk Dashboard**

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to: user.created, user.updated, user.deleted
4. Copy signing secret to `.env.local` as `CLERK_WEBHOOK_SECRET`

**Step 5: Commit**

```bash
git add prisma/schema.prisma src/app/api/webhooks/clerk/route.ts package.json
git commit -m "feat: add Clerk webhook to sync users to database"
```

---

### Task 15: Update Auth Helpers for Clerk

**Files:**
- Modify: `src/lib/auth.ts`

**Step 1: Replace getCurrentUser with Clerk version**

Replace `src/lib/auth.ts`:
```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      userpicUrl: true,
      bio: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

// Get Clerk user data (for profile sync)
export async function getClerkUser() {
  return await currentUser();
}
```

**Step 2: Update TopBar to use Clerk components**

Replace session-based auth with Clerk:
```typescript
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

// In the component:
<SignedIn>
  <UserButton afterSignOutUrl="/" />
</SignedIn>
<SignedOut>
  <Link href="/login">Login</Link>
</SignedOut>
```

**Step 3: Remove old NextAuth files**

```bash
rm src/app/api/auth/[...nextauth]/route.ts
rm -rf src/app/api/auth/signup
```

**Step 4: Update package.json to remove next-auth**

```bash
npm uninstall next-auth @auth/prisma-adapter
```

**Step 5: Commit**

```bash
git add src/lib/auth.ts src/components/TopBar.tsx package.json
git rm src/app/api/auth/[...nextauth]/route.ts
git rm -rf src/app/api/auth/signup
git commit -m "feat: migrate from NextAuth to Clerk auth"
```

---

### Task 16: Final Testing and Cleanup

**Step 1: Run full test suite**

```bash
npm test
```

Fix any failing tests related to auth changes.

**Step 2: Manual testing checklist**

- [ ] Signup with email creates user in Clerk + database
- [ ] Login redirects to /feed
- [ ] Logout clears session
- [ ] Protected routes redirect to login
- [ ] Journal entries work (CRUD)
- [ ] Comments work (create, reply, screen)
- [ ] Following/unfollowing works
- [ ] Friends feed shows correct entries
- [ ] FRIENDS visibility works correctly
- [ ] Search finds entries and users
- [ ] Pagination works on journal pages

**Step 3: Remove deprecated code**

- Remove SessionProvider wrapper (replaced by ClerkProvider)
- Remove old auth schemas if not used
- Clean up unused imports

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: cleanup after Clerk migration, all tests passing"
```

---

## Summary

**Phase 1 Tasks (Social Features):**
1. Wire delete entry button
2. Add Friendship model
3. Create friends server actions
4. Update FRIENDS security level
5. Create friends management page
6. Add follow button to journals
7. Create friends feed
8. Create recent/browse page
9. Add search functionality
10. Add pagination

**Phase 2 Tasks (Clerk Migration):**
11. Install Clerk
12. Add provider and middleware
13. Replace auth pages
14. Sync users via webhook
15. Update auth helpers
16. Final testing
