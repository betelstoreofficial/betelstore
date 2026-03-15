-- Create mandi_rates table for daily betel leaf prices
CREATE TABLE IF NOT EXISTS mandi_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variety TEXT UNIQUE NOT NULL,
  today_price NUMERIC NOT NULL DEFAULT 0,
  yesterday_price NUMERIC NOT NULL DEFAULT 0,
  change NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE mandi_rates ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see mandi rates)
CREATE POLICY "Public can read mandi rates"
  ON mandi_rates
  FOR SELECT
  USING (true);

-- Seed with current data
INSERT INTO mandi_rates (variety, today_price, yesterday_price, change) VALUES
  ('Maghai Paan', 1200, 1180, 20),
  ('Calcutta Paan', 950, 970, -20),
  ('Banarasi Paan', 1400, 1400, 0),
  ('Meetha Paan Leaf', 700, 720, -20),
  ('Desi Paan', 850, 840, 10),
  ('Kapuri Paan', 1100, 1080, 20)
ON CONFLICT (variety) DO NOTHING;
