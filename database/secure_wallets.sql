-- ============================================================
-- SCRIPT: PEMISAHAN DATA SENSITIF (USER WALLETS)
-- ============================================================

-- 1. Buat tabel user_wallets
CREATE TABLE IF NOT EXISTS public.user_wallets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buat dompet untuk semua user yang sudah ada dengan saldo 0
INSERT INTO public.user_wallets (user_id, balance)
SELECT id, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 3. Aktifkan RLS Super Ketat (Hanya Pemilik yang bisa akses)
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own wallet" ON public.user_wallets;
CREATE POLICY "Users can read their own wallet" ON public.user_wallets
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own wallet" ON public.user_wallets;
CREATE POLICY "Users can update their own wallet" ON public.user_wallets
FOR UPDATE USING (auth.uid() = user_id);

-- 4. Buat Trigger agar user baru otomatis punya dompet
CREATE OR REPLACE FUNCTION public.handle_new_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_wallet();

-- 5. Update Fungsi (RPC) Admin untuk memotong saldo dari tabel baru
CREATE OR REPLACE FUNCTION public.deduct_commission_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_wallets
  SET balance = balance - p_amount
  WHERE user_id = p_user_id AND balance >= p_amount;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or user not found';
  END IF;
END;
$$;

-- 6. Hapus kolom lama yang tidak aman (Jalankan ini HANYA JIKA kodingan React sudah diupdate!)
-- ALTER TABLE public.profiles DROP COLUMN commission_balance;
