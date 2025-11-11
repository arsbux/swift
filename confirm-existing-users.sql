-- Manually confirm existing users for MVP
-- This confirms all users who haven't confirmed their email yet
-- Run this after disabling email confirmations in Supabase settings

UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Verify the update
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC;

