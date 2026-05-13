const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const result = await pool.query(
        `SELECT r.*, c.first_name AS child_first_name, c.last_name AS child_last_name,
                u.first_name AS parent_first_name, u.last_name AS parent_last_name
         FROM reports r
         LEFT JOIN children c ON c.id = r.child_id
         LEFT JOIN users u ON u.id = r.parent_id
         WHERE r.teacher_id=$1
         ORDER BY r.sent_at DESC`,
        [req.user.id]
      );
      return res.json({ reports: result.rows });
    }

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
    console.error('[Reports/List]', err.message);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, c.first_name AS child_first_name, c.last_name AS child_last_name,
              t.first_name AS teacher_first_name, t.last_name AS teacher_last_name,
              p.first_name AS parent_first_name, p.last_name AS parent_last_name
       FROM reports r
       LEFT JOIN children c ON c.id = r.child_id
       LEFT JOIN users t ON t.id = r.teacher_id
       LEFT JOIN users p ON p.id = r.parent_id
       WHERE r.id=$1`,
      [id]
    );
    const report = result.rows[0];
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    if (req.user.role === 'teacher' && report.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role === 'parent' && report.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'parent' && !report.is_read) {
      await pool.query('UPDATE reports SET is_read=TRUE, read_at=NOW() WHERE id=$1', [id]);
      report.is_read = true;
      report.read_at = new Date().toISOString();
    }

    res.json({ report });
  } catch (err) {
    console.error('[Reports/Detail]', err.message);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

router.post('/', requireRole('teacher'), async (req, res) => {
  try {
    const { session_id, child_id, parent_id, title, summary, recommendations } = req.body;
    if (!session_id || !child_id || !parent_id || !title) {
      return res.status(400).json({ error: 'session_id, child_id, parent_id and title are required' });
    }

    const sessionResult = await pool.query(
      'SELECT * FROM assessment_sessions WHERE id=$1 AND teacher_id=$2',
      [session_id, req.user.id]
    );
    if (!sessionResult.rows[0]) {
      return res.status(404).json({ error: 'Session not found or not owned by you' });
    }

    const childResult = await pool.query(
      'SELECT * FROM children WHERE id=$1 AND teacher_id=$2',
      [child_id, req.user.id]
    );
    if (!childResult.rows[0]) {
      return res.status(404).json({ error: 'Child not found or not owned by you' });
    }

    const parentResult = await pool.query(
      'SELECT id FROM users WHERE id=$1 AND role=$2',
      [parent_id, 'parent']
    );
    if (!parentResult.rows[0]) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const existing = await pool.query('SELECT id FROM reports WHERE session_id=$1', [session_id]);
    let report;
    if (existing.rows[0]) {
      const update = await pool.query(
        `UPDATE reports SET
           title=$1, summary=$2, recommendations=$3
         WHERE id=$4 RETURNING *`,
        [title, summary || '', recommendations || '', existing.rows[0].id]
      );
      report = update.rows[0];
    } else {
      const insert = await pool.query(
        `INSERT INTO reports (
           session_id, child_id, teacher_id, parent_id,
           title, summary, recommendations, detailed_breakdown, sent_at, is_read
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,'{}', NULL, FALSE)
         RETURNING *`,
        [session_id, child_id, req.user.id, parent_id, title, summary || '', recommendations || '']
      );
      report = insert.rows[0];
    }

    res.status(201).json({ report });
  } catch (err) {
    console.error('[Reports/Create]', err.message);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

router.put('/:id', requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, recommendations } = req.body;
    const reportResult = await pool.query('SELECT * FROM reports WHERE id=$1 AND teacher_id=$2', [id, req.user.id]);
    if (!reportResult.rows[0]) {
      return res.status(404).json({ error: 'Report not found' });
    }
    const update = await pool.query(
      `UPDATE reports SET
         title = COALESCE($1, title),
         summary = COALESCE($2, summary),
         recommendations = COALESCE($3, recommendations)
       WHERE id=$4 RETURNING *`,
      [title, summary, recommendations, id]
    );
    res.json({ report: update.rows[0] });
  } catch (err) {
    console.error('[Reports/Update]', err.message);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

router.post('/:id/send', requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const reportResult = await pool.query('SELECT * FROM reports WHERE id=$1 AND teacher_id=$2', [id, req.user.id]);
    if (!reportResult.rows[0]) {
      return res.status(404).json({ error: 'Report not found' });
    }
    const update = await pool.query(
      `UPDATE reports SET sent_at=NOW(), is_read=FALSE, read_at=NULL WHERE id=$1 RETURNING *`,
      [id]
    );
    res.json({ report: update.rows[0] });
  } catch (err) {
    console.error('[Reports/Send]', err.message);
    res.status(500).json({ error: 'Failed to send report' });
  }
});

module.exports = router;
