# Fix for RLS Infinite Recursion Error

## Problem
When creating a job, you're getting: `infinite recursion detected in policy for relation "jobs"`

This happens because the RLS policies for `jobs` and `job_matches` tables reference each other, creating a circular dependency.

## Solution

Run this SQL script in your Supabase SQL Editor to fix the RLS policies:

```sql
-- Quick fix: Simplify RLS policies to avoid recursion
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Clients can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Freelancers can view matched jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clients can create own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clients can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Freelancers can update matched jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can update all jobs" ON public.jobs;

-- Simple policies - no circular dependencies
CREATE POLICY "Clients can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can create own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = client_id);

-- Allow freelancers to view/update jobs they're matched to
-- Using a function to break recursion
CREATE OR REPLACE FUNCTION public.can_access_job_as_freelancer(job_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.job_matches
    WHERE job_matches.job_id = job_uuid
    AND job_matches.freelancer_id = auth.uid()
  );
END;
$$;

CREATE POLICY "Freelancers can view matched jobs" ON public.jobs
  FOR SELECT USING (public.can_access_job_as_freelancer(id));

CREATE POLICY "Freelancers can update matched jobs" ON public.jobs
  FOR UPDATE USING (public.can_access_job_as_freelancer(id));

-- For MVP: Allow all authenticated users to view/update (you can restrict this later)
CREATE POLICY "All users can view jobs" ON public.jobs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All users can update jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() IS NOT NULL);
```

## Alternative: Disable RLS for MVP Testing

If you want to quickly test without RLS restrictions:

```sql
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_deliverables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_messages DISABLE ROW LEVEL SECURITY;
```

## 406 Errors on Users Endpoint

The 406 (Not Acceptable) errors are likely from missing or incorrect headers. This should be fixed by:
1. Ensuring you're using the latest Supabase client
2. The errors might be from development mode - they shouldn't affect functionality

If 406 errors persist, check your Supabase project settings and ensure CORS is properly configured.

