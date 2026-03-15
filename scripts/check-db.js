const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ohlovnugqjktbayxgmku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obG92bnVncWprdGJheXhnbWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzI5ODQsImV4cCI6MjA4NzAwODk4NH0.Z0tzC6azz2DknghXp0_AXQ2NcmshqBMgSzuSeDFvJUw'
);

async function checkTables() {
  // Try to insert into products to see if table exists
  console.log('Checking existing tables...\n');

  // Test products table
  const testProduct = { id: 'test-check', name: 'test', origin: 'test', grade: 'A', price_per_kg: 100, bulk_price_per_kg: 80, bulk_min_kg: 10, unit: 'kg', available: true, description: 'test' };
  const { error: productError } = await supabase.from('products').insert(testProduct).select();
  console.log('products:', productError ? productError.message : 'EXISTS (and can write)');

  if (!productError) {
    // Clean up test
    await supabase.from('products').delete().eq('id', 'test-check');
  }
}

checkTables();
