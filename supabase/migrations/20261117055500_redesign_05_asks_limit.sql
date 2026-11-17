-- SkillBridge redesign 05: the open-asks cap moves from the insert policy (which recursed into itself) to a trigger.
drop policy asks_insert_own on public.asks;
create policy asks_insert_own on public.asks for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'open'
    and exists (select 1 from public.profiles p where p.id = author_id and p.onboarding_completed));

create function public.enforce_ask_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.asks a where a.author_id = new.author_id and a.status = 'open' and a.expires_at > now()) >= 5 then
    raise exception 'You can have up to 5 open asks. Close one first.';
  end if;
  return new;
end $$;
revoke all on function public.enforce_ask_limit() from public, anon, authenticated;
create trigger asks_before_insert before insert on public.asks for each row execute function public.enforce_ask_limit();
