-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR (single run)
-- ============================================

-- 1. Update orders status constraint to include 'pending'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'));

-- 2. Create products table (if not exists)
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
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Products can be inserted" ON public.products;
CREATE POLICY "Products can be inserted" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Products can be updated" ON public.products;
CREATE POLICY "Products can be updated" ON public.products FOR UPDATE USING (true);

-- 3. Create order_items table (if not exists)
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
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );
