-- title/type/package are leftovers from the pre-redesign schema (when a
-- project always had a title/type/package instead of business_name +
-- video_length). The new Production board never populates them, so
-- every insert failed on whichever NOT NULL column it hit first.
--
-- status also lost its default entirely: the "convert enum to text"
-- migration's final `drop type ... cascade` silently dropped the old
-- 'queued'::project_status default along with the enum, leaving status
-- NOT NULL with no default at all.

alter table public.projects
  alter column title   drop not null,
  alter column type    drop not null,
  alter column package drop not null;

alter table public.projects
  alter column status set default 'in_production';
