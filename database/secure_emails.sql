-- ============================================================
-- SECURE EMAILS & AUTO MERGE PROFILES
-- ============================================================

-- 1. Buat fungsi RPC untuk menggabungkan profil (merge) berdasarkan email
CREATE OR REPLACE FUNCTION public.merge_my_profiles()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  my_uid uuid;
  my_email text;
  best_id uuid;
  best_role text;
  best_name text;
  best_avatar text;
  best_username text;
  rec record;
  best_score int := -1;
  current_score int;
BEGIN
  my_uid := auth.uid();
  IF my_uid IS NULL THEN RETURN NULL; END IF;

  SELECT email INTO my_email FROM auth.users WHERE id = my_uid;
  
  -- Jika tidak ada email, kembalikan profil saat ini saja
  IF my_email IS NULL THEN 
    SELECT * INTO rec FROM public.profiles WHERE id = my_uid;
    RETURN row_to_json(rec);
  END IF;

  -- Cari profil terbaik dari semua UID yang memiliki email sama di auth.users
  FOR rec IN (
    SELECT p.* FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE u.email = my_email
  ) LOOP
    current_score := 0;
    IF rec.role = 'admin' THEN current_score := current_score + 10; END IF;
    IF rec.full_name IS NOT NULL THEN current_score := current_score + 5; END IF;
    IF rec.avatar_url IS NOT NULL THEN current_score := current_score + 2; END IF;
    
    IF current_score > best_score THEN
      best_score := current_score;
      best_id := rec.id;
      best_role := rec.role;
      best_name := rec.full_name;
      best_avatar := rec.avatar_url;
      best_username := rec.username;
    END IF;
  END LOOP;

  -- Jika profil terbaik ada di ID lama, migrasikan data ke ID baru (my_uid)
  IF best_id IS NOT NULL AND best_id != my_uid THEN
    -- Pindahkan riwayat
    UPDATE public.library SET user_id = my_uid WHERE user_id = best_id;
    UPDATE public.cart SET user_id = my_uid WHERE user_id = best_id;
    UPDATE public.chats SET user_id = my_uid WHERE user_id = best_id;
    UPDATE public.giveaway_entries SET user_id = my_uid WHERE user_id = best_id;
    UPDATE public.giveaways SET created_by = my_uid WHERE created_by = best_id;
    
    -- Timpa data profil baru dengan data profil terbaik
    UPDATE public.profiles 
    SET 
      role = COALESCE(best_role, role),
      full_name = COALESCE(best_name, full_name),
      avatar_url = COALESCE(best_avatar, avatar_url),
      username = COALESCE(best_username, username)
    WHERE id = my_uid;

    -- Hapus profil lama
    DELETE FROM public.profiles 
    WHERE id IN (
      SELECT u.id FROM auth.users u WHERE u.email = my_email AND u.id != my_uid
    );
  END IF;

  -- Kembalikan profil final
  SELECT * INTO rec FROM public.profiles WHERE id = my_uid;
  RETURN row_to_json(rec);
END;
$$;

-- 2. HAPUS KOLOM EMAIL DARI TABEL PUBLIK (KUNCI KEAMANAN)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
