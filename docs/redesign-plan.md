# SkillBridge — Redesign Plan

Audit date: 17 Nov 2026. Scope: product, codebase, database, security, UI/UX and functionality audit of SkillBridge, and a blueprint for a second-pass implementation.
No application code or production data was changed. The only file added is this one.

---

## 1. Summary

SkillBridge's purpose is free, reciprocal, one-to-one skill exchange: I teach you something, you teach me something, no money.

The live app does not yet deliver that loop. Sign-up, profile editing and realtime chat work. The three things that make it a skill *exchange* do not:

- **Matching does not match.** The Matches page lists the first 20 profiles in the table, whatever their skills.
- **Nobody can propose a swap to a person.** There is no "send request" button anywhere. All 6 requests in the database are "open" requests with no recipient, and no screen shows them to anyone but their author.
- **Sessions are unreachable.** `/sessions` renders a blank page, and the booking page is not linked from anywhere.

There are also three verified security problems: logged-out visitors can read every profile, every user's skills and every swap request including its personal message; the avatar bucket can be listed anonymously; and `.env` is committed to the public GitHub repo.

The recommended redesign makes the **Swap** the central object. A swap is one agreement between two people ("I teach you Python, you teach me Guitar"). Its page holds the chat, the sessions and the progress for that agreement. Everything else in the app exists to get people into a swap or to keep one going.

The largest product risk is not technical. Of 136 possible pairs among the 17 users who have skills, only 3 are reciprocal matches. Strict two-way matching alone will show most users an empty page, so the plan adds labelled one-way matches and an Asks board.

---

## 2. How this audit was done

| Evidence | What it covers | Limits |
|---|---|---|
| Local source (≈10k lines outside generated `ui/`) | All pages, services, hooks, contexts | Local folder is not a git repo. File list matches GitHub `main` (132 files, last push 17 May 2026); size differences are consistent with line endings, not verified byte by byte |
| `basic_context.txt` (the Cursor master prompt) | Intended product spec | — |
| `SkillBridge_Project_Report.docx` | College report | Chapters 3–10 describe a different system, see §3.3 |
| Live site, logged out | Landing, login, redirects, dead routes | **No logged-in testing.** No test account was available and creating one would write to production |
| Supabase REST, read-only, using the app's own public key | Table list, columns, row counts, what an anonymous visitor can read, auth settings, bucket listing | **RLS policies, functions, triggers, indexes and constraints were not inspected.** The SkillBridge project (`kzqyampibniceydwmzby`) is not in the Supabase account connected to this session |
| Web research | Comparable platforms, time-bank failure modes, Supabase security guidance | Thin. Three searches, mostly vendor blogs and small studies. Treated as supporting, not decisive |

Labels used below: **Verified** (observed directly), **Code** (read in source, not executed), **Assumed** (inferred, needs checking).

---

## 3. Findings

### 3.1 Production data snapshot (Verified, anonymous read, aggregates only)

| Measure | Value |
|---|---|
| Profiles | 25 (created 10 Apr – 30 Jun 2026) |
| Onboarding completed | 20 yes, 5 no |
| Profiles with a name / bio / headline | 18 / 8 / 1 |
| Avatars | 11 Google URLs, 4 uploaded files |
| Canonical skills | 119, no case or whitespace duplicates |
| User skills | 40 rows (19 teach, 21 learn) across 17 users. All 40 have `level = null` |
| Onboarded users with zero skills | 3 |
| Reciprocal pairs / one-way pairs | 3 / 13, out of 136 possible pairs |
| Users listing the same skill as teach and learn | 1 |
| Swap requests | 6, all `pending`, all with `receiver_id = null`, none with skill IDs |
| Conversations, messages, sessions | 0 rows visible anonymously. Whether any exist is unknown |
| Tables that do not exist | `notifications`, `reviews`, `skill_categories`, `portfolio_items`, `session_confirmations` |
| Auth | Email confirmation on, Google enabled, sign-up open |

### 3.2 Security findings

| # | Severity | Finding | Status |
|---|---|---|---|
| S1 | High | Anonymous visitors can read all rows of `profiles`, `user_skills` and `swap_requests`, including request messages. The landing page depends on this for its stats | Verified |
| S2 | Medium | Anonymous visitors can list files in the `avatars` bucket | Verified |
| S3 | Medium | `.env` is committed to the public repo (since 10 Apr 2026) although `.gitignore` lists it. The key is a publishable key, so impact is low, but it shows secrets are not being kept out of git | Verified |
| S4 | High | Any member can open a conversation with any other member. The spec requires an accepted request first. `getOrCreateConversation` inserts directly | Code. DB enforcement unknown |
| S5 | High | Every business rule lives in React. Accept, reject, edit and delete are plain table writes by ID with no role check in the client. Safety depends entirely on RLS that was not inspected | Code |
| S6 | Medium | `NotificationPanel` subscribes to every `messages` insert and filters by recipient in the browser. If message RLS is loose, other people's messages reach the client | Code. Depends on RLS |
| S7 | Medium | Account deletion deletes the profile row first, then calls a `delete_user` RPC that may not exist. If it is missing, the auth user survives with no profile. The suggested function in the code comment has no `search_path` | Code |
| S8 | Low | `?user=` and route IDs are interpolated into PostgREST `.or()` filter strings without validating they are UUIDs | Code |
| S9 | Low | `messages.ts` logs message content and user IDs to the browser console | Code |
| S10 | Low | Onboarding is not enforced. `AppLayout` checks only for a session, `useOnboarding` is never called, and the fallbacks treat errors as "completed" | Code. Consistent with 5 un-onboarded and 3 skill-less profiles |
| S11 | Low | No security headers or CSP in `vercel.json` | Verified |

