-- ============================================================
-- SCRIPT: ULTIMATE FIX UNTUK DOMPET & RLS
-- ============================================================

-- 1. Hapus semua policy lama di user_wallets agar bersih
DROP POLICY IF EXISTS "Users can read their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can update wallets" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can read all wallets" ON public.user_wallets;

-- 2. Buat ulang policy yang BENAR
-- User biasa hanya bisa melihat miliknya sendiri
CREATE POLICY "Users can read their own wallet" ON public.user_wallets 
FOR SELECT USING (auth.uid() = user_id);

-- Admin bisa melihat SEMUA dompet
CREATE POLICY "Admins can read all wallets" ON public.user_wallets 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Admin bisa mengubah SEMUA dompet
CREATE POLICY "Admins can update wallets" ON public.user_wallets 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 3. Paksa ubah saldo Farrel menjadi 850
UPDATE public.user_wallets
SET balance = 850
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE full_name ILIKE '%Farrel%'
);

-- 4. Paksa hapus sisa kolom lama agar tidak membingungkan sistem lagi
ALTER TABLE public.profiles DROP COLUMN IF EXISTS commission_balance;
