# Profile Page Redesign

**Date:** 2026-01-19
**Status:** Ready for implementation

---

## Overview

Redesign the profile page to match the authentic LiveJournal 2003 aesthetic with collapsible sections, add new profile fields (name, birthday, location, website, contact, social links), create a global UsernameLink component with the userinfo icon, and separate view/edit into distinct pages.

---

## 1. Database Schema Changes

**Add to User model in `prisma/schema.prisma`:**

```prisma
model User {
  // ... existing fields ...

  // New profile fields
  name         String?   // Full name (separate from displayName)
  birthday     DateTime?
  location     String?
  website      String?   // Personal website URL
  contactEmail String?   // Optional public contact email
  socialLinks  String?   // JSON string for social handles
}
```

**Social links JSON structure:**
```typescript
type SocialLinks = {
  twitter?: string;    // Twitter/X handle (without @)
  instagram?: string;  // Instagram handle (without @)
  bluesky?: string;    // Bluesky handle
  customUrl?: string;  // Any custom URL
  customLabel?: string; // Label for custom URL (e.g., "Portfolio")
}
```

---

## 2. UsernameLink Component

**File:** `src/components/UsernameLink.tsx`

**Purpose:** Reusable component displaying userinfo icon + username, linked to user's journal.

**Props:**
```typescript
type Props = {
  username: string;
  displayName?: string;
  showIcon?: boolean;  // default true
  className?: string;
}
```

**Renders:**
```html
<a href="/journal/{username}" class="username-link">
  <img src="/icons/userinfo.svg" alt="" class="userinfo-icon" />
  {displayName || username}
</a>
```

**CSS:**
```css
.userinfo-icon {
  width: 16px;
  height: 16px;
  margin-right: 2px;
  vertical-align: middle;
  display: inline;
}

.username-link {
  color: var(--lj-link);
  text-decoration: none;
}

.username-link:hover {
  text-decoration: underline;
}
```

**Usage locations:**
- TopBar.tsx (logged in as)
- UserSidebar.tsx (user display)
- EntryCard.tsx (author)
- CommentThread.tsx (commenter)
- Profile pages (header)
- PublicHomepage/AuthenticatedHomepage (recent posts)

---

## 3. Profile Page (View-Only)

**URL:** `/profile` (redirects to `/profile/[username]` for current user)

**File:** `src/app/profile/[username]/page.tsx`

**Sections (collapsible with triangles):**

### Header Section
- Userinfo icon + username
- Userpic (left)
- Display name, @username
- Member since date
- Entry count, comment count
- "Add Friend" button (for other users)
- "Edit Profile" link (for own profile)

### Basic Info Section (▼ collapsible)
Two-column layout:
- Left: Name, Birthday, Location, Website
- Right: Contact email

### Bio Section (▼ collapsible)
- User's bio text

### Connect Section (▼ collapsible)
- Twitter/X (with icon)
- Instagram (with icon)
- Bluesky (with icon)
- Custom link (with label)

**Collapsible sections CSS:**
```css
.lj-section-header {
  cursor: pointer;
  font-weight: bold;
  padding: 4px 0;
  border-bottom: 1px solid var(--lj-box-border);
}

.lj-section-header::before {
  content: "▼ ";
  font-size: 10px;
}

.lj-section-header.collapsed::before {
  content: "▶ ";
}

.lj-section-content {
  padding: 8px 0;
}

.lj-section-content.collapsed {
  display: none;
}
```

---

## 4. Edit Profile Page

**URL:** `/profile/edit`

**File:** `src/app/profile/edit/page.tsx`

**Form sections:**

### Basic Info
- Display Name (text, required, max 50)
- Full Name (text, optional, max 100)
- Birthday (date input, optional)
- Location (text, optional, max 100)
- Website (url input, optional)

### Contact & Social
- Contact Email (email input, optional)
- Twitter/X handle (text, optional)
- Instagram handle (text, optional)
- Bluesky handle (text, optional)
- Custom Link URL (url input, optional)
- Custom Link Label (text, optional, max 50)

### Bio
- Bio (textarea, optional, max 500)

### Userpic
- Current userpic preview
- Upload new / Delete buttons

**Buttons:**
- Save Changes (primary)
- Cancel (returns to /profile)

---

## 5. Files to Create

| File | Purpose |
|------|---------|
| `src/components/UsernameLink.tsx` | Reusable username + icon |
| `src/app/profile/[username]/page.tsx` | View any user's profile |
| `src/app/profile/edit/page.tsx` | Edit own profile |

---

## 6. Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add 6 new User fields |
| `src/app/profile/page.tsx` | Redirect to /profile/[username] |
| `src/lib/actions/profile.ts` | Handle new fields in getProfile/updateProfile |
| `src/components/TopBar.tsx` | Use UsernameLink |
| `src/components/UserSidebar.tsx` | Use UsernameLink |
| `src/components/EntryCard.tsx` | Use UsernameLink |
| `src/components/CommentThread.tsx` | Use UsernameLink |
| `src/app/globals.css` | Add collapsible section styles |

---

## 7. Implementation Order

1. Add new fields to Prisma schema
2. Run database migration
3. Create UsernameLink component + CSS
4. Update profile actions for new fields
5. Create /profile/[username] view page
6. Create /profile/edit page
7. Update /profile/page.tsx to redirect
8. Update TopBar, UserSidebar, EntryCard, CommentThread to use UsernameLink
9. Test end-to-end

---

## 8. Success Criteria

- [ ] New profile fields save and display correctly
- [ ] Userinfo icon appears next to all usernames
- [ ] Collapsible sections work (click to toggle)
- [ ] View profile shows all info in LJ-style layout
- [ ] Edit profile form validates and saves
- [ ] Add Friend button appears on other users' profiles
- [ ] Social links display with appropriate formatting

---

*Design validated: 2026-01-19*
