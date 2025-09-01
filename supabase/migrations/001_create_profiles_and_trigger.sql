-- Migration: Create profiles table and trigger to populate on new auth.users
-- Run this in the Supabase SQL Editor or with your DB migration tooling.

-- 1) Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';

-- 2) Function to create a profile for new auth.users entries
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    lower(split_part(coalesce(NEW.email, ''), '@', 1)),
    COALESCE(
      (CASE WHEN NEW.raw_user_meta_data IS NOT NULL THEN (NEW.raw_user_meta_data::jsonb ->> 'full_name') ELSE NULL END),
      'New User'
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3) Trigger to run the function after a new user is created in auth.users
-- Drop existing trigger if present (idempotent migration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'on_auth_user_created'
  ) THEN
    DROP TRIGGER on_auth_user_created ON auth.users;
  END IF;
END$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
