-- ============================================================
-- PlayerFinder: Complete Database Schema
-- Run this in Supabase SQL Editor to set up the entire database
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

-- Sports table (data-driven, add new sports by inserting rows)
CREATE TABLE IF NOT EXISTS public.sports (
  id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  default_players_needed int NOT NULL DEFAULT 2,
  icon text DEFAULT 'trophy'
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  roll_number text UNIQUE NOT NULL,
  department text,
  year int CHECK (year BETWEEN 1 AND 5),
  contact text,
  avatar_url text,
  bio text,
  avg_rating numeric(3,2) DEFAULT 0,
  rating_count int DEFAULT 0,
  matches_played int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Player skill levels per sport
CREATE TABLE IF NOT EXISTS public.player_sport_levels (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport_id smallint REFERENCES public.sports(id) ON DELETE CASCADE,
  skill_level text NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  PRIMARY KEY (user_id, sport_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport_id smallint NOT NULL REFERENCES public.sports(id) ON DELETE RESTRICT,
  venue text NOT NULL,
  match_at timestamptz NOT NULL,
  players_needed int NOT NULL CHECK (players_needed > 0),
  skill_level text NOT NULL DEFAULT 'any' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'any')),
  join_mode text NOT NULL DEFAULT 'instant' CHECK (join_mode IN ('approval', 'instant')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Match participants (join requests and accepted players)
CREATE TABLE IF NOT EXISTS public.match_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (match_id, user_id)
);

-- Ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ratee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  no_show boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (match_id, rater_id, ratee_id),
  CHECK (rater_id <> ratee_id)
);

-- Notifications (in-app)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_matches_status_match_at ON public.matches (status, match_at);
CREATE INDEX IF NOT EXISTS idx_matches_sport_match_at ON public.matches (sport_id, match_at);
CREATE INDEX IF NOT EXISTS idx_matches_open_feed ON public.matches (match_at) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_matches_host ON public.matches (host_id);
CREATE INDEX IF NOT EXISTS idx_participants_match_status ON public.match_participants (match_id, status);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.match_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee ON public.ratings (ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_match ON public.ratings (match_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, read, created_at DESC);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_sport_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

-- SPORTS policies (read-only for users)
CREATE POLICY "sports_select" ON public.sports FOR SELECT TO authenticated USING (true);

-- PLAYER_SPORT_LEVELS policies
CREATE POLICY "psl_select" ON public.player_sport_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "psl_insert_own" ON public.player_sport_levels FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "psl_update_own" ON public.player_sport_levels FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "psl_delete_own" ON public.player_sport_levels FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- MATCHES policies
CREATE POLICY "matches_select" ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "matches_insert" ON public.matches FOR INSERT TO authenticated WITH CHECK (host_id = (SELECT auth.uid()));
CREATE POLICY "matches_update_host" ON public.matches FOR UPDATE TO authenticated USING (host_id = (SELECT auth.uid())) WITH CHECK (host_id = (SELECT auth.uid()));

-- MATCH_PARTICIPANTS policies
CREATE POLICY "mp_select_own" ON public.match_participants FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR match_id IN (SELECT id FROM public.matches WHERE host_id = (SELECT auth.uid()))
  );
CREATE POLICY "mp_insert_own" ON public.match_participants FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "mp_update" ON public.match_participants FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR match_id IN (SELECT id FROM public.matches WHERE host_id = (SELECT auth.uid()))
  );

-- RATINGS policies
CREATE POLICY "ratings_select" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "ratings_insert" ON public.ratings FOR INSERT TO authenticated WITH CHECK (rater_id = (SELECT auth.uid()));

-- NOTIFICATIONS policies
CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, roll_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'roll_number', NEW.id::text)
  );
  RETURN NEW;
END;
$$;

