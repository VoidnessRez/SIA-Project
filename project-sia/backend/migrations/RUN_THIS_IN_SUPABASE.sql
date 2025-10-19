-- ========================================
-- COPY THIS ENTIRE FILE AND RUN IN SUPABASE SQL EDITOR
-- ========================================

-- 0) Enable pgcrypto extension
create extension if not exists pgcrypto;

-- 1) Create public.auth_users table (main auth table)
create table if not exists public.auth_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  email text unique not null,
  password text not null,
  created_at timestamptz default now()
);

-- Create case-insensitive unique indexes
create unique index if not exists auth_users_email_lower_idx on public.auth_users (lower(email));
create unique index if not exists auth_users_username_lower_idx on public.auth_users (lower(username));

-- 2) Create profiles table (1:1 with auth_users)
create table if not exists public.profiles (
  id uuid primary key,
  auth_id uuid references public.auth_users(id) on delete cascade,
  first_name text,
  last_name text,
  gender text,
  phone text,
  birthday date,
  status boolean default true,
  last_seen timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists profiles_auth_id_idx on public.profiles (auth_id);
create index if not exists profiles_last_seen_idx on public.profiles (last_seen);

-- 3) Create addresses table (1..N per profile)
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade,
  street text,
  barangay text,
  city text,
  province text,
  region text,
  zip_code text,
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists addresses_profile_id_idx on public.addresses (profile_id);

-- 4) Create function to auto-create profile when auth_users row is inserted
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  -- Create a profile placeholder
  insert into public.profiles (id, auth_id, created_at, updated_at)
  values (new.id, new.id, now(), now());
  return new;
end;
$$;

-- 5) Create trigger to auto-create profile
drop trigger if exists on_auth_user_created on public.auth_users;
create trigger on_auth_user_created
  after insert on public.auth_users
  for each row execute function public.handle_new_auth_user();

-- ========================================
-- DONE! You should now have 3 tables:
-- - public.auth_users (username, email, password)
-- - public.profiles (first_name, last_name, phone, gender, birthday)
-- - public.addresses (street, barangay, city, province, region, zip_code)
-- ========================================
