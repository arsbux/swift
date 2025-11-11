-- Client Flow Database Schema
-- This script creates all tables, indexes, RLS policies, and storage buckets for the client flow feature

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Jobs table - Core job table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  one_line_request TEXT NOT NULL,
  objective TEXT NOT NULL,
  deliverable_type TEXT NOT NULL CHECK (deliverable_type IN ('landing_page', 'ad_1min', 'bug_fix', 'design', 'other')),
  acceptance_criteria JSONB DEFAULT '[]'::jsonb,
  budget NUMERIC,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'fast')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'brief_complete', 'payment_pending', 'matched', 'in_progress', 'submitted', 'accepted', 'revision_requested', 'completed', 'cancelled')),
  estimated_price NUMERIC,
  final_price NUMERIC,
  revision_count INTEGER DEFAULT 0,
  max_revisions INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Transactions table - Payment/escrow tracking
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'released', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('paypal', 'mobile_money', 'bank_transfer')),
  payment_reference TEXT,
  admin_verified_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Job matches table - Freelancer matching
CREATE TABLE IF NOT EXISTS public.job_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  match_score NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'auto_assigned')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(job_id, freelancer_id)
);

-- 4. Job checklists table - Progress tracking
CREATE TABLE IF NOT EXISTS public.job_checklists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  item TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES public.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Job deliverables table - File uploads
CREATE TABLE IF NOT EXISTS public.job_deliverables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  version INTEGER DEFAULT 1,
  is_final BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Job reviews table - Client feedback
CREATE TABLE IF NOT EXISTS public.job_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  met_criteria BOOLEAN NOT NULL,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(job_id, client_id)
);

-- 7. Job messages table - Job-specific chat
CREATE TABLE IF NOT EXISTS public.job_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON public.jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_job_id ON public.transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON public.transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

CREATE INDEX IF NOT EXISTS idx_job_matches_job_id ON public.job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_freelancer_id ON public.job_matches(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_status ON public.job_matches(status);
CREATE INDEX IF NOT EXISTS idx_job_matches_expires_at ON public.job_matches(expires_at);

CREATE INDEX IF NOT EXISTS idx_job_checklists_job_id ON public.job_checklists(job_id);
CREATE INDEX IF NOT EXISTS idx_job_checklists_completed ON public.job_checklists(completed);

CREATE INDEX IF NOT EXISTS idx_job_deliverables_job_id ON public.job_deliverables(job_id);
CREATE INDEX IF NOT EXISTS idx_job_deliverables_version ON public.job_deliverables(job_id, version);

CREATE INDEX IF NOT EXISTS idx_job_reviews_job_id ON public.job_reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_job_reviews_freelancer_id ON public.job_reviews(freelancer_id);

CREATE INDEX IF NOT EXISTS idx_job_messages_job_id ON public.job_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_created_at ON public.job_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs table
DROP POLICY IF EXISTS "Clients can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Freelancers can view matched jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clients can create own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clients can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Freelancers can update matched jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can update all jobs" ON public.jobs;

-- Clients can view their own jobs
CREATE POLICY "Clients can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = client_id);

-- Freelancers can view jobs they're matched to
CREATE POLICY "Freelancers can view matched jobs" ON public.jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.job_matches
      WHERE job_matches.job_id = jobs.id
      AND job_matches.freelancer_id = auth.uid()
      AND job_matches.status IN ('accepted', 'auto_assigned')
    )
  );

-- Admins can view all jobs
CREATE POLICY "Admins can view all jobs" ON public.jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- Clients can create their own jobs
CREATE POLICY "Clients can create own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Clients can update their own jobs
CREATE POLICY "Clients can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = client_id);

-- Freelancers can update matched jobs (for status changes like in_progress, submitted)
CREATE POLICY "Freelancers can update matched jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.job_matches
      WHERE job_matches.job_id = jobs.id
      AND job_matches.freelancer_id = auth.uid()
      AND job_matches.status IN ('accepted', 'auto_assigned')
    )
  );

-- Admins can update all jobs
CREATE POLICY "Admins can update all jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- RLS Policies for transactions table
DROP POLICY IF EXISTS "Clients can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Clients can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;

CREATE POLICY "Clients can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

CREATE POLICY "Clients can create own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can update transactions" ON public.transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- RLS Policies for job_matches table
DROP POLICY IF EXISTS "Users can view relevant matches" ON public.job_matches;
DROP POLICY IF EXISTS "Clients can create matches" ON public.job_matches;
DROP POLICY IF EXISTS "Freelancers can update own matches" ON public.job_matches;
DROP POLICY IF EXISTS "Admins can manage all matches" ON public.job_matches;

