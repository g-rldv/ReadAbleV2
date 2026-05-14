// ============================================================
// Classrooms Routes — teacher creates classrooms, parents join
// ============================================================
const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// ── Teacher: Get classroom info ───────────────────────────
router.get('/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  const { id } = req.params;
  try {
    const classroom = await pool.query('SELECT * FROM classrooms WHERE id = $1 AND teacher_id = $2', [id, req.user.id]);
    if (classroom.rows.length === 0) return res.status(404).json({ error: 'Classroom not found' });
    res.json({ classroom: classroom.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classroom' });
  }
});

// ── Teacher: Get my classrooms ──────────────────────────────
router.get('/', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const classrooms = await pool.query(
      `SELECT c.*, COUNT(cm.id) as member_count
       FROM classrooms c
       LEFT JOIN class_memberships cm ON c.id = cm.classroom_id AND cm.status = 'approved'
       WHERE c.teacher_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ classrooms: classrooms.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

// ── Teacher: Create classroom ───────────────────────────────
router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Classroom name required' });

  try {
    // Generate unique code
    let code;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (await pool.query('SELECT 1 FROM classrooms WHERE code = $1', [code]).rowCount > 0);

    const classroom = await pool.query(
      'INSERT INTO classrooms (teacher_id, name, code) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name.trim(), code]
    );
    res.json({ classroom: classroom.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create classroom' });
  }
});

// ── Teacher: Get classroom members ──────────────────────────
router.get('/:id/members', requireAuth, requireRole('teacher'), async (req, res) => {
  const { id } = req.params;
  try {
    const classroom = await pool.query('SELECT * FROM classrooms WHERE id = $1 AND teacher_id = $2', [id, req.user.id]);
    if (classroom.rows.length === 0) return res.status(404).json({ error: 'Classroom not found' });

    const members = await pool.query(
      `SELECT cm.*, u.username, u.first_name, u.last_name, u.email
       FROM class_memberships cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.classroom_id = $1
       ORDER BY cm.requested_at DESC`,
      [id]
    );
    res.json({ members: members.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// ── Teacher: Approve/reject member ──────────────────────────
router.post('/:id/members/:userId/:action', requireAuth, requireRole('teacher'), async (req, res) => {
  const { id, userId, action } = req.params;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

  try {
    const classroom = await pool.query('SELECT * FROM classrooms WHERE id = $1 AND teacher_id = $2', [id, req.user.id]);
    if (classroom.rows.length === 0) return res.status(404).json({ error: 'Classroom not found' });

    const status = action === 'approve' ? 'approved' : 'rejected';
    const approved_at = action === 'approve' ? new Date() : null;

    await pool.query(
      'UPDATE class_memberships SET status = $1, approved_at = $2 WHERE classroom_id = $3 AND user_id = $4',
      [status, approved_at, id, userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update membership' });
  }
});

// ── Parent: Join classroom by code ──────────────────────────
router.post('/join', requireAuth, requireRole('parent'), async (req, res) => {
  const { code } = req.body;
  if (!code?.trim()) return res.status(400).json({ error: 'Classroom code required' });

  try {
    const classroom = await pool.query('SELECT * FROM classrooms WHERE code = $1', [code.trim().toUpperCase()]);
    if (classroom.rows.length === 0) return res.status(404).json({ error: 'Classroom not found' });

    // Check if already member
    const existing = await pool.query(
      'SELECT * FROM class_memberships WHERE classroom_id = $1 AND user_id = $2',
      [classroom.rows[0].id, req.user.id]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Already requested or member' });

    await pool.query(
      'INSERT INTO class_memberships (classroom_id, user_id) VALUES ($1, $2)',
      [classroom.rows[0].id, req.user.id]
    );
    res.json({ classroom: classroom.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join classroom' });
  }
});

// ── Parent: Get my classrooms ───────────────────────────────
router.get('/my', requireAuth, requireRole('parent'), async (req, res) => {
  try {
    const classrooms = await pool.query(
      `SELECT c.*, cm.status, cm.requested_at, cm.approved_at, u.first_name as teacher_first, u.last_name as teacher_last
       FROM class_memberships cm
       JOIN classrooms c ON cm.classroom_id = c.id
       JOIN users u ON c.teacher_id = u.id
       WHERE cm.user_id = $1
       ORDER BY cm.requested_at DESC`,
      [req.user.id]
    );
    res.json({ classrooms: classrooms.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

module.exports = router;