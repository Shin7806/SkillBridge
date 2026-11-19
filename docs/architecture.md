# Architecture

SkillBridge is a single-page React app that talks straight to Supabase. There is no custom server: the browser calls Supabase's REST, Realtime, Auth and Storage APIs with the publishable key, and Postgres decides what each signed-in user may see and do.

```
Browser (React + TanStack Query)
   │  publishable key + user JWT
   ▼
Supabase
   ├─ Auth        email/password, Google, password reset
   ├─ PostgREST   tables behind row level security, RPC functions
   ├─ Realtime    new messages and notifications
   └─ Storage     avatars (public), attachments (private, signed URLs)
```

## The core object: a swap

A **swap** is one agreement between two people: "I teach you Python, you teach me Photoshop". It moves through these states:

```
proposed ──accept──▶ accepted ──end──▶ ended
   │
   ├─decline──▶ declined
   └─cancel───▶ cancelled
```

Chat, sessions and progress all hang off an accepted swap. A pair of people can have only one open swap at a time.

## Where rules live

| Rule | Enforced by |
|---|---|
| Who can read a profile, swap, message or session | Row level security policies |
| Proposing, answering and ending swaps | `security definer` functions such as `propose_swap` and `respond_to_swap` |
| Proposing, confirming and completing sessions | `propose_session` and related functions |
| Vouches only after a completed session | `add_vouch` |
| Messages only inside an accepted swap | Insert policy on `messages` |
| Attachments only readable by the two members | Storage policies on the `attachments` bucket |
| Asks per user | `enforce_ask_limit` trigger |

The front end mirrors these rules for a good experience, but it never relies on them for safety.

## Front-end layout

- `src/lib/api.ts`: every Supabase call, typed. Pages never call Supabase directly.
- `src/lib/hooks.ts`: TanStack Query hooks around the API, plus realtime subscriptions.
- `src/lib/auth.tsx`: session state and route guards.
- `src/components/kit.tsx`: the design system: buttons, fields, cards, badges, avatars.
- `src/layouts/app-shell.tsx`: the signed-in shell with the collapsible sidebar, top bar, mobile tab bar and sessions panel.
- `src/pages/`: one file per screen, each loaded lazily.

## Design system

- Fonts: Geist for the interface, a serif italic for accent words on the landing page.
- Colours: amber (`--primary`) means teaching, teal (`--learn`) means learning. Tokens live in `src/styles.css`.
- Motion: CSS transitions in the app; Motion (Framer) only on the landing page, loaded with `LazyMotion`. Everything respects `prefers-reduced-motion`.
