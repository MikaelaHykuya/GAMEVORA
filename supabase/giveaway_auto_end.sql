-- Run in Supabase Dashboard -> SQL Editor
-- Function to auto-end expired giveaways
CREATE OR REPLACE FUNCTION public.auto_end_expired_giveaways()
RETURNS TABLE(giveaway_id UUID, title TEXT, entries_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  winner_ids UUID[];
  winner_id UUID;
  v_game_id UUID;
  v_title TEXT;
BEGIN
  FOR rec IN
    SELECT g.id, g.title, g.game_id, g.winner_count,
           (SELECT COUNT(*) FROM public.giveaway_entries WHERE giveaway_id = g.id) AS total_entries
    FROM public.giveaways g
    WHERE g.status = 'active'
      AND g.ends_at < NOW()
  LOOP
    v_game_id := rec.game_id;
    v_title := rec.title;

    -- Collect all entry user_ids
    SELECT ARRAY_AGG(user_id) INTO winner_ids
    FROM public.giveaway_entries
    WHERE giveaway_id = rec.id;

    -- Update status to ended
    UPDATE public.giveaways
    SET status = 'ended'
    WHERE id = rec.id;

    -- Return info about what was ended
    giveaway_id := rec.id;
    title := v_title;
    entries_count := rec.total_entries;
    RETURN NEXT;
  END LOOP;
END;
$$;
