
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  age_confirmed BOOLEAN NOT NULL DEFAULT false,
  daily_view_limit INT NOT NULL DEFAULT 50,
  notify_daily_tips BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- PLANS (public catalog)
CREATE TABLE public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_ngn INT NOT NULL,
  interval TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_recommendation_limit INT NOT NULL DEFAULT 3,
  daily_custom_prediction_limit INT NOT NULL DEFAULT 3,
  can_use_accumulator BOOLEAN NOT NULL DEFAULT false,
  can_export_history BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads plans" ON public.plans FOR SELECT TO anon, authenticated USING (true);

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  flutterwave_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.subscriptions(user_id);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subs" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subs" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subs" ON public.subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RECOMMENDATIONS (public, from the system)
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture TEXT NOT NULL,
  league TEXT NOT NULL,
  kickoff TIMESTAMPTZ NOT NULL,
  market TEXT NOT NULL,
  pick TEXT NOT NULL,
  confidence INT NOT NULL,
  odds NUMERIC(5,2) NOT NULL,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.recommendations(market, kickoff);
GRANT SELECT ON public.recommendations TO authenticated, anon;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads recommendations" ON public.recommendations FOR SELECT TO anon, authenticated USING (true);

-- PREDICTIONS CACHE
CREATE TABLE public.predictions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.predictions_cache TO authenticated;
GRANT ALL ON public.predictions_cache TO service_role;
ALTER TABLE public.predictions_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read cache" ON public.predictions_cache FOR SELECT TO authenticated USING (true);

