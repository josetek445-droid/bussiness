-- Disable email confirmation for immediate login
-- This will allow workers to login without email verification

-- First, let's update any existing users that might be stuck in email confirmation
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmation_token = null
WHERE email_confirmed_at IS NULL 
AND created_at > now() - interval '1 day';

-- Create a function to automatically confirm emails for new worker signups
CREATE OR REPLACE FUNCTION public.auto_confirm_worker_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create trigger to auto-confirm emails
DROP TRIGGER IF EXISTS on_auth_user_email_confirm ON auth.users;
CREATE TRIGGER on_auth_user_email_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_worker_email();