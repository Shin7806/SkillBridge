-- SkillBridge redesign 01: schema and data migration.
-- Old request/chat/session tables are parked in the non-exposed "legacy" schema, not dropped.

create schema if not exists legacy;
revoke all on schema legacy from public, anon, authenticated;

drop view if exists public.debug_user_matches;

-- ── Legacy tables out of the API ────────────────────────────────────────────
alter publication supabase_realtime drop table public.messages, public.profiles, public.sessions, public.swap_requests, public.user_skills;
alter table public.sessions set schema legacy;
alter table public.messages set schema legacy;
alter table public.conversations set schema legacy;
alter table public.swap_requests set schema legacy;

-- ── Shared trigger function ─────────────────────────────────────────────────
drop trigger if exists update_profiles_timestamp on public.profiles;
drop trigger if exists update_requests_timestamp on legacy.swap_requests;
drop function if exists public.update_timestamp() cascade;
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ── Skills ──────────────────────────────────────────────────────────────────
create table public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int not null default 0
);
insert into public.skill_categories (name, slug, sort_order) values
  ('Technology','technology',1),('Creative','creative',2),('Business','business',3),
  ('Languages','languages',4),('Music','music',5),('Other','other',6);

-- merge duplicate skill "React.js" into "React"
do $$
declare v_keep uuid; v_drop uuid;
begin
  select id into v_keep from public.skills where name = 'React';
  select id into v_drop from public.skills where name = 'React.js';
  if v_keep is not null and v_drop is not null then
    update public.user_skills us set skill_id = v_keep
      where us.skill_id = v_drop
        and not exists (select 1 from public.user_skills x where x.user_id = us.user_id and x.skill_id = v_keep and x.skill_type = us.skill_type);
    delete from public.user_skills where skill_id = v_drop;
    update legacy.swap_requests set offered_skill_id = v_keep where offered_skill_id = v_drop;
    update legacy.swap_requests set requested_skill_id = v_keep where requested_skill_id = v_drop;
    delete from public.skills where id = v_drop;
  end if;
end $$;

alter table public.skills
  add column slug text,
  add column category_id uuid references public.skill_categories(id) on delete set null,
  add column created_by uuid references auth.users(id) on delete set null;
update public.skills set slug = lower(regexp_replace(btrim(name), '\s+', ' ', 'g'));
alter table public.skills alter column slug set not null;
create unique index skills_slug_unique on public.skills (slug);
alter table public.skills add constraint skills_name_len check (char_length(name) between 1 and 40);

update public.skills set category_id = (select id from public.skill_categories where slug = 'technology');
update public.skills set category_id = (select id from public.skill_categories where slug = 'creative')
  where name in ('Adobe Illustrator','Adobe Photoshop','Animation','Branding','Canva','Drawing','Figma','Graphic Design','Motion Graphics','Painting','Photography','UI Design','UI/UX Design','Video Editing','Videography','Dancing','Content Writing','Copywriting');
update public.skills set category_id = (select id from public.skill_categories where slug = 'business')
  where name in ('Accounting','Business Strategy','Digital Marketing','Economics','Email Marketing','Entrepreneurship','Freelancing','Leadership','LinkedIn Optimization','Marketing','Negotiation','Personal Branding','Product Management','Sales','SEO','Social Media Marketing','Interview Preparation','Resume Building','Portfolio Building');
update public.skills set category_id = (select id from public.skill_categories where slug = 'languages')
  where name in ('English','French','German','Hindi','Japanese','Mandarin','Spanish');
update public.skills set category_id = (select id from public.skill_categories where slug = 'music')
  where name in ('Guitar','Piano','Singing');
update public.skills set category_id = (select id from public.skill_categories where slug = 'other')
  where name in ('Biology','Chemistry','Physics','Mathematics','Statistics','Communication Skills','Critical Thinking','Problem Solving','Public Speaking','Teamwork','Time Management');

-- ── user_skills: tidy duplicates ────────────────────────────────────────────
alter table public.user_skills drop constraint if exists user_skills_user_id_skill_id_skill_type_key;
drop index if exists public.idx_user_skills_user_id, public.user_skills_user_id_idx, public.user_skills_skill_id_idx;
alter table public.user_skills drop constraint user_skills_user_id_fkey;
alter table public.user_skills add constraint user_skills_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

-- ── Profiles ────────────────────────────────────────────────────────────────
drop index if exists public.idx_profiles_id;
alter table public.profiles
  add column location text,
  add column organization text,
  add column timezone text,
  add column learning_goals text[] not null default '{}',
  add column github_url text,
  add column linkedin_url text,
  add column is_discoverable boolean not null default true;
