-- ============================================================
-- SCRIPT: TIGHTEN MISSING RLS POLICIES
-- ============================================================

-- Bantuan fungsi (jika belum ada, pastikan is_admin() ada)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 1. GIVEAWAYS
-- ==========================================
DROP POLICY IF EXISTS "Allow all read giveaways" ON public.giveaways;
DROP POLICY IF EXISTS "Allow all insert giveaways" ON public.giveaways;
DROP POLICY IF EXISTS "Allow all update giveaways" ON public.giveaways;
DROP POLICY IF EXISTS "Allow all delete giveaways" ON public.giveaways;

DROP POLICY IF EXISTS "Everyone can read giveaways" ON public.giveaways;
CREATE POLICY "Everyone can read giveaways" ON public.giveaways FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert giveaways" ON public.giveaways;
CREATE POLICY "Admins can insert giveaways" ON public.giveaways FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can update giveaways" ON public.giveaways;
CREATE POLICY "Admins can update giveaways" ON public.giveaways FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete giveaways" ON public.giveaways;
CREATE POLICY "Admins can delete giveaways" ON public.giveaways FOR DELETE USING (public.is_admin());

-- ==========================================
-- 2. GIVEAWAY ENTRIES
-- ==========================================
DROP POLICY IF EXISTS "Allow all read giveaway_entries" ON public.giveaway_entries;
DROP POLICY IF EXISTS "Allow all insert giveaway_entries" ON public.giveaway_entries;
DROP POLICY IF EXISTS "Allow all update giveaway_entries" ON public.giveaway_entries;
DROP POLICY IF EXISTS "Allow all delete giveaway_entries" ON public.giveaway_entries;

DROP POLICY IF EXISTS "Everyone can read giveaway_entries" ON public.giveaway_entries;
CREATE POLICY "Everyone can read giveaway_entries" ON public.giveaway_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own entries" ON public.giveaway_entries;
CREATE POLICY "Users can insert their own entries" ON public.giveaway_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users cannot update entries" ON public.giveaway_entries;
CREATE POLICY "Users cannot update entries" ON public.giveaway_entries FOR UPDATE USING (false);
DROP POLICY IF EXISTS "Only admins can delete entries" ON public.giveaway_entries;
CREATE POLICY "Only admins can delete entries" ON public.giveaway_entries FOR DELETE USING (public.is_admin());

-- ==========================================
-- 3. GAME REQUESTS
-- ==========================================
DROP POLICY IF EXISTS "Allow all read game_requests" ON public.game_requests;
DROP POLICY IF EXISTS "Allow all insert game_requests" ON public.game_requests;
DROP POLICY IF EXISTS "Allow all update game_requests" ON public.game_requests;
DROP POLICY IF EXISTS "Allow all delete game_requests" ON public.game_requests;

DROP POLICY IF EXISTS "Everyone can read game_requests" ON public.game_requests;
CREATE POLICY "Everyone can read game_requests" ON public.game_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert game_requests" ON public.game_requests;
CREATE POLICY "Authenticated users can insert game_requests" ON public.game_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can update game_requests" ON public.game_requests;
CREATE POLICY "Admins can update game_requests" ON public.game_requests FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete game_requests" ON public.game_requests;
CREATE POLICY "Admins can delete game_requests" ON public.game_requests FOR DELETE USING (public.is_admin());

-- ==========================================
-- 4. VAULT NOTIFICATIONS
-- ==========================================
DROP POLICY IF EXISTS "Allow all read vault_notifications" ON public.vault_notifications;
DROP POLICY IF EXISTS "Allow all insert vault_notifications" ON public.vault_notifications;
DROP POLICY IF EXISTS "Allow all update vault_notifications" ON public.vault_notifications;
DROP POLICY IF EXISTS "Allow all delete vault_notifications" ON public.vault_notifications;

DROP POLICY IF EXISTS "Users can read their own notifications" ON public.vault_notifications;
CREATE POLICY "Users can read their own notifications" ON public.vault_notifications FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.vault_notifications;
CREATE POLICY "Admins can insert notifications" ON public.vault_notifications FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.vault_notifications;
CREATE POLICY "Users can delete their own notifications" ON public.vault_notifications FOR DELETE USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users cannot update notifications" ON public.vault_notifications;
CREATE POLICY "Users cannot update notifications" ON public.vault_notifications FOR UPDATE USING (false);

