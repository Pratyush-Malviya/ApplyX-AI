-- Migration: Schema & RLS policies for UX Improvements and Buzz Features

-- 1. Onboarding Progress
CREATE TABLE IF NOT EXISTS public.user_onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  setup_progress INTEGER DEFAULT 0 NOT NULL,
  resume_uploaded BOOLEAN DEFAULT false NOT NULL,
  first_tailor_done BOOLEAN DEFAULT false NOT NULL,
  first_application_tracked BOOLEAN DEFAULT false NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding progress"
  ON public.user_onboarding_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
  ON public.user_onboarding_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON public.user_onboarding_progress FOR UPDATE USING (auth.uid() = user_id);

-- 2. Interview Prep Sessions
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_role TEXT NOT NULL,
  job_description TEXT,
  questions JSONB NOT NULL, -- Array of Q&A objects
  overall_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interview sessions"
  ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);

-- 3. Auto-Apply Queue
CREATE TABLE IF NOT EXISTS public.auto_apply_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_url TEXT NOT NULL,
  job_description TEXT,
  tailored_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'submitted', 'skipped', 'failed')),
  approved_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.auto_apply_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own auto-apply queue"
  ON public.auto_apply_queue FOR ALL USING (auth.uid() = user_id);

-- 4. Shareable Resumes (Public Read by Token, RLS Protected Write)
CREATE TABLE IF NOT EXISTS public.shareable_resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  mask_pii BOOLEAN DEFAULT true NOT NULL,
  views_count INTEGER DEFAULT 0 NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.shareable_resumes ENABLE ROW LEVEL SECURITY;

-- Anyone with the valid unexpired token can read
CREATE POLICY "Public read shareable resumes by valid token"
  ON public.shareable_resumes FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Users can manage own shareable resumes"
  ON public.shareable_resumes FOR ALL USING (auth.uid() = user_id);
