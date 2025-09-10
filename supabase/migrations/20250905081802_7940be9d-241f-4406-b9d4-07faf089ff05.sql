-- Fix the auto_confirm_worker_email function to handle confirmation_token properly
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
      confirmation_token = ''  -- Set to empty string instead of null
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$;

-- Also fix any existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = now(),
    confirmation_token = ''
WHERE email_confirmed_at IS NULL AND confirmation_token IS NULL;