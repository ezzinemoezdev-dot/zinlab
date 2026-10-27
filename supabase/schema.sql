-- ZinLab database schema for Supabase. Run once in SQL Editor on a NEW project.
create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('admin','teacher');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('present','absent','late','excused');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Utilisateur',
  role public.user_role not null default 'teacher',
  created_at timestamptz not null default now()
);
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text not null default 'Secondaire',
  school_year text not null,
  archived boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(name, school_year)
);
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  full_name text not null,
  group_name text not null default 'A' check (group_name in ('A','B','C','D')),
  created_at timestamptz not null default now()
);
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  group_name text not null default 'A',
  session_date date not null,
  start_time time,
  end_time time,
  label text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (end_time is null or start_time is null or end_time > start_time)
);
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status public.attendance_status not null default 'present',
  note text,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(session_id, student_id)
);
create table if not exists public.computers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  room text not null default 'Laboratoire',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.computer_assignments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  computer_id uuid not null references public.computers(id),
  created_at timestamptz not null default now(),
  unique(session_id, student_id),
  unique(session_id, computer_id)
);
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  due_date date,
  coefficient numeric(5,2) not null default 1 check (coefficient > 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric(5,2) not null check (score >= 0 and score <= 20),
  recorded_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  unique(assignment_id, student_id)
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- New Auth users get a profile with the least-privilege teacher role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), 'teacher')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS is enabled on every table. Teachers can access academic records; admin controls users and computer inventory.
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.computers enable row level security;
alter table public.computer_assignments enable row level security;
alter table public.assignments enable row level security;
alter table public.grades enable row level security;

drop policy if exists "profiles read self or admin" on public.profiles;
create policy "profiles read self or admin" on public.profiles for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "admin update profiles" on public.profiles;
create policy "admin update profiles" on public.profiles for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Class creation is tied to its creator; administrators can read/manage all classes.
drop policy if exists "classes read authenticated" on public.classes;
create policy "classes read authenticated" on public.classes for select to authenticated using (true);
drop policy if exists "classes insert creator or admin" on public.classes;
create policy "classes insert creator or admin" on public.classes for insert to authenticated with check (created_by = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "classes update creator or admin" on public.classes;
create policy "classes update creator or admin" on public.classes for update to authenticated using (created_by = (select auth.uid()) or (select public.is_admin())) with check (created_by = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "classes delete creator or admin" on public.classes;
create policy "classes delete creator or admin" on public.classes for delete to authenticated using (created_by = (select auth.uid()) or (select public.is_admin()));

-- Academic records: authenticated staff can manage. Production deployments can tighten this to assigned classes.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['students','sessions','attendance','computer_assignments','assignments','grades'] LOOP
  EXECUTE format('drop policy if exists %I on public.%I', t || ' staff access', t);
  EXECUTE format('create policy %I on public.%I for all to authenticated using (true) with check (true)', t || ' staff access', t);
 END LOOP;
END $$;
drop policy if exists "computers read staff" on public.computers;
create policy "computers read staff" on public.computers for select to authenticated using (true);
drop policy if exists "computers admin write" on public.computers;
create policy "computers admin write" on public.computers for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Seed 30 workstation names; safe to rerun.
insert into public.computers(name) select 'PC' || lpad(n::text, 2, '0') from generate_series(1,30) n on conflict (name) do nothing;
