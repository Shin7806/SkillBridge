<div align="center">

<img src="public/logo.png" alt="" width="72" height="72" />

# SkillBridge

**Teach what you know. Learn what you don't.**

A free peer-to-peer skill exchange. SkillBridge finds people who teach the skill you want and want a skill you have. You swap lessons. Nobody pays.

[Live site](https://skill-bridge-shin7806s-projects.vercel.app) · [Docs](docs/README.md) · [Report a bug](https://github.com/Shin7806/SkillBridge/issues/new?template=bug_report.yml) · [Request a feature](https://github.com/Shin7806/SkillBridge/issues/new?template=feature_request.yml)

[![CI](https://github.com/Shin7806/SkillBridge/actions/workflows/ci.yml/badge.svg)](https://github.com/Shin7806/SkillBridge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-f5b301.svg)](LICENSE)

<img src="public/og-image.png" alt="SkillBridge landing page" width="760" />

</div>

## How it works

1. **Get matched.** List what you can teach and what you want to learn. Two-way matches (they teach what you want and want what you teach) come first, with the exact skills shown.
2. **Propose a swap.** Pick one skill each way and add a short note. They accept or decline.
3. **Chat once they say yes.** Every accepted swap gets a private conversation. Nobody can message you before that.
4. **Book sessions together.** Suggest a time, the other person confirms. Each of you sees it in your own timezone.

## Features

| Area | What you get |
|---|---|
| Accounts | Email and password or Google, email confirmation, password reset, guided onboarding |
| Matching | Computed in Postgres from real skill lists; two-way first, one-way labelled |
| Discover | Matches, a searchable directory by category, and an Asks board for specific requests |
| Swaps | One skill each way, accept or decline, one open swap per pair, end any time |
| Messages | Realtime chat per accepted swap, photo and file attachments up to 4 MB in private storage |
| Sessions | Propose, confirm or reschedule, timezone-aware, bring your own meeting link, `.ics` download, an overview of every session |
| Progress | Sessions taught and learned per swap and per profile; learners vouch for teachers after a session |
| Safety | Email never shown, hide from Discover, block, report, delete your account |

There are deliberately no payments, credits, star ratings or leaderboards. [docs/redesign-plan.md](docs/redesign-plan.md) explains why.

## Tech stack

- **Front end:** React 19, TypeScript, Vite 6, Tailwind CSS 4, TanStack Query, React Router 7, Radix primitives, Motion, Sonner, Vaul, cmdk
- **Back end:** Supabase (Postgres with row level security, Auth, Storage, Realtime)
- **Hosting:** static build on Vercel

Every rule that matters is enforced in the database: row level security on every table, and `security definer` functions for anything with a business rule (`propose_swap`, `respond_to_swap`, `propose_session`, `add_vouch` and others). The browser only ever holds the publishable key. More in [docs/architecture.md](docs/architecture.md).

## Getting started

You need **Node.js 20 or newer** and a **Supabase project**.

```bash
git clone https://github.com/Shin7806/SkillBridge.git
cd SkillBridge
npm install
cp .env.example .env   # then fill in your Supabase URL and publishable key
npm run dev
```

The app runs at http://localhost:5199. To set up the database for a new Supabase project, follow [docs/database.md](docs/database.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on port 5199 |
| `npm run typecheck` | Type check with `tsc` |
| `npm run build` | Type check, then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test:e2e` | End-to-end test against your Supabase project (needs `.env.test`, see [docs/testing.md](docs/testing.md)) |

## Project structure

```
src/
  App.tsx              routes and auth guards
  lib/                 Supabase client, API calls, query hooks, auth, types, utils
  components/          shared UI: kit, chat, sessions, people, profile view, skill picker
  components/ui/       Radix-based primitives
  components/landing/  landing page demos and motion
  layouts/             signed-in app shell (sidebar, top bar, sessions panel)
  pages/               one file per screen
scripts/e2e.mjs        end-to-end test
supabase/bootstrap/    starting point for a brand-new Supabase project
supabase/migrations/   schema, functions, policies, storage
docs/                  architecture, database, deployment, testing
```

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request, and report security problems privately as described in [SECURITY.md](SECURITY.md).

## Background

SkillBridge started as a BCA final-year project and is still being developed.

## License

[MIT](LICENSE)