### 3.3 Documentation versus reality

Three documents describe three different products.

- **`basic_context.txt`** describes the Supabase app that was actually attempted. It is the right baseline.
- **`README.md`** claims working matching, session scheduling and notifications. Those claims are not true of the deployed app.
- **The college report** contradicts itself. Chapter 1 describes the Supabase app and lists video calls and scheduling as out of scope. Chapters 3–10 describe an Express, Redis, Socket.IO and WebRTC system with a credit economy, admin dashboard, leaderboard, badges, email notifications, a blue-and-white Inter theme and 58 passing tests. None of that exists in the repository. Its "objectives achieved" list should not be used as a source of requirements.

### 3.4 Feature matrix

Status values: Working, Partial, Broken, UI-only, Missing.

| Area | Feature | Status | Evidence |
|---|---|---|---|
| Auth | Email sign-up | Partial | Works, but the Full Name field is collected and thrown away (`signUp` sends only email and password). No special-character rule, no college field, no `emailRedirectTo` (Code) |
| Auth | Email confirmation screen | Working | Code. Confirmation is on (Verified) |
| Auth | Login | Working | Code. Not exercised live |
| Auth | "Remember me" | UI-only | State is never read (Code) |
| Auth | Google sign-in | Working | Provider enabled, 11 profiles carry Google avatars (Verified) |
| Auth | Forgot password | Broken | Link goes to `/forgot-password`, which has no route and renders a blank page (Verified) |
| Auth | Logout | Working | Code |
| Auth | Protected routes | Working | `/dashboard` redirects to `/login` when logged out (Verified) |
| Auth | Onboarding gate | Partial | See S10 |
| Auth | Unknown URLs | Broken | No catch-all route. Blank page (Verified) |
| Onboarding | Teach and learn skills, bio | Partial | Saves, but a skill not in the `skills` table is silently dropped. No levels, location, photo, objectives (Code) |
| Onboarding | "Start matching / skip" page with animation | Missing | — |
| Profile | Edit name, headline, bio, avatar | Working | Code. 4 uploaded avatars exist (Verified) |
| Profile | Edit skills | Partial | Delete-all-then-insert, not atomic. A failure between the two steps wipes the user's skills (Code) |
| Profile | Skill levels | Missing | Column exists, never written (Verified) |
| Profile | Add a new skill | Missing | Only existing skills selectable |
| Profile | Location, college, objectives, GitHub, LinkedIn | Missing | Columns do not exist (Verified) |
| Profile | Portfolio | Missing | No table |
| Profile | Public profile view | Working | `/profile/:id` (Code). `MatchProfile.tsx` is an orphaned duplicate |
| Matching | Reciprocal matching | Broken | Returns the first N profiles. "Teach matches" is the other person's skill count, not overlap. `score` is hard-coded 0 (Code) |
| Matching | Search | Partial | Client-side filter over those 20 rows only |
| Matching | Filters and categories | UI-only | `FilterDrawer` exists and is imported nowhere |
| Requests | Propose a swap to a person | Missing | No entry point. The only code path is the unlinked `/schedule/:id` |
| Requests | Open request | UI-only in effect | Saves, but only the author can ever see it (Code plus data: 6 of 6) |
| Requests | Accept and decline | Partial | Code exists. No request has ever had a recipient, so it has never run in production (Verified data) |
| Requests | Cancel | Partial | Hard-deletes the row. No `cancelled` status |
| Requests | Skill validation, duplicate prevention | Missing | Skills are free text. No checks |
| Requests | Conversation created on acceptance | Missing | Chat and requests are unrelated |
| Chat | Conversation list, send, realtime, unread badge | Working | Code. Not exercised live |
| Chat | Gated behind an accepted swap | Missing | See S4 |
| Chat | Pagination | Missing | Loads every message of every conversation to build the list |
| Chat | Phone, video and menu buttons | UI-only | No handlers |
| Sessions | Sessions list | Broken | Not registered in `App.tsx`. `/sessions` is blank (Verified). `routes.tsx`, which does list it, is dead code |
| Sessions | Booking | Broken | Unlinked. Offers hard-coded slots on the next five weekdays, invents a swap request from each user's first skill, stores date and time with no timezone, then redirects to the dashboard |
| Sessions | Mutual confirmation | Partial | Accept and decline code exists on the unrouted page |
| Sessions | Join session | UI-only | Button has no action |
| Dashboard | Stats | Partial | Real queries, wrong meaning. "Active Requests" counts every request ever sent. "Total Chats" and "Connections" are the same number |
| Dashboard | Matches, sessions, activity | Partial | Activity is derived from requests only |
| Notifications | Persistent notifications | Missing | No table. The panel keeps messages received while the tab is open, in memory |
| Notifications | Request and session events | Missing | — |
| Settings | Change password | Working | Code |
| Settings | Notification preferences | UI-only | Saved to `localStorage` after an artificial 400 ms delay. No email or push exists |
| Settings | Privacy toggles | Broken | Writes `is_public` and `show_email`, columns that do not exist (Verified) |
| Settings | Delete account | Partial | See S7 |
| Landing | Hero, how it works, CTAs | Working | Verified |
| Landing | Live stats | Partial | Showed "—" for all three figures at load. Not confirmed whether they fill in on scroll |
| Landing | Testimonials, "Join thousands" | Fabricated | Three invented people. The site has 25 profiles (Verified). The spec forbids this |
| Landing | Footer links (About, Help, Privacy, Terms) | Missing | Terms and Privacy are named on the auth pages as plain text |
| Other | Reviews, help, search page, admin | Missing | — |
| Report only | Credits, WebRTC video, leaderboard, badges, email, admin analytics | Missing | Never built |

