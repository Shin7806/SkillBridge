# Deployment

SkillBridge builds to static files in `dist/`, so it runs on any static host. The live site uses Vercel.

## Vercel

1. Import the GitHub repository in Vercel. The framework preset is **Vite**; the build command is `npm run build` and the output directory is `dist`.
2. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production and Preview.
3. Deploy. Every push to `main` creates a production deployment; pull requests get preview deployments.

`vercel.json` rewrites every path to `index.html` so client-side routes work on refresh, sets security headers and caches hashed assets for a year.

## Supabase settings for a new domain

In **Authentication → URL Configuration**, add the new origin's `/auth/callback` and `/reset-password` to the redirect allow-list, or sign-in links and password resets will fail.

## Recommended Auth settings

- **Authentication → Providers → Email**: keep "Confirm email" on.
- **Authentication → Attack Protection**: turn on leaked password protection (checks new passwords against Have I Been Pwned; needs a paid Supabase plan).

## Other hosts

Any host works if it serves `dist/` and falls back to `index.html` for unknown paths (Netlify `_redirects`, Cloudflare Pages SPA mode, Nginx `try_files`).
