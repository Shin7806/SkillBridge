-- SkillBridge bootstrap: the version 1 starting point that supabase/migrations upgrades from.
--
-- Run this ONCE on a brand-new, empty Supabase project, before the migrations:
--   psql "$DATABASE_URL" -f supabase/bootstrap/00_v1_baseline.sql
--   for f in supabase/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
--
-- Never run it against a project that already has SkillBridge tables.
-- Version 1 was created by hand in the Supabase dashboard; this file recreates just the tables,
-- constraints, trigger and bucket the redesign migrations expect to find.

create extension if not exists pgcrypto;

-- ── Profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text,
  bio text,
  avatar_url text,
  headline text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  onboarding_completed boolean not null default false,
  name text
);
create unique index profiles_username_normalized_unique on public.profiles (lower(btrim(username))) where username is not null;

create function public.update_timestamp() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger update_profiles_timestamp before update on public.profiles for each row execute function public.update_timestamp();

-- Placeholder; migration 02 replaces it with the real sign-up handler.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ── Skills catalogue ────────────────────────────────────────────────────────
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint skills_name_unique unique (name),
  constraint skills_name_not_blank check (length(trim(both from name)) > 0)
);
create unique index skills_name_normalized_unique on public.skills (lower(btrim(name)));

insert into public.skills (name) values
  ('Python'),('JavaScript'),('TypeScript'),('Java'),('C++'),('React'),('Node.js'),('SQL'),('Data Analysis'),('Machine Learning'),('Web Development'),('Excel'),
  ('Adobe Illustrator'),('Adobe Photoshop'),('Animation'),('Branding'),('Canva'),('Drawing'),('Figma'),('Graphic Design'),('Motion Graphics'),('Painting'),('Photography'),('UI/UX Design'),('Video Editing'),('Videography'),('Dancing'),('Content Writing'),('Copywriting'),
  ('Accounting'),('Business Strategy'),('Digital Marketing'),('Entrepreneurship'),('Freelancing'),('Leadership'),('Marketing'),('Product Management'),('Sales'),('SEO'),('Social Media Marketing'),('Interview Preparation'),('Resume Building'),
  ('English'),('French'),('German'),('Hindi'),('Japanese'),('Mandarin'),('Spanish'),
  ('Guitar'),('Piano'),('Singing'),
  ('Mathematics'),('Statistics'),('Physics'),('Chemistry'),('Biology'),('Communication Skills'),('Public Speaking'),('Time Management');

create table public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  skill_id uuid not null references public.skills(id) on delete cascade,
  skill_type text not null,
  level text,
  created_at timestamptz not null default now(),
  constraint user_skills_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_skill_unique unique (user_id, skill_id, skill_type),
  constraint user_skills_skill_type_check check (skill_type in ('teach', 'learn')),
  constraint user_skills_level_check check (level in ('beginner', 'intermediate', 'advanced'))
);

-- ── Version 1 chat, requests and sessions (migration 01 parks these in the "legacy" schema) ──
create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid,
  receiver_id uuid,
  offered_skill_id uuid,
  requested_skill_id uuid,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  requester_id uuid,
  skill_learn text,
  skill_teach text,
  level text default 'beginner',
  duration text default '30',
  frequency text default 'weekly',
  goals text[] default '{}'
);
create trigger update_requests_timestamp before update on public.swap_requests for each row execute function public.update_timestamp();

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_1 uuid not null,
  user_2 uuid not null,
  created_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  receiver_id uuid not null,
  sender_id uuid not null,
  content text not null,
  created_at timestamptz not null default now(),
  is_read boolean default false,
  conversation_id uuid
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  created_by uuid not null,
  scheduled_date date not null,
  scheduled_time time not null,
  duration_minutes integer not null,
  meeting_link text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sender_id uuid,
  receiver_id uuid
);

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.user_skills enable row level security;
alter table public.swap_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.sessions enable row level security;

-- Migration 01 removes these from realtime, so they must be members first.
alter publication supabase_realtime add table public.messages, public.profiles, public.sessions, public.swap_requests, public.user_skills;

-- ── Storage ─────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
