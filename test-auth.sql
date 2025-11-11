-- Test script to verify auth setup
-- Run this to check if your user can log in

-- Check if user exists and is confirmed
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'NOT CONFIRMED - This is why login fails!'
    ELSE 'CONFIRMED - Should be able to login'
  END as status
FROM auth.users
WHERE email = 'franciskeith87@gmail.com';

-- If email_confirmed_at is NULL, run this to confirm:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'franciskeith87@gmail.com';

-- Check if user profile exists
SELECT * FROM public.users WHERE email = 'franciskeith87@gmail.com';

