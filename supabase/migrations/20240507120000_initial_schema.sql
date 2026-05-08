-- RH Portal — schéma initial + RLS
-- Exécuter via Supabase CLI (`supabase db push`) ou SQL Editor du dashboard.

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  email text not null unique,
  first_name text not null,
  last_name text not null,
  job_title text,
  department text,
  manager_name text,
  hire_date date,
  internal_id text,
  phone_work text,
  phone_personal text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('rh', 'employee')),
  employee_id uuid references public.employees (id) on delete set null
);

create index idx_profiles_employee_id on public.profiles (employee_id);
create index idx_employees_user_id on public.employees (user_id);
create index idx_employees_email on public.employees (lower(email));

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type text not null,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  comment_rh text,
  handled_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_requests_date_range check (end_date >= start_date)
);

create index idx_leave_requests_employee on public.leave_requests (employee_id);
create index idx_leave_requests_status on public.leave_requests (status);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger employees_set_updated_at
  before update on public.employees
  for each row execute procedure public.set_updated_at();

create trigger leave_requests_set_updated_at
  before update on public.leave_requests
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth: liaison e-mail employé + profil par défaut
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  emp_id uuid;
begin
  select id into emp_id
  from public.employees
  where lower(email) = lower(new.email)
    and user_id is null
  limit 1;

  if emp_id is not null then
    update public.employees
    set user_id = new.id
    where id = emp_id;
    insert into public.profiles (user_id, role, employee_id)
    values (new.id, 'employee', emp_id);
  else
    insert into public.profiles (user_id, role, employee_id)
    values (new.id, 'employee', null);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers RLS (stable, lecture contrôlée)
-- ---------------------------------------------------------------------------

create or replace function public.is_rh()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'rh' from public.profiles p where p.user_id = auth.uid()),
    false
  );
$$;

create or replace function public.current_profile_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employee_id from public.profiles where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.employees enable row level security;
alter table public.profiles enable row level security;
alter table public.leave_requests enable row level security;

-- profiles
create policy profiles_select_own_or_rh on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_rh());

create policy profiles_update_rh on public.profiles
  for update to authenticated
  using (public.is_rh())
  with check (public.is_rh());

-- employees
create policy employees_select on public.employees
  for select to authenticated
  using (
    public.is_rh()
    or user_id = auth.uid()
    or id = public.current_profile_employee_id()
  );

create policy employees_insert_rh on public.employees
  for insert to authenticated
  with check (public.is_rh());

create policy employees_update_rh on public.employees
  for update to authenticated
  using (public.is_rh())
  with check (public.is_rh());

-- leave_requests
create policy leave_requests_select on public.leave_requests
  for select to authenticated
  using (
    public.is_rh()
    or employee_id = public.current_profile_employee_id()
  );

create policy leave_requests_insert_employee on public.leave_requests
  for insert to authenticated
  with check (
    not public.is_rh()
    and employee_id = public.current_profile_employee_id()
    and public.current_profile_employee_id() is not null
    and status = 'pending'
  );

create policy leave_requests_update_rh on public.leave_requests
  for update to authenticated
  using (public.is_rh())
  with check (public.is_rh());

create policy leave_requests_cancel_own on public.leave_requests
  for update to authenticated
  using (
    not public.is_rh()
    and employee_id = public.current_profile_employee_id()
    and status = 'pending'
  )
  with check (
    employee_id = public.current_profile_employee_id()
    and status = 'cancelled'
  );
