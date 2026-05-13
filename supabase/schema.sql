-- =============================================================================
-- Aaharam — Supabase Database Schema
-- =============================================================================
--
-- HOW TO APPLY
-- ------------
-- 1. Open your Supabase project dashboard.
-- 2. Navigate to the SQL Editor (left sidebar).
-- 3. Click "New query", paste this entire file, and click "Run".
--    The script is idempotent — safe to re-run after the first apply.
--
-- FINDING YOUR CREDENTIALS
-- ------------------------
-- JWT Secret (needed in server/.env as SUPABASE_JWT_SECRET):
--   Project Settings → API → JWT Secret
--
-- DB connection string (needed in server/.env as DB_URL):
--   Project Settings → Database → Connection string → URI mode
--   Use port 5432 (direct connection), e.g.:
--   jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. profiles
--    One row per user, created automatically via trigger on auth.users.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email        TEXT        NOT NULL,
    display_name TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. daily_goals
--    Stores each user's macro targets. UNIQUE(user_id) enforces one row per user.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_goals (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    calories   INT         NOT NULL DEFAULT 2000,
    protein_g  INT         NOT NULL DEFAULT 150,
    carbs_g    INT         NOT NULL DEFAULT 200,
    fat_g      INT         NOT NULL DEFAULT 65,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- ---------------------------------------------------------------------------
-- 3. food_cache
--    Barcode-keyed nutritional data fetched from external APIs by the server.
--    Users read from this table; writes are server-side only.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_cache (
    barcode             TEXT        PRIMARY KEY,
    name                TEXT        NOT NULL,
    brand               TEXT,
    calories_per_100g   NUMERIC(8,2),
    protein_per_100g    NUMERIC(8,2),
    carbs_per_100g      NUMERIC(8,2),
    fat_per_100g        NUMERIC(8,2),
    image_url           TEXT,
    fetched_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 4. meal_logs
--    Individual food entries logged by a user for a given date and meal slot.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meal_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    logged_date DATE        NOT NULL DEFAULT CURRENT_DATE,
    meal_type   TEXT        NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name   TEXT        NOT NULL,
    brand       TEXT,
    serving_g   NUMERIC(8,2) NOT NULL,
    calories    NUMERIC(8,2) NOT NULL,
    protein_g   NUMERIC(8,2) NOT NULL DEFAULT 0,
    carbs_g     NUMERIC(8,2) NOT NULL DEFAULT 0,
    fat_g       NUMERIC(8,2) NOT NULL DEFAULT 0,
    barcode     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_cache  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs   ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------
CREATE POLICY "profiles: select own row"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "profiles: update own row"
    ON profiles FOR UPDATE
    USING (id = auth.uid());


-- ---------------------------------------------------------------------------
-- daily_goals policies
-- ---------------------------------------------------------------------------
CREATE POLICY "daily_goals: select own rows"
    ON daily_goals FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "daily_goals: insert own rows"
    ON daily_goals FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_goals: update own rows"
    ON daily_goals FOR UPDATE
    USING (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- food_cache policies
--    Authenticated users can read; writes are performed by the backend service
--    role (bypasses RLS), so no user-level INSERT/UPDATE/DELETE policies.
-- ---------------------------------------------------------------------------
CREATE POLICY "food_cache: authenticated users can select"
    ON food_cache FOR SELECT
    TO authenticated
    USING (true);


-- ---------------------------------------------------------------------------
-- meal_logs policies
-- ---------------------------------------------------------------------------
CREATE POLICY "meal_logs: select own rows"
    ON meal_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "meal_logs: insert own rows"
    ON meal_logs FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "meal_logs: delete own rows"
    ON meal_logs FOR DELETE
    USING (user_id = auth.uid());


-- =============================================================================
-- Trigger: auto-create a profile row when a new user signs up
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Drop first so this file stays idempotent on re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
