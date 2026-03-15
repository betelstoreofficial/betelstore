-- Allow inserts to products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products can be inserted" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Products can be updated" ON products FOR UPDATE USING (true);
