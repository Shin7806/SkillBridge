# SkillBridge

A free peer-to-peer skill exchange. You teach something you know, someone teaches you something you want to learn, and no money changes hands.

## What it does

- **Accounts** — email and password or Google, email confirmation, forgot and reset password.
- **Onboarding** — name, photo, skills you teach and skills you want to learn (with levels). You can't enter the app without at least one of each.
- **Matching** — computed in the database from real skill lists. Two-way matches come first with the exact skills shown; one-way matches are labelled.
- **Discover** — matches, a searchable directory filtered by category, and an Asks board for specific requests.
- **Swaps** — propose one skill each way with a short message. The other person accepts or declines. One open swap per pair.
- **Chat** — opens only when a swap is accepted, visible only to its two members, delivered in realtime.
- **Sessions** — suggest a time, the other person confirms or suggests another. Stored as an absolute instant and shown in each person's timezone. Bring your own meeting link. Calendar (.ics) download.
- **Progress** — sessions taught and learned per swap and per profile. Learners can vouch for teachers after a completed session.
- **Notifications** — stored, with read state, for proposals, answers, messages and session changes.
- **Privacy and safety** — hide your profile from Discover, block, report, delete your account.

There are no payments, credits, ratings out of five, leaderboards or video calls. See `REDESIGN_PLAN.md` for why.

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, Radix primitives, Sonner, Vaul and cmdk on the front end. Supabase (Postgres, Auth, Storage, Realtime) on the back end. Deployed as a static site on Vercel.

Every rule that matters lives in Postgres: row level security on every table, and `security definer` functions for anything with a business rule (`propose_swap`, `respond_to_swap`, `propose_session`, `add_vouch` and so on). The browser uses the publishable key only.

## Run it locally

```bash
npm install
```

Copy `.env.example` to `.env` and fill in your Supabase project URL and publishable key, then:

```bash
npm run dev
```

The app runs at `http://localhost:5199`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run typecheck` | Type check with `tsc` |
| `npm run build` | Type check, then build to `dist/` |
| `npm run test:e2e` | Run the two-user end-to-end test against the configured Supabase project |

The end-to-end test signs in as three test accounts and exercises matching, proposals, chat (including realtime delivery), sessions, Asks, privacy, blocking and anonymous access through the same HTTP API the app uses. It needs a `.env.test` file with `E2E_PASSWORD`, `E2E_ALICE`, `E2E_BEN` and `E2E_CARA`. That file is git-ignored.

## Database

Migrations are in `supabase/migrations/` and are the source of truth for the schema, policies and functions. The tables from the first version of the app (`swap_requests`, `conversations`, `messages`, `sessions`) were moved to a `legacy` schema that the API cannot reach; they have not been dropped.

## Deploying

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project's environment variables. `.env` is no longer committed.

In Supabase → Authentication → URL Configuration, the redirect allow-list must include `<your-site>/auth/callback` and `<your-site>/reset-password`.

## Project structure

```
src/
  App.tsx            routes and guards
  lib/               supabase client, api calls, query hooks, auth, types, utils
  components/        shared UI (kit, modal, skill picker, people, sessions, profile view)
  components/ui/     Radix-based primitives
  layouts/           signed-in app shell
  pages/             one file per screen
scripts/e2e.mjs      end-to-end test
supabase/migrations  schema, functions, policies
```

## License

MIT
