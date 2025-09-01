-- Migration: Create ChatLog table to store user/bot conversations
-- Run this in the Supabase SQL Editor or with your DB migration tooling.

CREATE TABLE IF NOT EXISTS public.chatlog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_message text,
  bot_response text,
  detected_mood text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.chatlog IS 'Stores chat messages between users and the bot.';

-- Optional index to speed up queries by user
CREATE INDEX IF NOT EXISTS idx_chatlog_user_id ON public.chatlog (user_id);
