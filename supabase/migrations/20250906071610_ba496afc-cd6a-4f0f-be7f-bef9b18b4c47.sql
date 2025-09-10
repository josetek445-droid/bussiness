-- Ensure email verification is completely disabled for workers
-- Update the auto_confirm_worker_email function to be more robust

CREATE OR REPLACE FUNCTION public.auto_confirm_worker_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Automatically confirm email for new users (workers)
  -- This completely bypasses email verification
  UPDATE auth.users 
  SET 
    email_confirmed_at = now(),
    confirmation_token = '',
    email_change_confirm_status = 0,
    email_change = ''
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.auto_confirm_worker_email();

-- Also confirm any existing unconfirmed users
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmation_token = '',
  email_change_confirm_status = 0,
  email_change = ''
WHERE email_confirmed_at IS NULL;