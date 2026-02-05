# User Onboarding Flow

This document explains the user onboarding flow in OptStuff Dashboard.

## Overview

When a new user signs up for OptStuff, they must create a **personal team** before accessing the dashboard. This team serves as their default workspace for managing projects and API keys.

## Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER ONBOARDING FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   User       │
                              │   Sign Up    │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  Clerk Auth  │
                              │  (External)  │
                              └──────┬───────┘
                                     │
                                     ▼
                       ┌─────────────────────────────┐
                       │  Has personal team already? │
                       └─────────────┬───────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │ NO                          YES │
                    ▼                                 ▼
           ┌────────────────┐                ┌────────────────┐
           │   /onboarding  │                │   /[team]      │
           │   page         │                │   dashboard    │
           └───────┬────────┘                └────────────────┘
                   │
                   ▼
           ┌────────────────┐
           │  User enters:  │
           │  - Team name   │
           │  - Team slug   │
           └───────┬────────┘
                   │
                   ▼
           ┌────────────────┐
           │  Validate &    │
           │  Check slug    │
           │  availability  │
           └───────┬────────┘
                   │
                   ▼
           ┌────────────────┐
           │ Create personal│
           │ team in DB     │
           └───────┬────────┘
                   │
                   ▼
           ┌────────────────┐
           │  Redirect to   │
           │  /[team-slug]  │
           └────────────────┘
```

## Key Concepts

### Personal Team

| Property | Description |
|----------|-------------|
| Unique per user | Each user has exactly **one** personal team |
| Required | Users cannot access the dashboard without a personal team |
| Non-deletable | Personal teams cannot be deleted |
| Extensible | Users can create additional (non-personal) teams later |

### Team Slug

The slug is the URL identifier for a team (e.g., `optstuff.com/my-team`).

| Rule | Description |
|------|-------------|
| Length | 3–50 characters |
| Characters | Lowercase letters (`a-z`), numbers (`0-9`), hyphens (`-`) |
| Format | Must start and end with a letter or number |
| Uniqueness | Globally unique across all teams |

## User Journey

### 1. Sign Up / Sign In

User authenticates via Clerk (email, Google, GitHub, etc.).

### 2. Redirect Decision

After authentication, the system checks if the user has a personal team:

- **No personal team** → Redirect to `/onboarding`
- **Has personal team** → Redirect to `/[team-slug]` dashboard

### 3. Onboarding Page

The onboarding page:

1. Pre-fills a suggested team name based on user profile (e.g., "John's Team")
2. Auto-generates a slug from the team name
3. Shows real-time slug availability feedback
4. Provides a "randomize" button for generating a random slug

### 4. Team Creation

When the user submits the form:

1. Validates team name (1–255 characters)
2. Validates slug format and length
3. Checks slug availability (must be unique)
4. Creates the personal team record in database
5. Redirects to the new team's dashboard

## Error Scenarios

| Scenario | Behavior |
|----------|----------|
| Slug already taken | Show error, user must choose different slug |
| Invalid slug format | Show validation error with format requirements |
| User already has personal team | Redirect to existing team (shouldn't happen normally) |
| Network error | Show generic error, allow retry |

## Related Files

| File | Purpose |
|------|---------|
| `src/app/onboarding/page.tsx` | Onboarding page component |
| `src/modules/onboarding/ui/components/onboarding-form.tsx` | Form with validation and submission |
| `src/server/api/routers/team.ts` | Backend team creation logic |
| `src/lib/slug.ts` | Slug generation utilities |
| `src/app/[team]/page.tsx` | Team page with redirect logic |

## Database Constraints

The `teams` table enforces:

1. **Unique slug** — No two teams can have the same slug
2. **One personal team per user** — Partial unique index on `(ownerId)` where `isPersonal = true`

---

## Related Documentation

- [Authentication](../service/authentication.md) — Request authentication flow
- [Access Control](../system-design/access-control.md) — Team and project permissions
