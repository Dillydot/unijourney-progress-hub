-- Failed Ladok imports, so admins see who gets stuck on the first step.
-- Only the kind of failure is stored: never PDF text, names or personal identity numbers.

create table public.import_failures (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  -- 'read': a PDF could not be parsed; 'save': saving the parsed data failed.
  stage text not null check (stage in ('read', 'save')),
  -- LadokError code (swedish, wrong_document, missing_codes, unreadable, no_programme) or save_<postgres code>.
  code text not null check (code ~ '^[a-z0-9_]{1,40}$'),
  document text check (document in ('transcript', 'registration', 'other')),
  detail text check (length(detail) <= 300)
);
alter table public.import_failures enable row level security;

create policy "log own import failure" on public.import_failures for insert to authenticated
  with check (user_id = (select auth.uid()));

revoke all on public.import_failures from anon, authenticated;
grant insert (stage, code, document, detail) on public.import_failures to authenticated;

-- Admins read failures only through this function.
create function public.admin_import_failures()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not an admin';
  end if;

  return jsonb_build_object(
    'failures_7d', (select count(*) from public.import_failures where created_at > now() - interval '7 days'),
    'users_failed', (select count(distinct user_id) from public.import_failures),
    -- Failed at least once and still have no saved Ladok data.
    'users_stuck', (
      select count(distinct f.user_id) from public.import_failures f
      where not exists (select 1 from public.profiles p where p.id = f.user_id)),
    'by_code', coalesce(
      (select jsonb_object_agg(code, n) from (
        select code, count(*) as n from public.import_failures group by code
      ) c), '{}'::jsonb),
    'recent', coalesce(
      (select jsonb_agg(r order by r.created_at desc) from (
        select f.created_at, f.stage, f.code, f.document, f.detail,
          exists (select 1 from public.profiles p where p.id = f.user_id) as fixed_later
        from public.import_failures f
        order by f.created_at desc
        limit 50
      ) r), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.admin_import_failures() from public, anon;
grant execute on function public.admin_import_failures() to authenticated;
