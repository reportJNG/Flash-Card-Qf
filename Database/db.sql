-- ============================================================
-- FLASHQF — FULL SUPABASE DATABASE SCHEMA  (FINAL)
-- Stack: Next.js 14 · TypeScript · Supabase (PostgreSQL)
-- Version: 1.1.0  — reviewed & completed
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- fuzzy search on question text


-- ============================================================
-- TABLE: profiles
-- No admin/user distinction — all profiles are equal.
-- Each profile is entirely self-contained.
-- ============================================================
CREATE TABLE profiles (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT        UNIQUE NOT NULL,
  display_name  TEXT        NOT NULL,
  avatar_color  TEXT        NOT NULL DEFAULT '#6366f1',   -- hex color for avatar UI
  pin           TEXT        CHECK (pin IS NULL OR (pin ~ '^\d{4}$')),  -- FIX #9: 4-digit only
  total_points  BIGINT      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  profiles IS 'Every user is a profile. No roles. Each profile owns its own categories, questions, and sessions.';
COMMENT ON COLUMN profiles.pin IS 'Optional 4-digit numeric PIN. NULL means no PIN protection.';


-- ============================================================
-- TABLE: categories
-- Profiles create categories to group their questions.
-- One auto-created "Special ⭐" category per profile (trigger below).
-- ============================================================
CREATE TABLE categories (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  type           TEXT,                                       -- user-defined label e.g. "Math", "History"
  description    TEXT,
  color          TEXT        NOT NULL DEFAULT '#6366f1',
  icon           TEXT        NOT NULL DEFAULT '📚',
  is_special     BOOLEAN     NOT NULL DEFAULT FALSE,          -- the auto-created "Special ⭐" category
  question_count INTEGER     NOT NULL DEFAULT 0,             -- cached count, kept in sync by trigger

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (profile_id, name),                                 -- no two categories with same name per profile

  -- FIX #8: prevent duplicate Special categories per profile
  CONSTRAINT uq_one_special_per_profile EXCLUDE USING btree (profile_id WITH =)
    WHERE (is_special = TRUE)
);

CREATE INDEX idx_categories_profile_id ON categories(profile_id);
CREATE INDEX idx_categories_is_special  ON categories(profile_id, is_special);

COMMENT ON TABLE categories IS 'Question groups owned by a profile. The "Special" category is auto-created and holds starred questions.';


-- ============================================================
-- TABLE: questions
-- Core content unit. Tracks per-question difficulty stat
-- and raw play counters for full stats breakdown.
-- ============================================================
CREATE TABLE questions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id     UUID        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,

  question        TEXT        NOT NULL,
  answer          TEXT        NOT NULL,

  -- difficulty_stat = LAST rating given by the user.
  -- Default 'none' means the question has never been played.
  difficulty_stat TEXT        NOT NULL DEFAULT 'none'
    CHECK (difficulty_stat IN ('none', 'easy', 'good', 'hard', 'super_hard')),

  -- Lifetime counters — never reset
  times_seen        INTEGER   NOT NULL DEFAULT 0,
  times_easy        INTEGER   NOT NULL DEFAULT 0,
  times_good        INTEGER   NOT NULL DEFAULT 0,
  times_hard        INTEGER   NOT NULL DEFAULT 0,
  times_super_hard  INTEGER   NOT NULL DEFAULT 0,

  last_played_at  TIMESTAMPTZ,

  -- TRUE when this question has been pinned to the user's Special category
  is_saved_special BOOLEAN    NOT NULL DEFAULT FALSE,

  -- How was this question created?
  source          TEXT        NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'file')),

  order_index     INTEGER     NOT NULL DEFAULT 0,   -- display order within category

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_profile_id   ON questions(profile_id);
CREATE INDEX idx_questions_category_id  ON questions(category_id);
CREATE INDEX idx_questions_difficulty   ON questions(profile_id, difficulty_stat);
CREATE INDEX idx_questions_last_played  ON questions(profile_id, last_played_at NULLS FIRST);
CREATE INDEX idx_questions_text_search  ON questions USING gin(question gin_trgm_ops);

COMMENT ON TABLE questions IS 'One row per Q&A pair. difficulty_stat reflects the LAST user rating. Counters accumulate across all sessions.';


