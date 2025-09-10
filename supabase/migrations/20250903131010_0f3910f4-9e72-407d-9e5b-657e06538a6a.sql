-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
  ('Electronics', 'Electronic devices and accessories'),
  ('Clothing', 'Clothing and fashion items'),
  ('Home & Garden', 'Home and garden products'),
  ('Sports & Outdoors', 'Sports and outdoor equipment'),
  ('Books & Media', 'Books, movies, and other media'),
  ('Food & Beverages', 'Food and drink items'),
  ('Health & Beauty', 'Health and beauty products'),
  ('Toys & Games', 'Toys and gaming products'),
  ('Automotive', 'Automotive parts and accessories'),
  ('Office Supplies', 'Office and business supplies')
ON CONFLICT DO NOTHING;

-- Insert default subcategories for Electronics
INSERT INTO public.subcategories (name, description, category_id) 
SELECT 'Smartphones', 'Mobile phones and accessories', id FROM public.categories WHERE name = 'Electronics'
UNION ALL
SELECT 'Laptops', 'Laptop computers', id FROM public.categories WHERE name = 'Electronics'
UNION ALL
SELECT 'Headphones', 'Audio headphones and earbuds', id FROM public.categories WHERE name = 'Electronics'
UNION ALL
SELECT 'Tablets', 'Tablet computers', id FROM public.categories WHERE name = 'Electronics';

-- Insert default subcategories for Clothing
INSERT INTO public.subcategories (name, description, category_id) 
SELECT 'Men''s Clothing', 'Clothing for men', id FROM public.categories WHERE name = 'Clothing'
UNION ALL
SELECT 'Women''s Clothing', 'Clothing for women', id FROM public.categories WHERE name = 'Clothing'
UNION ALL
SELECT 'Shoes', 'Footwear for all ages', id FROM public.categories WHERE name = 'Clothing'
UNION ALL
SELECT 'Accessories', 'Fashion accessories', id FROM public.categories WHERE name = 'Clothing';

-- Insert default subcategories for Food & Beverages
INSERT INTO public.subcategories (name, description, category_id) 
SELECT 'Snacks', 'Snack foods and treats', id FROM public.categories WHERE name = 'Food & Beverages'
UNION ALL
SELECT 'Beverages', 'Drinks and beverages', id FROM public.categories WHERE name = 'Food & Beverages'
UNION ALL
SELECT 'Fresh Produce', 'Fresh fruits and vegetables', id FROM public.categories WHERE name = 'Food & Beverages'
UNION ALL
SELECT 'Packaged Foods', 'Packaged and processed foods', id FROM public.categories WHERE name = 'Food & Beverages';

-- Drop existing policies first
DROP POLICY IF EXISTS "Workers can view categories" ON public.categories;
DROP POLICY IF EXISTS "Workers can view subcategories" ON public.subcategories;

-- Create RLS policy to allow everyone to view categories and subcategories
CREATE POLICY "Workers can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Workers can view subcategories" 
ON public.subcategories 
FOR SELECT 
USING (true);