alter table public.profiles
  add constraint profiles_full_name_len check (full_name is null or char_length(full_name) <= 80),
  add constraint profiles_headline_len check (headline is null or char_length(headline) <= 120),
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 600),
  add constraint profiles_location_len check (location is null or char_length(location) <= 80),
  add constraint profiles_org_len check (organization is null or char_length(organization) <= 80),
  add constraint profiles_goals_len check (cardinality(learning_goals) <= 6),
  add constraint profiles_github_url check (github_url is null or (github_url ~* '^https://' and char_length(github_url) <= 200)),
  add constraint profiles_linkedin_url check (linkedin_url is null or (linkedin_url ~* '^https://' and char_length(linkedin_url) <= 200));

-- people who "finished" onboarding with no skills are asked again
update public.profiles p set onboarding_completed = false
  where onboarding_completed and not exists (select 1 from public.user_skills us where us.user_id = p.id);

-- ── Swaps ───────────────────────────────────────────────────────────────────
create table public.swaps (
  id uuid primary key default gen_random_uuid(),
  proposer_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  offered_skill_id uuid not null references public.skills(id),
  requested_skill_id uuid not null references public.skills(id),
  message text check (message is null or char_length(message) <= 500),
  cadence text check (cadence is null or char_length(cadence) <= 80),
  status text not null default 'proposed' check (status in ('proposed','accepted','declined','cancelled','ended')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  ended_at timestamptz,
  last_message_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint swaps_not_self check (proposer_id <> recipient_id),
  constraint swaps_distinct_skills check (offered_skill_id <> requested_skill_id)
);
create unique index swaps_one_open_per_pair on public.swaps (least(proposer_id, recipient_id), greatest(proposer_id, recipient_id)) where status in ('proposed','accepted');
create index swaps_proposer_idx on public.swaps (proposer_id, status);
create index swaps_recipient_idx on public.swaps (recipient_id, status);
create trigger swaps_set_updated_at before update on public.swaps for each row execute function public.set_updated_at();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_swap_created_idx on public.messages (swap_id, created_at desc);

create table public.swap_reads (
  swap_id uuid not null references public.swaps(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (swap_id, user_id)
);

-- ── Sessions ────────────────────────────────────────────────────────────────
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id),
  starts_at timestamptz not null,
  duration_minutes int not null check (duration_minutes between 15 and 240),
  meeting_url text check (meeting_url is null or (meeting_url ~* '^https://' and char_length(meeting_url) <= 500)),
  notes text check (notes is null or char_length(notes) <= 500),
  proposed_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'proposed' check (status in ('proposed','confirmed','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_roles_differ check (teacher_id <> learner_id)
);
create index sessions_swap_idx on public.sessions (swap_id, starts_at);
create index sessions_teacher_idx on public.sessions (teacher_id, status);
create index sessions_learner_idx on public.sessions (learner_id, status);
create trigger sessions_set_updated_at before update on public.sessions for each row execute function public.set_updated_at();

create table public.vouches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id),
  note text check (note is null or char_length(note) <= 280),
  created_at timestamptz not null default now(),
  unique (session_id, from_id)
);
create index vouches_to_idx on public.vouches (to_id, created_at desc);

-- ── Asks ────────────────────────────────────────────────────────────────────
create table public.asks (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  wanted_skill_id uuid not null references public.skills(id),
  offered_skill_id uuid references public.skills(id),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  status text not null default 'open' check (status in ('open','closed')),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);
create index asks_open_idx on public.asks (status, expires_at desc);
create index asks_author_idx on public.asks (author_id);

insert into public.asks (author_id, wanted_skill_id, offered_skill_id, body, created_at)
select r.requester_id, w.id, o.id,
       left(coalesce(nullif(btrim(r.message), ''), 'I would like to learn ' || w.name || '.'), 500),
       r.created_at
from legacy.swap_requests r
join public.skills w on w.slug = lower(regexp_replace(btrim(r.skill_learn), '\s+', ' ', 'g'))
left join public.skills o on o.slug = lower(regexp_replace(btrim(r.skill_teach), '\s+', ' ', 'g'))
where r.receiver_id is null and r.requester_id in (select id from public.profiles);

-- ── Notifications, blocks, reports ──────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('swap_proposed','swap_accepted','swap_declined','swap_ended','message',
    'session_proposed','session_confirmed','session_declined','session_rescheduled','session_cancelled','session_completed','vouch_received')),
  swap_id uuid references public.swaps(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam','harassment','inappropriate_content','impersonation','safety','other')),
  details text check (details is null or char_length(details) <= 1000),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);
create index reports_reported_idx on public.reports (reported_id);
