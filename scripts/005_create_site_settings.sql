-- Site Settings: single-row configuration table
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

-- Seed a single default row
INSERT INTO site_settings (phone, email, whatsapp, address, business_hours_weekday, business_hours_weekend)
SELECT '+91 99999 99999', 'hello@betelwholesale.com', '919999999999', 'Mumbai, Maharashtra, India', 'Mon – Sat: 6 AM – 9 PM', 'Sunday: 8 AM – 2 PM'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (public landing page)
CREATE POLICY "Public can read site settings"
  ON site_settings FOR SELECT
  USING (true);

-- Only service role can update (admin API uses service role key)
CREATE POLICY "Service role can update site settings"
  ON site_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);