-- ============================================================
-- TABLE: play_sessions
-- Records every play attempt (normal or hard mode).
-- FIX #1: Added question_queue + current_index to survive page refresh.
-- FIX #3: Added category_names_snapshot to preserve history display names.
-- ============================================================
CREATE TABLE play_sessions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  mode            TEXT        NOT NULL CHECK (mode IN ('normal', 'hard')),

  -- Session configuration
  is_all_categories   BOOLEAN  NOT NULL DEFAULT FALSE,
  is_infinity         BOOLEAN  NOT NULL DEFAULT FALSE,  -- no limit; play until user quits
  question_limit      INTEGER,                           -- NULL when is_infinity = true
  category_ids        UUID[]   NOT NULL DEFAULT '{}',   -- selected category UUIDs

  -- FIX #3: snapshot of category names at session start (names may change later)
  category_names_snapshot TEXT[] NOT NULL DEFAULT '{}',

  -- FIX #1: persisted play queue (ordered question UUIDs) — survives page refresh
  question_queue  UUID[]       NOT NULL DEFAULT '{}',

  -- FIX #2: index of the card currently being shown (0-based)
  current_index   INTEGER      NOT NULL DEFAULT 0,

  -- Running totals — maintained by trigger on session_answers
  total_answered  INTEGER      NOT NULL DEFAULT 0,
  points_earned   INTEGER      NOT NULL DEFAULT 0,

  status          TEXT         NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'quit')),

  started_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_play_sessions_profile_id ON play_sessions(profile_id);
CREATE INDEX idx_play_sessions_status     ON play_sessions(profile_id, status);
CREATE INDEX idx_play_sessions_started    ON play_sessions(profile_id, started_at DESC);

COMMENT ON TABLE play_sessions IS 'One row per play attempt. question_queue persists the ordered card list. current_index tracks progress.';


