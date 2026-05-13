const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireRole('teacher'));

router.get('/children', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.first_name AS parent_first_name, u.last_name AS parent_last_name
       FROM children c
       LEFT JOIN users u ON u.id = c.parent_id
       WHERE c.teacher_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    const children = result.rows.map((row) => ({
      ...row,
      parent_name: row.parent_first_name ? `${row.parent_first_name} ${row.parent_last_name}` : null,
    }));
    res.json({ children });
  } catch (err) {
    console.error('[Teacher/Children]', err.message);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

router.post('/children', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      age,
      gender,
      asd_notes,
      parent_email,
    } = req.body;

    if (!first_name || !last_name || !date_of_birth || !age) {
      return res.status(400).json({ error: 'First name, last name, date of birth, and age are required' });
    }

    let parentId = null;
    if (parent_email) {
      const parentResult = await pool.query(
        'SELECT id FROM users WHERE email=$1 AND role=$2',
        [parent_email.toLowerCase().trim(), 'parent']
      );
      if (!parentResult.rows[0]) {
        return res.status(404).json({ error: 'Parent not found' });
      }
      parentId = parentResult.rows[0].id;
    }

    const insertResult = await pool.query(
      `INSERT INTO children (
         first_name, last_name, date_of_birth, age, gender,
         asd_notes, avatar, parent_id, teacher_id, created_at
       ) VALUES ($1,$2,$3,$4,$5,$6,'', $7,$8,NOW())
       RETURNING *`,
      [first_name.trim(), last_name.trim(), date_of_birth, age, gender || null, asd_notes || null, parentId, req.user.id]
    );
    res.status(201).json({ child: insertResult.rows[0] });
  } catch (err) {
    console.error('[Teacher/CreateChild]', err.message);
    res.status(500).json({ error: 'Failed to create child profile' });
  }
});

router.get('/children/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const childResult = await pool.query(
      `SELECT c.*, u.first_name AS parent_first_name, u.last_name AS parent_last_name
       FROM children c
       LEFT JOIN users u ON u.id = c.parent_id
       WHERE c.id=$1 AND c.teacher_id=$2`,
      [id, req.user.id]
    );
    if (!childResult.rows[0]) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const child = childResult.rows[0];
    const sessionsResult = await pool.query(
      `SELECT s.id, s.assessment_id, a.title AS assessment_title,
              s.started_at, s.completed_at, s.status,
              s.total_score, s.percentage
       FROM assessment_sessions s
       LEFT JOIN assessments a ON a.id = s.assessment_id
       WHERE s.child_id=$1
       ORDER BY s.started_at DESC`,
      [id]
    );

    const reportResult = await pool.query(
      `SELECT * FROM reports
       WHERE child_id=$1 AND teacher_id=$2
       ORDER BY sent_at DESC
       LIMIT 1`,
      [id, req.user.id]
    );

    res.json({
      child: {
        ...child,
        parent_name: child.parent_first_name ? `${child.parent_first_name} ${child.parent_last_name}` : null,
      },
      sessions: sessionsResult.rows,
      latest_report: reportResult.rows[0] || null,
    });
  } catch (err) {
    console.error('[Teacher/ChildDetail]', err.message);
    res.status(500).json({ error: 'Failed to fetch child profile' });
  }
});

router.put('/children/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      date_of_birth,
      age,
      gender,
      asd_notes,
    } = req.body;

    const updateResult = await pool.query(
      `UPDATE children SET
         first_name = COALESCE(NULLIF($1, ''), first_name),
         last_name  = COALESCE(NULLIF($2, ''), last_name),
         date_of_birth = COALESCE(NULLIF($3, ''), date_of_birth),
         age = COALESCE($4, age),
         gender = COALESCE($5, gender),
         asd_notes = COALESCE($6, asd_notes)
       WHERE id=$7 AND teacher_id=$8
       RETURNING *`,
      [
        first_name,
        last_name,
        date_of_birth,
        age,
        gender,
        asd_notes,
        id,
        req.user.id,
      ]
    );

    if (!updateResult.rows[0]) {
      return res.status(404).json({ error: 'Child not found or not owned by you' });
    }
    res.json({ child: updateResult.rows[0] });
  } catch (err) {
    console.error('[Teacher/UpdateChild]', err.message);
    res.status(500).json({ error: 'Failed to update child profile' });
  }
});

router.delete('/children/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM children WHERE id=$1 AND teacher_id=$2 RETURNING id',
      [id, req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Child not found or not owned by you' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Teacher/DeleteChild]', err.message);
    res.status(500).json({ error: 'Failed to delete child' });
  }
});

router.post('/children/:id/assign-parent', async (req, res) => {
  try {
    const { id } = req.params;
    const { parent_email } = req.body;
    if (!parent_email) {
      return res.status(400).json({ error: 'Parent email is required' });
    }

    const childResult = await pool.query(
      'SELECT id FROM children WHERE id=$1 AND teacher_id=$2',
      [id, req.user.id]
    );
    if (!childResult.rows[0]) {
      return res.status(404).json({ error: 'Child not found or not owned by you' });
    }

    const parentResult = await pool.query(
      'SELECT id FROM users WHERE email=$1 AND role=$2',
      [parent_email.toLowerCase().trim(), 'parent']
    );
    if (!parentResult.rows[0]) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const updated = await pool.query(
      'UPDATE children SET parent_id=$1 WHERE id=$2 RETURNING *',
      [parentResult.rows[0].id, id]
    );
    res.json({ child: updated.rows[0] });
  } catch (err) {
    console.error('[Teacher/AssignParent]', err.message);
    res.status(500).json({ error: 'Failed to assign parent' });
  }
});

module.exports = router;
