-- Run in Supabase Dashboard -> SQL Editor
-- Add missing columns to vault_notifications table

ALTER TABLE public.vault_notifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