-- USER ACTIVITY
CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.user_activity(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.user_activity TO authenticated;
GRANT ALL ON public.user_activity TO service_role;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own activity" ON public.user_activity FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own activity" ON public.user_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- WATCHLIST
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_name)
);
GRANT SELECT, INSERT, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist" ON public.watchlist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- BET SLIPS
CREATE TABLE public.bet_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  picks JSONB NOT NULL DEFAULT '[]'::jsonb,
  combined_odds NUMERIC(8,2) NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.bet_slips(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bet_slips TO authenticated;
GRANT ALL ON public.bet_slips TO service_role;
ALTER TABLE public.bet_slips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own slips" ON public.bet_slips FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AUTO CREATE PROFILE + DEFAULT ROLE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED PLANS
INSERT INTO public.plans (id, name, price_ngn, interval, features, daily_recommendation_limit, daily_custom_prediction_limit, can_use_accumulator, can_export_history, sort_order) VALUES
('free_trial', 'Free Trial', 0, '14d',
 '["3 daily recommendations per market","3 custom predictions/day","14-day full access to Pro features"]'::jsonb,
 999, 999, true, true, 1),
('weekly', 'Weekly', 3500, 'week',
 '["Unlimited daily recommendations","Unlimited custom predictions","Accumulator builder","Prediction history export","Priority tips"]'::jsonb,
 9999, 9999, true, true, 2),
('monthly', 'Monthly', 12000, 'month',
 '["Everything in Weekly","Best value for regular bettors","Priority email tips"]'::jsonb,
 9999, 9999, true, true, 3),
('annual', 'Annual', 110000, 'year',
 '["Everything in Monthly","2 months free","Early access to new markets"]'::jsonb,
 9999, 9999, true, true, 4);

-- SEED RECOMMENDATIONS (a bunch across markets)
INSERT INTO public.recommendations (fixture, league, kickoff, market, pick, confidence, odds) VALUES
('Arsenal vs Chelsea','EPL', now() + interval '4 hours','Home Win','Arsenal',82,1.75),
('Man City vs Brighton','EPL', now() + interval '6 hours','Home Win','Man City',88,1.45),
('Liverpool vs Fulham','EPL', now() + interval '8 hours','Home Win','Liverpool',80,1.55),
('Bayern vs Leverkusen','Bundesliga', now() + interval '5 hours','Home Win','Bayern',75,1.85),
('Real Madrid vs Getafe','La Liga', now() + interval '7 hours','Home Win','Real Madrid',85,1.40),
('PSG vs Nantes','Ligue 1', now() + interval '3 hours','Home Win','PSG',90,1.35),
('Inter vs Torino','Serie A', now() + interval '9 hours','Home Win','Inter',78,1.65),
('Barcelona vs Sevilla','La Liga', now() + interval '10 hours','Home Win','Barcelona',77,1.70),
('Dortmund vs Mainz','Bundesliga', now() + interval '5 hours','Home Win','Dortmund',72,1.90),
('Napoli vs Empoli','Serie A', now() + interval '6 hours','Home Win','Napoli',80,1.60),

('Wolves vs Man Utd','EPL', now() + interval '4 hours','Away Win','Man Utd',68,2.10),
('Girona vs Atletico','La Liga', now() + interval '5 hours','Away Win','Atletico',65,2.30),
('Genoa vs Juventus','Serie A', now() + interval '6 hours','Away Win','Juventus',70,2.05),
('Nice vs Marseille','Ligue 1', now() + interval '7 hours','Away Win','Marseille',62,2.40),
('Stuttgart vs Leipzig','Bundesliga', now() + interval '8 hours','Away Win','Leipzig',67,2.20),
('Everton vs Tottenham','EPL', now() + interval '9 hours','Away Win','Tottenham',72,1.95),
('Bologna vs Milan','Serie A', now() + interval '10 hours','Away Win','Milan',66,2.25),
('Rennes vs Lyon','Ligue 1', now() + interval '11 hours','Away Win','Lyon',63,2.35),
('Betis vs Villarreal','La Liga', now() + interval '4 hours','Away Win','Villarreal',60,2.50),
('Union Berlin vs Frankfurt','Bundesliga', now() + interval '6 hours','Away Win','Frankfurt',64,2.15),

('Roma vs Lazio','Serie A', now() + interval '5 hours','Draw','Draw',55,3.20),
('Atletico vs Real Sociedad','La Liga', now() + interval '6 hours','Draw','Draw',52,3.40),
('Marseille vs Monaco','Ligue 1', now() + interval '7 hours','Draw','Draw',50,3.30),
('Newcastle vs Aston Villa','EPL', now() + interval '8 hours','Draw','Draw',54,3.25),
('Leverkusen vs Dortmund','Bundesliga', now() + interval '9 hours','Draw','Draw',53,3.35),

('Man City vs Arsenal','EPL', now() + interval '4 hours','BTTS','Yes',80,1.60),
('Barcelona vs Real Madrid','La Liga', now() + interval '6 hours','BTTS','Yes',85,1.45),
('PSG vs Marseille','Ligue 1', now() + interval '8 hours','BTTS','Yes',82,1.55),
('Milan vs Inter','Serie A', now() + interval '9 hours','BTTS','Yes',78,1.65),
('Bayern vs Dortmund','Bundesliga', now() + interval '10 hours','BTTS','Yes',88,1.40),

('Chelsea vs Brighton','EPL', now() + interval '5 hours','Over 1.5','Over 1.5',92,1.25),
('Real Madrid vs Bilbao','La Liga', now() + interval '7 hours','Over 1.5','Over 1.5',90,1.28),
('PSG vs Lens','Ligue 1', now() + interval '4 hours','Over 1.5','Over 1.5',94,1.20),
('Juventus vs Roma','Serie A', now() + interval '8 hours','Over 1.5','Over 1.5',88,1.30),
('Bayern vs Wolfsburg','Bundesliga', now() + interval '6 hours','Over 1.5','Over 1.5',95,1.18),

('Liverpool vs Man City','EPL', now() + interval '5 hours','Over 2.5','Over 2.5',78,1.72),
('Real Madrid vs Barcelona','La Liga', now() + interval '9 hours','Over 2.5','Over 2.5',82,1.65),
('PSG vs Monaco','Ligue 1', now() + interval '10 hours','Over 2.5','Over 2.5',80,1.68),
('Inter vs Milan','Serie A', now() + interval '11 hours','Over 2.5','Over 2.5',75,1.80),
('Bayern vs Leipzig','Bundesliga', now() + interval '12 hours','Over 2.5','Over 2.5',85,1.60);
