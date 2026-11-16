-- Student data extracted in the browser from Ladok PDFs. The PDFs themselves,
-- names and personal identity numbers are never sent here.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  university text not null default 'KTH',
  programme_code text,
  programme_name text,
  programme_credits numeric(5, 1),
  programme_start date,
  programme_end date,
  transcript_printed date,
  registration_printed date,
  updated_at timestamptz not null default now()
);

create table public.courses (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  code text,
  name text not null,
  credits numeric(5, 1) not null,
  start_date date,
  end_date date,
  grade text check (grade in ('A', 'B', 'C', 'D', 'E', 'FX', 'F', 'P')),
  grade_date date,
  earned_credits numeric(5, 1) not null default 0,
  status text not null check (status in ('completed', 'ongoing', 'awaiting_result'))
);
create index courses_user_id_idx on public.courses (user_id);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;

create policy "own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "own courses" on public.courses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.profiles, public.courses from anon;
grant select, insert, update, delete on public.profiles, public.courses to authenticated;

-- Replaces the caller's profile and courses in one transaction, so a failed
-- import never leaves a student with their old courses deleted.
create function public.import_ladok(p_profile jsonb, p_courses jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  insert into public.profiles as p (
    id, display_name, programme_code, programme_name, programme_credits,
    programme_start, programme_end, transcript_printed, registration_printed, updated_at
  ) values (
    uid,
    p_profile ->> 'display_name',
    p_profile ->> 'programme_code',
    p_profile ->> 'programme_name',
    (p_profile ->> 'programme_credits')::numeric,
    (p_profile ->> 'programme_start')::date,
    (p_profile ->> 'programme_end')::date,
    (p_profile ->> 'transcript_printed')::date,
    (p_profile ->> 'registration_printed')::date,
    now()
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, p.display_name),
    programme_code = excluded.programme_code,
    programme_name = excluded.programme_name,
    programme_credits = excluded.programme_credits,
    programme_start = excluded.programme_start,
    programme_end = excluded.programme_end,
    transcript_printed = excluded.transcript_printed,
    registration_printed = excluded.registration_printed,
    updated_at = now();

  delete from public.courses where user_id = uid;

  insert into public.courses (
    user_id, code, name, credits, start_date, end_date, grade, grade_date, earned_credits, status
  )
  select uid, c.code, c.name, c.credits, c.start_date, c.end_date, c.grade, c.grade_date, c.earned_credits, c.status
  from jsonb_to_recordset(p_courses) as c(
    code text, name text, credits numeric, start_date date, end_date date,
    grade text, grade_date date, earned_credits numeric, status text
  );
end;
$$;

revoke execute on function public.import_ladok(jsonb, jsonb) from public, anon;
grant execute on function public.import_ladok(jsonb, jsonb) to authenticated;
