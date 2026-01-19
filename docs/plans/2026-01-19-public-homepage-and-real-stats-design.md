# Public Homepage & Real Stats System Design

**Date:** 2026-01-19
**Status:** Ready for implementation
**Target:** Beta launch this week

---

## Overview

Create a public homepage for logged-out users that matches the authentic LiveJournal 2003 aesthetic, implement real database-driven stats throughout the site, and set up production infrastructure (Vercel Postgres + Vercel Blob) for beta launch.

---

## 1. Homepage Architecture

### Two Distinct Experiences

**Public Homepage** (`/` when logged out):
- New welcome page with signup/login CTAs
- Feature boxes highlighting MyJournal benefits
- Recent public posts
- Real site statistics

**Authenticated Homepage** (`/` when logged in):
- Keep current homepage as-is
- Update stats to use real data

### Implementation

Modify `src/app/page.tsx` to check auth state and render appropriate component:
- `PublicHomepage.tsx` - new component for logged-out users
- `AuthenticatedHomepage.tsx` - refactored current homepage

---

## 2. Public Homepage Design

### Hero Section

**Headline:** "Welcome to MyJournal"

**Copy:**
> MyJournal lets you express yourself, share your life, and connect with friends online. You can use MyJournal in many different ways: as a private journal, a blog, a discussion forum, a social network, and more.

**Primary CTA:**
- Green button: "Create a Journal"
- Subtext: "Joining MyJournal is completely free."

### Feature Boxes (4 icons with labels)

| Feature | Icon Description |
|---------|------------------|
| True Community | Group of people figures with speech bubbles |
| Content You Care About | Document/page with star |
| Staying in Touch | Envelope with IM/SMS bubbles |
| Your Personal Journal | Pencil writing in diary |

Icons should be SVG in early 2000s clipart style - friendly, simple, with subtle gradients.

### Additional Sections

- **Recent Posts:** Latest public entries (existing functionality)
- **Site Stats:** Real database-driven statistics
- **Footer:** About, FAQ, Support links

### Sidebar

- Welcome box with Login/Create Account buttons
- Calendar (existing, "coming soon" state)
- User Stats (real data)
- Live Post Stats (real data)
- Navigation links
- Help links

---

## 3. Real Stats System

### Stats to Implement

| Stat | Query Logic | Display Location |
|------|-------------|------------------|
| Total Users | `COUNT(*) FROM User` | Sidebar, Site Stats |
| Active Users | Users with entries in last 30 days | Sidebar |
| Active Today | Users with entries today (midnight to now) | Site Stats |
| Posts Today | Entries created today | Site Stats |
| Comments Today | Comments created today | Site Stats |
| Posts Per Hour | Entries in last 60 minutes | Sidebar |
| Posts Per Minute | Entries in last 5 minutes ÷ 5 (rolling avg) | Sidebar |

### Implementation

Create `src/lib/actions/stats.ts`:

```typescript
export async function getStats() {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Parallel queries for performance
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
    prisma.user.count({ where: { entries: { some: { createdAt: { gte: thirtyDaysAgo } } } } }),
    prisma.user.count({ where: { entries: { some: { createdAt: { gte: todayStart } } } } }),
    prisma.entry.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.comment.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.entry.count({ where: { createdAt: { gte: oneHourAgo } } }),
    prisma.entry.count({ where: { createdAt: { gte: fiveMinutesAgo } } })
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
```

Use Next.js caching with 60-second revalidation for performance.

---

## 4. Visual Design (2003 Authentic Aesthetic)

### Color Palette

```css
:root {
  --lj-header-blue: #789;
  --lj-accent-blue: #6699CC;
  --lj-box-bg: #C8D7E3;
  --lj-cta-green: #5B9A47;
  --lj-cta-green-hover: #4A8A3A;
  --lj-orange-accent: #FF6600;
}
```

### Typography

- Headers: Trebuchet MS, Verdana
- Body: Verdana, Georgia
- Small text: 10px-11px (era-authentic)

