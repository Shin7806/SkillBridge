-- SkillBridge redesign 02: functions. Every rule that matters is enforced here, not in React.
-- All functions pin search_path and check auth.uid() themselves.

drop function if exists public.delete_user();

-- ── Auth trigger: profile row for every new user (never blocks sign-up) ─────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(left(btrim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')), 80), ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end $$;

-- ── Internal helpers (not callable by clients) ──────────────────────────────
create function public._uid() returns uuid
language plpgsql stable set search_path = '' as $$
declare v uuid := auth.uid();
begin
  if v is null then raise exception 'You need to be signed in.' using errcode = '28000'; end if;
  return v;
end $$;

create function public._notify(p_recipient uuid, p_actor uuid, p_type text, p_swap uuid, p_session uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (recipient_id, actor_id, type, swap_id, session_id)
  values (p_recipient, p_actor, p_type, p_swap, p_session);
$$;

create function public._blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.blocks x where (x.blocker_id = a and x.blocked_id = b) or (x.blocker_id = b and x.blocked_id = a));
$$;

create function public._skills_json(p_user uuid, p_type text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'level', us.level) order by s.name), '[]'::jsonb)
  from public.user_skills us join public.skills s on s.id = us.skill_id
  where us.user_id = p_user and us.skill_type = p_type;
$$;

create function public._overlap_json(p_teacher uuid, p_learner uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name) order by s.name), '[]'::jsonb)
  from public.user_skills t
  join public.user_skills l on l.skill_id = t.skill_id and l.user_id = p_learner and l.skill_type = 'learn'
  join public.skills s on s.id = t.skill_id
  where t.user_id = p_teacher and t.skill_type = 'teach';
$$;

-- used by RLS policies
create function public.is_swap_member(p_swap uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.swaps s where s.id = p_swap and auth.uid() in (s.proposer_id, s.recipient_id));
$$;

create function public.can_see_profile(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user = auth.uid()
    or exists (select 1 from public.profiles p where p.id = p_user and p.is_discoverable and p.onboarding_completed)
    or exists (select 1 from public.swaps s where auth.uid() in (s.proposer_id, s.recipient_id) and p_user in (s.proposer_id, s.recipient_id));
$$;

-- ── Public landing stats: three integers, nothing else ──────────────────────
create function public.public_stats() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'members', (select count(*) from public.profiles where onboarding_completed),
    'swaps', (select count(*) from public.swaps where status in ('accepted','ended')),
    'skills', (select count(distinct skill_id) from public.user_skills));
$$;

-- ── Skills ──────────────────────────────────────────────────────────────────
create function public.add_skill(p_name text, p_category_id uuid default null) returns public.skills
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public._uid();
  v_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_row public.skills;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 40 then
    raise exception 'Skill names need 2 to 40 characters.';
  end if;
  if v_name !~ '^[[:alnum:]][[:alnum:] .+#&/()''-]*$' then
    raise exception 'Skill names can use letters, numbers, spaces and . + # & / - only.';
  end if;
  select * into v_row from public.skills where slug = lower(v_name);
  if found then return v_row; end if;
  if (select count(*) from public.skills where created_by = v_uid) >= 20 then
    raise exception 'You have added the maximum number of new skills.';
  end if;
  insert into public.skills (name, slug, category_id, created_by)
  values (v_name, lower(v_name), coalesce(p_category_id, (select id from public.skill_categories where slug = 'other')), v_uid)
  returning * into v_row;
  return v_row;
end $$;