### 3.5 Codebase health

- **No type checking.** There is no `tsconfig.json` and no `typescript` dependency. `vite build` strips types without checking them. 32 uses of `any`. The `Message` type declares `requester_id` while the code uses `sender_id`.
- **No tests, no lint, no CI.** `build_output.txt` is a leftover log of a failed build.
- **Schema is not in the repo.** `supabase/` holds one ad-hoc SQL file. Tables, policies and functions exist only in the dashboard.
- **Two Supabase clients** (`lib/supabase.ts`, `services/supabase.ts`) and two routers' worth of imports (`react-router` and `react-router-dom`).
- **Dead code:** `routes.tsx`, `Navigation.tsx`, `SidebarContext.tsx`, `ThemeToggle.tsx`, `MatchProfile.tsx`, `filters/*`, `useOnboarding`, `useAuthGuard`, `redirectUser`, `scratch.mjs`, and most of the 47 generated `ui/` components.
- **About 25 unused dependencies**, including MUI, Emotion, react-slick, react-dnd, recharts, Popper, next-themes and dotenv. The package is still named `@figma/my-make-file`.
- **Every page fetches by hand** in `useEffect`, with no caching, so the same profile is fetched several times per screen and navigation uses full reloads (`window.location.replace`).
- **Styling bugs:** `hsl(var(--primary) / 0.08)` is used for background glows, but `--primary` is a hex value, so the declaration is invalid and the glow never renders. `index.html` links `/fonts/ngetic.css`, which does not exist. Syne is loaded by an inline `@import` repeated in each page. `Sessions.tsx` uses light-only colours on a dark theme.
- **Teach and learn look the same.** Teach uses the gold primary and learn uses Tailwind `yellow-500`, which is nearly the same colour.

### 3.6 Logged-in walkthrough (added 17 Nov 2026, read-only, one account)

Done in the owner's signed-in session. Nothing was sent, created or edited.

| Finding | Status |
|---|---|
| Matches lists all other profiles, including ones with no skills and no name ("User"). The current user's skills (teaches Generative AI, wants Animation) play no part. "1 teach match · 1 learn match" is each person's own skill count | Verified. Confirms "Broken" |
| Cards offer "Message" only. No way to propose a swap | Verified |
| Conversations and messages are restricted to their participants: this account sees 1 conversation and 2 messages, none belonging to others. S6 is therefore lower risk than feared | Verified for one account |
| Any signed-in member can read all 6 swap requests, 5 of them other people's. No screen shows them, so this is exposure without benefit | Verified |
| Sessions table is empty. The feature has never been used | Verified |
| Dashboard: "Active Requests", "Total Chats", "Skills Learning" and "Connections" all show 1. The first three count different things than their labels say. The only activity item is a pending request from 184 days ago | Verified |
| The open request is stored as `pending`, so the "Open" filter on Requests shows 0 and the request looks like it is awaiting someone's answer | Verified |
| The request shows "Teaches Graphic Design, Learns Java", which matches neither skill on the profile. Requests are free text, unrelated to profile skills | Verified |
| Settings shows email and push notification toggles and "Show email on profile". None of these exist | Verified |
| The dashboard took several seconds to leave its spinner on first load | Observed once |
| At least one member's avatar is an offensive image. There is no way to report it | Verified. Raises the priority of block and report (R16) and adds a need for the owner to be able to remove an avatar |
| No console errors on any page visited | Verified |

Not exercised, because they write data: sending a message, creating or cancelling a request, editing the profile, changing the password, saving settings.

---

## 4. Product direction

### 4.1 What comparable products suggest

- Language-exchange apps (Tandem, HelloTalk) are the nearest working model of reciprocal exchange. Reviews of them repeat the same complaints: the partner does not show up, the levels do not fit, the exchange becomes lopsided. Bilingua's answer is pairing for the medium term rather than one-off chats.
- Time banks tend to be short-lived, and the cited cause is failing to reach and hold a critical mass of active members.
- A barter-platform study found that a token eases the "double coincidence of wants" problem, and that changing its rules abruptly drove users away.

