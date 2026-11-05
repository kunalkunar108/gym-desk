-- GymDesk single-gym MVP schema
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'staff');
create type public.membership_status as enum ('active', 'expired', 'cancelled');
create type public.payment_method as enum ('cash', 'upi', 'card', 'bank_transfer', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'staff',
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  member_code text unique not null,
  full_name text not null,
  phone text not null,
  email text,
  date_of_birth date,
  gender text,
  address text,
  emergency_contact text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index members_phone_idx on public.members(phone);
create index members_name_idx on public.members using gin (to_tsvector('simple', full_name));

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_days integer not null check (duration_days > 0),
  price numeric(10,2) not null check (price >= 0),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete restrict,
  plan_id uuid not null references public.membership_plans(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  status public.membership_status not null default 'active',
  amount numeric(10,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index memberships_member_idx on public.memberships(member_id);
create index memberships_end_date_idx on public.memberships(end_date);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete restrict,
  membership_id uuid references public.memberships(id) on delete set null,
  amount numeric(10,2) not null check (amount > 0),
  method public.payment_method not null,
  reference text,
  paid_at timestamptz not null default now(),
  received_by uuid references public.profiles(id) on delete set null,
  notes text
);
create index payments_paid_at_idx on public.payments(paid_at desc);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete restrict,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  checked_in_by uuid references public.profiles(id) on delete set null,
  notes text
);
create index attendance_checked_in_idx on public.attendance(checked_in_at desc);
create index attendance_member_idx on public.attendance(member_id, checked_in_at desc);

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare assigned_role public.app_role;
begin
  perform pg_advisory_xact_lock(734921);
  if not exists (select 1 from public.profiles where role = 'admin') then
    assigned_role := 'admin';
  else
    assigned_role := 'staff';
  end if;
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), assigned_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;

create policy "Authenticated users can read profiles"
on public.profiles for select to authenticated
using (id = auth.uid() or public.current_app_role() = 'admin');
create policy "Admins can update profiles"
on public.profiles for update to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "Staff can read members"
on public.members for select to authenticated using (public.current_app_role() in ('admin', 'staff'));
create policy "Staff can add members"
on public.members for insert to authenticated with check (public.current_app_role() in ('admin', 'staff'));
create policy "Staff can update members"
on public.members for update to authenticated using (public.current_app_role() in ('admin', 'staff')) with check (public.current_app_role() in ('admin', 'staff'));
create policy "Admins can delete members"
on public.members for delete to authenticated using (public.current_app_role() = 'admin');

create policy "Authenticated users can read plans"
on public.membership_plans for select to authenticated using (public.current_app_role() in ('admin', 'staff'));
create policy "Admins manage plans"
on public.membership_plans for all to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

create policy "Staff can read memberships"
on public.memberships for select to authenticated using (public.current_app_role() in ('admin', 'staff'));
create policy "Staff can create memberships"
on public.memberships for insert to authenticated with check (public.current_app_role() in ('admin', 'staff'));
create policy "Staff can update memberships"
on public.memberships for update to authenticated using (public.current_app_role() in ('admin', 'staff')) with check (public.current_app_role() in ('admin', 'staff'));
create policy "Admins can delete memberships"
on public.memberships for delete to authenticated using (public.current_app_role() = 'admin');

create policy "Staff can read payments"
on public.payments for select to authenticated using (public.current_app_role() in ('admin', 'staff'));
create policy "Staff can record payments"
on public.payments for insert to authenticated with check (public.current_app_role() in ('admin', 'staff'));
create policy "Admins can update payments"
on public.payments for update to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "Admins can delete payments"
on public.payments for delete to authenticated using (public.current_app_role() = 'admin');

create policy "Staff can read attendance"
on public.attendance for select to authenticated using (public.current_app_role() in ('admin', 'staff'));
create policy "Staff can record attendance"
on public.attendance for insert to authenticated with check (public.current_app_role() in ('admin', 'staff'));
create policy "Staff can update attendance"
on public.attendance for update to authenticated using (public.current_app_role() in ('admin', 'staff')) with check (public.current_app_role() in ('admin', 'staff'));
create policy "Admins can delete attendance"
on public.attendance for delete to authenticated using (public.current_app_role() = 'admin');