-- p_teach / p_learn: [{"skill_id": uuid, "level": "beginner"|"intermediate"|"advanced"|null}]
create function public.set_my_skills(p_teach jsonb, p_learn jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := public._uid();
  v_teach jsonb := coalesce(p_teach, '[]'::jsonb);
  v_learn jsonb := coalesce(p_learn, '[]'::jsonb);
begin
  if jsonb_typeof(v_teach) <> 'array' or jsonb_typeof(v_learn) <> 'array' then
    raise exception 'Skills must be lists.';
  end if;
  if jsonb_array_length(v_teach) > 12 or jsonb_array_length(v_learn) > 12 then
    raise exception 'You can list up to 12 skills on each side.';
  end if;
  if exists (select 1 from jsonb_array_elements(v_teach) t join jsonb_array_elements(v_learn) l on t->>'skill_id' = l->>'skill_id') then
    raise exception 'A skill cannot be on both your teach and learn lists.';
  end if;
  delete from public.user_skills where user_id = v_uid;
  insert into public.user_skills (user_id, skill_id, skill_type, level)
  select v_uid, x.skill_id, x.skill_type, x.level from (
    select distinct on (e->>'skill_id') (e->>'skill_id')::uuid as skill_id, 'teach' as skill_type, nullif(e->>'level', '') as level
    from jsonb_array_elements(v_teach) e
    union all
    select distinct on (e->>'skill_id') (e->>'skill_id')::uuid, 'learn', nullif(e->>'level', '')
    from jsonb_array_elements(v_learn) e
  ) x;
  update public.profiles set updated_at = now() where id = v_uid;
end $$;

create function public.complete_onboarding() returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid();
begin
  if not exists (select 1 from public.profiles where id = v_uid and char_length(btrim(coalesce(full_name, ''))) >= 2) then
    raise exception 'Add your name first.';
  end if;
  if not exists (select 1 from public.user_skills where user_id = v_uid and skill_type = 'teach') then
    raise exception 'Add at least one skill you can teach.';
  end if;
  if not exists (select 1 from public.user_skills where user_id = v_uid and skill_type = 'learn') then
    raise exception 'Add at least one skill you want to learn.';
  end if;
  update public.profiles set onboarding_completed = true where id = v_uid;
end $$;

-- ── Matching and discovery ──────────────────────────────────────────────────
create function public._person_card(p_me uuid, p public.profiles) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id, 'full_name', p.full_name, 'headline', p.headline, 'bio', p.bio, 'avatar_url', p.avatar_url,
    'location', p.location, 'organization', p.organization,
    'teaches', public._skills_json(p.id, 'teach'),
    'learns', public._skills_json(p.id, 'learn'),
    'they_teach', public._overlap_json(p.id, p_me),
    'they_want', public._overlap_json(p_me, p.id));
$$;

-- Two-way matches first, then one-way, each with the exact overlapping skills.
create function public.find_matches(p_limit int default 60) returns setof jsonb
language sql stable security definer set search_path = '' as $$
  with me as (select public._uid() as id),
  cand as (
    select p, public._overlap_json(p.id, me.id) as they_teach, public._overlap_json(me.id, p.id) as they_want, me.id as me_id
    from public.profiles p, me
    where p.id <> me.id and p.onboarding_completed and p.is_discoverable
      and not public._blocked_between(me.id, p.id)
  )
  select public._person_card(c.me_id, c.p) || jsonb_build_object('kind',
      case when jsonb_array_length(c.they_teach) > 0 and jsonb_array_length(c.they_want) > 0 then 'two_way'
           when jsonb_array_length(c.they_teach) > 0 then 'can_teach_me' else 'wants_my_skill' end)
  from cand c
  where jsonb_array_length(c.they_teach) > 0 or jsonb_array_length(c.they_want) > 0
  order by (jsonb_array_length(c.they_teach) > 0 and jsonb_array_length(c.they_want) > 0) desc,
           jsonb_array_length(c.they_teach) + jsonb_array_length(c.they_want) desc,
           (jsonb_array_length(c.they_teach) > 0) desc,
           (c.p).updated_at desc
  limit least(greatest(coalesce(p_limit, 60), 1), 100);
$$;

-- People who teach something matching the search, optionally within a category.
create function public.explore_people(p_query text default null, p_category_id uuid default null, p_limit int default 60) returns setof jsonb
language sql stable security definer set search_path = '' as $$
  with me as (select public._uid() as id),
  q as (select nullif(btrim(coalesce(p_query, '')), '') as term)
  select public._person_card(me.id, p)
  from public.profiles p, me, q
  where p.id <> me.id and p.onboarding_completed and p.is_discoverable
    and not public._blocked_between(me.id, p.id)
    and exists (
      select 1 from public.user_skills us join public.skills s on s.id = us.skill_id
      where us.user_id = p.id and us.skill_type = 'teach'
        and (p_category_id is null or s.category_id = p_category_id)
        and (q.term is null or s.name ilike '%' || replace(replace(q.term, '%', '\%'), '_', '\_') || '%'
             or p.full_name ilike '%' || replace(replace(q.term, '%', '\%'), '_', '\_') || '%'))
  order by p.updated_at desc
  limit least(greatest(coalesce(p_limit, 60), 1), 100);
$$;

