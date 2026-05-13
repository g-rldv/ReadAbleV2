const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

function normalizeAnswer(answer) {
  return answer === undefined || answer === null ? null : answer;
}

function evaluateCorrectness(question, givenAnswer) {
  if (!question) return false;
  const correct = question.correct_answer;
  if (question.question_type === 'short_answer') {
    return true;
  }
  if (question.question_type === 'yes_no') {
    return String(givenAnswer).trim().toLowerCase() === String(correct).trim().toLowerCase();
  }
  try {
    const parsedCorrect = typeof correct === 'string' ? JSON.parse(correct) : correct;
    if (Array.isArray(parsedCorrect)) {
      return JSON.stringify(parsedCorrect) === JSON.stringify(givenAnswer);
    }
  } catch (_) {}
  return String(givenAnswer).trim() === String(correct).trim();
}

async function verifyParentSession(sessionId, parentId) {
  const result = await pool.query(
    `SELECT s.*, c.parent_id FROM assessment_sessions s
     JOIN children c ON c.id = s.child_id
     WHERE s.id=$1 AND c.parent_id=$2`,
    [sessionId, parentId]
  );
  return result.rows[0];
}

router.use(requireAuth);
router.post('/start', requireRole('parent'), async (req, res) => {
  try {
    const { assessment_id, child_id } = req.body;
    if (!assessment_id || !child_id) {
      return res.status(400).json({ error: 'assessment_id and child_id are required' });
    }

    const childResult = await pool.query(
      'SELECT * FROM children WHERE id=$1 AND parent_id=$2',
      [child_id, req.user.id]
    );
    
    if (!childResult.rows[0]) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const assessmentResult = await pool.query('SELECT * FROM assessments WHERE id=$1', [assessment_id]);
    const assessment = assessmentResult.rows[0];
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const sessionResult = await pool.query(
      `INSERT INTO assessment_sessions (
         assessment_id, child_id, teacher_id, started_at, status, total_score,
         max_score, percentage, time_spent_seconds, initiated_by_parent_id
       ) VALUES ($1,$2,$3,NOW(),'in_progress',0,0,0,0,$4)
       RETURNING *`,
      [assessment_id, child_id, assessment.teacher_id, req.user.id]
    );
    const session = sessionResult.rows[0];

    const questionsResult = await pool.query(
      'SELECT * FROM assessment_questions WHERE assessment_id=$1 ORDER BY order_index ASC',
      [assessment_id]
    );
    const questions = questionsResult.rows;

    const insertAnswers = questions.map((question) => pool.query(
      `INSERT INTO session_answers (
         session_id, question_id, child_id, given_answer, is_correct,
         points_earned, time_spent_seconds, answered_at
       ) VALUES ($1,$2,$3,NULL,FALSE,0,0,NULL)`,
      [session.id, question.id, child_id]
    ));
    await Promise.all(insertAnswers);

    const pagesResult = await pool.query(
      'SELECT * FROM assessment_pages WHERE assessment_id=$1 ORDER BY page_number ASC',
      [assessment_id]
    );

    res.status(201).json({
      session,
      assessment,
      pages: pagesResult.rows,
      questions,
    });
  } catch (err) {
    console.error('[Sessions/Start]', err.message);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

router.post('/:id/answer', requireRole('parent'), async (req, res) => {
  try {
    const { id } = req.params;
    const { question_id, given_answer, time_spent_seconds } = req.body;
    if (!question_id || given_answer === undefined) {
      return res.status(400).json({ error: 'question_id and given_answer are required' });
    }

    const session = await verifyParentSession(id, req.user.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const questionResult = await pool.query(
      'SELECT * FROM assessment_questions WHERE id=$1 AND assessment_id=$2',
      [question_id, session.assessment_id]
    );
    const question = questionResult.rows[0];
    if (!question) {
      return res.status(404).json({ error: 'Question not found for this session' });
    }

    const isCorrect = evaluateCorrectness(question, given_answer);
    const pointsEarned = isCorrect ? question.points : 0;

    const answerResult = await pool.query(
      `INSERT INTO session_answers (
         session_id, question_id, child_id, given_answer, is_correct,
         points_earned, time_spent_seconds, answered_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (session_id, question_id) DO UPDATE SET
         given_answer = EXCLUDED.given_answer,
         is_correct = EXCLUDED.is_correct,
         points_earned = EXCLUDED.points_earned,
         time_spent_seconds = EXCLUDED.time_spent_seconds,
         answered_at = EXCLUDED.answered_at
       RETURNING *`,
      [
        id,
        question_id,
        session.child_id,
        JSON.stringify(given_answer),
        isCorrect,
        pointsEarned,
        time_spent_seconds || 0,
      ]
    );

    res.json({ answer: answerResult.rows[0], is_correct: isCorrect, points_earned: pointsEarned });
  } catch (err) {
    console.error('[Sessions/Answer]', err.message);
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

router.post('/:id/complete', requireRole('parent'), async (req, res) => {
  try {
    const { id } = req.params;
    const session = await verifyParentSession(id, req.user.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const answersResult = await pool.query(
      `SELECT sa.*, q.question_text, q.question_type, q.correct_answer, q.points
       FROM session_answers sa
       JOIN assessment_questions q ON q.id = sa.question_id
       WHERE sa.session_id=$1`,
      [id]
    );
    const answers = answersResult.rows;

    let totalScore = 0;
    let maxScore = 0;
    let timeSpent = 0;
    const questionBreakdown = answers.map((answer) => {
      const correctAnswer = answer.correct_answer;
      const parsedGiven = answer.given_answer;
      const isCorrect = answer.is_correct;
      totalScore += Number(answer.points_earned || 0);
      maxScore += Number(answer.points || 0);
      timeSpent += Number(answer.time_spent_seconds || 0);
      return {
        question_id: answer.question_id,
        question_text: answer.question_text,
        question_type: answer.question_type,
        correct_answer: correctAnswer,
        given_answer: parsedGiven,
        is_correct: isCorrect,
        points_earned: Number(answer.points_earned || 0),
        max_points: Number(answer.points || 0),
      };
    });

    const percentage = maxScore === 0 ? 0 : Math.round((totalScore / maxScore) * 100);
    await pool.query(
      `UPDATE assessment_sessions SET
         total_score=$1, max_score=$2, percentage=$3,
         time_spent_seconds=$4, completed_at=NOW(), status='completed'
       WHERE id=$5`,
      [totalScore, maxScore, percentage, timeSpent, id]
    );

    const reportTitle = `Session ${id} Summary`;
    await pool.query(
      `INSERT INTO reports (
         session_id, child_id, teacher_id, parent_id,
         title, summary, detailed_breakdown, recommendations,
         sent_at, is_read
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL, FALSE)`,
      [
        id,
        session.child_id,
        session.teacher_id,
        req.user.id,
        reportTitle,
        '',
        JSON.stringify({
          questions: questionBreakdown,
          total_score: totalScore,
          max_score: maxScore,
          percentage,
          time_spent_seconds: timeSpent,
        }),
        '',
      ]
    );

    res.json({
      session: {
        ...session,
        total_score: totalScore,
        max_score: maxScore,
        percentage,
        time_spent_seconds: timeSpent,
        status: 'completed',
      },
    });
  } catch (err) {
    console.error('[Sessions/Complete]', err.message);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let sessionResult;
    if (req.user.role === 'teacher') {
      sessionResult = await pool.query(
        `SELECT s.*, c.first_name AS child_first_name, c.last_name AS child_last_name,
                a.title AS assessment_title
         FROM assessment_sessions s
         JOIN children c ON c.id = s.child_id
         JOIN assessments a ON a.id = s.assessment_id
         WHERE s.id=$1 AND s.teacher_id=$2`,
        [id, req.user.id]
      );
    } else {
      sessionResult = await pool.query(
        `SELECT s.*, c.first_name AS child_first_name, c.last_name AS child_last_name,
                a.title AS assessment_title
         FROM assessment_sessions s
         JOIN children c ON c.id = s.child_id
         JOIN assessments a ON a.id = s.assessment_id
         WHERE s.id=$1 AND c.parent_id=$2`,
        [id, req.user.id]
      );
    }
    if (!sessionResult.rows[0]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];
    const answersResult = await pool.query(
      `SELECT sa.*, q.question_text, q.question_type, q.correct_answer, q.points
       FROM session_answers sa
       JOIN assessment_questions q ON q.id = sa.question_id
       WHERE sa.session_id=$1`,
      [id]
    );

    res.json({ session, answers: answersResult.rows });
  } catch (err) {
    console.error('[Sessions/Get]', err.message);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

router.get('/', async (req, res) => {
  try {
    let result;
    if (req.user.role === 'teacher') {
      result = await pool.query(
        `SELECT s.id, s.assessment_id, a.title AS assessment_title,
                s.child_id, c.first_name AS child_first_name, c.last_name AS child_last_name,
                s.started_at, s.completed_at, s.status, s.total_score, s.percentage
         FROM assessment_sessions s
         LEFT JOIN children c ON c.id = s.child_id
         LEFT JOIN assessments a ON a.id = s.assessment_id
         WHERE s.teacher_id=$1
         ORDER BY s.started_at DESC`,
        [req.user.id]
      );
    } else {
      result = await pool.query(
        `SELECT s.id, s.assessment_id, a.title AS assessment_title,
                s.child_id, c.first_name AS child_first_name, c.last_name AS child_last_name,
                s.started_at, s.completed_at, s.status, s.total_score, s.percentage
         FROM assessment_sessions s
         LEFT JOIN children c ON c.id = s.child_id
         LEFT JOIN assessments a ON a.id = s.assessment_id
         WHERE c.parent_id=$1
         ORDER BY s.started_at DESC`,
        [req.user.id]
      );
    }
    res.json({ sessions: result.rows });
  } catch (err) {
    console.error('[Sessions/List]', err.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

module.exports = router;
