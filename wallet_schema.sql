-- Wallet System Schema

-- 1. Add gvr_balance to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gvr_balance bigint DEFAULT 0;

-- 2. Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  type text NOT NULL, -- 'top_up', 'purchase', 'refund'
  description text,
  status text DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'rejected'
  proof_url text, -- For manual top-up proofs
  reference_id uuid, -- Optional link to other tables if needed
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. RLS for wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet transactions"
ON public.wallet_transactions FOR SELECT
USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can insert their own wallet transactions (e.g. top up request)"
ON public.wallet_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update wallet transactions"
ON public.wallet_transactions FOR UPDATE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 4. RPC for paying with wallet
-- This function securely deducts balance and adds the games to the library
CREATE OR REPLACE FUNCTION checkout_with_wallet(
  p_user_id uuid,
  p_amount bigint,
  p_game_ids uuid[],
  p_voucher_code text DEFAULT NULL,
  p_voucher_owner_id uuid DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  v_current_balance bigint;
  v_game_id uuid;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT gvr_balance INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance >= p_amount THEN
    -- Deduct balance
    UPDATE public.profiles
    SET gvr_balance = gvr_balance - p_amount
    WHERE id = p_user_id;

    -- Record transaction
    INSERT INTO public.wallet_transactions (user_id, amount, type, description, status)
    VALUES (p_user_id, -p_amount, 'purchase', 'Checkout ' || array_length(p_game_ids, 1) || ' games', 'completed');

    -- Insert into library
    FOREACH v_game_id IN ARRAY p_game_ids
    LOOP
      INSERT INTO public.library (user_id, game_id, status, purchase_date, is_giveaway, voucher_code, voucher_owner_id)
      VALUES (p_user_id, v_game_id, 'completed', now(), false, p_voucher_code, p_voucher_owner_id)
      ON CONFLICT (user_id, game_id) DO UPDATE SET status = 'completed';
    END LOOP;
    
    -- Clear cart
    DELETE FROM public.cart WHERE user_id = p_user_id;

    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
