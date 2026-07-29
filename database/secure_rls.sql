-- ============================================================
-- SECURE RLS POLICIES FOR GAMEVORA
-- Jalankan skrip ini di SQL Editor Supabase untuk memperketat keamanan.
-- ============================================================

-- Bantuan fungsi untuk cek admin, agar policy lebih rapi
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. SETTINGS
DROP POLICY IF EXISTS "Allow all read settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all insert settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all update settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all delete settings" ON public.settings;
DROP POLICY IF EXISTS "Allow read settings to everyone" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can delete settings" ON public.settings;

CREATE POLICY "Allow read settings to everyone" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON public.settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update settings" ON public.settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete settings" ON public.settings FOR DELETE USING (public.is_admin());


-- 2. PROFILES
DROP POLICY IF EXISTS "Allow all read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile, or Admins" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

CREATE POLICY "Everyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile, or Admins" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Only admins can delete profiles" ON public.profiles FOR DELETE USING (public.is_admin());


-- 3. GAMES
DROP POLICY IF EXISTS "Allow all read games" ON public.games;
DROP POLICY IF EXISTS "Allow all insert games" ON public.games;
DROP POLICY IF EXISTS "Allow all update games" ON public.games;
DROP POLICY IF EXISTS "Allow all delete games" ON public.games;
DROP POLICY IF EXISTS "Everyone can read games" ON public.games;
DROP POLICY IF EXISTS "Admins can insert games" ON public.games;
DROP POLICY IF EXISTS "Admins can update games" ON public.games;
DROP POLICY IF EXISTS "Admins can delete games" ON public.games;

CREATE POLICY "Everyone can read games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Admins can insert games" ON public.games FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update games" ON public.games FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete games" ON public.games FOR DELETE USING (public.is_admin());


-- 4. LIBRARY
DROP POLICY IF EXISTS "Allow all read library" ON public.library;
DROP POLICY IF EXISTS "Allow all insert library" ON public.library;
DROP POLICY IF EXISTS "Allow all update library" ON public.library;
DROP POLICY IF EXISTS "Allow all delete library" ON public.library;
DROP POLICY IF EXISTS "Users can view their own library, or Admins" ON public.library;
DROP POLICY IF EXISTS "Users can insert into their own library" ON public.library;
DROP POLICY IF EXISTS "Users can update their own library, or Admins" ON public.library;
DROP POLICY IF EXISTS "Only admins can delete from library" ON public.library;

CREATE POLICY "Users can view their own library, or Admins" ON public.library FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert into their own library" ON public.library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own library, or Admins" ON public.library FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Only admins can delete from library" ON public.library FOR DELETE USING (public.is_admin());


-- 5. CART
DROP POLICY IF EXISTS "Allow all read cart" ON public.cart;
DROP POLICY IF EXISTS "Allow all insert cart" ON public.cart;
DROP POLICY IF EXISTS "Allow all update cart" ON public.cart;
DROP POLICY IF EXISTS "Allow all delete cart" ON public.cart;
DROP POLICY IF EXISTS "Users can view their own cart" ON public.cart;
DROP POLICY IF EXISTS "Users can insert to their cart" ON public.cart;
DROP POLICY IF EXISTS "Users can update their cart" ON public.cart;
DROP POLICY IF EXISTS "Users can delete from their cart" ON public.cart;

CREATE POLICY "Users can view their own cart" ON public.cart FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert to their cart" ON public.cart FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their cart" ON public.cart FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their cart" ON public.cart FOR DELETE USING (auth.uid() = user_id);


-- 6. WISHLIST
DROP POLICY IF EXISTS "Allow all read wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Allow all insert wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Allow all delete wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can insert to their wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can delete from their wishlist" ON public.wishlist;

CREATE POLICY "Users can view their own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert to their wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete from their wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);


-- 7. REVIEWS
DROP POLICY IF EXISTS "Allow all read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow all insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow all update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow all delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Everyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews, or Admins" ON public.reviews;

CREATE POLICY "Everyone can read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews, or Admins" ON public.reviews FOR DELETE USING (auth.uid() = user_id OR public.is_admin());


-- 8. AUDIT LOGS
DROP POLICY IF EXISTS "Allow all read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow all insert audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin());


-- 9. VAULT NEWS
DROP POLICY IF EXISTS "Allow all read vault_news" ON public.vault_news;
DROP POLICY IF EXISTS "Allow all insert vault_news" ON public.vault_news;
DROP POLICY IF EXISTS "Allow all update vault_news" ON public.vault_news;
DROP POLICY IF EXISTS "Allow all delete vault_news" ON public.vault_news;
DROP POLICY IF EXISTS "Everyone can read vault_news" ON public.vault_news;
DROP POLICY IF EXISTS "Admins can insert vault_news" ON public.vault_news;
DROP POLICY IF EXISTS "Admins can update vault_news" ON public.vault_news;
DROP POLICY IF EXISTS "Admins can delete vault_news" ON public.vault_news;

CREATE POLICY "Everyone can read vault_news" ON public.vault_news FOR SELECT USING (true);
CREATE POLICY "Admins can insert vault_news" ON public.vault_news FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update vault_news" ON public.vault_news FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete vault_news" ON public.vault_news FOR DELETE USING (public.is_admin());

-- 10. AFFILIATE WITHDRAWALS
DROP POLICY IF EXISTS "Allow all read affiliate_withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Allow all insert affiliate_withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Allow all update affiliate_withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Allow all delete affiliate_withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Users can read their own withdrawals or admin" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Users can request withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Admins can delete withdrawals" ON public.affiliate_withdrawals;

CREATE POLICY "Users can read their own withdrawals or admin" ON public.affiliate_withdrawals FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can request withdrawals" ON public.affiliate_withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update withdrawals" ON public.affiliate_withdrawals FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete withdrawals" ON public.affiliate_withdrawals FOR DELETE USING (public.is_admin());