-- ==========================================
-- 5. CHATS
-- ==========================================
DROP POLICY IF EXISTS "Allow all read chats" ON public.chats;
DROP POLICY IF EXISTS "Allow all insert chats" ON public.chats;
DROP POLICY IF EXISTS "Allow all update chats" ON public.chats;
DROP POLICY IF EXISTS "Allow all delete chats" ON public.chats;

DROP POLICY IF EXISTS "Users can read their own chats and admins can read all" ON public.chats;
CREATE POLICY "Users can read their own chats and admins can read all" ON public.chats FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users can insert their own chats or admin" ON public.chats;
CREATE POLICY "Users can insert their own chats or admin" ON public.chats FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "No one can update chats" ON public.chats;
CREATE POLICY "No one can update chats" ON public.chats FOR UPDATE USING (false);
DROP POLICY IF EXISTS "Admins can delete chats" ON public.chats;
CREATE POLICY "Admins can delete chats" ON public.chats FOR DELETE USING (public.is_admin());

-- ==========================================
-- 6. PUSH SUBSCRIPTIONS
-- ==========================================
DROP POLICY IF EXISTS "Allow all read push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow all insert push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow all update push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow all delete push_subscriptions" ON public.push_subscriptions;

DROP POLICY IF EXISTS "Users can read their own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can read their own push_subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert their own push_subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own push_subscriptions" ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own push_subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 7. AFFILIATE REFERRALS
-- ==========================================
DROP POLICY IF EXISTS "Allow all read affiliate_referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "Allow all insert affiliate_referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "Allow all update affiliate_referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "Allow all delete affiliate_referrals" ON public.affiliate_referrals;

DROP POLICY IF EXISTS "Users can read their own referrals" ON public.affiliate_referrals;
CREATE POLICY "Users can read their own referrals" ON public.affiliate_referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_admin());
DROP POLICY IF EXISTS "Users can insert referral for themselves" ON public.affiliate_referrals;
CREATE POLICY "Users can insert referral for themselves" ON public.affiliate_referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);
DROP POLICY IF EXISTS "No one can update referrals" ON public.affiliate_referrals;
CREATE POLICY "No one can update referrals" ON public.affiliate_referrals FOR UPDATE USING (false);
DROP POLICY IF EXISTS "Admins can delete referrals" ON public.affiliate_referrals;
CREATE POLICY "Admins can delete referrals" ON public.affiliate_referrals FOR DELETE USING (public.is_admin());

-- ==========================================
-- 8. AFFILIATE COMMISSIONS
-- ==========================================
DROP POLICY IF EXISTS "Allow all read affiliate_commissions" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Allow all insert affiliate_commissions" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Allow all update affiliate_commissions" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Allow all delete affiliate_commissions" ON public.affiliate_commissions;

DROP POLICY IF EXISTS "Users can read their own commissions" ON public.affiliate_commissions;
CREATE POLICY "Users can read their own commissions" ON public.affiliate_commissions FOR SELECT USING (auth.uid() = referrer_id OR public.is_admin());
DROP POLICY IF EXISTS "Only admins can insert commissions" ON public.affiliate_commissions;
CREATE POLICY "Only admins can insert commissions" ON public.affiliate_commissions FOR INSERT WITH CHECK (public.is_admin()); 
DROP POLICY IF EXISTS "Admins can update commissions" ON public.affiliate_commissions;
CREATE POLICY "Admins can update commissions" ON public.affiliate_commissions FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete commissions" ON public.affiliate_commissions;
CREATE POLICY "Admins can delete commissions" ON public.affiliate_commissions FOR DELETE USING (public.is_admin());

-- ============================================================
-- 9. PROFILES PUBLIC VIEW & RPCs
-- ============================================================
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT id, username, full_name, avatar_url, border_effect, status_emoji,
       status_text, accent_color, bg_effect, bgm_url, bgm_playlist,
       avatar_frame, avatar_accessory, profile_theme, cover_url,
       cover_video_url, visitor_count, featured_games,
       total_earned, affiliate_tier_id
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;

CREATE OR REPLACE FUNCTION public.increment_profile_visitor(target_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.profiles
  SET visitor_count = COALESCE(visitor_count, 0) + 1
  WHERE id = target_id
  RETURNING visitor_count INTO new_count;
  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_profile_visitor(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_referrer_by_code(code text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE affiliate_code ILIKE code LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_referrer_by_code(text) TO authenticated, anon;

-- ============================================================
-- DONE
-- ============================================================
