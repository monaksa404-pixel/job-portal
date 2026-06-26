-- =====================================================================
-- JOB EXPERT - Initial Schema
-- Run this in your Supabase Dashboard -> SQL Editor (one time).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ENUMS ---------------------------------------------------------------
do $$ begin create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null; end $$;
do $$ begin create type public.gender_type as enum ('male', 'female');
exception when duplicate_object then null; end $$;
do $$ begin create type public.job_status as enum ('active', 'closed', 'draft');
exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;
do $$ begin create type public.application_status as enum ('under_review', 'accepted', 'rejected');
exception when duplicate_object then null; end $$;

-- PROFILES ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  nationality text,
  country text,
  gender public.gender_type,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles self select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Profiles self insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Profiles self update" on public.profiles for update to authenticated using (auth.uid() = id);

-- USER ROLES ----------------------------------------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Roles self select" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Auto-create profile + role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- CATEGORIES ----------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text not null default 'briefcase',
  color text not null default 'blue',
  status boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Categories public read" on public.categories for select to anon, authenticated using (status = true);
create policy "Categories admin all" on public.categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- JOBS ----------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company_name text not null,
  company_logo_url text,
  category_id uuid references public.categories(id) on delete set null,
  salary numeric not null,
  salary_currency text not null default 'SAR',
  salary_period text not null default 'Monthly',
  location text not null,
  job_type text not null default 'Full Time',
  work_mode text not null default 'On Site',
  duty_timing text not null default '8 Hours / Day',
  experience_required text not null default '1 - 2 Years',
  male_required int not null default 0,
  female_required int not null default 0,
  accommodation boolean not null default false,
  food boolean not null default false,
  transport boolean not null default false,
  medical_insurance boolean not null default false,
  overtime boolean not null default false,
  application_fee numeric not null default 10,
  description text not null default '',
  responsibilities text[] not null default '{}',
  rating numeric not null default 4.5,
  reviews_count int not null default 0,
  verified boolean not null default true,
  status public.job_status not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists jobs_category_idx on public.jobs(category_id);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_created_idx on public.jobs(created_at desc);
grant select on public.jobs to anon, authenticated;
grant all on public.jobs to service_role;
alter table public.jobs enable row level security;
create policy "Jobs public read" on public.jobs for select to anon, authenticated using (status = 'active');
create policy "Jobs admin all" on public.jobs for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- APPLICATIONS --------------------------------------------------------
create sequence if not exists public.application_seq start with 1;
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  application_id text not null unique
    default ('APP-' || lpad(nextval('public.application_seq')::text, 6, '0')),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  full_name text not null,
  email text,
  phone text not null,
  date_of_birth date,
  gender public.gender_type,
  nationality text,
  current_location text,
  marital_status text,
  in_saudi_arabia boolean,
  iqama_status text,
  iqama_profession text,
  iqama_number text,
  iqama_expiry date,
  experience text,
  cv_url text,
  passport_url text,
  recharge_pin text not null,
  amount_paid numeric not null default 0,
  payment_status public.payment_status not null default 'pending',
  application_status public.application_status not null default 'under_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists applications_user_idx on public.applications(user_id);
create index if not exists applications_job_idx on public.applications(job_id);
grant select, insert, update on public.applications to authenticated;
grant all on public.applications to service_role;
alter table public.applications enable row level security;
create policy "Applications self read" on public.applications for select to authenticated using (auth.uid() = user_id);
create policy "Applications self insert" on public.applications for insert to authenticated with check (auth.uid() = user_id);
create policy "Applications admin all" on public.applications for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- MESSAGES ------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  title text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "Messages self read" on public.messages for select to authenticated using (auth.uid() = user_id);
create policy "Messages self update" on public.messages for update to authenticated using (auth.uid() = user_id);
create policy "Messages admin all" on public.messages for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS -------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Notifications self read" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "Notifications self update" on public.notifications for update to authenticated using (auth.uid() = user_id);
create policy "Notifications admin all" on public.notifications for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- POPUPS --------------------------------------------------------------
create table if not exists public.popups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  is_viewed boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.popups to authenticated;
grant all on public.popups to service_role;
alter table public.popups enable row level security;
create policy "Popups self read" on public.popups for select to authenticated using (auth.uid() = user_id);
create policy "Popups self update" on public.popups for update to authenticated using (auth.uid() = user_id);
create policy "Popups admin all" on public.popups for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- STORAGE BUCKETS -----------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('cv', 'cv', false),
  ('passport', 'passport', false)
on conflict (id) do nothing;

