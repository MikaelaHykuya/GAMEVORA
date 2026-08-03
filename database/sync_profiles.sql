-- ============================================================
-- SCRIPT: FIX MISSING PROFILES & RLS (REVISED V3)
-- ============================================================

-- Bantuan fungsi (Mencegah Infinite Recursion di Policy)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Pastikan RLS di tabel profiles mengizinkan Admin untuk melihat semua data
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles 
FOR SELECT USING (public.is_admin());

-- Pastikan policy umum "Everyone can read profiles" jika diperlukan
DROP POLICY IF EXISTS "Everyone can read profiles" ON public.profiles;
CREATE POLICY "Everyone can read profiles" ON public.profiles FOR SELECT USING (true);


-- 2. Sinkronisasi (Sync) data dari auth.users ke public.profiles
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
  'user' as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. Sinkronisasi dompet
INSERT INTO public.user_wallets (user_id, balance)
SELECT id, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_wallets)
ON CONFLICT (user_id) DO NOTHING;
