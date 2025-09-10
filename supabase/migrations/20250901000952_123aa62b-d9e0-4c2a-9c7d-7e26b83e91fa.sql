-- Update RLS policies for better security

-- First, add a created_by column to profiles to track who created each user
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- Update profiles policies to be more restrictive
DROP POLICY IF EXISTS "Admin can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Only developers can manage all profiles
CREATE POLICY "Developers can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (get_user_role(auth.uid()) = 'developer');

-- Admins can only view and manage their own workers (users they created)
CREATE POLICY "Admins can manage their own workers" 
ON public.profiles 
FOR ALL 
USING (
  get_user_role(auth.uid()) = 'admin' 
  AND (
    created_by = auth.uid() 
    OR id = auth.uid()
  )
);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Workers can only view their own data and their admin's data
CREATE POLICY "Workers can view limited data" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'worker' 
  AND (
    id = auth.uid() 
    OR id = (SELECT created_by FROM public.profiles WHERE id = auth.uid())
  )
);

-- Create a trigger to automatically set created_by when a new profile is created
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Set created_by to the current user if not already set
  IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER set_created_by_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();