-- ============================================================
-- TABLE: session_answers
-- One row per flashcard flip + rating in a session.
-- Source of truth for all stats computation. Never mutated after insert.
-- ============================================================
CREATE TABLE session_answers (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID        NOT NULL REFERENCES play_sessions(id) ON DELETE CASCADE,
  profile_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id     UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  result          TEXT        NOT NULL
    CHECK (result IN ('easy', 'good', 'hard', 'super_hard')),

  -- Points at the moment of the answer (locked in; set by BEFORE INSERT trigger)
  points_awarded  INTEGER     NOT NULL DEFAULT 0,

  answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_answers_session_id  ON session_answers(session_id);
CREATE INDEX idx_session_answers_profile_id  ON session_answers(profile_id);
CREATE INDEX idx_session_answers_question_id ON session_answers(question_id);
CREATE INDEX idx_session_answers_result      ON session_answers(profile_id, result);

COMMENT ON TABLE session_answers IS 'Immutable log of every flashcard rating. Used for leaderboard, stats, and session history.';


-- ============================================================
-- VIEWS
-- ============================================================

-- profile_stats — aggregated stats per profile (Stats page)
CREATE OR REPLACE VIEW profile_stats AS
SELECT
  p.id             AS profile_id,
  p.username,
  p.display_name,
  p.avatar_color,
  p.total_points,

  COUNT(DISTINCT q.id)                                                    AS total_questions,
  COUNT(DISTINCT q.id) FILTER (WHERE q.difficulty_stat = 'none')          AS none_count,
  COUNT(DISTINCT q.id) FILTER (WHERE q.difficulty_stat = 'easy')          AS easy_count,
  COUNT(DISTINCT q.id) FILTER (WHERE q.difficulty_stat = 'good')          AS good_count,
  COUNT(DISTINCT q.id) FILTER (WHERE q.difficulty_stat = 'hard')          AS hard_count,
  COUNT(DISTINCT q.id) FILTER (WHERE q.difficulty_stat = 'super_hard')    AS super_hard_count,

  COUNT(DISTINCT c.id)                                                    AS total_categories,
  COUNT(DISTINCT ps.id)                                                   AS total_sessions,
  COUNT(DISTINCT sa.id)                                                   AS total_answers,

  -- Smart rate = (easy + good) / total played (non-none) * 100
  COALESCE(
    ROUND(
      (
        COUNT(DISTINCT q.id) FILTER (WHERE q.difficulty_stat IN ('easy','good'))::DECIMAL
        /
        NULLIF(COUNT(DISTINCT q.id) FILTER (WHERE q.difficulty_stat <> 'none'), 0)
      ) * 100,
      1
    ),
    0
  ) AS smart_rate

FROM        profiles       p
LEFT JOIN   questions      q  ON q.profile_id  = p.id
LEFT JOIN   categories     c  ON c.profile_id  = p.id
LEFT JOIN   play_sessions  ps ON ps.profile_id = p.id
LEFT JOIN   session_answers sa ON sa.profile_id = p.id
GROUP BY    p.id, p.username, p.display_name, p.avatar_color, p.total_points;

COMMENT ON VIEW profile_stats IS 'Aggregated stats for the Stats page. smart_rate = % of played questions rated easy or good.';


-- leaderboard — ranked across all profiles
-- FIX #4: Added smart_rate to match profile_stats and app spec
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id             AS profile_id,
  p.username,
  p.display_name,
  p.avatar_color,
  p.total_points,

  COUNT(DISTINCT q.id)  AS total_questions,
  COUNT(DISTINCT sa.id) AS total_answers,

  -- accuracy_rate = (easy + good answers) / all answers  * 100
  COALESCE(
    ROUND(
      (
        COUNT(sa.id) FILTER (WHERE sa.result IN ('easy','good'))::DECIMAL
        /
        NULLIF(COUNT(sa.id), 0)
      ) * 100,
      1
    ),
    0
  ) AS accuracy_rate,

  -- FIX #4: smart_rate per profile (based on current difficulty_stat of questions)
  COALESCE(
    ROUND(
      (
        COUNT(DISTINCT q.id) FILTER (WHERE q.difficulty_stat IN ('easy','good'))::DECIMAL
        /
        NULLIF(COUNT(DISTINCT q.id) FILTER (WHERE q.difficulty_stat <> 'none'), 0)
      ) * 100,
      1
    ),
    0
  ) AS smart_rate,

  RANK() OVER (ORDER BY p.total_points DESC, COUNT(DISTINCT sa.id) DESC) AS rank

FROM        profiles       p
LEFT JOIN   questions      q  ON q.profile_id  = p.id
LEFT JOIN   session_answers sa ON sa.profile_id = p.id
GROUP BY    p.id, p.username, p.display_name, p.avatar_color, p.total_points
ORDER BY    p.total_points DESC, COUNT(DISTINCT sa.id) DESC;

COMMENT ON VIEW leaderboard IS 'Cross-profile leaderboard ranked by total_points (tie-break: most answers).';


-- category_overview — planning/categories page per profile
CREATE OR REPLACE VIEW category_overview AS
SELECT
  c.id             AS category_id,
  c.profile_id,
  c.name,
  c.type,
  c.color,
  c.icon,
  c.is_special,
  c.question_count,
  COUNT(q.id) FILTER (WHERE q.difficulty_stat = 'none')       AS none_count,
  COUNT(q.id) FILTER (WHERE q.difficulty_stat = 'easy')       AS easy_count,
  COUNT(q.id) FILTER (WHERE q.difficulty_stat = 'good')       AS good_count,
  COUNT(q.id) FILTER (WHERE q.difficulty_stat = 'hard')       AS hard_count,
  COUNT(q.id) FILTER (WHERE q.difficulty_stat = 'super_hard') AS super_hard_count,
  -- mastery_pct = (easy + good) / total * 100
  COALESCE(
    ROUND(
      (
        COUNT(q.id) FILTER (WHERE q.difficulty_stat IN ('easy','good'))::DECIMAL
        /
        NULLIF(COUNT(q.id), 0)
      ) * 100,
      1
    ),
    0
  ) AS mastery_pct,
  c.created_at,
  c.updated_at
FROM      categories c
LEFT JOIN questions  q ON q.category_id = c.id
GROUP BY  c.id, c.profile_id, c.name, c.type, c.color, c.icon,
          c.is_special, c.question_count, c.created_at, c.updated_at;

COMMENT ON VIEW category_overview IS 'Used on Planning and Categories pages — shows per-category question counts by difficulty plus mastery_pct.';


-- session_history — human-readable session log with answer breakdown
CREATE OR REPLACE VIEW session_history AS
SELECT
  ps.id              AS session_id,
  ps.profile_id,
  ps.mode,
  ps.status,
  ps.is_infinity,
  ps.is_all_categories,
  ps.question_limit,
  ps.category_names_snapshot,
  ps.total_answered,
  ps.points_earned,
  ps.started_at,
  ps.ended_at,
  COUNT(sa.id) FILTER (WHERE sa.result = 'easy')       AS easy_count,
  COUNT(sa.id) FILTER (WHERE sa.result = 'good')       AS good_count,
  COUNT(sa.id) FILTER (WHERE sa.result = 'hard')       AS hard_count,
  COUNT(sa.id) FILTER (WHERE sa.result = 'super_hard') AS super_hard_count,
  EXTRACT(EPOCH FROM (COALESCE(ps.ended_at, NOW()) - ps.started_at))::INTEGER AS duration_seconds
FROM      play_sessions  ps
LEFT JOIN session_answers sa ON sa.session_id = ps.id
GROUP BY  ps.id, ps.profile_id, ps.mode, ps.status, ps.is_infinity,
          ps.is_all_categories, ps.question_limit, ps.category_names_snapshot,
          ps.total_answered, ps.points_earned, ps.started_at, ps.ended_at;

COMMENT ON VIEW session_history IS 'Human-readable session log with per-result counts. Used on Stats page session history table.';


-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- ── Generic timestamp updater ────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();


-- ── Keep categories.question_count in sync ───────────────────
CREATE OR REPLACE FUNCTION fn_sync_category_question_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories
    SET question_count = question_count + 1, updated_at = NOW()
    WHERE id = NEW.category_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories
    SET question_count = GREATEST(question_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.category_id;

  ELSIF TG_OP = 'UPDATE' AND OLD.category_id <> NEW.category_id THEN
    -- question moved to a different category
    UPDATE categories
    SET question_count = GREATEST(question_count - 1, 0), updated_at = NOW()
    WHERE id = OLD.category_id;

    UPDATE categories
    SET question_count = question_count + 1, updated_at = NOW()
    WHERE id = NEW.category_id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_category_question_count
  AFTER INSERT OR UPDATE OR DELETE ON questions
  FOR EACH ROW EXECUTE FUNCTION fn_sync_category_question_count();


-- ── On session answer insert — core stat engine ──────────────
-- Points: easy=10 | good=7 | hard=3 | super_hard=0
-- Updates: question stats, profile total_points, session totals.
-- This is a BEFORE trigger so it can mutate NEW.points_awarded.
CREATE OR REPLACE FUNCTION fn_on_session_answer_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_points INTEGER;
BEGIN
  v_points := CASE NEW.result
    WHEN 'easy'       THEN 10
    WHEN 'good'       THEN 7
    WHEN 'hard'       THEN 3
    WHEN 'super_hard' THEN 0
    ELSE 0
  END;

  -- Lock in the points on the row being inserted
  NEW.points_awarded := v_points;

  -- Update question: new difficulty_stat, increment counters, set last_played_at
  UPDATE questions SET
    difficulty_stat  = NEW.result,
    times_seen       = times_seen + 1,
    times_easy       = times_easy       + (CASE WHEN NEW.result = 'easy'       THEN 1 ELSE 0 END),
    times_good       = times_good       + (CASE WHEN NEW.result = 'good'       THEN 1 ELSE 0 END),
    times_hard       = times_hard       + (CASE WHEN NEW.result = 'hard'       THEN 1 ELSE 0 END),
    times_super_hard = times_super_hard + (CASE WHEN NEW.result = 'super_hard' THEN 1 ELSE 0 END),
    last_played_at   = NOW(),
    updated_at       = NOW()
  WHERE id = NEW.question_id;

  -- Update profile: add points
  UPDATE profiles SET
    total_points = total_points + v_points,
    updated_at   = NOW()
  WHERE id = NEW.profile_id;

  -- Update session: increment answered count + points
  UPDATE play_sessions SET
    total_answered = total_answered + 1,
    points_earned  = points_earned  + v_points,
    -- Advance current_index — always safe to increment here
    current_index  = current_index + 1
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_session_answer_insert
  BEFORE INSERT ON session_answers
  FOR EACH ROW EXECUTE FUNCTION fn_on_session_answer_insert();


-- ── Auto-create Special category for every new profile ───────
CREATE OR REPLACE FUNCTION fn_auto_create_special_category()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO categories (profile_id, name, type, description, color, icon, is_special)
  VALUES (
    NEW.id,
    'Special',
    'special',
    'Your saved star questions — collected while playing.',
    '#f59e0b',
    '⭐',
    TRUE
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_special_category
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_auto_create_special_category();


-- ── FIX #7: Close session helper ─────────────────────────────
-- Called from server action when user quits or session completes.
CREATE OR REPLACE FUNCTION fn_close_session(
  p_session_id UUID,
  p_status     TEXT  -- 'completed' | 'quit'
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF p_status NOT IN ('completed', 'quit') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be completed or quit.', p_status;
  END IF;

  UPDATE play_sessions SET
    status   = p_status,
    ended_at = NOW()
  WHERE id = p_session_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE NOTICE 'Session % not found or already closed.', p_session_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION fn_close_session IS 'Atomically marks a session as completed or quit and sets ended_at.';


-- ============================================================
-- HELPER FUNCTION: get_play_queue
-- Called from the Next.js server action right after creating
-- a play_session row. Returns ordered question UUIDs that are
-- then stored in play_sessions.question_queue.
--
-- Normal mode : none-first, then all others — all random within group.
-- Hard mode   : super_hard → hard → none → good → easy — random within group.
-- LIMIT NULL  : PostgreSQL treats LIMIT NULL as LIMIT ALL (no limit).
-- ============================================================
CREATE OR REPLACE FUNCTION get_play_queue(
  p_profile_id    UUID,
  p_category_ids  UUID[],   -- pass '{}' or NULL for all categories
  p_mode          TEXT,     -- 'normal' | 'hard'
  p_limit         INTEGER   -- NULL = infinity (no limit)
)
RETURNS TABLE (question_id UUID, question_order INTEGER)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      q.id,
      CASE
        WHEN p_mode = 'hard' THEN
          CASE q.difficulty_stat
            WHEN 'super_hard' THEN 1
            WHEN 'hard'       THEN 2
            WHEN 'none'       THEN 3
            WHEN 'good'       THEN 4
            WHEN 'easy'       THEN 5
            ELSE 6
          END
        ELSE  -- normal: none first, everything else second
          CASE q.difficulty_stat
            WHEN 'none' THEN 1
            ELSE             2
          END
      END AS priority_group,
      RANDOM() AS rand
    FROM questions q
    WHERE
      q.profile_id = p_profile_id
      AND (
        -- empty or NULL array means all categories
        p_category_ids IS NULL
        OR array_length(p_category_ids, 1) IS NULL
        OR q.category_id = ANY(p_category_ids)
      )
  )
  SELECT
    r.id                                                                       AS question_id,
    ROW_NUMBER() OVER (ORDER BY r.priority_group, r.rand)::INTEGER            AS question_order
  FROM ranked r
  ORDER BY r.priority_group, r.rand
  LIMIT p_limit;  -- LIMIT NULL = no limit in PostgreSQL
END;
$$;

COMMENT ON FUNCTION get_play_queue IS
  'Returns an ordered list of question IDs for a play session. Handles normal/hard priority logic. Store result in play_sessions.question_queue.';


-- ============================================================
-- ROW LEVEL SECURITY
-- Access control is enforced by Next.js middleware + server
-- actions via HTTP-only cookie (profile_id).
-- These permissive policies exist so the service-role key can
-- read/write all rows. If you add Supabase Auth later, tighten
-- to (auth.uid() = profile_id) checks.
-- ============================================================
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_profiles"        ON profiles        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_categories"      ON categories      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_questions"       ON questions       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_play_sessions"   ON play_sessions   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_session_answers" ON session_answers FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- OPTIONAL SEED — remove in production
-- ============================================================
-- INSERT INTO profiles (username, display_name, avatar_color)
-- VALUES
--   ('alice',   'Alice',   '#6366f1'),
--   ('bob',     'Bob',     '#10b981'),
--   ('charlie', 'Charlie', '#f59e0b');


-- ============================================================
-- END OF SCHEMA
-- ============================================================