This evidence is thin (§2), but it agrees with SkillBridge's own numbers: 3 reciprocal pairs among 17 users.

### 4.2 Decisions

| Decision | Choice | Reason |
|---|---|---|
| Core object | The **Swap**: a two-person agreement with its own chat, sessions and progress | Fixes the current disconnect between requests, chats and sessions. Favours medium-term pairs over one-off chats |
| Empty matching | Show **two-way matches** first, then **one-way matches** labelled "can teach you" and "wants to learn from you" | 13 one-way pairs exist against 3 two-way. One-way help is still free peer learning |
| Reciprocity without currency | A **give / receive count** on each profile, derived from completed sessions. Not a balance, not spendable | Keeps the "no money" rule and avoids the ledger, holds and disputes of a credit system |
| Credit economy from the report | **Do not build** | Contradicts the spec, adds the most complex and abuse-prone subsystem, and nothing depends on it |
| Open requests | Keep as **Asks**: short, specific, expiring posts shown to people who teach that skill | The existing 6 requests show people want this. Today they go nowhere |
| Ratings | **Vouches** instead of 1–5 stars: "taught me Guitar" plus an optional one-line note, only after a completed session | Stars between peers who will meet again are inflated and discouraging. A vouch is a trust signal tied to a real session |
| Video | **User-supplied meeting link** on each session | Per spec. WebRTC needs TURN servers and is out of proportion |
| Chat before acceptance | **Not allowed.** The proposal carries one message of up to 500 characters | Per spec. Limits spam and unwanted contact |
| Trust and safety | **Block and report** in the first release | Members meet strangers. Currently there is no way to stop contact |
| Gamification, leaderboard, admin analytics, blockchain credentials, freemium | **Do not build** | Report-only ideas with no user evidence |
| Swap circles (A teaches B, B teaches C, C teaches A) | **Later**, after real usage data | Addresses the same scarcity problem but needs three-party agreement flows |

### 4.3 Use cases the redesign must serve

1. A student who knows Python and wants Photoshop finds the one person who is the reverse, proposes a swap, and has a first session booked within the week.
2. A student with no two-way match still finds someone who can teach them, and can ask.
3. Two people in a swap can see whose turn it is to teach, what is scheduled next, and how many sessions each has given.
4. Someone with a specific, dated need ("React interview on Friday") posts an Ask and is seen by people who teach React.
5. Someone receiving unwanted contact can decline, block and report.

---

## 5. Requirements

### P0 — the exchange loop works end to end

| ID | Requirement |
|---|---|
| R1 | Close S1–S3: no anonymous table reads, no bucket listing, `.env` out of git |
| R2 | Schema, policies and functions live in versioned migrations |
| R3 | Sign-up saves the name. Forgot and reset password work. Unknown URLs show a 404 page |
| R4 | Onboarding is enforced and cannot finish with zero teach or zero learn skills. Unknown skills can be added |
| R5 | Matching runs in the database and returns two-way matches with the exact skill pairs, then one-way matches, each labelled |
| R6 | A member can propose a swap to a person, choosing one skill each way. The database validates that both people actually hold those skills, rejects self-proposals and duplicate open proposals |
| R7 | The recipient can accept or decline. The proposer can cancel. Transitions are atomic and role-checked in the database |
| R8 | Accepting creates exactly one conversation. Only its two members can read or write it |
| R9 | Sessions: propose a time with timezone, the other person confirms or counter-proposes, either can cancel. Stored as `timestamptz`, shown in local time |
| R10 | Persistent notifications for proposals, responses, session events and new messages, with read state |
| R11 | Home shows real, correctly-defined numbers and the next action to take |
| R12 | Type checking and a build run in CI |

### P1 — makes it trustworthy and worth returning to

| ID | Requirement |
|---|---|
| R13 | Mark sessions complete, vouch for the teacher, show give / receive counts |
| R14 | Asks board |
| R15 | Explore: search people by skill, filter by category and level |
| R16 | Block and report |
| R17 | Discoverability switch, secure account deletion |
| R18 | Skill levels and categories |
| R19 | Landing shows real numbers through a safe public function. Remove invented testimonials and "thousands" |
| R20 | Privacy, Terms, Help and About pages. Legal text needs the owner's review before publishing |
| R21 | `.ics` download for a confirmed session |

### P2 — later

Portfolio items, availability hints in matching, swap circles, email notifications, light-mode polish, multilingual UI.

---

## 6. Experience design

### 6.1 Navigation

Four destinations. Sidebar on desktop, bottom tab bar on mobile.

| Tab | Purpose |
|---|---|
| Home | What needs me now: proposals awaiting my answer, next session, unread swaps |
| Discover | Matches, Explore, Asks |
| Swaps | Proposals (received, sent) and my active and past swaps |
| Me | Profile, skills, vouches, settings |

