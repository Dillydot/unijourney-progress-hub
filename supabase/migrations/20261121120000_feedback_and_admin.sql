-- In-app feedback, readable only by admins, plus the numbers for the admin page.

-- Admins are added by hand in the SQL editor:
--   insert into public.admins (user_id) select id from auth.users where email = '...';
create table public.admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table public.feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- Null when sent from the demo without signing in.
  user_id uuid default auth.uid() references auth.users on delete set null,
  category text not null check (category in ('bug', 'idea', 'data', 'design', 'other')),
  message text not null check (length(trim(message)) between 1 and 2000)
);
alter table public.feedback enable row level security;

-- Anyone may send feedback, but only as themselves (or anonymously when signed out).
create policy "send feedback" on public.feedback for insert to anon, authenticated
  with check (user_id is not distinct from (select auth.uid()));
create policy "admins read feedback" on public.feedback for select to authenticated
  using ((select public.is_admin()));

revoke all on public.feedback from anon, authenticated;
grant insert (category, message) on public.feedback to anon, authenticated;
grant select on public.feedback to authenticated;

-- One JSON object with the admin page's numbers; refuses anyone who is not an admin.
create function public.admin_metrics()
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
    'users', (select count(*) from auth.users),
    'new_users_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'active_users_7d', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
    'ladok_imports', (select count(*) from public.profiles),
    'ladok_imports_7d', (select count(*) from public.profiles where updated_at > now() - interval '7 days'),
    'courses', (select count(*) from public.courses),
    'feedback', (select count(*) from public.feedback),
    'feedback_7d', (select count(*) from public.feedback where created_at > now() - interval '7 days'),
    'feedback_by_category', coalesce(
      (select jsonb_object_agg(category, n) from (
        select category, count(*) as n from public.feedback group by category
      ) c), '{}'::jsonb),
    'top_programmes', coalesce(
      (select jsonb_agg(jsonb_build_object('code', code, 'name', name, 'students', n) order by n desc)
       from (
         select programme_code as code, max(programme_name) as name, count(*) as n
         from public.profiles
         where programme_code is not null
         group by programme_code
         order by n desc
         limit 10
       ) p), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.admin_metrics() from public, anon;
grant execute on function public.admin_metrics() to authenticated;
