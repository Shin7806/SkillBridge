# Database

All schema, policies, functions, storage buckets and realtime settings are kept as SQL migrations in `supabase/migrations/`. Postgres is the source of truth for every rule in the app.

## Main tables

| Table | Holds |
|---|---|
| `profiles` | Name, headline, bio, avatar, location, links, Discover visibility |
| `skills`, `skill_categories` | The shared skill catalogue |
| `user_skills` | What each person teaches or wants to learn, with a level |
| `swaps` | One agreement between two people and its status |
| `messages` | Chat inside an accepted swap, with optional attachment |
| `swap_reads` | Where each member last read a swap's chat, for unread counts |
| `sessions` | Planned lessons inside a swap, stored as an absolute instant |
| `vouches` | A learner's endorsement after a completed session |
| `asks` | Short public requests on the Asks board |
| `notifications` | In-app notifications with read state |
| `blocks`, `reports` | Safety |

Storage buckets: `avatars` (public read) and `attachments` (private, 4 MB per file, images, PDF, text, Office files and zip).

## Setting up a new Supabase project

The migrations upgrade SkillBridge version 1, whose first tables were made by hand in the dashboard. `supabase/bootstrap/00_v1_baseline.sql` recreates that starting point, so a brand-new project is set up in two steps. Take the connection string from **Project Settings → Database** (use the direct connection, not the pooler):

```bash
export DATABASE_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/bootstrap/00_v1_baseline.sql
for f in supabase/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

Only run the bootstrap on an empty project. It also seeds a starter skill catalogue; people can add their own skills from the app.

After that, configure Auth:

1. **Authentication → URL Configuration**: set the Site URL to your deployed URL and add `<site>/auth/callback` and `<site>/reset-password` to the redirect allow-list (plus `http://localhost:5199/...` for local work).
2. **Authentication → Providers**: enable Email, and Google if you want it.
3. Copy the project URL and publishable key into `.env`.

## Changing the schema

1. Add a new file in `supabase/migrations/` named `<UTC timestamp>_<short_name>.sql`. Never edit a migration that has already been applied.
2. Enable row level security on every new table and write explicit policies.
3. Put any business rule in a `security definer` function with `set search_path = ''`, and revoke execute from `public` and `anon` unless anonymous use is intended.
4. Run the Supabase security advisor and `npm run test:e2e` before opening a pull request.

## Legacy tables

The version 1 tables `swap_requests`, `conversations`, `messages` and `sessions` were moved into a `legacy` schema that the API roles cannot reach. They have not been dropped.