Chats and Requests stop being top-level items. Chat lives inside a swap. Requests become the Proposals section of Swaps.

### 6.2 Routes

| Route | Screen | Access |
|---|---|---|
| `/` | Landing | Public |
| `/login`, `/signup` | Auth | Public, redirect if signed in |
| `/forgot-password`, `/reset-password` | Password recovery | Public |
| `/auth/callback` | OAuth and email-link return | Public |
| `/about`, `/help`, `/privacy`, `/terms` | Static pages | Public |
| `/welcome` | Onboarding: you, teach, learn, first matches | Signed in, not onboarded |
| `/home` | Home | Onboarded |
| `/discover` | Matches (default), `?tab=explore`, `?tab=asks` | Onboarded |
| `/people/:id` | Public profile with "Propose a swap" | Onboarded |
| `/swaps` | Proposals and swaps list | Onboarded |
| `/swaps/:id` | Swap workspace: chat, sessions, agreement | The two members |
| `/sessions` | Agenda across all swaps | Onboarded |
| `/me` | Own profile and skills | Onboarded |
| `/settings` | Account, privacy, blocked users, delete | Onboarded |
| `*` | 404 | Public |

Redirects from the current URLs: `/dashboard` to `/home`, `/matching` to `/discover`, `/requests` to `/swaps`, `/chat` to `/swaps`, `/profile` to `/me`, `/profile/:id` to `/people/:id`, `/setup` to `/welcome`.

### 6.3 Core workflows

**Onboarding.** Name and photo (prefilled from Google), then skills I can teach with a level, then skills I want to learn, then a results screen that runs the real match query. If there are two-way matches it shows them. If not, it shows one-way matches and says so plainly.

**Propose.** From a match card or a profile, "Propose a swap" opens a sheet with the two skills preselected from the overlap, a 500-character message and a suggested rhythm (for example weekly, 45 minutes). One tap sends it.

**Respond.** The proposal appears on Home and under Swaps. Accept opens the swap workspace. Decline is one tap with no required reason.

**Swap workspace.** Header shows both people and the two skills as a two-sided strip. Below it: chat, a sessions panel with "Propose a time", and the give / receive count for this swap. On mobile these are tabs.

**Session.** Propose date, time, length, who teaches, optional meeting link. The other person confirms or suggests another time. After the end time either person marks it done, and the learner is invited to vouch.

**Ending.** Either person can end a swap. The chat becomes read-only and stays available to both.

### 6.4 Design system

Keep the existing identity: charcoal surfaces, gold accent, Syne for display, Inter for text. Change what is currently unclear or broken.

| Token | Value | Note |
|---|---|---|
| `--background` | `#1E2328` | Keep |
| `--card` | `#2A2E34` | Keep |
| `--border`, `--muted` | `#3B3F46` | Keep |
| `--primary` (teach, actions) | `#F5B301` | Keep |
| `--learn` | A teal in the `#2DD4BF` range | **New.** Replaces `yellow-500` so teach and learn are distinguishable. Final value to be checked for 4.5:1 contrast on `--card` |
| `--destructive` | `#EF4444` | Keep |
| Radius | `0.75rem` base | Keep |
| Display font | Syne 700 / 800 | Load once in `index.html` |
| Text font | Inter 400 / 500 / 600 | Load once in `index.html` |

- **Signature element: the two-sided swap strip.** Gold half for what I teach, teal half for what I learn, joined in the middle. Used on match cards, proposals and the swap header. It is the one custom component. Everything else is plain.
- **Colour means direction, not decoration.** Gold is teaching, teal is learning, everywhere.
- **Fix the glow bug** by using `color-mix(in srgb, var(--primary) 8%, transparent)`.
- **Dark first.** Keep light tokens but treat light mode as P2. Use one theme mechanism, not two.
- **Empty states carry the next action**, not an illustration.
- **Accessibility:** visible focus rings, 44 px touch targets, labels on icon buttons, no information by colour alone (the strip also carries "teaches" and "learns" text).
- **Component set:** keep roughly ten of the generated `ui/` components (button, input, textarea, dialog, sheet, dropdown, tabs, avatar, badge, skeleton, tooltip) and delete the rest. One toast library.

---

## 7. Architecture

### 7.1 Frontend

Stay on React, Vite, Tailwind and Supabase. No framework migration.

```
src/
  app/            router, providers, layouts, route guards
  features/
    auth/  onboarding/  discover/  swaps/  sessions/  profile/  notifications/  settings/
      api.ts        typed Supabase calls for this feature
      hooks.ts      query and mutation hooks
      components/   feature UI
      pages/        route screens
  components/     shared UI (swap strip, avatar, skill chip, empty state)
  lib/            supabase client (one), query client, dates, validation
  types/          database.ts (generated), domain types
```

- **TypeScript for real:** add `typescript` and a strict `tsconfig.json`. Build script becomes `tsc --noEmit && vite build`.
- **Generated database types** from the Supabase CLI, regenerated after each migration.
- **TanStack Query** for server state. It is one dependency and replaces the hand-written fetch, loading and refetch code in every page. Realtime events invalidate queries instead of patching local state.
- **One router** (`react-router-dom`), lazy-loaded routes, client-side navigation instead of full reloads.
- **Guards as layout routes:** `RequireAuth`, `RequireOnboarded`, `RedirectIfAuthed`.
- **Form validation** with small hand-written validators. No form library needed at this size.
- **Dependencies:** remove the unused ones listed in §3.5.

