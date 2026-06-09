-- ============================================================
-- Fix "Cart is empty!" saat pembayaran & related schema issues
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add UNIQUE index on cart(user_id, game_id) so upsert with onConflict works
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_user_game ON public.cart (user_id, game_id);

-- 2. Add UNIQUE index on library(user_id, game_id) so upsert works
CREATE UNIQUE INDEX IF NOT EXISTS idx_library_user_game ON public.library (user_id, game_id);

-- 3. Add is_read column to vault_notifications (used by InboxModal & Navbar)
ALTER TABLE public.vault_notifications
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- 4. Create reviews table (used by Detail.jsx & GameCard.jsx)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT reviews_user_game_unique UNIQUE (game_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow all insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update reviews" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "Allow all delete reviews" ON public.reviews FOR DELETE USING (true);
