-- ============================================
-- Migration: Change pricing from kg to leaves + Link mandi rates to products
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Rename product pricing columns
ALTER TABLE products RENAME COLUMN price_per_kg TO price_per_100;
ALTER TABLE products RENAME COLUMN bulk_price_per_kg TO bulk_price_per_1000;
ALTER TABLE products RENAME COLUMN bulk_min_kg TO bulk_min_qty;

-- Update default unit
ALTER TABLE products ALTER COLUMN unit SET DEFAULT 'leaves';
UPDATE products SET unit = 'leaves' WHERE unit = 'kg';

-- 2. Rename order_items pricing column
ALTER TABLE order_items RENAME COLUMN price_per_kg TO price_per_unit;

-- 3. Rename orders JSONB items (update existing data)
UPDATE orders SET items = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'product_id', item->>'product_id',
      'product_name', item->>'product_name',
      'quantity', item->>'quantity',
      'price_per_unit', COALESCE(item->>'price_per_kg', item->>'price_per_unit'),
      'is_bulk', item->>'is_bulk'
    )
  )
  FROM jsonb_array_elements(items) AS item
) WHERE items IS NOT NULL AND jsonb_array_length(items) > 0;

-- 4. Add product_id to mandi_rates
ALTER TABLE mandi_rates ADD COLUMN IF NOT EXISTS product_id TEXT REFERENCES products(id) ON DELETE CASCADE;

-- 5. Clear old seed data from mandi_rates (will be auto-populated from products)
TRUNCATE mandi_rates;

-- 6. Populate mandi_rates from existing products
INSERT INTO mandi_rates (variety, today_price, yesterday_price, change, product_id)
SELECT name, price_per_100, price_per_100, 0, id
FROM products
ON CONFLICT (variety) DO UPDATE SET product_id = EXCLUDED.product_id;

-- ============================================
-- DONE! Pricing changed to leaves, mandi rates linked to products.
-- ============================================
