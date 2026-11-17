-- SkillBridge redesign 03: row level security, grants, storage, realtime.
-- Anonymous visitors get nothing except public_stats().

-- ── Remove every old policy on kept tables ──────────────────────────────────
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public' and tablename in ('profiles','skills','user_skills') loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.skill_categories enable row level security;
alter table public.swaps enable row level security;
alter table public.messages enable row level security;
alter table public.swap_reads enable row level security;
alter table public.sessions enable row level security;
alter table public.vouches enable row level security;
alter table public.asks enable row level security;
alter table public.notifications enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

-- ── Table privileges: start from nothing ────────────────────────────────────
revoke all on all tables in schema public from anon, authenticated;
grant select, insert on public.profiles to authenticated;
grant update (full_name, headline, bio, avatar_url, location, organization, timezone, learning_goals, github_url, linkedin_url, is_discoverable)
  on public.profiles to authenticated;
grant select on public.skills, public.skill_categories, public.user_skills, public.swaps, public.swap_reads,
  public.sessions, public.vouches, public.notifications, public.blocks to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, delete on public.asks to authenticated;
grant update (status) on public.asks to authenticated;

-- ── Policies ────────────────────────────────────────────────────────────────
create policy profiles_select on public.profiles for select to authenticated
  using (public.can_see_profile(id));
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check (id = (select auth.uid()) and onboarding_completed = false);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy skills_select on public.skills for select to authenticated using (true);
create policy skill_categories_select on public.skill_categories for select to authenticated using (true);

create policy user_skills_select on public.user_skills for select to authenticated
  using (public.can_see_profile(user_id));

create policy swaps_select_members on public.swaps for select to authenticated
  using ((select auth.uid()) in (proposer_id, recipient_id));

create policy messages_select_members on public.messages for select to authenticated
  using (public.is_swap_member(swap_id));
create policy messages_insert_member_of_active_swap on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and exists (
    select 1 from public.swaps s where s.id = swap_id and s.status = 'accepted'
      and (select auth.uid()) in (s.proposer_id, s.recipient_id)));

create policy swap_reads_select_own on public.swap_reads for select to authenticated
  using (user_id = (select auth.uid()));

create policy sessions_select_members on public.sessions for select to authenticated
  using ((select auth.uid()) in (teacher_id, learner_id));

create policy vouches_select on public.vouches for select to authenticated using (true);

create policy asks_select on public.asks for select to authenticated
  using (author_id = (select auth.uid()) or (status = 'open' and expires_at > now()));
create policy asks_insert_own on public.asks for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'open'
    and exists (select 1 from public.profiles p where p.id = author_id and p.onboarding_completed)
    and (select count(*) from public.asks a where a.author_id = (select auth.uid()) and a.status = 'open' and a.expires_at > now()) < 5);
create policy asks_update_own on public.asks for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy asks_delete_own on public.asks for delete to authenticated
  using (author_id = (select auth.uid()));

create policy notifications_select_own on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));

create policy blocks_select_own on public.blocks for select to authenticated
  using (blocker_id = (select auth.uid()));
-- reports: no client policies. Written through report_user(), read by the owner in the dashboard.

-- ── Function privileges ─────────────────────────────────────────────────────
revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.is_swap_member(uuid), public.can_see_profile(uuid),
  public.add_skill(text, uuid), public.set_my_skills(jsonb, jsonb), public.complete_onboarding(),
  public.find_matches(int), public.explore_people(text, uuid, int), public.get_person(uuid),
  public.my_swaps(uuid), public.propose_swap(uuid, uuid, uuid, text, text), public.respond_to_swap(uuid, boolean),
  public.cancel_swap(uuid), public.end_swap(uuid), public.mark_swap_read(uuid),
  public.propose_session(uuid, uuid, timestamptz, int, text, text), public.respond_to_session(uuid, boolean),
  public.reschedule_session(uuid, timestamptz, int), public.set_session_link(uuid, text),
  public.cancel_session(uuid), public.complete_session(uuid), public.add_vouch(uuid, text),
  public.mark_notifications_read(uuid[]), public.block_user(uuid), public.unblock_user(uuid),
  public.report_user(uuid, text, text), public.delete_my_account()
  to authenticated;
grant execute on function public.public_stats() to anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ── Storage: avatars ────────────────────────────────────────────────────────
drop policy if exists "Allow authenticated uploads 1oj01fe_0" on storage.objects;
drop policy if exists "Allow updates 1oj01fe_0" on storage.objects;
drop policy if exists "Allow updates 1oj01fe_1" on storage.objects;
drop policy if exists "Public read 1oj01fe_0" on storage.objects;
-- Public bucket: files stay readable by exact URL. Nobody can list other people's files.
create policy avatars_select_own on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ── Realtime ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.messages, public.notifications, public.swaps, public.sessions;
