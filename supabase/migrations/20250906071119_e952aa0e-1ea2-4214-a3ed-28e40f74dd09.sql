-- Fix RLS policies for proper worker/admin data access

-- Update categories policy to allow workers to see categories created by their admin
DROP POLICY IF EXISTS "Workers can view admin categories" ON categories;
CREATE POLICY "Workers can view admin categories" 
ON categories 
FOR SELECT 
TO authenticated 
USING (
  (get_user_role(auth.uid()) = 'worker'::user_role) AND 
  (created_by = (SELECT created_by FROM profiles WHERE id = auth.uid()))
);

-- Update subcategories policy 
DROP POLICY IF EXISTS "Workers can view admin subcategories" ON subcategories;
CREATE POLICY "Workers can view admin subcategories" 
ON subcategories 
FOR SELECT 
TO authenticated 
USING (
  (get_user_role(auth.uid()) = 'worker'::user_role) AND 
  (created_by = (SELECT created_by FROM profiles WHERE id = auth.uid()))
);

-- Update products policy for workers to see products from their admin
DROP POLICY IF EXISTS "Workers can view shop products" ON products;
CREATE POLICY "Workers can view shop products" 
ON products 
FOR SELECT 
TO authenticated 
USING (
  shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()) AND
  created_by = (SELECT created_by FROM profiles WHERE id = auth.uid())
);

-- Update expense requests policy so admins can see requests from their workers
DROP POLICY IF EXISTS "Admin can manage all expense requests" ON expense_requests;
CREATE POLICY "Admin can manage expense requests from their workers" 
ON expense_requests 
FOR ALL 
TO authenticated 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'developer'::user_role])) AND
  (worker_id IN (SELECT id FROM profiles WHERE created_by = auth.uid()) OR worker_id = auth.uid())
);

-- Update sales policy so admins can see sales from their workers  
DROP POLICY IF EXISTS "Admin can view all sales" ON sales;
CREATE POLICY "Admin can view sales from their workers" 
ON sales 
FOR SELECT 
TO authenticated 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'developer'::user_role])) AND
  (worker_id IN (SELECT id FROM profiles WHERE created_by = auth.uid()) OR worker_id = auth.uid())
);