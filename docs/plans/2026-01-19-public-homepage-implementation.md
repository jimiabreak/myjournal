# Public Homepage & Real Stats Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a public homepage for logged-out users and replace all hardcoded stats with real database queries.

**Architecture:** Auth-aware homepage routing using Clerk's `auth()`. Stats fetched via server actions with 60-second caching. Feature boxes with era-authentic SVG icons.

**Tech Stack:** Next.js 16, Clerk auth, Prisma, CSS (existing LJ theme)

---

## Task 1: Create Stats Server Action

**Files:**
- Create: `src/lib/actions/stats.ts`

**Step 1: Create the stats action file**

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export type SiteStats = {
  totalUsers: number;
  activeUsers: number;
  activeToday: number;
  postsToday: number;
  commentsToday: number;
  postsPerHour: number;
  postsPerMinute: number;
};

async function fetchStats(): Promise<SiteStats> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    activeToday,
    postsToday,
    commentsToday,
    postsLastHour,
    postsLastFiveMin
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        entries: {
          some: {
            createdAt: { gte: thirtyDaysAgo }
          }
        }
      }
    }),
    prisma.user.count({
      where: {
        entries: {
          some: {
            createdAt: { gte: todayStart }
          }
        }
      }
    }),
    prisma.entry.count({
      where: {
        createdAt: { gte: todayStart }
      }
    }),
    prisma.comment.count({
      where: {
        createdAt: { gte: todayStart }
      }
    }),
    prisma.entry.count({
      where: {
        createdAt: { gte: oneHourAgo }
      }
    }),
    prisma.entry.count({
      where: {
        createdAt: { gte: fiveMinutesAgo }
      }
    })
  ]);

  return {
    totalUsers,
    activeUsers,
    activeToday,
    postsToday,
    commentsToday,
    postsPerHour: postsLastHour,
    postsPerMinute: Math.round(postsLastFiveMin / 5)
  };
}

export const getStats = unstable_cache(
  fetchStats,
  ['site-stats'],
  { revalidate: 60 }
);
```

**Step 2: Commit**

```bash
git add src/lib/actions/stats.ts
git commit -m "feat: add real stats server action with caching"
```

---

## Task 2: Update Sidebar with Real Stats

**Files:**
- Modify: `src/components/Sidebar.tsx`

**Step 1: Convert Sidebar to async and fetch real stats**

Replace the entire file with:

```typescript
import { UserSidebar } from './UserSidebar';
import { Calendar } from './Calendar';
import Link from 'next/link';
import { getStats } from '@/lib/actions/stats';