### 7.2 Backend

- All reads go through RLS-protected tables or views. All state changes that involve a rule go through Postgres functions.
- Functions are `security definer`, set `search_path = ''`, check `auth.uid()` first, and have `execute` revoked from `anon` and `public`.
- Notifications are written only by those functions and by triggers, never by the client.
- Realtime uses `postgres_changes` filtered by `conversation_id` and `recipient_id`, which respects the select policies. Move to private broadcast channels only if quotas require it.
- No Edge Functions in P0 or P1. Account deletion is a Postgres function.

---

## 8. Database changes

The current schema could only be seen from outside. **Step one of implementation is a full dump of tables, constraints, indexes, policies and functions**, and this section must be reconciled against it.

### 8.1 Target schema

| Table | Key columns | Rules |
|---|---|---|
| `profiles` | existing, plus `location`, `organization`, `timezone`, `learning_goals text[]`, `github_url`, `linkedin_url`, `is_discoverable default true`. Drop unused `name` and `username` later | Never holds email. Owner updates only |
| `skill_categories` | `id`, `name`, `slug` | Seeded: Technology, Creative, Business, Languages, Music, Other |
| `skills` | existing, plus `slug` (unique, lower-cased, whitespace-collapsed), `category_id`, `created_by` | Inserts only through `add_skill()` |
| `user_skills` | existing (`level` already present), plus `note` | Unique on user, skill, type. Trigger prevents the same skill as both teach and learn |
| `swaps` | `proposer_id`, `recipient_id` (not null), `offered_skill_id`, `requested_skill_id`, `message` (≤500), `cadence`, `status` (`proposed`, `accepted`, `declined`, `cancelled`, `ended`), timestamps | Check proposer ≠ recipient. Partial unique index on the unordered pair plus both skills where status is `proposed` or `accepted` |
| `asks` | `author_id`, `skill_id`, `offered_skill_id` (nullable), `body` (≤500), `expires_at`, `status` | Visible to onboarded members |
| `conversations` | `swap_id` (unique) | Members are the swap's two people |
| `messages` | `conversation_id`, `sender_id`, `body` (1–2000), `created_at` | Insert only by a member of an accepted swap. Index on conversation and time |
| `conversation_reads` | `conversation_id`, `user_id`, `last_read_at` | Replaces per-message `is_read` and `receiver_id` |
| `sessions` | `swap_id`, `teacher_id`, `learner_id`, `skill_id`, `starts_at timestamptz`, `duration_minutes` (15–240), `meeting_url`, `proposed_by`, `confirmed_at`, `status` (`proposed`, `confirmed`, `completed`, `cancelled`), `notes` | Teacher and learner must be the swap's members |
| `vouches` | `session_id`, `from_id`, `to_id`, `skill_id`, `note` (≤280) | Unique on session and author. Session must be completed. Author must be the learner |
| `notifications` | `recipient_id`, `actor_id`, `type`, `swap_id`, `session_id`, `read_at`, `created_at` | Recipient reads and marks read. No client inserts |
| `blocks` | `blocker_id`, `blocked_id` | Blocked users are excluded from matching and cannot propose |
| `reports` | `reporter_id`, `reported_id`, `context`, `reason` | Insert only. Read by the owner through the dashboard |

### 8.2 Functions

`find_matches(limit, offset)`, `search_people(query, category, level)`, `add_skill(name, category)`, `set_my_skills(teach, learn)` (atomic replace), `propose_swap`, `respond_to_swap`, `cancel_swap`, `end_swap`, `propose_session`, `respond_to_session`, `cancel_session`, `complete_session`, `add_vouch`, `mark_notifications_read`, `block_user`, `delete_my_account`, and `public_stats()` — the only function callable anonymously, returning three integers.

`find_matches` returns, per candidate: the profile card fields, `they_teach_i_learn[]`, `i_teach_they_learn[]`, and `kind` (`two_way`, `can_teach_me`, `wants_my_skill`). Order: two-way first, then by number of overlapping skills, then by most recent activity. Excludes self, blocked users, undiscoverable and un-onboarded profiles.

### 8.3 Access policy summary

| Table | Read | Write |
|---|---|---|
| `profiles`, `user_skills` | Signed-in members, for discoverable profiles, self, or a swap partner | Self |
| `skills`, `skill_categories` | Signed-in members | Function only |
| `swaps`, `conversations`, `messages`, `sessions` | The two members | Function, except message insert by a member |
| `asks` | Signed-in members | Author |
| `vouches` | Signed-in members | Function |
| `notifications`, `conversation_reads`, `blocks` | Owner | Owner or function |
| Anonymous | Nothing except `public_stats()` | Nothing |
| Storage `avatars` | Public read by exact URL, no listing | Owner, under `{user_id}/`, images only, 2 MB limit |