CREATE POLICY "Users can view relevant matches" ON public.job_matches
  FOR SELECT USING (
    auth.uid() = freelancer_id
    OR EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_matches.job_id AND jobs.client_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

CREATE POLICY "Clients can create matches" ON public.job_matches
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_matches.job_id AND jobs.client_id = auth.uid())
  );

CREATE POLICY "Freelancers can update own matches" ON public.job_matches
  FOR UPDATE USING (auth.uid() = freelancer_id);

CREATE POLICY "Admins can manage all matches" ON public.job_matches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- RLS Policies for job_checklists table
DROP POLICY IF EXISTS "Users can view job checklists" ON public.job_checklists;
DROP POLICY IF EXISTS "Users can update job checklists" ON public.job_checklists;

CREATE POLICY "Users can view job checklists" ON public.job_checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_checklists.job_id
      AND (
        jobs.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.job_matches
          WHERE job_matches.job_id = jobs.id
          AND job_matches.freelancer_id = auth.uid()
          AND job_matches.status IN ('accepted', 'auto_assigned')
        )
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
        )
      )
    )
  );

CREATE POLICY "Users can update job checklists" ON public.job_checklists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_checklists.job_id
      AND (
        jobs.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.job_matches
          WHERE job_matches.job_id = jobs.id
          AND job_matches.freelancer_id = auth.uid()
          AND job_matches.status IN ('accepted', 'auto_assigned')
        )
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
        )
      )
    )
  );

-- RLS Policies for job_deliverables table
DROP POLICY IF EXISTS "Users can view job deliverables" ON public.job_deliverables;
DROP POLICY IF EXISTS "Users can upload deliverables" ON public.job_deliverables;

CREATE POLICY "Users can view job deliverables" ON public.job_deliverables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_deliverables.job_id
      AND (
        jobs.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.job_matches
          WHERE job_matches.job_id = jobs.id
          AND job_matches.freelancer_id = auth.uid()
          AND job_matches.status IN ('accepted', 'auto_assigned')
        )
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
        )
      )
    )
  );

CREATE POLICY "Users can upload deliverables" ON public.job_deliverables
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_deliverables.job_id
      AND (
        jobs.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.job_matches
          WHERE job_matches.job_id = jobs.id
          AND job_matches.freelancer_id = auth.uid()
          AND job_matches.status IN ('accepted', 'auto_assigned')
        )
      )
    )
  );

-- RLS Policies for job_reviews table
DROP POLICY IF EXISTS "Users can view job reviews" ON public.job_reviews;
DROP POLICY IF EXISTS "Clients can create reviews" ON public.job_reviews;

CREATE POLICY "Users can view job reviews" ON public.job_reviews
  FOR SELECT USING (true); -- Reviews are public

CREATE POLICY "Clients can create reviews" ON public.job_reviews
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- RLS Policies for job_messages table
DROP POLICY IF EXISTS "Users can view job messages" ON public.job_messages;
DROP POLICY IF EXISTS "Users can send job messages" ON public.job_messages;

CREATE POLICY "Users can view job messages" ON public.job_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_messages.job_id
      AND (
        jobs.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.job_matches
          WHERE job_matches.job_id = jobs.id
          AND job_matches.freelancer_id = auth.uid()
          AND job_matches.status IN ('accepted', 'auto_assigned')
        )
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
          AND users.email = ANY(SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
        )
      )
    )
  );

CREATE POLICY "Users can send job messages" ON public.job_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_messages.job_id
      AND (
        jobs.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.job_matches
          WHERE job_matches.job_id = jobs.id
          AND job_matches.freelancer_id = auth.uid()
          AND job_matches.status IN ('accepted', 'auto_assigned')
        )
      )
    )
  );

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_matches_updated_at ON public.job_matches;
CREATE TRIGGER update_job_matches_updated_at BEFORE UPDATE ON public.job_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_checklists_updated_at ON public.job_checklists;
CREATE TRIGGER update_job_checklists_updated_at BEFORE UPDATE ON public.job_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for job deliverables
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-deliverables', 'job-deliverables', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job deliverables
DROP POLICY IF EXISTS "Job deliverables are viewable by job participants" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload job deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own job deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own job deliverables" ON storage.objects;

-- Anyone can view job deliverables (public bucket)
CREATE POLICY "Job deliverables are viewable by job participants" ON storage.objects
  FOR SELECT USING (bucket_id = 'job-deliverables');

-- Users can upload to their job folders
CREATE POLICY "Users can upload job deliverables" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'job-deliverables'
    AND auth.uid()::text = (storage.foldername(name))[2] -- Format: job-deliverables/{job_id}/{user_id}/{filename}
  );

-- Users can update their own uploads
CREATE POLICY "Users can update own job deliverables" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'job-deliverables'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Users can delete their own uploads
CREATE POLICY "Users can delete own job deliverables" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'job-deliverables'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