### Button Styles

**Green CTA Button:**
```css
.lj-button-cta {
  background: linear-gradient(to bottom, #6DB356, #5B9A47);
  border: 1px solid #4A8A3A;
  color: white;
  font-weight: bold;
  padding: 8px 24px;
  border-radius: 4px;
  text-shadow: 0 1px 1px rgba(0,0,0,0.2);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
}
```

### Feature Box Icons

Create 4 SVG icons in `/public/icons/`:
- `community.svg` - people figures
- `content.svg` - document with star
- `connect.svg` - envelope with bubbles
- `journal.svg` - pencil and diary

Style: Early 2000s corporate clipart aesthetic with subtle gradients, friendly/approachable feel.

---

## 5. Production Infrastructure

### Database: Vercel Postgres

**Schema changes in `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

**Environment variables for production:**
```
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
```

**Local development:** Keep SQLite with separate `.env` file.

### File Storage: Vercel Blob

**Package:** `@vercel/blob`

**Environment variable:**
```
BLOB_READ_WRITE_TOKEN=
```

**Upload implementation:**
```typescript
import { put, del } from '@vercel/blob';

export async function uploadUserpic(file: File, userId: string) {
  const blob = await put(`userpics/${userId}/${file.name}`, file, {
    access: 'public',
  });
  return blob.url;
}
```

Update userpic upload action to use Vercel Blob instead of local filesystem.

---

## 6. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/components/PublicHomepage.tsx` | Public homepage component |
| `src/components/AuthenticatedHomepage.tsx` | Logged-in homepage component |
| `src/components/FeatureBoxes.tsx` | 4 feature boxes with icons |
| `src/components/SiteStats.tsx` | Real stats display component |
| `src/lib/actions/stats.ts` | Database queries for stats |
| `public/icons/community.svg` | Feature icon |
| `public/icons/content.svg` | Feature icon |
| `public/icons/connect.svg` | Feature icon |
| `public/icons/journal.svg` | Feature icon |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/page.tsx` | Auth check, route to correct homepage |
| `src/components/Sidebar.tsx` | Fetch real stats, remove hardcoded values |
| `prisma/schema.prisma` | Change provider to postgresql |
| `src/lib/actions/upload.ts` | Switch to Vercel Blob |
| `src/app/globals.css` | Add green CTA button styles |

---

## 7. Manual Setup Steps (Before Implementation)

1. **Vercel Postgres:**
   - Go to Vercel Dashboard → Storage → Create Database → Postgres
   - Copy connection strings to environment variables

2. **Vercel Blob:**
   - Go to Vercel Dashboard → Storage → Create Store → Blob
   - Copy token to environment variables

3. **Environment Variables:**
   - Add to Vercel project settings
   - Add to local `.env.local` for testing

4. **Database Migration:**
   - Run `npx prisma migrate dev` after schema change
   - Run `npx prisma db push` for production

---

## 8. Success Criteria

- [ ] Logged-out users see public homepage with signup CTAs
- [ ] Logged-in users see current homepage experience
- [ ] All stats display real database values (no hardcoded numbers)
- [ ] Stats refresh appropriately (60-second cache)
- [ ] Feature boxes display with era-authentic icons
- [ ] Green "Create a Journal" CTA is prominent and functional
- [ ] Production database (Vercel Postgres) is operational
- [ ] Userpic uploads work via Vercel Blob
- [ ] Design matches authentic 2003 LiveJournal aesthetic

---

## Implementation Order

1. Set up Vercel Postgres and Blob (manual)
2. Update Prisma schema for PostgreSQL
3. Create stats actions with real queries
4. Update Sidebar with real stats
5. Create feature box icons (SVG)
6. Build PublicHomepage component
7. Refactor page.tsx with auth routing
8. Update userpic upload for Vercel Blob
9. Test end-to-end on Vercel preview
10. Deploy to production

---

*Design validated: 2026-01-19*
