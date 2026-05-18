// ============================================================
// Runtime Schema Guard
// Creates missing classroom/report/session schema without deleting data.
// ============================================================

let readyPromise = null;

async function ensureRuntimeSchema(pool) {
  if (readyPromise) return readyPromise;

  await pool.query(`
  CREATE TABLE IF NOT EXISTS classroom_child_assignments (
    id SERIAL PRIMARY KEY,
    classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(classroom_id, child_id)
  );
`);

  readyPromise = (async () => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(`
        CREATE TABLE IF NOT EXISTS classrooms (
          id         SERIAL PRIMARY KEY,
          teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name       VARCHAR(255) NOT NULL,
          code       VARCHAR(10) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS class_memberships (
          id           SERIAL PRIMARY KEY,
          classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE,
          user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
          status       VARCHAR(20) DEFAULT 'pending',
          requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          approved_at  TIMESTAMP WITH TIME ZONE,
          UNIQUE(classroom_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON classrooms(teacher_id);
        CREATE INDEX IF NOT EXISTS idx_class_memberships_classroom_id ON class_memberships(classroom_id);
        CREATE INDEX IF NOT EXISTS idx_class_memberships_user_id ON class_memberships(user_id);
        CREATE INDEX IF NOT EXISTS idx_class_memberships_status ON class_memberships(status);

        CREATE TABLE IF NOT EXISTS classroom_child_assignments (
        id SERIAL PRIMARY KEY,
        classroom_id INTEGER REFERENCES classrooms(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(classroom_id, child_id)
      );

        CREATE INDEX IF NOT EXISTS idx_classroom_child_assignments_classroom
        ON classroom_child_assignments(classroom_id);
      `);

      await client.query(`
        ALTER TABLE classroom_child_assignments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

        ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL;
        ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS child_id INTEGER REFERENCES children(id) ON DELETE SET NULL;
        ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS initiated_by_parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'in_progress';
        ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0;
        ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 0;
        ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS percentage DOUBLE PRECISION DEFAULT 0;
        ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;

        CREATE INDEX IF NOT EXISTS idx_assessment_sessions_teacher_id ON assessment_sessions(teacher_id);
        CREATE INDEX IF NOT EXISTS idx_assessment_sessions_child_id ON assessment_sessions(child_id);
      `);

      await client.query(`
        ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES assessment_sessions(id) ON DELETE CASCADE;
        ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS question_id INTEGER REFERENCES assessment_questions(id) ON DELETE SET NULL;
        ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS child_id INTEGER REFERENCES children(id) ON DELETE SET NULL;
        ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS given_answer JSONB;
        ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT FALSE;
        ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
        ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
        ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS time_spent_milliseconds INTEGER DEFAULT 0;
        ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS answered_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
        ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS hint_used BOOLEAN DEFAULT FALSE;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_session_answers_session_question_unique
          ON session_answers(session_id, question_id)
          WHERE session_id IS NOT NULL AND question_id IS NOT NULL;

        CREATE INDEX IF NOT EXISTS idx_session_answers_session_id ON session_answers(session_id);
        CREATE INDEX IF NOT EXISTS idx_session_answers_child_id ON session_answers(child_id);
      `);

      await client.query(`
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES assessment_sessions(id) ON DELETE CASCADE;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS child_id INTEGER REFERENCES children(id) ON DELETE SET NULL;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS title VARCHAR(255);
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS summary TEXT;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS recommendations TEXT;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS detailed_breakdown JSONB DEFAULT '{}';
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

        CREATE INDEX IF NOT EXISTS idx_reports_teacher_id ON reports(teacher_id);
        CREATE INDEX IF NOT EXISTS idx_reports_parent_id ON reports(parent_id);
        CREATE INDEX IF NOT EXISTS idx_reports_child_id ON reports(child_id);
        CREATE INDEX IF NOT EXISTS idx_reports_session_id ON reports(session_id);
      `);

      await client.query('COMMIT');
      console.log('[DB] Runtime schema ready');
    } catch (err) {
      await client.query('ROLLBACK');
      readyPromise = null;
      throw err;
    } finally {
      client.release();
    }
  })();

  return readyPromise;
}

module.exports = { ensureRuntimeSchema };