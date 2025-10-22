# Supabase Auth + Profiles Schema

This file documents a recommended Supabase schema and workflow for authentication + profile data. It uses Supabase Auth (email/password) for credential storage and a `profiles` table (1:1 with `auth.users`) for user metadata. An optional `addresses` table is included for normalized addresses.

> Important: Do NOT store raw/plaintext passwords in your own tables. Use Supabase Auth to manage credentials securely.

---

## Overview
- Use Supabase Auth to handle email/password sign-up and login.
- Create `public.profiles` to store username, first/last name, phone, birthday, status, last_seen, etc.
- Optionally create `public.addresses` for 1..N addresses per profile.
- Add a trigger that auto-inserts a `profiles` row when an `auth.users` row is created.
- Apply Row Level Security (RLS) policies so users can only read/update their own profile.

---

## SQL: Tables, Indexes, Trigger, Policies

Paste the following into the Supabase SQL Editor and run. It is safe to run multiple times because `IF NOT EXISTS` and `CREATE OR REPLACE` are used where appropriate.

```sql
-- 1) Enable pgcrypto extension (for gen_random_uuid)
create extension if not exists pgcrypto;

-- 2) profiles table (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key,           -- matches auth.users.id
  username text unique,
  email text,
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

-- case-insensitive username lookup
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_last_seen_idx on public.profiles (last_seen);

-- 3) optional addresses table (1..N per profile)
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

-- 4) trigger function to auto-create profile on auth insert
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  if not exists (select 1 from public.profiles where id = new.id) then
    insert into public.profiles (id, email, created_at, updated_at)
    values (new.id, new.email, now(), now());
  end if;
  return new;
end;
$$;

-- attach trigger to auth.users
-- (supabase-managed auth schema supports triggers on auth.users)
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- 5) Enable RLS on profiles and add policies
alter table public.profiles enable row level security;

-- allow authenticated users to select their own profile
create policy if not exists "Profiles: select own" on public.profiles
  for select using (auth.uid() = id);

-- allow authenticated users to insert their own profile (if inserting from client)
create policy if not exists "Profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- allow authenticated users to update their own profile
create policy if not exists "Profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- (Optional) addresses RLS
alter table public.addresses enable row level security;
create policy if not exists "Addresses: select by owner" on public.addresses
  for select using (exists (select 1 from public.profiles p where p.id = profile_id and p.id = auth.uid()));
create policy if not exists "Addresses: insert by owner" on public.addresses
  for insert with check (profile_id = auth.uid());
create policy if not exists "Addresses: update by owner" on public.addresses
  for update using (exists (select 1 from public.profiles p where p.id = profile_id and p.id = auth.uid())) with check (profile_id = auth.uid());
```

Notes:
- The trigger function uses `security definer` so it can run with the function owner's privileges and insert into `public.profiles`. Supabase's default DB user typically permits this pattern, but if you run into permission issues, create the profile from your backend using the service role instead.
- If you prefer explicit control over profile fields (username, names), create the profile from your server after signup (and skip the trigger).

---

## Combined migration script (single paste)

If you prefer one combined script, here it is (same as above but in one block):

```sql
-- Combined migration (all-in-one)
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  username text unique,
  email text,
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

create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_last_seen_idx on public.profiles (last_seen);

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

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  if not exists (select 1 from public.profiles where id = new.id) then
    insert into public.profiles (id, email, created_at, updated_at)
    values (new.id, new.email, now(), now());
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

alter table public.profiles enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy
    WHERE polname = 'Profiles: select own'
      AND polrelid = 'public.profiles'::regclass
  ) THEN
    CREATE POLICY "Profiles: select own" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy
    WHERE polname = 'Profiles: insert own'
      AND polrelid = 'public.profiles'::regclass
  ) THEN
    CREATE POLICY "Profiles: insert own" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy
    WHERE polname = 'Profiles: update own'
      AND polrelid = 'public.profiles'::regclass
  ) THEN
    CREATE POLICY "Profiles: update own" ON public.profiles
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END$$;

alter table public.addresses enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy
    WHERE polname = 'Addresses: select by owner'
      AND polrelid = 'public.addresses'::regclass
  ) THEN
    CREATE POLICY "Addresses: select by owner" ON public.addresses
      FOR SELECT USING (
        exists (
          select 1 from public.profiles p where p.id = profile_id and p.id = auth.uid()
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy
    WHERE polname = 'Addresses: insert by owner'
      AND polrelid = 'public.addresses'::regclass
  ) THEN
    CREATE POLICY "Addresses: insert by owner" ON public.addresses
      FOR INSERT WITH CHECK (profile_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy
    WHERE polname = 'Addresses: update by owner'
      AND polrelid = 'public.addresses'::regclass
  ) THEN
    CREATE POLICY "Addresses: update by owner" ON public.addresses
      FOR UPDATE USING (
        exists (
          select 1 from public.profiles p where p.id = profile_id and p.id = auth.uid()
        )
      ) WITH CHECK (profile_id = auth.uid());
  END IF;
END$$;
```

---

## Client examples (supabase-js v2)

Sign up (client-side) and upsert profile (recommended server-side with service role if you need to set protected fields):

```js
// client-side signup
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'supersecret'
});
if (error) throw error;

// After signUp, the trigger will create an empty profiles row. To add username or names, upsert:
await supabase.from('profiles').upsert({
  id: data.user.id,
  email: data.user.email,
  username: 'chosen_username',
  first_name: 'First',
  last_name: 'Last'
});
```

Sign in and update `last_seen` (heartbeat):

```js
// sign in
const { data: signInData } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'supersecret'
});
const user = signInData.user;

// update last_seen (client can do this thanks to RLS)
await supabase.from('profiles').update({ last_seen: new Date().toISOString(), status: true }).eq('id', user.id);

// optional periodic heartbeat every 30s
setInterval(() => {
  supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
}, 30000);

// on sign out
await supabase.auth.signOut();
await supabase.from('profiles').update({ status: false }).eq('id', user.id).catch(() => {});
```

Notes:
- For admin operations (suspend user, change status), use a backend with the Supabase service role key to avoid exposing admin privileges in the client.
- Use `upsert` to avoid duplicate profile errors when editing existing profiles.

---

## Presence & Realtime
- Use `last_seen` + `status` to show approximate presence in dashboards.
- For richer presence (connect/disconnect detection), use Supabase Realtime channels or a small websocket/presence service.
- Implement a short heartbeat (10-60s) to update `last_seen`. Use page visibility API to note when user leaves.

---

## When to separate `addresses` table
- Separate when users may have multiple addresses (shipping, billing).
- Separate when you need address-level queries (search by city, region) across users.
- Keep in `profiles` when there's exactly one address that rarely changes and you prefer a flatter model.

---

## Next steps I can help with
- Add these SQL migrations to your repo as a migration file.
- Implement server-side endpoints for admin tasks using the service role key.
- Wire your frontend `SignUpPage.jsx` to `upsert` profile data after signup (I can implement this in your repo).

---

If you want this saved as a migration file instead (e.g., `migrations/001_create_profiles.sql`), tell me the path and I'll create it for you.