create function public.get_person(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v_p public.profiles; v_out jsonb;
begin
  select * into v_p from public.profiles where id = p_user;
  if not found or not public.can_see_profile(p_user)
     or exists (select 1 from public.blocks where blocker_id = p_user and blocked_id = v_uid) then
    return null;
  end if;
  v_out := public._person_card(v_uid, v_p) || jsonb_build_object(
    'learning_goals', to_jsonb(v_p.learning_goals), 'github_url', v_p.github_url, 'linkedin_url', v_p.linkedin_url,
    'timezone', v_p.timezone, 'is_discoverable', v_p.is_discoverable, 'onboarding_completed', v_p.onboarding_completed,
    'created_at', v_p.created_at,
    'blocked_by_me', exists (select 1 from public.blocks where blocker_id = v_uid and blocked_id = p_user),
    'sessions_given', (select count(*) from public.sessions where teacher_id = p_user and status = 'completed'),
    'sessions_received', (select count(*) from public.sessions where learner_id = p_user and status = 'completed'),
    'vouches', coalesce((
      select jsonb_agg(v order by v->>'created_at' desc) from (
        select jsonb_build_object('id', v.id, 'note', v.note, 'created_at', v.created_at, 'skill', s.name,
                 'from_id', f.id, 'from_name', f.full_name, 'from_avatar', f.avatar_url) as v
        from public.vouches v join public.skills s on s.id = v.skill_id join public.profiles f on f.id = v.from_id
        where v.to_id = p_user order by v.created_at desc limit 20) x), '[]'::jsonb),
    'vouch_count', (select count(*) from public.vouches where to_id = p_user));
  return v_out;
end $$;

-- ── Swaps ───────────────────────────────────────────────────────────────────
create function public.my_swaps(p_swap uuid default null) returns setof jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', s.id, 'status', s.status, 'i_proposed', s.proposer_id = u.uid,
    'message', s.message, 'cadence', s.cadence,
    'created_at', s.created_at, 'responded_at', s.responded_at, 'ended_at', s.ended_at,
    'other', jsonb_build_object('id', o.id, 'full_name', o.full_name, 'avatar_url', o.avatar_url, 'headline', o.headline, 'timezone', o.timezone),
    'i_teach', jsonb_build_object('id', mt.id, 'name', mt.name),
    'i_learn', jsonb_build_object('id', ml.id, 'name', ml.name),
    'last_message', (select jsonb_build_object('body', m.body, 'sender_id', m.sender_id, 'created_at', m.created_at)
                     from public.messages m where m.swap_id = s.id order by m.created_at desc limit 1),
    'unread_count', (select count(*) from public.messages m where m.swap_id = s.id and m.sender_id <> u.uid
                     and m.created_at > coalesce((select r.last_read_at from public.swap_reads r where r.swap_id = s.id and r.user_id = u.uid), 'epoch'::timestamptz)),
    'next_session_at', (select min(x.starts_at) from public.sessions x where x.swap_id = s.id and x.status = 'confirmed'
                        and x.starts_at + make_interval(mins => x.duration_minutes) > now()),
    'sessions_to_answer', (select count(*) from public.sessions x where x.swap_id = s.id and x.status = 'proposed' and x.proposed_by <> u.uid),
    'sessions_given', (select count(*) from public.sessions x where x.swap_id = s.id and x.status = 'completed' and x.teacher_id = u.uid),
    'sessions_received', (select count(*) from public.sessions x where x.swap_id = s.id and x.status = 'completed' and x.learner_id = u.uid),
    'activity_at', greatest(s.created_at, coalesce(s.responded_at, s.created_at), coalesce(s.last_message_at, s.created_at)))
  from (select public._uid() as uid) u
  join public.swaps s on u.uid in (s.proposer_id, s.recipient_id)
  join public.profiles o on o.id = case when s.proposer_id = u.uid then s.recipient_id else s.proposer_id end
  join public.skills mt on mt.id = case when s.proposer_id = u.uid then s.offered_skill_id else s.requested_skill_id end
  join public.skills ml on ml.id = case when s.proposer_id = u.uid then s.requested_skill_id else s.offered_skill_id end
  where p_swap is null or s.id = p_swap
  order by greatest(s.created_at, coalesce(s.responded_at, s.created_at), coalesce(s.last_message_at, s.created_at)) desc;
$$;