create policy "Auth upload cv" on storage.objects for insert to authenticated
  with check (bucket_id = 'cv' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Auth read own cv" on storage.objects for select to authenticated
  using (bucket_id = 'cv' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Admin read cv" on storage.objects for select to authenticated
  using (bucket_id = 'cv' and public.has_role(auth.uid(), 'admin'));
create policy "Auth upload passport" on storage.objects for insert to authenticated
  with check (bucket_id = 'passport' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Auth read own passport" on storage.objects for select to authenticated
  using (bucket_id = 'passport' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Admin read passport" on storage.objects for select to authenticated
  using (bucket_id = 'passport' and public.has_role(auth.uid(), 'admin'));

-- SEED CATEGORIES -----------------------------------------------------
insert into public.categories (name, slug, icon, color, sort_order) values
  ('Healthcare',   'healthcare',   'stethoscope',   'teal',    1),
  ('Driver',       'driver',       'truck',         'blue',    2),
  ('Electrician',  'electrician',  'zap',           'yellow',  3),
  ('Technician',   'technician',   'wrench',        'purple',  4),
  ('Construction', 'construction', 'hard-hat',      'orange',  5),
  ('Hotel',        'hotel',        'building',      'pink',    6),
  ('Restaurant',   'restaurant',   'utensils',      'green',   7),
  ('IT',           'it',           'monitor',       'blue',    8),
  ('Sales',        'sales',        'shopping-cart', 'red',     9),
  ('Security',     'security',     'shield',        'teal',    10),
  ('Factory',      'factory',      'factory',       'purple',  11),
  ('Cleaner',      'cleaner',      'sparkles',      'amber',   12),
  ('Other',        'other',        'grid',          'gray',    13)
on conflict (name) do nothing;

-- =====================================================================
-- USER FLOW EXTENSION (idempotent; safe to re-run)
-- =====================================================================

-- SAVED JOBS ----------------------------------------------------------
create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id  uuid not null references public.jobs(id)   on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);
grant select, insert, delete on public.saved_jobs to authenticated;
grant all on public.saved_jobs to service_role;
alter table public.saved_jobs enable row level security;
create policy "Saved self select" on public.saved_jobs for select to authenticated using (auth.uid() = user_id);
create policy "Saved self insert" on public.saved_jobs for insert to authenticated with check (auth.uid() = user_id);
create policy "Saved self delete" on public.saved_jobs for delete to authenticated using (auth.uid() = user_id);

-- USER DOCUMENTS ------------------------------------------------------
create table if not exists public.user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'other',
  name text not null,
  url  text not null,
  size_bytes bigint default 0,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.user_documents to authenticated;
grant all on public.user_documents to service_role;
alter table public.user_documents enable row level security;
create policy "Docs self select" on public.user_documents for select to authenticated using (auth.uid() = user_id);
create policy "Docs self insert" on public.user_documents for insert to authenticated with check (auth.uid() = user_id);
create policy "Docs self delete" on public.user_documents for delete to authenticated using (auth.uid() = user_id);

-- NOTIFICATION PREFERENCES -------------------------------------------
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  job_alerts boolean not null default true,
  application_updates boolean not null default true,
  system_updates boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.notification_preferences to authenticated;
grant all on public.notification_preferences to service_role;
alter table public.notification_preferences enable row level security;
create policy "Prefs self all" on public.notification_preferences for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- SUPPORT TICKETS -----------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  message text not null,
  status  text not null default 'open',
  created_at timestamptz not null default now()
);
grant select, insert on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;
alter table public.support_tickets enable row level security;
create policy "Tickets self select" on public.support_tickets for select to authenticated using (auth.uid() = user_id);
create policy "Tickets self insert" on public.support_tickets for insert to authenticated with check (auth.uid() = user_id);
create policy "Tickets admin all"   on public.support_tickets for all    to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS columns used by UI -----------------------------------
alter table public.notifications add column if not exists type text not null default 'system';
alter table public.notifications add column if not exists link text;

-- AVATARS bucket ------------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;
do $$ begin
  create policy "Avatars public read" on storage.objects for select to anon, authenticated using (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Avatars self write" on storage.objects for insert to authenticated
    with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Avatars self update" on storage.objects for update to authenticated
    using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;

-- DOCUMENTS bucket ----------------------------------------------------
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;
do $$ begin
  create policy "Docs self upload" on storage.objects for insert to authenticated
    with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Docs self read" on storage.objects for select to authenticated
    using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Docs self delete" on storage.objects for delete to authenticated
    using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;

-- AVATAR url on profile ----------------------------------------------
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists date_of_birth date;

-- REALTIME ------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.popups;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.applications;
exception when others then null; end $$;