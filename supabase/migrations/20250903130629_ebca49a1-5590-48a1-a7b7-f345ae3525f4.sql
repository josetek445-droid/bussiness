-- Update the existing function to get role from auth metadata instead of profiles table
-- This prevents infinite recursion while maintaining compatibility with existing policies
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role AS $$
BEGIN
  -- Get role from auth.users metadata instead of profiles table to avoid recursion
  RETURN COALESCE(
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')::user_role),
    'worker'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Also drop the duplicate policies on profiles table that are causing conflicts
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Workers can view limited data" ON public.profiles;