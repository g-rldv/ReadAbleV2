// ============================================================
// Database Migration Runner
// Run: node db/migrations/run.js
// ============================================================
require('dotenv').config({ path: '../../.env' });
const pool = require('../index');

const MIGRATION_SQL = `
-- ============================================================
-- ReadAble Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'parent',
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  level         INTEGER DEFAULT 1,
  xp            INTEGER DEFAULT 0,
  streak        INTEGER DEFAULT 0,
  achievements  JSONB DEFAULT '[]',
  avatar        VARCHAR(50) DEFAULT 'star',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Children Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS children (
  id            SERIAL PRIMARY KEY,
  avatar        VARCHAR(255),
  age           INTEGER,
  parent_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  teacher_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_of_birth DATE,
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  gender        VARCHAR(50),
  asd_notes     TEXT
);

-- ── Assessments Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id                   SERIAL PRIMARY KEY,
  teacher_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title                VARCHAR(255) NOT NULL,
  difficulty           VARCHAR(50),
  difficulty_level     INTEGER DEFAULT 1,
  story_theme          VARCHAR(255),
  description          TEXT,
  autism_focus_areas   JSONB DEFAULT '[]',
  recommended_age_min  INTEGER,
  recommended_age_max  INTEGER,
  break_interval       INTEGER DEFAULT 10,
  updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published         BOOLEAN DEFAULT FALSE
);

-- ── Assessment Pages Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_pages (
  id                SERIAL PRIMARY KEY,
  assessment_id     INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
  page_number       INTEGER,
  image_url         VARCHAR(255),
  image_description TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audio_hint        TEXT,
  page_text         TEXT
);

-- ── Assessment Questions Table ──────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_questions (
  id                SERIAL PRIMARY KEY,
  assessment_id     INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
  order_index       INTEGER DEFAULT 0,
  question_text     TEXT,
  question_type     VARCHAR(50),
  question_category VARCHAR(50),
  difficulty_score  INTEGER DEFAULT 5,
  time_estimate     INTEGER DEFAULT 60,
  image_url         VARCHAR(255),
  points            INTEGER DEFAULT 0,
  correct_answer    JSONB,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  options           JSONB DEFAULT '[]'
);

-- ── Assessment Sessions Table ──────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id                     SERIAL PRIMARY KEY,
  assessment_id          INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
  child_id               INTEGER REFERENCES children(id) ON DELETE SET NULL,
  teacher_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  started_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at           TIMESTAMP WITH TIME ZONE,
  status                 VARCHAR(50) DEFAULT 'in_progress',
  total_score            INTEGER DEFAULT 0,
  max_score              INTEGER DEFAULT 0,
  percentage             DOUBLE PRECISION DEFAULT 0,
  time_spent_seconds     INTEGER DEFAULT 0,
  initiated_by_parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- ── Reports Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id                 SERIAL PRIMARY KEY,
  child_id           INTEGER REFERENCES children(id) ON DELETE SET NULL,
  teacher_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  parent_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_read            BOOLEAN DEFAULT FALSE,
  sent_at            TIMESTAMP WITH TIME ZONE,
  detailed_breakdown JSONB DEFAULT '{}',
  recommendations    TEXT,
  title              VARCHAR(255),
  summary            TEXT,
  read_at            TIMESTAMP WITH TIME ZONE,
  session_id         INTEGER REFERENCES assessment_sessions(id) ON DELETE CASCADE
);

-- ── Session Answers Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS session_answers (
  id                        SERIAL PRIMARY KEY,
  child_id                  INTEGER REFERENCES children(id) ON DELETE SET NULL,
  question_id               INTEGER REFERENCES assessment_questions(id) ON DELETE SET NULL,
  is_correct                BOOLEAN DEFAULT FALSE,
  points_earned             INTEGER DEFAULT 0,
  time_spent_seconds        INTEGER DEFAULT 0,
  time_spent_milliseconds   INTEGER DEFAULT 0,
  answered_at               TIMESTAMP WITH TIME ZONE,
  session_id                INTEGER REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  given_answer              JSONB,
  attempt_number            INTEGER DEFAULT 1,
  hint_used                 BOOLEAN DEFAULT FALSE
);

-- ── Settings Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  text_size       VARCHAR(20) DEFAULT 'medium',
  theme           VARCHAR(20) DEFAULT 'light',
  tts_enabled     BOOLEAN DEFAULT TRUE,
  tts_voice       VARCHAR(100) DEFAULT '',
  bg_music_theme  VARCHAR(50) DEFAULT 'calm',
  bg_music_volume DOUBLE PRECISION DEFAULT 0.7,
  bg_music_enabled BOOLEAN DEFAULT FALSE,
  tts_pitch       DOUBLE PRECISION DEFAULT 1.0,
  tts_rate        DOUBLE PRECISION DEFAULT 0.9,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Pre Assessment Results Table ──────────────────────────
CREATE TABLE IF NOT EXISTS pre_assessment_results (
  id                SERIAL PRIMARY KEY,
  child_id          INTEGER REFERENCES children(id) ON DELETE CASCADE,
  score             INTEGER NOT NULL,
  recommended_level INTEGER NOT NULL,
  completed_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Classrooms Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classrooms (
  id         SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  code       VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Class Memberships Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS class_memberships (
  id           SERIAL PRIMARY KEY,
  classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(20) DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at  TIMESTAMP WITH TIME ZONE,
  UNIQUE(classroom_id, user_id)
);
CREATE TABLE IF NOT EXISTS otp_tokens (
  id         SERIAL PRIMARY KEY,
  used       BOOLEAN DEFAULT FALSE,
  email      VARCHAR(255) NOT NULL,
  otp        VARCHAR(10) NOT NULL,
  type       VARCHAR(20),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, type)
);

-- ── Activities Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  type          VARCHAR(50) NOT NULL,
  difficulty    VARCHAR(20) DEFAULT 'easy',
  content       JSONB NOT NULL,
  correct_answer JSONB NOT NULL,
  xp_reward     INTEGER DEFAULT 10,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── User Progress Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_progress (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  score       INTEGER DEFAULT 0,
  attempts    INTEGER DEFAULT 0,
  completed   BOOLEAN DEFAULT FALSE,
  feedback    TEXT,
  last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- ── Badges / Achievements Table ──────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(50) UNIQUE NOT NULL,
  title       VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon        VARCHAR(10) NOT NULL,
  condition   JSONB NOT NULL
);

-- ── Indexes for Performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_activity_id ON user_progress(activity_id);
CREATE INDEX IF NOT EXISTS idx_activities_difficulty ON activities(difficulty);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
`;
async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('[Migration] Running database migrations...');
    await client.query(MIGRATION_SQL);
    console.log('[Migration] ✅ Schema created successfully');
  } catch (err) {
    console.error('[Migration] ❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
