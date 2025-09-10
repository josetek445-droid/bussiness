-- Fix security warning: Set proper search_path for the function
CREATE OR REPLACE FUNCTION public.auto_confirm_worker_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Automatically confirm email for new users (workers)
  -- This bypasses the email verification requirement
  UPDATE auth.users 
  SET email_confirmed_at = now(),
      confirmation_token = null
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;