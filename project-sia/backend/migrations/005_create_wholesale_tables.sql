-- =====================================================
-- 005_create_wholesale_tables.sql
-- Adds wholesale module core tables + order extensions
-- =====================================================

-- 1) Wholesale profile per user
create table if not exists public.wholesale_profiles (
  id bigserial primary key,
  user_id uuid not null references public.auth_users(id) on delete cascade,
  business_name text not null,
  business_type text,
  tax_id text,
  contact_person text,
  contact_phone text,
  contact_email text,
  business_address text,
  expected_monthly_volume integer default 0 check (expected_monthly_volume >= 0),
  status varchar(30) not null default 'pending_review',
  approved_by uuid references public.adminauth(id) on delete set null,
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

create index if not exists wholesale_profiles_status_idx
  on public.wholesale_profiles(status);

-- 2) Wholesale applications (track lifecycle)
create table if not exists public.wholesale_applications (
  id bigserial primary key,
  wholesale_profile_id bigint not null references public.wholesale_profiles(id) on delete cascade,
  application_number varchar(60) not null unique,
  status varchar(30) not null default 'pending_review',
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.adminauth(id) on delete set null,
  rejection_reason text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists wholesale_applications_status_idx
  on public.wholesale_applications(status);

-- 3) Wholesale tier rules (server-side pricing policy)
create table if not exists public.wholesale_tier_rules (
  id bigserial primary key,
  code varchar(40) not null unique,
  name varchar(120) not null,
  min_items integer not null default 0,
  min_order_amount numeric(12,2) not null default 0,
  discount_percentage numeric(5,2) not null,
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint wholesale_tier_rules_discount_check
    check (discount_percentage >= 0 and discount_percentage <= 100)
);

create index if not exists wholesale_tier_rules_active_priority_idx
  on public.wholesale_tier_rules(is_active, priority);

-- 4) Wholesale quotes
create table if not exists public.wholesale_quotes (
  id bigserial primary key,
  quote_number varchar(60) not null unique,
  wholesale_profile_id bigint not null references public.wholesale_profiles(id) on delete cascade,
  user_id uuid not null references public.auth_users(id) on delete cascade,
  status varchar(30) not null default 'draft',
  valid_until timestamptz,
  reviewed_by uuid references public.adminauth(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  downpayment_required_amount numeric(12,2) not null default 0,
  downpayment_paid_amount numeric(12,2) not null default 0,
  payment_policy_snapshot text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists wholesale_quotes_status_idx
  on public.wholesale_quotes(status);

create index if not exists wholesale_quotes_profile_idx
  on public.wholesale_quotes(wholesale_profile_id);

-- 5) Wholesale quote items
create table if not exists public.wholesale_quote_items (
  id bigserial primary key,
  quote_id bigint not null references public.wholesale_quotes(id) on delete cascade,
  product_type varchar(30) not null,
  product_id integer not null,
  product_sku varchar(80),
  product_name text,
  quantity integer not null,
  base_unit_price numeric(12,2) not null,
  applied_tier_rule_id bigint references public.wholesale_tier_rules(id) on delete set null,
  discount_percentage numeric(5,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  final_unit_price numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint wholesale_quote_items_qty_check check (quantity > 0)
);

create index if not exists wholesale_quote_items_quote_idx
  on public.wholesale_quote_items(quote_id);

-- 6) Generic order audit logs
create table if not exists public.order_audit_logs (
  id bigserial primary key,
  order_id integer not null references public.orders(id) on delete cascade,
  action_type varchar(60) not null,
  actor_id uuid,
  actor_role varchar(40),
  reason text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz default now()
);

create index if not exists order_audit_logs_order_idx
  on public.order_audit_logs(order_id);

-- 7) Extend existing orders table for wholesale links/policy snapshots
alter table public.orders add column if not exists order_channel varchar(20) default 'retail';
alter table public.orders add column if not exists wholesale_profile_id bigint;
alter table public.orders add column if not exists quote_id bigint;
alter table public.orders add column if not exists downpayment_required_amount numeric(12,2) default 0;
alter table public.orders add column if not exists downpayment_paid_amount numeric(12,2) default 0;
alter table public.orders add column if not exists downpayment_policy_snapshot text;

update public.orders
set order_channel = 'retail'
where order_channel is null;

create index if not exists orders_order_channel_idx
  on public.orders(order_channel);

create index if not exists orders_wholesale_profile_idx
  on public.orders(wholesale_profile_id);

create index if not exists orders_quote_id_idx
  on public.orders(quote_id);

-- Add FK constraints only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_wholesale_profile_fk'
      AND table_schema = 'public'
      AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_wholesale_profile_fk
      FOREIGN KEY (wholesale_profile_id)
      REFERENCES public.wholesale_profiles(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_quote_id_fk'
      AND table_schema = 'public'
      AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_quote_id_fk
      FOREIGN KEY (quote_id)
      REFERENCES public.wholesale_quotes(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 8) Seed default wholesale tiers (idempotent)
insert into public.wholesale_tier_rules
(code, name, min_items, min_order_amount, discount_percentage, priority, is_active)
values
('WHOLESALE_BRONZE', 'Wholesale Bronze', 10, 5000, 5.00, 10, true),
('WHOLESALE_SILVER', 'Wholesale Silver', 25, 12000, 10.00, 20, true),
('WHOLESALE_GOLD', 'Wholesale Gold', 50, 25000, 15.00, 30, true),
('WHOLESALE_PLATINUM', 'Wholesale Platinum', 100, 50000, 20.00, 40, true)
on conflict (code) do update
set
  name = excluded.name,
  min_items = excluded.min_items,
  min_order_amount = excluded.min_order_amount,
  discount_percentage = excluded.discount_percentage,
  priority = excluded.priority,
  is_active = excluded.is_active,
  updated_at = now();
