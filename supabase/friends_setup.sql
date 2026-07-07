-- Add visitor_count to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS visitor_count bigint DEFAULT 0;

-- BGM playlist (array of {url, title})
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bgm_playlist jsonb DEFAULT '[]'::jsonb;

-- Avatar customization
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_frame text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_accessory text DEFAULT '';

-- Profile visitor book
CREATE TABLE IF NOT EXISTS public.profile_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  visited_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profile visits"
  ON public.profile_visits FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert visits"
  ON public.profile_visits FOR INSERT
  WITH CHECK (auth.uid() = visitor_id);

CREATE INDEX IF NOT EXISTS idx_profile_visits_visited ON public.profile_visits(visited_id);
CREATE INDEX IF NOT EXISTS idx_profile_visits_created ON public.profile_visits(created_at DESC);

-- Profile theme
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_theme text DEFAULT 'default';

-- Reviews table already exists in fix_schema.sql — skipping

-- Friend requests / friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own friendships
CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Allow users to insert friend requests (as sender)
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Allow users to update friendships they're part of (accept/reject)
CREATE POLICY "Users can update their friendships"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Allow users to delete friendships they're part of
CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_friendships_sender ON public.friendships(sender_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON public.friendships(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);
