-- SkillBridge redesign 08: cover every foreign key in the app's tables with an index,
-- so joins and "on delete cascade" stay fast as the tables grow.
create index if not exists asks_offered_skill_idx on public.asks (offered_skill_id);
create index if not exists asks_wanted_skill_idx on public.asks (wanted_skill_id);
create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists notifications_actor_idx on public.notifications (actor_id);
create index if not exists notifications_session_idx on public.notifications (session_id);
create index if not exists notifications_swap_idx on public.notifications (swap_id);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists sessions_proposed_by_idx on public.sessions (proposed_by);
create index if not exists sessions_skill_idx on public.sessions (skill_id);
create index if not exists skills_category_idx on public.skills (category_id);
create index if not exists skills_created_by_idx on public.skills (created_by);
create index if not exists swap_reads_user_idx on public.swap_reads (user_id);
create index if not exists swaps_offered_skill_idx on public.swaps (offered_skill_id);
create index if not exists swaps_requested_skill_idx on public.swaps (requested_skill_id);
create index if not exists vouches_from_idx on public.vouches (from_id);
create index if not exists vouches_skill_idx on public.vouches (skill_id);
