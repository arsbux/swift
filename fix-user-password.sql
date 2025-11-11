-- Fix user password issue - Run this in Supabase SQL Editor
-- This will help you reset the password or delete the user to start fresh

-- Option 1: Delete the existing user so they can sign up again
-- Uncomment the line below and run it:
-- DELETE FROM auth.users WHERE email = 'franciskeith87@gmail.com';

-- Option 2: Check user status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  encrypted_password IS NOT NULL as has_password,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'Email not confirmed'
    WHEN encrypted_password IS NULL THEN 'No password set'
    ELSE 'Should be able to login'
  END as status
FROM auth.users
WHERE email IN ('franciskeith87@gmail.com', 'keith87@gmail.com');

-- Option 3: Manually confirm email (if needed)
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'franciskeith87@gmail.com';

-- After running Option 1, the user can sign up again with a fresh password

