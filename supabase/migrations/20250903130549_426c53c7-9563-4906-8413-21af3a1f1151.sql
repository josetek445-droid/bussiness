-- Drop all existing policies on profiles table to fix infinite recursion
DROP POLICY IF EXISTS "Admins can manage their own workers" ON public.profiles;
DROP POLICY IF EXISTS "Developers can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Workers can view limited data" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Create a simple security definer function that gets user role from auth metadata
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Get role from auth.users metadata instead of profiles table to avoid recursion
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role')::text,
    'worker'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Developers can manage all profiles
CREATE POLICY "Developers can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.get_current_user_role() = 'developer');

-- Admins can manage profiles they created
CREATE POLICY "Admins can manage worker profiles" 
ON public.profiles 
FOR ALL 
USING (
  public.get_current_user_role() = 'admin' 
  AND (created_by = auth.uid() OR id = auth.uid())
);