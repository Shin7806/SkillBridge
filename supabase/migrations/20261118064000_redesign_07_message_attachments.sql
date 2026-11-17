-- SkillBridge 07: images and files in chat (max 4 MB each), visible only to the two swap members.
alter table public.messages
  add column attachment_path text,
  add column attachment_name text check (attachment_name is null or char_length(attachment_name) <= 200),
  add column attachment_type text check (attachment_type is null or char_length(attachment_type) <= 120),
  add column attachment_size int check (attachment_size is null or attachment_size between 1 and 4194304);

-- A message needs text, an attachment, or both.
alter table public.messages drop constraint messages_body_check;
alter table public.messages alter column body set default '';
alter table public.messages add constraint messages_body_or_attachment
  check (char_length(body) <= 2000 and (char_length(btrim(body)) > 0 or attachment_path is not null));
alter table public.messages add constraint messages_attachment_complete
  check ((attachment_path is null) = (attachment_name is null) and (attachment_path is null) = (attachment_size is null));

-- Attachments must live in the swap's own folder.
drop policy messages_insert_member_of_active_swap on public.messages;
create policy messages_insert_member_of_active_swap on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid())
    and (attachment_path is null or attachment_path like swap_id::text || '/%')
    and exists (select 1 from public.swaps s where s.id = swap_id and s.status = 'accepted'
      and (select auth.uid()) in (s.proposer_id, s.recipient_id)));

-- Private bucket: 4 MB cap, images and common documents only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 4194304, array[
  'image/jpeg','image/png','image/webp','image/gif',
  'application/pdf','text/plain','text/csv',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create function public.can_use_attachment_folder(p_folder text, p_write boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.swaps s
    where s.id::text = p_folder and auth.uid() in (s.proposer_id, s.recipient_id)
      and (not p_write or s.status = 'accepted'));
$$;
revoke all on function public.can_use_attachment_folder(text, boolean) from public, anon;
grant execute on function public.can_use_attachment_folder(text, boolean) to authenticated;

create policy attachments_read_members on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and public.can_use_attachment_folder((storage.foldername(name))[1], false));
create policy attachments_upload_members on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and owner_id = (select auth.uid())::text
    and public.can_use_attachment_folder((storage.foldername(name))[1], true));
create policy attachments_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and owner_id = (select auth.uid())::text);
