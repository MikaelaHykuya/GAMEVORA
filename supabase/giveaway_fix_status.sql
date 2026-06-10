-- Run in Supabase Dashboard -> SQL Editor
-- Fix: giveaways created without explicit status get NULL instead of 'active'

ALTER TABLE public.giveaways
  ALTER COLUMN status SET DEFAULT 'active';

UPDATE public.giveaways
SET status = 'active'
WHERE status IS NULL;
