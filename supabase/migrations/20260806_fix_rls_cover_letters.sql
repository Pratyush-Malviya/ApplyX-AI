-- Migration: Fix missing RLS policies
-- Adds UPDATE policy for cover_letters and creates the auth/verify endpoint helper

-- cover_letters was missing an UPDATE policy
CREATE POLICY "Users can update own cover letters"
  ON public.cover_letters FOR UPDATE
  USING (auth.uid() = user_id);
