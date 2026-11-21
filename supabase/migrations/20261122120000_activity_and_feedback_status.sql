-- Daily activity for retention, a status on feedback, and weekly/funnel numbers for /admin.

-- One row per user per day they opened the app. auth.users.last_sign_in_at only
-- changes on a new sign-in link, so it misses students who stay signed in.
create table public.activity (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  primary key (user_id, day)
);
alter table public.activity enable row level security;
revoke all on public.activity from anon, authenticated;

create function public.track_activity()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.activity (user_id, day)
  select (select auth.uid()), (now() at time zone 'Europe/Stockholm')::date
  where (select auth.uid()) is not null
  on conflict do nothing;
$$;
revoke execute on function public.track_activity() from public, anon;
grant execute on function public.track_activity() to authenticated;

alter table public.feedback
  add column status text not null default 'new' check (status in ('new', 'seen', 'resolved'));
create policy "admins update feedback" on public.feedback for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
grant update (status) on public.feedback to authenticated;

create or replace function public.admin_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  this_week date := date_trunc('week', now() at time zone 'Europe/Stockholm')::date;
begin
  if not public.is_admin() then
    raise exception 'not an admin';
  end if;

  return jsonb_build_object(
    'users', (select count(*) from auth.users),
    'new_users_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'active_users_7d', (
      select count(distinct id) from (
        select user_id as id from public.activity where day > current_date - 7
        union all
        select id from auth.users where last_sign_in_at > now() - interval '7 days'
      ) a),
    'ladok_imports', (select count(*) from public.profiles),
    'ladok_imports_7d', (select count(*) from public.profiles where updated_at > now() - interval '7 days'),
    'courses', (select count(*) from public.courses),
    'feedback', (select count(*) from public.feedback),
    'feedback_7d', (select count(*) from public.feedback where created_at > now() - interval '7 days'),
    'feedback_new', (select count(*) from public.feedback where status = 'new'),
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
       ) p), '[]'::jsonb),
    -- Signed up -> imported Ladok -> came back on a later day -> still around a week after signing up.
    'funnel', (
      select jsonb_build_object(
        'signed_up', count(*),
        'imported', count(*) filter (where p.id is not null),
        'returned', count(*) filter (where back.later_day),
        'returned_after_7d', count(*) filter (where back.after_week),
        'old_enough_7d', count(*) filter (where u.created_at <= now() - interval '7 days'),
        'returned_after_30d', count(*) filter (where back.after_month),
        'old_enough_30d', count(*) filter (where u.created_at <= now() - interval '30 days')
      )
      from auth.users u
      left join public.profiles p on p.id = u.id
      cross join lateral (
        select
          coalesce(bool_or(a.day > u.created_at::date), false)
            or u.last_sign_in_at::date > u.created_at::date as later_day,
          coalesce(bool_or(a.day >= u.created_at::date + 7), false)
            or u.last_sign_in_at >= u.created_at + interval '7 days' as after_week,
          coalesce(bool_or(a.day >= u.created_at::date + 30), false)
            or u.last_sign_in_at >= u.created_at + interval '30 days' as after_month
        from public.activity a
        where a.user_id = u.id
      ) back
    ),
    -- Last 12 weeks (Monday start, Stockholm time), oldest first.
    'weekly', (
      select jsonb_agg(jsonb_build_object(
        'week', w.week,
        'signups', (
          select count(*) from auth.users
          where (created_at at time zone 'Europe/Stockholm')::date >= w.week
            and (created_at at time zone 'Europe/Stockholm')::date < w.week + 7),
        'active', (
          select count(distinct user_id) from public.activity
          where day >= w.week and day < w.week + 7)
      ) order by w.week)
      from (select (this_week - 7 * i) as week from generate_series(0, 11) as i) w
    )
  );
end;
$$;