create function public.propose_swap(p_recipient uuid, p_offered_skill uuid, p_requested_skill uuid, p_message text default null, p_cadence text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v_id uuid;
begin
  if p_recipient is null or p_recipient = v_uid then raise exception 'You cannot propose a swap to yourself.'; end if;
  if not exists (select 1 from public.profiles where id = v_uid and onboarding_completed) then
    raise exception 'Finish setting up your profile first.';
  end if;
  if not exists (select 1 from public.profiles where id = p_recipient and onboarding_completed)
     or public._blocked_between(v_uid, p_recipient) then
    raise exception 'This person is not available for swaps.';
  end if;
  if p_offered_skill is null or p_requested_skill is null or p_offered_skill = p_requested_skill then
    raise exception 'Choose two different skills.';
  end if;
  if not exists (select 1 from public.user_skills where user_id = v_uid and skill_id = p_offered_skill and skill_type = 'teach') then
    raise exception 'You can only offer a skill from your own teach list.';
  end if;
  if not exists (select 1 from public.user_skills where user_id = p_recipient and skill_id = p_requested_skill and skill_type = 'teach') then
    raise exception 'They do not list that skill as something they teach.';
  end if;
  if exists (select 1 from public.swaps where status in ('proposed','accepted')
             and least(proposer_id, recipient_id) = least(v_uid, p_recipient)
             and greatest(proposer_id, recipient_id) = greatest(v_uid, p_recipient)) then
    raise exception 'You already have an open swap with this person.';
  end if;
  if (select count(*) from public.swaps where proposer_id = v_uid and status = 'proposed') >= 20 then
    raise exception 'You have too many unanswered proposals. Cancel one before sending another.';
  end if;
  begin
    insert into public.swaps (proposer_id, recipient_id, offered_skill_id, requested_skill_id, message, cadence)
    values (v_uid, p_recipient, p_offered_skill, p_requested_skill, nullif(btrim(coalesce(p_message, '')), ''), nullif(btrim(coalesce(p_cadence, '')), ''))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'You already have an open swap with this person.';
  end;
  perform public._notify(p_recipient, v_uid, 'swap_proposed', v_id);
  return v_id;
end $$;

create function public.respond_to_swap(p_swap uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v public.swaps;
begin
  select * into v from public.swaps where id = p_swap for update;
  if not found or v.recipient_id <> v_uid then raise exception 'Proposal not found.'; end if;
  if v.status <> 'proposed' then raise exception 'This proposal has already been answered.'; end if;
  update public.swaps set status = case when p_accept then 'accepted' else 'declined' end, responded_at = now() where id = p_swap;
  update public.notifications set read_at = now() where recipient_id = v_uid and swap_id = p_swap and type = 'swap_proposed' and read_at is null;
  perform public._notify(v.proposer_id, v_uid, case when p_accept then 'swap_accepted' else 'swap_declined' end, p_swap);
end $$;

create function public.cancel_swap(p_swap uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v public.swaps;
begin
  select * into v from public.swaps where id = p_swap for update;
  if not found or v.proposer_id <> v_uid then raise exception 'Proposal not found.'; end if;
  if v.status <> 'proposed' then raise exception 'Only an unanswered proposal can be cancelled.'; end if;
  update public.swaps set status = 'cancelled', responded_at = now() where id = p_swap;
  delete from public.notifications where swap_id = p_swap and type = 'swap_proposed';
end $$;

create function public.end_swap(p_swap uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v public.swaps;
begin
  select * into v from public.swaps where id = p_swap for update;
  if not found or v_uid not in (v.proposer_id, v.recipient_id) then raise exception 'Swap not found.'; end if;
  if v.status <> 'accepted' then raise exception 'Only an active swap can be ended.'; end if;
  update public.swaps set status = 'ended', ended_at = now() where id = p_swap;
  update public.sessions set status = 'cancelled' where swap_id = p_swap and status in ('proposed','confirmed');
  perform public._notify(case when v.proposer_id = v_uid then v.recipient_id else v.proposer_id end, v_uid, 'swap_ended', p_swap);
end $$;

-- ── Messages ────────────────────────────────────────────────────────────────
create function public.on_message_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_other uuid;
begin
  update public.swaps set last_message_at = new.created_at where id = new.swap_id
    returning case when proposer_id = new.sender_id then recipient_id else proposer_id end into v_other;
  insert into public.swap_reads (swap_id, user_id, last_read_at) values (new.swap_id, new.sender_id, new.created_at)
    on conflict (swap_id, user_id) do update set last_read_at = excluded.last_read_at;
  if not exists (select 1 from public.notifications where recipient_id = v_other and swap_id = new.swap_id and type = 'message' and read_at is null) then
    perform public._notify(v_other, new.sender_id, 'message', new.swap_id);
  end if;
  return new;
end $$;
create trigger messages_after_insert after insert on public.messages for each row execute function public.on_message_insert();

create function public.mark_swap_read(p_swap uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid();
begin
  if not public.is_swap_member(p_swap) then raise exception 'Swap not found.'; end if;
  insert into public.swap_reads (swap_id, user_id, last_read_at) values (p_swap, v_uid, now())
    on conflict (swap_id, user_id) do update set last_read_at = excluded.last_read_at;
  update public.notifications set read_at = now() where recipient_id = v_uid and swap_id = p_swap and type = 'message' and read_at is null;
end $$;

-- ── Sessions ────────────────────────────────────────────────────────────────
create function public._session_for(p_session uuid, p_uid uuid) returns public.sessions
language plpgsql security definer set search_path = '' as $$
declare v public.sessions;
begin
  select * into v from public.sessions where id = p_session for update;
  if not found or p_uid not in (v.teacher_id, v.learner_id) then raise exception 'Session not found.'; end if;
  return v;
end $$;

create function public.propose_session(p_swap uuid, p_teacher uuid, p_starts_at timestamptz, p_duration int, p_meeting_url text default null, p_notes text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v public.swaps; v_other uuid; v_id uuid;
begin
  select * into v from public.swaps where id = p_swap;
  if not found or v_uid not in (v.proposer_id, v.recipient_id) then raise exception 'Swap not found.'; end if;
  if v.status <> 'accepted' then raise exception 'Sessions can only be planned in an active swap.'; end if;
  if p_teacher is null or p_teacher not in (v.proposer_id, v.recipient_id) then raise exception 'The teacher must be one of you two.'; end if;
  if p_starts_at is null or p_starts_at <= now() then raise exception 'Pick a time in the future.'; end if;
  if p_starts_at > now() + interval '180 days' then raise exception 'Pick a time within the next six months.'; end if;
  if (select count(*) from public.sessions where swap_id = p_swap and status in ('proposed','confirmed') and starts_at > now()) >= 12 then
    raise exception 'This swap already has plenty of upcoming sessions.';
  end if;
  v_other := case when v.proposer_id = v_uid then v.recipient_id else v.proposer_id end;
  insert into public.sessions (swap_id, teacher_id, learner_id, skill_id, starts_at, duration_minutes, meeting_url, notes, proposed_by)
  values (p_swap, p_teacher,
          case when p_teacher = v.proposer_id then v.recipient_id else v.proposer_id end,
          case when p_teacher = v.proposer_id then v.offered_skill_id else v.requested_skill_id end,
          p_starts_at, p_duration, nullif(btrim(coalesce(p_meeting_url, '')), ''), nullif(btrim(coalesce(p_notes, '')), ''), v_uid)
  returning id into v_id;
  perform public._notify(v_other, v_uid, 'session_proposed', p_swap, v_id);
  return v_id;
end $$;

create function public.respond_to_session(p_session uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v public.sessions := public._session_for(p_session, v_uid);
begin
  if v.status <> 'proposed' then raise exception 'This session is no longer waiting for an answer.'; end if;
  if v.proposed_by = v_uid then raise exception 'The other person needs to answer this one.'; end if;
  if p_accept and v.starts_at <= now() then raise exception 'That time has passed. Suggest a new one.'; end if;
  update public.sessions set status = case when p_accept then 'confirmed' else 'cancelled' end where id = p_session;
  update public.notifications set read_at = now() where recipient_id = v_uid and session_id = p_session and read_at is null;
  perform public._notify(v.proposed_by, v_uid, case when p_accept then 'session_confirmed' else 'session_declined' end, v.swap_id, p_session);
end $$;

-- Changing the time hands the decision back to the other person.
create function public.reschedule_session(p_session uuid, p_starts_at timestamptz, p_duration int default null) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v public.sessions := public._session_for(p_session, v_uid);
begin
  if v.status not in ('proposed','confirmed') then raise exception 'This session can no longer be changed.'; end if;
  if p_starts_at is null or p_starts_at <= now() then raise exception 'Pick a time in the future.'; end if;
  update public.sessions set starts_at = p_starts_at, duration_minutes = coalesce(p_duration, duration_minutes), proposed_by = v_uid, status = 'proposed'
    where id = p_session;
  perform public._notify(case when v.teacher_id = v_uid then v.learner_id else v.teacher_id end, v_uid, 'session_rescheduled', v.swap_id, p_session);
end $$;

create function public.set_session_link(p_session uuid, p_meeting_url text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v public.sessions := public._session_for(p_session, v_uid);
begin
  if v.status not in ('proposed','confirmed') then raise exception 'This session can no longer be changed.'; end if;
  update public.sessions set meeting_url = nullif(btrim(coalesce(p_meeting_url, '')), '') where id = p_session;
end $$;

create function public.cancel_session(p_session uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v public.sessions := public._session_for(p_session, v_uid);
begin
  if v.status not in ('proposed','confirmed') then raise exception 'This session is already closed.'; end if;
  update public.sessions set status = 'cancelled' where id = p_session;
  perform public._notify(case when v.teacher_id = v_uid then v.learner_id else v.teacher_id end, v_uid, 'session_cancelled', v.swap_id, p_session);
end $$;

create function public.complete_session(p_session uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v public.sessions := public._session_for(p_session, v_uid);
begin
  if v.status <> 'confirmed' then raise exception 'Only a confirmed session can be marked as done.'; end if;
  if v.starts_at > now() then raise exception 'This session has not started yet.'; end if;
  update public.sessions set status = 'completed' where id = p_session;
  perform public._notify(case when v.teacher_id = v_uid then v.learner_id else v.teacher_id end, v_uid, 'session_completed', v.swap_id, p_session);
end $$;

create function public.add_vouch(p_session uuid, p_note text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid(); v public.sessions := public._session_for(p_session, v_uid); v_id uuid;
begin
  if v.status <> 'completed' then raise exception 'You can vouch once the session is marked as done.'; end if;
  if v.learner_id <> v_uid then raise exception 'Only the learner can vouch for a session.'; end if;
  begin
    insert into public.vouches (session_id, from_id, to_id, skill_id, note)
    values (p_session, v_uid, v.teacher_id, v.skill_id, nullif(btrim(coalesce(p_note, '')), '')) returning id into v_id;
  exception when unique_violation then
    raise exception 'You have already vouched for this session.';
  end;
  perform public._notify(v.teacher_id, v_uid, 'vouch_received', v.swap_id, p_session);
  return v_id;
end $$;

-- ── Notifications ───────────────────────────────────────────────────────────
create function public.mark_notifications_read(p_ids uuid[] default null) returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now()
  where recipient_id = public._uid() and read_at is null and (p_ids is null or id = any(p_ids));
$$;

-- ── Safety ──────────────────────────────────────────────────────────────────
create function public.block_user(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid();
begin
  if p_user is null or p_user = v_uid then raise exception 'You cannot block yourself.'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (v_uid, p_user) on conflict do nothing;
  update public.sessions set status = 'cancelled'
    where status in ('proposed','confirmed') and v_uid in (teacher_id, learner_id) and p_user in (teacher_id, learner_id);
  update public.swaps set
      status = case when status = 'accepted' then 'ended' when proposer_id = v_uid then 'cancelled' else 'declined' end,
      ended_at = case when status = 'accepted' then now() else ended_at end,
      responded_at = coalesce(responded_at, now())
    where status in ('proposed','accepted') and v_uid in (proposer_id, recipient_id) and p_user in (proposer_id, recipient_id);
  delete from public.notifications where recipient_id = v_uid and actor_id = p_user;
end $$;

create function public.unblock_user(p_user uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.blocks where blocker_id = public._uid() and blocked_id = p_user;
$$;

create function public.report_user(p_user uuid, p_reason text, p_details text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid();
begin
  if p_user is null or p_user = v_uid then raise exception 'You cannot report yourself.'; end if;
  if (select count(*) from public.reports where reporter_id = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You have sent several reports today. Please try again tomorrow.';
  end if;
  insert into public.reports (reporter_id, reported_id, reason, details)
  values (v_uid, p_user, p_reason, nullif(btrim(coalesce(p_details, '')), ''));
end $$;

-- Removes the auth user; every owned row goes with it through foreign keys.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := public._uid();
begin
  delete from auth.users where id = v_uid;
end $$;
