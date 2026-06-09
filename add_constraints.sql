-- Add missing FK constraints for Supabase schema cache
-- Jalankan di Supabase Dashboard → SQL Editor
-- NOT VALID = skip validasi data lama, cuma berlaku buat data baru

-- library → games & profiles
ALTER TABLE public.library
  ADD CONSTRAINT library_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE NOT VALID,
  ADD CONSTRAINT library_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

-- cart → games & profiles
ALTER TABLE public.cart
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS game_id uuid;
ALTER TABLE public.cart
  ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID,
  ADD CONSTRAINT cart_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE NOT VALID;

-- giveaways → games & profiles
ALTER TABLE public.giveaways
  ADD CONSTRAINT giveaways_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE NOT VALID,
  ADD CONSTRAINT giveaways_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

-- giveaway_entries → giveaways & profiles
ALTER TABLE public.giveaway_entries
  ADD CONSTRAINT giveaway_entries_giveaway_id_fkey FOREIGN KEY (giveaway_id) REFERENCES public.giveaways(id) ON DELETE CASCADE NOT VALID,
  ADD CONSTRAINT giveaway_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;

-- chats → profiles
ALTER TABLE public.chats
  ADD CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;
