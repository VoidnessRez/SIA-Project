-- Local development auth + profiles + addresses migration
-- WARNING: This creates a local `app_auth` table that stores passwords in plain text.
-- DO NOT use this in production. Use Supabase Auth or hash passwords before storing.

-- 0) enable pgcrypto (for gen_random_uuid)
create extension if not exists pgcrypto;

-- 1) app_auth table (local auth for development; stores username/email/password)
create table if not exists backend.app_auth (
  id uuid default gen_random_uuid() primary key,
  username text not null,
  email text not null,
  password text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists app_auth_username_lower_idx on backend.app_auth (lower(username));
create unique index if not exists app_auth_email_lower_idx on backend.app_auth (lower(email));

-- Create a public auth_users table so auth lives in the public schema (dev-only)
create table if not exists public.auth_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  username text unique not null,
  password text not null,
  created_at timestamptz default now()
);
create unique index if not exists auth_users_email_lower_idx on public.auth_users (lower(email));
create unique index if not exists auth_users_username_lower_idx on public.auth_users (lower(username));

-- 2) profiles table (1:1 with app_auth)
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
create index if not exists profiles_last_seen_idx on public.profiles (last_seen);

-- 3) addresses table (1..N per profile)
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

-- 4) helper: create profile automatically when app_auth row is created (idempotent)
create or replace function backend.handle_new_local_auth_user()
returns trigger language plpgsql security definer as $$
begin
  -- create a profile placeholder if missing
  if not exists (select 1 from public.profiles where auth_id = new.id) then
    insert into public.profiles (id, auth_id, created_at, updated_at)
    values (new.id, new.id, now(), now());
  end if;
  return new;
end;
$$;

-- create trigger on backend.app_auth (idempotent check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger t
    JOIN pg_catalog.pg_class c ON t.tgrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname = 'on_local_auth_user_created'
      AND n.nspname = 'backend'
      AND c.relname = 'app_auth'
  ) THEN
    PERFORM pg_catalog.set_config('search_path', 'backend,public', false);
    EXECUTE 'CREATE TRIGGER on_local_auth_user_created AFTER INSERT ON backend.app_auth FOR EACH ROW EXECUTE PROCEDURE backend.handle_new_local_auth_user()';
  END IF;
END$$;

    -- create trigger on public.auth_users so profiles are created when auth_users are inserted (idempotent)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_trigger t
        JOIN pg_catalog.pg_class c ON t.tgrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        WHERE t.tgname = 'on_public_auth_user_created'
          AND n.nspname = 'public'
          AND c.relname = 'auth_users'
      ) THEN
        PERFORM pg_catalog.set_config('search_path', 'public,backend', false);
        EXECUTE 'CREATE TRIGGER on_public_auth_user_created AFTER INSERT ON public.auth_users FOR EACH ROW EXECUTE PROCEDURE backend.handle_new_local_auth_user()';
      END IF;
    END$$;

-- 5) Notes and warnings
-- This local `app_auth` table is for development only. Passwords are stored as plaintext here
-- by design of this quick-start migration because you requested no hashing yet.
-- Before going to production, switch to either:
--  - Supabase Auth (recommended), or
--  - Add server-side hashing (bcrypt/argon2) and store only hashes.

-- Example sign-up flow (server-side recommended):
-- 1) insert into backend.app_auth (username, email, password) values ('u','e','p');
-- 2) the trigger will create a public.profiles row with id = app_auth.id and auth_id = app_auth.id.

-- Cleanup: if you later switch to Supabase Auth, drop the backend.app_auth table and migrate
-- profile.auth_id to profiles.id -> auth.users.id mapping as needed.
