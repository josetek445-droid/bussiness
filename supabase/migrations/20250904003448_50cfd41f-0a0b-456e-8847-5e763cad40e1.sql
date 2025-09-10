-- Fix function search path mutable issue by updating existing functions to have fixed search path
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get role from auth.users metadata instead of profiles table to avoid recursion
  RETURN COALESCE(
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'role')::user_role),
    'worker'::user_role
  );
END;
$$;