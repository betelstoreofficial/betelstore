const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ohlovnugqjktbayxgmku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obG92bnVncWprdGJheXhnbWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzI5ODQsImV4cCI6MjA4NzAwODk4NH0.Z0tzC6azz2DknghXp0_AXQ2NcmshqBMgSzuSeDFvJUw'
);

async function checkAndSeedProducts() {
  console.log('Checking products table...');

  // Try to insert products
  const products = [
    { id: "maghai-paan", name: "Maghai Paan", origin: "Bihar", grade: "Premium A+", price_per_kg: 1200, bulk_price_per_kg: 980, bulk_min_kg: 25, unit: "kg", available: true, description: "Authentic Maghai betel leaves from Bihar.", tag: "Best Seller" },
    { id: "calcutta-paan", name: "Calcutta Paan", origin: "West Bengal", grade: "Grade A", price_per_kg: 950, bulk_price_per_kg: 780, bulk_min_kg: 25, unit: "kg", available: true, description: "Classic Calcutta betel leaves.", tag: null },
    { id: "banarasi-paan", name: "Banarasi Paan", origin: "Varanasi", grade: "Premium A+", price_per_kg: 1400, bulk_price_per_kg: 1150, bulk_min_kg: 20, unit: "kg", available: true, description: "The legendary Banarasi betel leaf.", tag: "Premium" },
    { id: "meetha-paan-leaf", name: "Meetha Paan Leaf", origin: "Madhya Pradesh", grade: "Grade B+", price_per_kg: 700, bulk_price_per_kg: 560, bulk_min_kg: 30, unit: "kg", available: true, description: "Sweet-flavored betel leaves.", tag: null },
    { id: "desi-paan", name: "Desi Paan", origin: "Assam", grade: "Grade A", price_per_kg: 850, bulk_price_per_kg: 700, bulk_min_kg: 25, unit: "kg", available: false, description: "Traditional Assamese betel leaves.", tag: null },
    { id: "kapuri-paan", name: "Kapuri Paan", origin: "Karnataka", grade: "Premium A", price_per_kg: 1100, bulk_price_per_kg: 900, bulk_min_kg: 20, unit: "kg", available: true, description: "South Indian Kapuri variety.", tag: "New Arrival" },
  ];

  const { data, error } = await supabase.from('products').upsert(products, { onConflict: 'id' }).select();

  if (error) {
    console.log('Error:', error.message);
    console.log('\nPlease create the products table in Supabase Dashboard:');
    console.log('SQL:\n');
    console.log(`
CREATE TABLE products (
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
    `);
  } else {
    console.log('Products seeded successfully!');
    console.log(data);
  }
}

checkAndSeedProducts();
