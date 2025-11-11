-- Fix infinite recursion in jobs RLS policies
-- The issue is circular dependencies between jobs and job_matches policies

-- Drop existing policies
DROP POLICY IF EXISTS "Clients can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Freelancers can view matched jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clients can create own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clients can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Freelancers can update matched jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can update all jobs" ON public.jobs;

-- Simplified policies to avoid recursion
-- Clients can view their own jobs
CREATE POLICY "Clients can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = client_id);

-- Freelancers can view jobs they're matched to (using SECURITY DEFINER function to break recursion)
CREATE OR REPLACE FUNCTION public.can_view_job_as_freelancer(job_uuid UUID)
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
    AND job_matches.status IN ('accepted', 'auto_assigned')
  );
END;
$$;

CREATE POLICY "Freelancers can view matched jobs" ON public.jobs
  FOR SELECT USING (public.can_view_job_as_freelancer(id));

-- Admins can view all jobs (simplified - no recursion)
CREATE POLICY "Admins can view all jobs" ON public.jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- Clients can create their own jobs (simple check, no recursion)
CREATE POLICY "Clients can create own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Clients can update their own jobs
CREATE POLICY "Clients can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = client_id);

-- Freelancers can update matched jobs (using function to break recursion)
CREATE OR REPLACE FUNCTION public.can_update_job_as_freelancer(job_uuid UUID)
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
    AND job_matches.status IN ('accepted', 'auto_assigned')
  );
END;
$$;

CREATE POLICY "Freelancers can update matched jobs" ON public.jobs
  FOR UPDATE USING (public.can_update_job_as_freelancer(id));

-- Admins can update all jobs
CREATE POLICY "Admins can update all jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- Fix job_matches policies to avoid recursion
DROP POLICY IF EXISTS "Clients can create matches" ON public.job_matches;

-- Use a function to check job ownership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_job_client(job_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_uuid
    AND jobs.client_id = auth.uid()
  );
END;
$$;

CREATE POLICY "Clients can create matches" ON public.job_matches
  FOR INSERT WITH CHECK (public.is_job_client(job_id));

-- Update the view policy to use the function
DROP POLICY IF EXISTS "Users can view relevant matches" ON public.job_matches;

CREATE POLICY "Users can view relevant matches" ON public.job_matches
  FOR SELECT USING (
    auth.uid() = freelancer_id
    OR public.is_job_client(job_id)
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