### 8.4 Migrating existing data

Use expand, migrate, contract. Nothing is dropped until the new app is live.

1. Add new tables and columns beside the old ones.
2. Backfill: `skills.slug`; categories for the 119 skills; the 6 open requests into `asks` by matching their free-text skill to a skill row (unmatched ones flagged for manual review).
3. Existing conversations, if any exist, become accepted swaps with null skills, labelled as earlier connections, so no chat history is lost. **Decide after the dump shows whether any exist.**
4. Fix the 3 onboarded profiles with no skills by setting `onboarding_completed = false` so they are asked again. Fix the 1 user with the same skill on both sides by asking them.
5. Drop old tables and columns in a later, separately approved migration.

---

## 9. Implementation sequence

Each phase ends with something that can be checked. Do not start a phase until the previous one passes.

| Phase | Work | Done when |
|---|---|---|
| 0. Baseline | Clone from GitHub so the folder is a real git repo. Get admin access to the SkillBridge Supabase project. Dump schema and policies into `supabase/migrations`. Run the security and performance advisors. Take a backup. Create a second free project as staging. Add `tsconfig`, CI build | Schema is in git. Staging exists. CI is green on the current code |
| 1. Security hotfix | Fix S1–S3 on the *current* app: add `public_stats()`, point the landing page at it, remove anonymous policies, stop bucket listing, remove `.env` from git and add `.env.example` | The anonymous probes in §11 return nothing. Landing stats still show |
| 2. Schema v2 | Migrations for §8 on staging, functions, policies, SQL tests for every rule | All database tests pass. Advisors show no errors |
| 3. Frontend foundation | New folder structure, tokens, app shell, router and guards, query layer, generated types, dependency cleanup. Auth fixes: name saved, forgot and reset password, 404 | Sign up, confirm, log in, reset password, log out all work on staging |
| 4. Onboarding and profile | `/welcome`, `/me`, skills with levels, add-a-skill, avatar path fix | A new account cannot reach `/home` without one teach and one learn skill |
| 5. Discover | `find_matches`, match cards with the swap strip, people pages, Explore | The two-account test in §11 shows each account the other as a two-way match |
| 6. Swaps and chat | Propose, respond, cancel, end. Workspace with chat and unread state | Full proposal flow passes. A third account cannot read the conversation |
| 7. Sessions | Propose, confirm, counter, cancel, complete, `.ics` | A session agreed in one timezone shows the right local time in another |
| 8. Notifications and Home | Notification table, triggers, panel, Home | Each event in R10 produces exactly one notification |
| 9. Trust and extras | Vouches, give / receive counts, Asks, block, report, discoverability, account deletion, static pages, honest landing | Blocked users cannot propose or appear in matches. Deleting an account removes the auth user and all owned rows |
| 10. Cutover | Run the data migration on production, deploy, smoke test, then the contract migration, README rewrite | Acceptance criteria in §11 pass on production |

Phase 1 is independent and should ship first, even if the rest is delayed.

---

## 10. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Too few two-way matches make the product feel empty | High. 3 pairs today | One-way matches and Asks in the first release. Seed within one college cohort so skills overlap. Measure the share of new users who see at least one match |
| Existing RLS is different from what was assumed | Certain to some degree | Phase 0 dump before any design is final |
| Migration damages the 25 existing accounts | Medium | Expand-migrate-contract, backup, rehearsal on staging with a copy of production |
| Built-in Supabase email is heavily rate-limited, breaking confirmation and password reset under any real sign-up volume | Medium | Check current limits in the dashboard. Configure a free-tier SMTP provider before inviting users |
| Free-tier Supabase projects pause when idle | Medium | Know the pause policy. Keep staging disposable |
| Scope creep from the college report (video, credits, leaderboard) | Medium | §4.2 is the scope. Anything else needs a written reason |
| AI-assisted changes regress working parts | High without tests | Database tests in phase 2, type checking in CI, the scripted two-account test after every phase |
| The report describes a system that does not exist | Already true | The owner should decide whether to correct the report. Do not let it drive requirements |
| Legal pages written without review | Medium | Mark as drafts. No claims about data handling that the app does not implement |

---

## 11. Acceptance criteria

**Security (run logged out with the public key):**
- `GET /rest/v1/profiles`, `/user_skills`, `/swaps`, `/messages` return zero rows or 401.
- Listing the `avatars` bucket returns nothing.
- `.env` is absent from the repo's current tree.
- Supabase security advisor reports no errors.

**Two-account scenario (A teaches Python, wants Photoshop. B is the reverse. C is unrelated):**
1. A and B each see the other first under Matches, labelled two-way, showing Python and Photoshop on the correct sides. C appears for neither as two-way.
2. A proposes. A second identical proposal is rejected. A cannot propose to themself. A cannot offer a skill A does not teach.
3. B sees the proposal and a notification. C cannot read it. A cannot accept it. B accepts.
4. Exactly one conversation exists. A and B can exchange messages in realtime. C's attempt to read or write fails at the database.
5. A proposes a session for a given time. B, in a different timezone setting, sees the correct local time and confirms. Status is `confirmed` only after B acts.
6. After the end time the session is marked complete. The learner can vouch once. A second vouch is rejected. A vouch before completion is rejected.
7. B blocks A. A no longer sees B in Discover and cannot propose.
8. A deletes their account. A's auth user, profile, skills and notifications are gone. B's copy of the conversation remains readable.

