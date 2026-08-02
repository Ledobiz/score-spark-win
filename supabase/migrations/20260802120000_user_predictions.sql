-- Per-user prediction history. Each prediction a signed-in user runs (via the
-- getPredictionDetailed server function) is recorded here, tied to their
-- account, so their history and personalised data load on sign-in.
CREATE TABLE public.user_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  fixture TEXT NOT NULL,
  predicted_outcome TEXT,
  confidence INTEGER,                 -- 0..100
  method TEXT,                        -- ml | poisson | mock
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,   -- full detailed prediction
  result TEXT,                        -- null until settled (home_win/draw/away_win)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON public.user_predictions(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_predictions TO authenticated;
GRANT ALL ON public.user_predictions TO service_role;

ALTER TABLE public.user_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own predictions" ON public.user_predictions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
