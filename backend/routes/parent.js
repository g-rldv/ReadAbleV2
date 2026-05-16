const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireRole('parent'));

router.get('/children', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
       FROM children c
       LEFT JOIN users t ON t.id = c.teacher_id
       WHERE c.parent_id = $1
       ORDER BY c.first_name, c.last_name`,
      [req.user.id]
    );
    res.json({ children: result.rows });
  } catch (err) {
    console.error('[Parent/Children]', err.message);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// ── Parent: Create a child (added so parents can register their own children)
router.post('/children', async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, age, gender, avatar, asd_notes } = req.body;
    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ error: 'Child first name is required' });
    }

    const teacherRes = await pool.query(
      `SELECT c.teacher_id
       FROM class_memberships cm
       JOIN classrooms c ON cm.classroom_id = c.id
       WHERE cm.user_id = $1
         AND cm.status = 'approved'
       ORDER BY cm.approved_at DESC
       LIMIT 1`,
      [req.user.id]
    );
    const teacher_id = teacherRes.rows[0]?.teacher_id || null;

    const result = await pool.query(
      `INSERT INTO children (parent_id, teacher_id, first_name, last_name, date_of_birth, age, gender, avatar, asd_notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
      [req.user.id, teacher_id, first_name.trim(), (last_name || '').trim(), date_of_birth || null, age || null, gender || null, avatar || null, asd_notes || null]
    );
    res.status(201).json({ child: result.rows[0] });
  } catch (err) {
    console.error('[Parent/CreateChild]', err.message);
    res.status(500).json({ error: 'Failed to create child' });
  }
});

router.get('/children/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const childResult = await pool.query(
      `SELECT c.*, t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
       FROM children c
       LEFT JOIN users t ON t.id = c.teacher_id
       WHERE c.id=$1 AND c.parent_id=$2`,
      [id, req.user.id]
    );
    if (!childResult.rows[0]) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const sessionsResult = await pool.query(
      `SELECT s.id, s.assessment_id, a.title AS assessment_title,
              s.started_at, s.completed_at, s.status,
              s.total_score, s.percentage
       FROM assessment_sessions s
       LEFT JOIN assessments a ON a.id = s.assessment_id
       WHERE s.child_id=$1
       ORDER BY s.started_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({ child: childResult.rows[0], sessions: sessionsResult.rows });
  } catch (err) {
    console.error('[Parent/ChildDetail]', err.message);
    res.status(500).json({ error: 'Failed to fetch child details' });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, c.first_name AS child_first_name, c.last_name AS child_last_name,
              t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
       FROM reports r
       LEFT JOIN children c ON c.id = r.child_id
       LEFT JOIN users t ON t.id = r.teacher_id
       WHERE r.parent_id=$1
       ORDER BY r.sent_at DESC`,
      [req.user.id]
    );
    res.json({ reports: result.rows });
  } catch (err) {
    console.error('[Parent/Reports]', err.message);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.get('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, c.first_name AS child_first_name, c.last_name AS child_last_name,
              t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
       FROM reports r
       LEFT JOIN children c ON c.id = r.child_id
       LEFT JOIN users t ON t.id = r.teacher_id
       WHERE r.id=$1 AND r.parent_id=$2`,
      [id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];
    if (!report.is_read) {
      await pool.query(
        'UPDATE reports SET is_read=TRUE, read_at=NOW() WHERE id=$1',
        [id]
      );
      report.is_read = true;
      report.read_at = new Date().toISOString();
    }

    res.json({ report });
  } catch (err) {
    console.error('[Parent/ReportDetail]', err.message);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

module.exports = router;
