-- Private storage bucket for campaign source documents
insert into storage.buckets (id, name, public)
values ('campaign-docs', 'campaign-docs', false)
on conflict (id) do nothing;

-- Users can upload to their own folder only
create policy "Users upload campaign docs"
  on storage.objects for insert
  with check (bucket_id = 'campaign-docs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users can read their own docs
create policy "Users read own campaign docs"
  on storage.objects for select
  using (bucket_id = 'campaign-docs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own docs
create policy "Users delete own campaign docs"
  on storage.objects for delete
  using (bucket_id = 'campaign-docs' and auth.uid()::text = (storage.foldername(name))[1]);
