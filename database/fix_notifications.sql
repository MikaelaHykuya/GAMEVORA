-- ============================================================
-- Fix: Add missing columns to push_subscriptions table
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Add missing columns
ALTER TABLE public.push_subscriptions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS endpoint TEXT,
ADD COLUMN IF NOT EXISTS auth_key TEXT,
ADD COLUMN IF NOT EXISTS p256dh_key TEXT;

-- 2. Add constraints
ALTER TABLE public.push_subscriptions ALTER COLUMN endpoint SET NOT NULL;
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
ALTER TABLE public.push_subscriptions ALTER COLUMN auth_key SET NOT NULL;
ALTER TABLE public.push_subscriptions ALTER COLUMN p256dh_key SET NOT NULL;

-- 3. Recreate RLS policies (drop existing, create proper ones)
DROP POLICY IF EXISTS "Allow all read push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow all insert push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow all update push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow all delete push_subscriptions" ON public.push_subscriptions;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.push_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- 4. Enable Realtime for notification-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS push_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS vault_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS library;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS games;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS chats;

-- 5. Set replica identity for all realtime tables
ALTER TABLE push_subscriptions REPLICA IDENTITY FULL;
ALTER TABLE vault_notifications REPLICA IDENTITY FULL;
ALTER TABLE library REPLICA IDENTITY FULL;
ALTER TABLE games REPLICA IDENTITY FULL;
ALTER TABLE chats REPLICA IDENTITY FULL;
