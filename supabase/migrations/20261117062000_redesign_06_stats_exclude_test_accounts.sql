-- SkillBridge redesign 06: landing-page totals ignore the automated test accounts (@skillbridge.test).
create or replace function public.public_stats() returns jsonb
language sql stable security definer set search_path = '' as $$
  with real_users as (
    select p.id from public.profiles p join auth.users u on u.id = p.id
    where p.onboarding_completed and u.email not like '%@skillbridge.test'
  )
  select jsonb_build_object(
    'members', (select count(*) from real_users),
    'swaps', (select count(*) from public.swaps s where s.status in ('accepted','ended')
              and s.proposer_id in (select id from real_users) and s.recipient_id in (select id from real_users)),
    'skills', (select count(distinct us.skill_id) from public.user_skills us where us.user_id in (select id from real_users)));
$$;