**Product:**
- No number, name or quote on any screen is invented.
- Every button does something. No route renders a blank page.
- A new user gets from sign-up to a sent proposal in under five minutes.

**Quality:**
- `tsc --noEmit` passes with no `any` in feature code.
- Initial JavaScript for the landing route is under 150 kB gzipped.
- Keyboard-only use can complete the propose and accept flows.
- Usable at 360 px width.

---

## 12. Open decisions for the owner

Defaults are what the plan assumes if nothing is said.

1. **Vouches instead of star ratings.** Default: vouches.
2. **One-way help allowed and shown in matches.** Default: yes, labelled.
3. **Learn colour.** Default: teal. Alternative is to keep a single gold accent and rely on labels.
4. **Light mode.** Default: keep the tokens, polish later.
5. **Legacy conversations.** Default: keep as earlier connections if any exist.
6. **The college report.** Default: leave as is and do not use it as a requirements source.
7. **Database access for implementation.** The implementer needs the SkillBridge Supabase project connected, or CLI access with the database password.

---

## 13. Implementation status (17 Nov 2026)

The plan above was implemented on branch `redesign` against the real Supabase project. Nothing has been committed, pushed or deployed.

**Built:** everything in P0 and P1 (R1–R21), in six migrations under `supabase/migrations/` and a rewritten front end under `src/`.

**Where the build departs from the plan, and why**

| Plan | Built | Reason |
|---|---|---|
| `conversations` table, one per swap | Messages attach directly to the swap; read state in `swap_reads` | A conversation was always exactly one swap, so the extra table added nothing |
| Unique open swap per pair *and skill pair* | One open swap per pair | Simpler to understand and to show; a pair can start another after ending one |
| Proposal must match all four skill lists | Proposer must teach the offered skill and recipient must teach the requested one; the two "wants" are not required | Needed for one-way matches to lead anywhere (§4.2) |
| Deleted member's partner keeps the chat (§11.8) | Deleting an account removes its swaps and messages for both sides | Honours "delete my data" literally; the Privacy page says so |
| Staging project, expand-migrate-contract | Applied directly to production, with old tables parked in a `legacy` schema | Owner's decision: the site has no active users |
| Legacy conversation kept as an "earlier connection" | The one legacy conversation (2 messages) stays in `legacy` and is not shown | It had no skills attached and could not be a valid swap |
| React 18 | React 19 | The existing Radix-based primitives are written for React 19 and warned under 18 |
| Light mode kept as tokens | Dark only | Deferred to P2 as planned; the half-working toggle was removed |

**Verified**

- 27 database rule checks on real data inside a rolled-back transaction, including completing a session and vouching.
- `npm run test:e2e`: 84 checks through the public API as three accounts, including realtime delivery. All pass.
- Account deletion cascade, in a rolled-back transaction.
- In the browser on localhost, desktop and 375 px: landing, login, onboarding, home, discover, propose, accept, chat, plan a session, live updates from the other account, profile, edit skills, Asks, notifications, settings, 404.
- `tsc --noEmit` and `vite build` pass.

**Not verified** — see the implementation report for what is needed.

- Email sign-up confirmation, password-reset email, and Google sign-in from the new app.
- Avatar upload from the new UI.
- Screen-reader testing. Semantics and keyboard paths were built in but not tested with assistive technology.

---

## Sources

Comparable platforms and exchange dynamics:
- [Univext: HelloTalk vs Tandem (2026)](https://univext.com/en/blog/360/hellotalk-vs-tandem-2026) — vendor blog
- [Preply: language exchange apps guide](https://preply.com/en/blog/language-exchange-app/)
- [Tandem: best language exchange apps](https://tandem.net/blog/best-language-exchange-apps) — vendor blog
- [SkillShare Local listing](https://peerpush.com/p/skillshare-local)
- [Time bank decline and critical mass (Springer chapter)](https://link.springer.com/chapter/10.1007/978-3-030-71147-4_7)
- [Bunz barter platform token study (working paper)](https://mbwong.com/pdf/Bunz.pdf)
- [Time banking and the banking metaphor (CHI paper)](https://unpaywall.org/10.1145%2F2556288.2557061)

Supabase security:
- [Supabase Advisors documentation](https://supabase.com/docs/guides/monitoring-and-debugging/advisors.md)
- [Makerkit: Supabase RLS best practices](https://makerkit.dev/blog/md/tutorials/supabase-rls-best-practices)
- [Security definer audit write-up](https://dev.to/domoniqueluchin/supabase-rls-security-audit-fixing-security-definer-vulnerabilities-across-3-production-projects-22o3)
- [Supabase splinter lints](https://www.github.com/supabase/splinter/blob/main/splinter.sql)
