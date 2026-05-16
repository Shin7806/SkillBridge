# SkillBridge

A full-stack peer-to-peer skill exchange platform where users teach what they know and learn what they don't — no money, no institutions, just people helping each other grow.

🔗 **Live Demo**: [skill-bridge-shin7806s-projects.vercel.app](https://skill-bridge-shin7806s-projects.vercel.app)

---

## What is SkillBridge?

SkillBridge operates on a simple philosophy: everyone is simultaneously a teacher in some domains and a student in others. The platform algorithmically connects users with complementary skill profiles and provides the communication infrastructure to support real, ongoing learning relationships.

Instead of paying for courses or waiting for institutional access, users swap skills directly — teach JavaScript, learn Guitar. Teach Spanish, learn Photography. The currency is reciprocal expertise.

---

## Features

- **Authentication** — Email/password and Google OAuth via Supabase Auth
- **Skill Profile Setup** — Multi-step onboarding to define skills you teach and want to learn
- **User Matching** — Discover users with complementary skill profiles
- **Swap Requests** — Send, receive, accept, and manage skill exchange requests
- **Real-Time Chat** — Live messaging powered by Supabase Realtime WebSockets
- **Session Scheduling** — Plan and track learning sessions with matched users
- **Dashboard** — Live stats, active requests, and recent activity
- **Notifications** — Instant updates on requests, messages, and session changes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Database | PostgreSQL with Row Level Security |
| Auth | JWT + OAuth 2.0 (Google) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/skillbridge.git
cd skillbridge
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

---

## Project Structure

```
src/
├── app/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # Auth and sidebar context providers
│   ├── layouts/        # AppLayout and AuthLayout
│   └── pages/          # Route-level page components
├── hooks/              # Custom React hooks
├── lib/                # Supabase client
├── services/           # API service functions
├── types/              # TypeScript table types
└── utils/              # Helper utilities
```

---

## Architecture Highlights

- **Single redirect source** — All onboarding redirects are handled in one place, eliminating loops
- **PKCE OAuth flow** — Secure Google login with proper code exchange via `exchangeCodeForSession`
- **Row Level Security** — All database access rules enforced at the PostgreSQL level
- **Realtime subscriptions** — Dashboard and chat update live via WebSocket without page refreshes
- **Safe profile creation** — Profiles are only inserted once; existing users are never overwritten

---

## Status

⚠️ Currently under active development. Some features may be incomplete or subject to change.

---

## License

MIT