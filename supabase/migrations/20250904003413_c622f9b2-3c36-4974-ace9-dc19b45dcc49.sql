-- Add created_by column to categories and subcategories tables to track which admin created them
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.subcategories ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Update existing categories and subcategories to have a created_by value (set to the first admin found)
UPDATE public.categories 
SET created_by = (
  SELECT id FROM public.profiles 
  WHERE role IN ('admin', 'developer') 
  LIMIT 1
) 
WHERE created_by IS NULL;

UPDATE public.subcategories 
SET created_by = (
  SELECT id FROM public.profiles 
  WHERE role IN ('admin', 'developer') 
  LIMIT 1
) 
WHERE created_by IS NULL;

-- Drop existing policies and recreate them with proper restrictions
DROP POLICY IF EXISTS "Workers can view categories" ON public.categories;
DROP POLICY IF EXISTS "Workers can view subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admin can manage subcategories" ON public.subcategories;

-- Categories policies: Admins can manage, workers can only view what their admin created
CREATE POLICY "Admin can manage categories" 
ON public.categories 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'developer'::user_role]));

CREATE POLICY "Workers can view admin categories" 
ON public.categories 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'worker'::user_role 
  AND created_by = (
    SELECT created_by FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Subcategories policies: Similar to categories
CREATE POLICY "Admin can manage subcategories" 
ON public.subcategories 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'developer'::user_role]));

CREATE POLICY "Workers can view admin subcategories" 
ON public.subcategories 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'worker'::user_role 
  AND created_by = (
    SELECT created_by FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Add triggers to automatically set created_by when creating categories/subcategories
CREATE TRIGGER set_categories_created_by
  BEFORE INSERT ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_subcategories_created_by
  BEFORE INSERT ON public.subcategories
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();