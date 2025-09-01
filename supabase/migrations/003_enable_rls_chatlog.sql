-- Migration: Enable Row Level Security for ChatLog table
-- This ensures users can only see their own chat logs

-- Enable RLS on the chatlog table
ALTER TABLE public.chatlog ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own chat logs" ON public.chatlog;
DROP POLICY IF EXISTS "Users can insert own chat logs" ON public.chatlog;
DROP POLICY IF EXISTS "Users can update own chat logs" ON public.chatlog;
DROP POLICY IF EXISTS "Users can delete own chat logs" ON public.chatlog;

-- Policy: Users can only view their own chat logs
CREATE POLICY "Users can view own chat logs" ON public.chatlog
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own chat logs
CREATE POLICY "Users can insert own chat logs" ON public.chatlog
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own chat logs
CREATE POLICY "Users can update own chat logs" ON public.chatlog
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own chat logs
CREATE POLICY "Users can delete own chat logs" ON public.chatlog
  FOR DELETE USING (auth.uid() = user_id);
