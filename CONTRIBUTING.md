# Contributing to SkillBridge

Thanks for helping. This guide keeps changes easy to review.

## Ground rules

- Be kind. This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
- Open an issue before large changes so we can agree on the approach first.
- Report security problems privately, as described in [SECURITY.md](SECURITY.md), never in a public issue.

## Set up

Follow **Getting started** in the [README](README.md). You need Node.js 20 or newer and a Supabase project of your own; never point local work at the production project.

## Making a change

1. Fork the repository and create a branch from `main`, for example `fix/chat-scroll` or `feat/session-reminders`.
2. Keep each pull request to one change.
3. Follow the existing patterns:
   - All Supabase calls go in `src/lib/api.ts`, wrapped in a hook in `src/lib/hooks.ts`.
   - Build screens from `src/components/kit.tsx` instead of one-off styles.
   - Any rule about who can see or do something belongs in the database (a policy or a `security definer` function), not only in React. See [docs/database.md](docs/database.md).
   - Schema changes are new files in `supabase/migrations/`; never edit one that has been applied.
4. Check your work:

   ```bash
   npm run typecheck
   npm run build
   npm run test:e2e   # if you touched the database or an API call
   ```

5. Check the change at phone width (about 375 px) and on desktop.
6. Open a pull request and fill in the template.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat: …`, `fix: …`, `docs: …`, `refactor: …`, `chore: …`. Keep the first line under 72 characters.

## Writing in the UI

Short, plain sentences. Say what happens ("Swap ended") rather than what the system did. Avoid jargon such as "entity" or "instance".
