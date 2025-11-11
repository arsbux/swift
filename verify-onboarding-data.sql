-- Script to verify onboarding data is being saved correctly

-- Check if users table has all required columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Check all users and their data
SELECT 
  id,
  name,
  email,
  bio,
  role,
  avatar_url,
  COALESCE(array_length(skills, 1), 0) as skill_count,
  skills,
  created_at,
  updated_at
FROM public.users
ORDER BY created_at DESC;

-- Check posts and their associated user data
SELECT 
  p.id as post_id,
  p.title,
  p.type,
  p.price,
  p.timeline,
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  u.avatar_url as user_avatar,
  COALESCE(array_length(u.skills, 1), 0) as user_skill_count,
  u.skills as user_skills,
  p.created_at
FROM public.posts p
LEFT JOIN public.users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

-- Check for users with empty or null fields (potential issues)
SELECT 
  id,
  CASE 
    WHEN name IS NULL OR name = '' THEN 'Missing Name'
    ELSE 'Has Name'
  END as name_status,
  CASE 
    WHEN email IS NULL OR email = '' THEN 'Missing Email'
    ELSE 'Has Email'
  END as email_status,
  CASE 
    WHEN bio IS NULL OR bio = '' THEN 'Missing Bio'
    ELSE 'Has Bio'
  END as bio_status,
  CASE 
    WHEN avatar_url IS NULL THEN 'Missing Avatar'
    ELSE 'Has Avatar'
  END as avatar_status,
  CASE 
    WHEN skills IS NULL OR array_length(skills, 1) IS NULL OR array_length(skills, 1) = 0 THEN 'No Skills'
    ELSE 'Has Skills'
  END as skills_status
FROM public.users
WHERE 
  name IS NULL OR name = '' OR
  email IS NULL OR email = '' OR
  bio IS NULL OR bio = '' OR
  avatar_url IS NULL OR
  skills IS NULL OR array_length(skills, 1) IS NULL OR array_length(skills, 1) = 0;
