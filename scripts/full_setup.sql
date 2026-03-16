-- ============================================
-- FULL DATABASE SETUP - Run in Supabase SQL Editor
-- ============================================

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  business_name text,
  phone text,
  gst_number text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', null),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', null),
    new.email
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    email = coalesce(excluded.email, public.profiles.email),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal integer not null default 0,
  discount integer not null default 0,
  total integer not null default 0,
  status text not null default 'processing' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;
drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "orders_update_own" on public.orders;
create policy "orders_select_own" on public.orders for select using (auth.uid() = user_id);
create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = user_id);
create policy "orders_update_own" on public.orders for update using (auth.uid() = user_id);

create sequence if not exists order_number_seq start 1000;

create or replace function public.generate_order_number()
returns trigger language plpgsql as $$
begin
  new.order_number := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists set_order_number on public.orders;
create trigger set_order_number
  before insert on public.orders
  for each row
  when (new.order_number = '' or new.order_number is null)
  execute function public.generate_order_number();

-- 3. PAYMENT FIELDS ON ORDERS
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders (razorpay_order_id);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  grade TEXT NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  bulk_price_per_kg NUMERIC NOT NULL,
  bulk_min_kg INTEGER NOT NULL DEFAULT 25,
  unit TEXT NOT NULL DEFAULT 'kg',
  available BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products can be inserted" ON public.products;
DROP POLICY IF EXISTS "Products can be updated" ON public.products;
DROP POLICY IF EXISTS "Products can be deleted" ON public.products;
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Products can be inserted" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Products can be updated" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Products can be deleted" ON public.products FOR DELETE USING (true);

-- 5. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  is_bulk BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can insert own order items" ON public.order_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- 6. MANDI RATES
CREATE TABLE IF NOT EXISTS mandi_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variety TEXT UNIQUE NOT NULL,
  today_price NUMERIC NOT NULL DEFAULT 0,
  yesterday_price NUMERIC NOT NULL DEFAULT 0,
  change NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mandi_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read mandi rates" ON mandi_rates;
CREATE POLICY "Public can read mandi rates" ON mandi_rates FOR SELECT USING (true);

INSERT INTO mandi_rates (variety, today_price, yesterday_price, change) VALUES
  ('Maghai Paan', 1200, 1180, 20),
  ('Calcutta Paan', 950, 970, -20),
  ('Banarasi Paan', 1400, 1400, 0),
  ('Meetha Paan Leaf', 700, 720, -20),
  ('Desi Paan', 850, 840, 10),
  ('Kapuri Paan', 1100, 1080, 20)
ON CONFLICT (variety) DO NOTHING;

-- 7. SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL DEFAULT '+91 99999 99999',
  email text NOT NULL DEFAULT 'hello@betelwholesale.com',
  whatsapp text NOT NULL DEFAULT '919999999999',
  address text NOT NULL DEFAULT 'Mumbai, Maharashtra, India',
  business_hours_weekday text NOT NULL DEFAULT 'Mon – Sat: 6 AM – 9 PM',
  business_hours_weekend text NOT NULL DEFAULT 'Sunday: 8 AM – 2 PM',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings (phone, email, whatsapp, address, business_hours_weekday, business_hours_weekend)
SELECT '+91 99999 99999', 'hello@betelwholesale.com', '919999999999', 'Mumbai, Maharashtra, India', 'Mon – Sat: 6 AM – 9 PM', 'Sunday: 8 AM – 2 PM'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Service role can update site settings" ON site_settings;
CREATE POLICY "Public can read site settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Service role can update site settings" ON site_settings FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================
-- DONE! All tables, RLS policies, and seed data created.
-- ============================================
