
-- ── profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  email         TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- ── user_preferences ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id                 UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  locale                  TEXT        NOT NULL DEFAULT 'ru' CHECK (locale IN ('ky','ru','en')),
  theme                   TEXT        NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  notifications_enabled   BOOLEAN     NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_select_own" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prefs_insert_own" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prefs_update_own" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- ── organizations ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  slug          TEXT        UNIQUE NOT NULL,
  plan          TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro','enterprise')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ── organization_members ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_members (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role                TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('owner','manager','member')),
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ── updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
