CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_name text,
  requested_code text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_game_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
  reason text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read affiliate_applications" ON public.affiliate_applications FOR SELECT USING (true);
CREATE POLICY "Allow all insert affiliate_applications" ON public.affiliate_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update affiliate_applications" ON public.affiliate_applications FOR UPDATE USING (true);
CREATE POLICY "Allow all delete affiliate_applications" ON public.affiliate_applications FOR DELETE USING (true);

ALTER TABLE public.affiliate_game_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read affiliate_game_requests" ON public.affiliate_game_requests FOR SELECT USING (true);
CREATE POLICY "Allow all insert affiliate_game_requests" ON public.affiliate_game_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update affiliate_game_requests" ON public.affiliate_game_requests FOR UPDATE USING (true);
CREATE POLICY "Allow all delete affiliate_game_requests" ON public.affiliate_game_requests FOR DELETE USING (true);
