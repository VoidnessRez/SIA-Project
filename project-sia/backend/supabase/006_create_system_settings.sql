-- Create a simple key/value table for global system settings
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Optional index for common lookups (already covered by PK for key)