export async function Sidebar() {
  const stats = await getStats();

  return (
    <div className="lj-sidebar">
      {/* User Box */}
      <UserSidebar />

      {/* Calendar */}
      <Calendar />

      {/* User Stats - like the screenshot */}
      <div className="lj-user-stats">
        <div className="lj-user-stats-header">User Stats</div>
        <div className="lj-user-stats-content">
          <div className="lj-user-stats-row">
            <span className="lj-user-stats-label">Total:</span>
            <span className="lj-user-stats-value">{stats.totalUsers.toLocaleString()}</span>
          </div>
          <div className="lj-user-stats-row">
            <span className="lj-user-stats-label">Active:</span>
            <span className="lj-user-stats-value">{stats.activeUsers.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Live Post Stats */}
      <div className="lj-user-stats">
        <div className="lj-user-stats-header">Live Post Stats</div>
        <div className="lj-user-stats-content">
          <div className="lj-user-stats-row">
            <span className="lj-user-stats-label">Per Hour:</span>
            <span className="lj-user-stats-value">{stats.postsPerHour.toLocaleString()}</span>
          </div>
          <div className="lj-user-stats-row">
            <span className="lj-user-stats-label">Per Minute:</span>
            <span className="lj-user-stats-value">{stats.postsPerMinute.toLocaleString()}</span>
          </div>
          <div style={{ marginTop: '4px' }}>
            <Link href="/recent">Latest Posts</Link>
            <span style={{
              background: '#FF6600',
              color: 'white',
              padding: '0 4px',
              fontSize: '9px',
              marginLeft: '4px',
              fontWeight: 'bold'
            }}>
              XML
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="lj-box">
        <div className="lj-box-header">Navigation</div>
        <div className="lj-box-content">
          <div style={{ lineHeight: '1.6' }}>
            <div><Link href="/">Home</Link></div>
            <div><Link href="/random">Random</Link></div>
            <div><Link href="/search">Search</Link></div>
            <div><Link href="/directory">Directory</Link></div>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="lj-box">
        <div className="lj-box-header">Help</div>
        <div className="lj-box-content">
          <div style={{ lineHeight: '1.6' }}>
            <div><Link href="/about">About</Link></div>
            <div><Link href="/faq">FAQ</Link></div>
            <div><Link href="/help">How To</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Run dev server to verify**

```bash
npm run dev
```

Visit http://localhost:3000 and confirm sidebar shows real numbers (likely 0s or small numbers).

**Step 3: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: update Sidebar to use real stats from database"
```

---

## Task 3: Create Feature Box Icons (SVGs)

**Files:**
- Create: `public/icons/community.svg`
- Create: `public/icons/content.svg`
- Create: `public/icons/connect.svg`
- Create: `public/icons/journal.svg`

**Step 1: Create icons directory**

```bash
mkdir -p public/icons
```

**Step 2: Create community.svg (people figures)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <!-- Background circle -->
  <circle cx="32" cy="32" r="30" fill="#C5D9E8" stroke="#6699CC" stroke-width="2"/>
  <!-- Person 1 (left) -->
  <circle cx="20" cy="22" r="6" fill="#6699CC"/>
  <path d="M12 42 Q12 32 20 32 Q28 32 28 42" fill="#6699CC"/>
  <!-- Person 2 (right) -->
  <circle cx="44" cy="22" r="6" fill="#4A6B8A"/>
  <path d="M36 42 Q36 32 44 32 Q52 32 52 42" fill="#4A6B8A"/>
  <!-- Speech bubbles -->
  <ellipse cx="32" cy="50" rx="12" ry="6" fill="#FFFFFF" stroke="#6699CC" stroke-width="1"/>
  <text x="32" y="53" text-anchor="middle" font-size="8" fill="#6699CC">...</text>
</svg>
```

**Step 3: Create content.svg (document with star)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <!-- Background circle -->
  <circle cx="32" cy="32" r="30" fill="#C5D9E8" stroke="#6699CC" stroke-width="2"/>
  <!-- Document -->
  <rect x="18" y="12" width="28" height="36" fill="#FFFFFF" stroke="#6699CC" stroke-width="2"/>
  <rect x="18" y="12" width="28" height="8" fill="#6699CC"/>
  <!-- Lines on document -->
  <line x1="22" y1="28" x2="42" y2="28" stroke="#C5D9E8" stroke-width="2"/>
  <line x1="22" y1="34" x2="38" y2="34" stroke="#C5D9E8" stroke-width="2"/>
  <line x1="22" y1="40" x2="40" y2="40" stroke="#C5D9E8" stroke-width="2"/>
  <!-- Star -->
  <polygon points="50,8 52,14 58,14 53,18 55,24 50,20 45,24 47,18 42,14 48,14" fill="#FFCC00" stroke="#FF9900" stroke-width="1"/>
</svg>
```

**Step 4: Create connect.svg (envelope with bubbles)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <!-- Background circle -->
  <circle cx="32" cy="32" r="30" fill="#C5D9E8" stroke="#6699CC" stroke-width="2"/>
  <!-- Envelope -->
  <rect x="12" y="22" width="32" height="24" fill="#FFFFFF" stroke="#6699CC" stroke-width="2"/>
  <polyline points="12,22 28,36 44,22" fill="none" stroke="#6699CC" stroke-width="2"/>
  <!-- IM bubble -->
  <rect x="40" y="12" width="16" height="12" rx="2" fill="#4A6B8A"/>
  <polygon points="42,24 46,24 44,28" fill="#4A6B8A"/>
  <text x="48" y="20" text-anchor="middle" font-size="8" fill="#FFFFFF">IM</text>
  <!-- SMS indicator -->
  <circle cx="52" cy="42" r="8" fill="#6699CC"/>
  <text x="52" y="45" text-anchor="middle" font-size="7" fill="#FFFFFF">@</text>
</svg>
```

**Step 5: Create journal.svg (pencil and diary)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <!-- Background circle -->
  <circle cx="32" cy="32" r="30" fill="#C5D9E8" stroke="#6699CC" stroke-width="2"/>
  <!-- Book/diary -->
  <rect x="16" y="14" width="26" height="36" fill="#4A6B8A" stroke="#314D6B" stroke-width="2"/>
  <rect x="20" y="14" width="22" height="36" fill="#FFFFFF" stroke="#6699CC" stroke-width="1"/>
  <!-- Book spine lines -->
  <line x1="18" y1="18" x2="18" y2="46" stroke="#314D6B" stroke-width="1"/>
  <!-- Lines on page -->
  <line x1="24" y1="22" x2="38" y2="22" stroke="#C5D9E8" stroke-width="1"/>
  <line x1="24" y1="28" x2="38" y2="28" stroke="#C5D9E8" stroke-width="1"/>
  <line x1="24" y1="34" x2="36" y2="34" stroke="#C5D9E8" stroke-width="1"/>
  <!-- Pencil -->
  <rect x="44" y="10" width="6" height="30" fill="#FFCC00" stroke="#CC9900" stroke-width="1" transform="rotate(25 47 25)"/>
  <polygon points="44,40 47,48 50,40" fill="#FFE4C4" stroke="#CC9900" stroke-width="1" transform="rotate(25 47 44)"/>
  <rect x="44" y="8" width="6" height="4" fill="#FF6699" stroke="#CC3366" stroke-width="1" transform="rotate(25 47 10)"/>
</svg>
```

**Step 6: Commit icons**

```bash
git add public/icons/
git commit -m "feat: add era-authentic feature box icons"
```

---

## Task 4: Add Green CTA Button Styles

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add green CTA button styles**

Add at the end of the file, before the last closing comment:

```css
/* ═══════════════════════════════════════════════════════════════════════════
   GREEN CTA BUTTON - For signup/create actions
   ═══════════════════════════════════════════════════════════════════════════ */

.lj-button-cta {
  background: linear-gradient(to bottom, #6DB356 0%, #5B9A47 100%);
  border: 1px solid #4A8A3A;
  color: white !important;
  font-weight: bold;
  padding: 10px 28px;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
  text-shadow: 0 1px 1px rgba(0,0,0,0.2);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
}

.lj-button-cta:hover {
  background: linear-gradient(to bottom, #5B9A47 0%, #4A8A3A 100%);
  border-color: #3A7A2A;
  color: white !important;
}

.lj-button-cta:active {
  background: linear-gradient(to bottom, #4A8A3A 0%, #3A7A2A 100%);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE BOXES - For homepage feature highlights
   ═══════════════════════════════════════════════════════════════════════════ */

.lj-feature-boxes {
  display: flex;
  justify-content: space-around;
  gap: 10px;
  margin: 15px 0;
  flex-wrap: wrap;
}

.lj-feature-box {
  text-align: center;
  padding: 10px;
  flex: 1;
  min-width: 100px;
  max-width: 140px;
}

.lj-feature-box img {
  width: 64px;
  height: 64px;
  margin-bottom: 8px;
}

.lj-feature-box-label {
  font-size: 10px;
  font-weight: bold;
  color: var(--lj-text);
}

/* ═══════════════════════════════════════════════════════════════════════════
   WELCOME HERO - For public homepage
   ═══════════════════════════════════════════════════════════════════════════ */

.lj-welcome-hero {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 15px;
}

.lj-welcome-text {
  flex: 1;
}

.lj-welcome-text h2 {
  font-size: 18px;
  margin: 0 0 10px 0;
  color: var(--lj-text);
}

.lj-welcome-text p {
  font-size: 11px;
  line-height: 1.5;
  margin: 0 0 15px 0;
}

.lj-welcome-cta {
  text-align: center;
  padding: 15px;
  background: var(--lj-content-bg);
  border: 1px solid var(--lj-box-border);
}

.lj-welcome-cta-subtitle {
  font-size: 10px;
  color: var(--lj-text-gray);
  margin-top: 8px;
}
```

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add green CTA button and feature box styles"
```

---

## Task 5: Create PublicHomepage Component

**Files:**
- Create: `src/components/PublicHomepage.tsx`

**Step 1: Create the PublicHomepage component**

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { getStats } from '@/lib/actions/stats';
import { getRecentPublicEntries } from '@/lib/actions/journal';

export async function PublicHomepage() {
  const [stats, { entries }] = await Promise.all([
    getStats(),
    getRecentPublicEntries(5)
  ]);

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

      {/* Recent Posts */}
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
            <Link href="/recent" className="text-small">View all recent posts</Link>
          </div>
        </div>
      </div>

      {/* Site Stats */}
      <div className="lj-box">
        <div className="lj-box-header">Site Stats</div>
        <div className="lj-box-content">
          <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Total Users:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.totalUsers.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Active Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.activeToday.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Posts Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.postsToday.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Comments Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.commentsToday.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
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
```

**Step 2: Commit**

```bash
git add src/components/PublicHomepage.tsx
git commit -m "feat: add PublicHomepage component with real stats and feature boxes"
```

---

## Task 6: Create AuthenticatedHomepage Component

**Files:**
- Create: `src/components/AuthenticatedHomepage.tsx`

**Step 1: Create the component (refactored from current page.tsx)**

```typescript
import Link from 'next/link';
import { getStats } from '@/lib/actions/stats';
import { getRecentPublicEntries } from '@/lib/actions/journal';

export async function AuthenticatedHomepage() {
  const [stats, { entries }] = await Promise.all([
    getStats(),
    getRecentPublicEntries(5)
  ]);

  return (
    <div>
      {/* Welcome Header */}
      <div className="lj-profile-header" style={{ marginBottom: '10px' }}>
        <div className="lj-profile-title">
          <h1 style={{ margin: 0 }}>Welcome to MyJournal</h1>
        </div>
        <div className="lj-profile-content">
          <p style={{ margin: 0 }}>
            A place to share your thoughts, connect with friends, and keep a personal journal online.
          </p>
        </div>
      </div>

      {/* Quick Actions for logged-in users */}
      <div className="lj-box">
        <div className="lj-box-header">Quick Actions</div>
        <div className="lj-box-content">
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/update" className="lj-button lj-button-primary">
              Post New Entry
            </Link>
            <Link href="/friends" className="lj-button">
              Friends Feed
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
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
            <Link href="/recent" className="text-small">View all recent posts</Link>
          </div>
        </div>
      </div>

      {/* Site Stats */}
      <div className="lj-box">
        <div className="lj-box-header">Site Stats</div>
        <div className="lj-box-content">
          <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Total Users:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.totalUsers.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Active Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.activeToday.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Posts Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.postsToday.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}><strong>Comments Today:</strong></td>
                <td style={{ padding: '2px 4px', textAlign: 'right' }}>{stats.commentsToday.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
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
```

**Step 2: Commit**

```bash
git add src/components/AuthenticatedHomepage.tsx
git commit -m "feat: add AuthenticatedHomepage component with real stats"
```

---

## Task 7: Update page.tsx with Auth Routing

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace page.tsx with auth-aware routing**

```typescript
import { auth } from '@clerk/nextjs/server';
import { PublicHomepage } from '@/components/PublicHomepage';
import { AuthenticatedHomepage } from '@/components/AuthenticatedHomepage';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    return <AuthenticatedHomepage />;
  }

  return <PublicHomepage />;
}
```

**Step 2: Run dev server and test both states**

```bash
npm run dev
```

Test:
1. Visit http://localhost:3000 while logged out - should see PublicHomepage
2. Log in - should see AuthenticatedHomepage
3. Verify stats show real numbers in both views

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add auth-aware homepage routing"
```

---

## Task 8: Final Testing and Verification

**Step 1: Run the build to check for errors**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Run existing tests**

```bash
npm test
```

Expected: All existing tests pass.

**Step 3: Manual verification checklist**

- [ ] Logged-out homepage shows welcome message and feature boxes
- [ ] Green "Create a Journal" button displays correctly
- [ ] Feature icons render (check Network tab if not)
- [ ] Stats show real numbers (0 is fine for empty database)
- [ ] Logged-in homepage shows Quick Actions
- [ ] Sidebar stats update to real numbers
- [ ] All links work correctly

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: public homepage and real stats implementation complete"
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/actions/stats.ts` | Create | Real database stats with 60s cache |
| `src/components/Sidebar.tsx` | Modify | Fetch real stats |
| `public/icons/*.svg` | Create | 4 era-authentic feature icons |
| `src/app/globals.css` | Modify | Green CTA + feature box styles |
| `src/components/PublicHomepage.tsx` | Create | Logged-out homepage |
| `src/components/AuthenticatedHomepage.tsx` | Create | Logged-in homepage |
| `src/app/page.tsx` | Modify | Auth-aware routing |

---

*Plan created: 2026-01-19*
