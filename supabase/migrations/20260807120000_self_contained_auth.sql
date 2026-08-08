-- Makes auth self-contained: `profiles` becomes the credentials table (no
-- dependency on Supabase's `auth.users`), so the app's Postgres can be
-- dumped/restored onto any provider (e.g. Neon) with no auth-schema coupling.

-- Drop the FK to auth.users — profiles.id is now the primary identity, not a
-- mirror of a Supabase-managed table.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON public.profiles (email);

-- Every other per-user table FK'd straight to auth.users too. Nothing is
-- ever inserted into auth.users anymore, so those FKs would reject every
-- write. Repoint them at profiles(id) instead — still enforced referential
-- integrity, just entirely within our own schema.
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_activity DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey;
ALTER TABLE public.user_activity ADD CONSTRAINT user_activity_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.watchlist DROP CONSTRAINT IF EXISTS watchlist_user_id_fkey;
ALTER TABLE public.watchlist ADD CONSTRAINT watchlist_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bet_slips DROP CONSTRAINT IF EXISTS bet_slips_user_id_fkey;
ALTER TABLE public.bet_slips ADD CONSTRAINT bet_slips_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_predictions DROP CONSTRAINT IF EXISTS user_predictions_user_id_fkey;
ALTER TABLE public.user_predictions ADD CONSTRAINT user_predictions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- The old signup trigger inserted into profiles/user_roles whenever a row was
-- created in auth.users. Nothing writes to auth.users anymore, so it's dead
-- code, but drop it to avoid confusion for anyone still poking at that table.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON public.password_reset_tokens (user_id, created_at DESC);
