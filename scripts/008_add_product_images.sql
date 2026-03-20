-- Add image_url column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users (admin) to upload/update/delete product images
CREATE POLICY "Admin can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admin can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Admin can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