-- Trigger: create profile on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Roll number lookup (returns email, no enumeration info)
CREATE OR REPLACE FUNCTION public.get_email_by_roll_number(roll text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_email text;
BEGIN
  SELECT u.email INTO found_email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.roll_number = roll;
  
  -- Always return something to prevent enumeration
  RETURN COALESCE(found_email, roll || '@placeholder.invalid');
END;
$$;

-- Join match (atomic with row locking)
CREATE OR REPLACE FUNCTION public.join_match(p_match_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_accepted_count int;
  v_user_id uuid := auth.uid();
  v_result_status text;
BEGIN
  -- Lock the match row
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
  
  IF v_match IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  
  IF v_match.host_id = v_user_id THEN
    RAISE EXCEPTION 'Cannot join your own match';
  END IF;
  
  IF v_match.status <> 'open' THEN
    RAISE EXCEPTION 'Match is not open for joining';
  END IF;
  
  IF v_match.match_at <= now() THEN
    RAISE EXCEPTION 'Match has already passed';
  END IF;
  
  -- Check if already a participant
  IF EXISTS (SELECT 1 FROM public.match_participants WHERE match_id = p_match_id AND user_id = v_user_id AND status IN ('pending', 'accepted')) THEN
    RAISE EXCEPTION 'Already joined or requested';
  END IF;
  
  -- Count accepted participants
  SELECT count(*) INTO v_accepted_count FROM public.match_participants WHERE match_id = p_match_id AND status = 'accepted';
  
  IF v_match.join_mode = 'instant' THEN
    IF v_accepted_count >= v_match.players_needed THEN
      RAISE EXCEPTION 'Match is full';
    END IF;
    
    INSERT INTO public.match_participants (match_id, user_id, status) VALUES (p_match_id, v_user_id, 'accepted')
    ON CONFLICT (match_id, user_id) DO UPDATE SET status = 'accepted';
    
    v_result_status := 'accepted';
    
    -- Check if match is now full
    IF v_accepted_count + 1 >= v_match.players_needed THEN
      UPDATE public.matches SET status = 'full' WHERE id = p_match_id;
    END IF;
  ELSE
    -- Approval mode
    INSERT INTO public.match_participants (match_id, user_id, status) VALUES (p_match_id, v_user_id, 'pending')
    ON CONFLICT (match_id, user_id) DO UPDATE SET status = 'pending';
    
    v_result_status := 'pending';
  END IF;
  
  RETURN v_result_status;
END;
$$;

-- Accept join request (host only)
CREATE OR REPLACE FUNCTION public.accept_join_request(p_match_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_accepted_count int;
BEGIN
  -- Lock the match row
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
  
  IF v_match IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  
  IF v_match.host_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the host can accept requests';
  END IF;
  
  IF v_match.status NOT IN ('open', 'full') THEN
    RAISE EXCEPTION 'Match is not active';
  END IF;
  
  SELECT count(*) INTO v_accepted_count FROM public.match_participants WHERE match_id = p_match_id AND status = 'accepted';
  
  IF v_accepted_count >= v_match.players_needed THEN
    RAISE EXCEPTION 'Match is full';
  END IF;
  
  UPDATE public.match_participants SET status = 'accepted' WHERE match_id = p_match_id AND user_id = p_user_id AND status = 'pending';
  
  -- Check if match is now full
  IF v_accepted_count + 1 >= v_match.players_needed THEN
    UPDATE public.matches SET status = 'full' WHERE id = p_match_id;
  END IF;
END;
$$;

-- Reject join request (host only)
CREATE OR REPLACE FUNCTION public.reject_join_request(p_match_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  
  IF v_match IS NULL OR v_match.host_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  UPDATE public.match_participants SET status = 'rejected' WHERE match_id = p_match_id AND user_id = p_user_id AND status = 'pending';
END;
$$;

-- Leave match (participant only)
CREATE OR REPLACE FUNCTION public.leave_match(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_accepted_count int;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
  
  IF v_match IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  
  IF v_match.host_id = auth.uid() THEN
    RAISE EXCEPTION 'Host cannot leave their own match. Cancel it instead.';
  END IF;
  
  UPDATE public.match_participants SET status = 'withdrawn' WHERE match_id = p_match_id AND user_id = auth.uid() AND status IN ('pending', 'accepted');
  
  -- If match was full and someone left, reopen
  IF v_match.status = 'full' THEN
    SELECT count(*) INTO v_accepted_count FROM public.match_participants WHERE match_id = p_match_id AND status = 'accepted';
    IF v_accepted_count < v_match.players_needed THEN
      UPDATE public.matches SET status = 'open' WHERE id = p_match_id;
    END IF;
  END IF;
END;
$$;

-- Cancel match (host only)
CREATE OR REPLACE FUNCTION public.cancel_match(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  
  IF v_match IS NULL OR v_match.host_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  IF v_match.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Match is already completed or cancelled';
  END IF;
  
  UPDATE public.matches SET status = 'cancelled' WHERE id = p_match_id;
END;
$$;

-- Complete match (host only)
CREATE OR REPLACE FUNCTION public.complete_match(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  
  IF v_match IS NULL OR v_match.host_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  IF v_match.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Match is already completed or cancelled';
  END IF;
  
  UPDATE public.matches SET status = 'completed' WHERE id = p_match_id;
  
  -- Update matches_played count for all accepted participants
  UPDATE public.profiles
  SET matches_played = matches_played + 1
  WHERE id IN (
    SELECT user_id FROM public.match_participants WHERE match_id = p_match_id AND status = 'accepted'
  ) OR id = v_match.host_id;
END;
$$;

-- Submit rating
CREATE OR REPLACE FUNCTION public.submit_rating(
  p_match_id uuid,
  p_ratee_id uuid,
  p_stars smallint,
  p_comment text DEFAULT NULL,
  p_no_show boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_rater_id uuid := auth.uid();
  v_new_avg numeric;
  v_new_count int;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  
  IF v_match IS NULL OR v_match.status <> 'completed' THEN
    RAISE EXCEPTION 'Match is not completed';
  END IF;
  
  IF v_rater_id = p_ratee_id THEN
    RAISE EXCEPTION 'Cannot rate yourself';
  END IF;
  
  -- Check both are participants
  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants 
    WHERE match_id = p_match_id AND user_id = v_rater_id AND status = 'accepted'
    UNION ALL
    SELECT 1 WHERE v_rater_id = v_match.host_id
  ) THEN
    RAISE EXCEPTION 'You are not a participant of this match';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants 
    WHERE match_id = p_match_id AND user_id = p_ratee_id AND status = 'accepted'
    UNION ALL
    SELECT 1 WHERE p_ratee_id = v_match.host_id
  ) THEN
    RAISE EXCEPTION 'Target is not a participant of this match';
  END IF;
  
  INSERT INTO public.ratings (match_id, rater_id, ratee_id, stars, comment, no_show)
  VALUES (p_match_id, v_rater_id, p_ratee_id, p_stars, p_comment, p_no_show);
  
  -- Update the ratee's average rating
  SELECT avg(stars), count(*) INTO v_new_avg, v_new_count
  FROM public.ratings WHERE ratee_id = p_ratee_id;
  
  UPDATE public.profiles
  SET avg_rating = ROUND(v_new_avg, 2), rating_count = v_new_count
  WHERE id = p_ratee_id;
END;
$$;

-- ============================================================
-- 5. SEED DATA
-- ============================================================

INSERT INTO public.sports (name, default_players_needed, icon) VALUES
  ('Badminton', 2, 'racquet'),
  ('Table Tennis', 2, 'table-tennis'),
  ('Cricket', 12, 'cricket'),
  ('Football', 12, 'football'),
  ('Basketball', 10, 'basketball'),
  ('Volleyball', 12, 'volleyball'),
  ('Chess', 2, 'chess'),
  ('Tennis', 2, 'tennis')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 6. REALTIME
-- ============================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

