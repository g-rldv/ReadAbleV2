// ============================================================
// Classrooms Routes — teacher creates classrooms, parents join
// ============================================================
const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// ── Helper: generate a unique 6-char code ─────────────────────
async function generateUniqueCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing 0/O/1/I
  let code, exists;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const res = await pool.query('SELECT 1 FROM classrooms WHERE code = $1', [code]);
    exists = res.rowCount > 0;
  } while (exists);
  return code;
}

// ── Parent: Get MY classrooms  (MUST be before /:id) ─────────
router.get('/my', requireAuth, requireRole('parent'), async (req, res) => {
  try {
    const classrooms = await pool.query(
      `SELECT c.id, c.name, c.code, c.created_at,
              cm.status, cm.requested_at, cm.approved_at,
              u.first_name AS teacher_first, u.last_name AS teacher_last
       FROM class_memberships cm
       JOIN classrooms c ON cm.classroom_id = c.id
       JOIN users u ON c.teacher_id = u.id
       WHERE cm.user_id = $1
       ORDER BY cm.requested_at DESC`,
      [req.user.id]
    );
    res.json({ classrooms: classrooms.rows });
  } catch (err) {
    console.error('[Classrooms/My]', err.message);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

// ── Parent: Join classroom by code (MUST be before /:id) ─────
router.post('/join', requireAuth, requireRole('parent'), async (req, res) => {
  const { code } = req.body;
  if (!code?.trim()) return res.status(400).json({ error: 'Classroom code is required' });

  try {
    const classroomRes = await pool.query(
      'SELECT * FROM classrooms WHERE code = $1',
      [code.trim().toUpperCase()]
    );
    if (classroomRes.rows.length === 0) {
      return res.status(404).json({ error: 'Classroom not found. Please check the code and try again.' });
    }
    const classroom = classroomRes.rows[0];

    const existing = await pool.query(
      'SELECT status FROM class_memberships WHERE classroom_id = $1 AND user_id = $2',
      [classroom.id, req.user.id]
    );
    if (existing.rows.length > 0) {
      const status = existing.rows[0].status;
      if (status === 'approved') return res.status(400).json({ error: 'You are already a member of this classroom.' });
      if (status === 'pending')  return res.status(400).json({ error: 'Your request is already pending approval.' });
      if (status === 'rejected') return res.status(400).json({ error: 'Your request was rejected. Contact the teacher.' });
    }

    await pool.query(
      'INSERT INTO class_memberships (classroom_id, user_id, status, requested_at) VALUES ($1, $2, $3, NOW())',
      [classroom.id, req.user.id, 'pending']
    );
    res.json({ success: true, classroom });
  } catch (err) {
    console.error('[Classrooms/Join]', err.message);
    res.status(500).json({ error: 'Failed to join classroom' });
  }
});

// ── Teacher: List MY classrooms ──────────────────────────────
router.get('/', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const classrooms = await pool.query(
      `SELECT c.*,
              COUNT(cm.id) FILTER (WHERE cm.status = 'approved') AS member_count,
              COUNT(cm.id) FILTER (WHERE cm.status = 'pending')  AS pending_count
       FROM classrooms c
       LEFT JOIN class_memberships cm ON c.id = cm.classroom_id
       WHERE c.teacher_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ classrooms: classrooms.rows });
  } catch (err) {
    console.error('[Classrooms/List]', err.message);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

// ── Teacher: Create classroom ────────────────────────────────
router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Classroom name is required' });

  try {
    const code = await generateUniqueCode();
    const result = await pool.query(
      'INSERT INTO classrooms (teacher_id, name, code, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [req.user.id, name.trim(), code]
    );
    res.status(201).json({ classroom: result.rows[0] });
  } catch (err) {
    console.error('[Classrooms/Create]', err.message);
    res.status(500).json({ error: 'Failed to create classroom' });
  }
});

// ── Teacher: Get single classroom ───────────────────────────
router.get('/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM classrooms WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Classroom not found' });
    res.json({ classroom: result.rows[0] });
  } catch (err) {
    console.error('[Classrooms/Get]', err.message);
    res.status(500).json({ error: 'Failed to fetch classroom' });
  }
});

// ── Teacher: Get classroom members ──────────────────────────
router.get('/:id/members', requireAuth, requireRole('teacher'), async (req, res) => {
  const { id } = req.params;
  try {
    const classroom = await pool.query(
      'SELECT id FROM classrooms WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );
    if (classroom.rows.length === 0) return res.status(404).json({ error: 'Classroom not found' });

    const members = await pool.query(
      `SELECT cm.id, cm.user_id, cm.status, cm.requested_at, cm.approved_at,
              u.first_name, u.last_name, u.email
       FROM class_memberships cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.classroom_id = $1
       ORDER BY
         CASE cm.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         cm.requested_at DESC`,
      [id]
    );
    res.json({ members: members.rows });
  } catch (err) {
    console.error('[Classrooms/Members]', err.message);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// ── Teacher: Get classroom students by approved parent membership ─────
router.get('/:id/children', requireAuth, requireRole('teacher'), async (req, res) => {
  const { id } = req.params;
  try {
    const classroom = await pool.query(
      'SELECT id FROM classrooms WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );
    if (classroom.rows.length === 0) return res.status(404).json({ error: 'Classroom not found' });

    const children = await pool.query(
      `SELECT c.*, u.first_name AS parent_first_name, u.last_name AS parent_last_name
       FROM children c
       JOIN class_memberships cm ON cm.user_id = c.parent_id
       WHERE cm.classroom_id = $1
         AND cm.status = 'approved'
         AND (c.teacher_id = $2 OR c.teacher_id IS NULL)
       ORDER BY c.first_name, c.last_name`,
      [id, req.user.id]
    );

    const formatted = children.rows.map((child) => ({
      ...child,
      parent_name: child.parent_first_name ? `${child.parent_first_name} ${child.parent_last_name}` : null,
    }));

    res.json({ children: formatted });
  } catch (err) {
    console.error('[Classrooms/Children]', err.message);
    res.status(500).json({ error: 'Failed to fetch classroom students' });
  }
});

// ── Parent: Get activities for an approved classroom (visible to approved members)
router.get('/:id/activities', requireAuth, requireRole('parent'), async (req, res) => {
  const { id } = req.params;
  try {
    // Verify membership and approval
    const membership = await pool.query(
      'SELECT status FROM class_memberships WHERE classroom_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (membership.rows.length === 0 || membership.rows[0].status !== 'approved') {
      return res.status(403).json({ error: 'You do not have access to this classroom' });
    }

    const classroomRes = await pool.query('SELECT teacher_id, name, code FROM classrooms WHERE id = $1', [id]);
    if (classroomRes.rows.length === 0) return res.status(404).json({ error: 'Classroom not found' });
    const teacherId = classroomRes.rows[0].teacher_id;

    const assessments = await pool.query(
      `SELECT id, title, description, story_theme, difficulty, is_published, created_at
       FROM assessments
       WHERE teacher_id = $1 AND is_published = TRUE
       ORDER BY created_at DESC`,
      [teacherId]
    );

    res.json({ classroom: classroomRes.rows[0], activities: assessments.rows });
  } catch (err) {
    console.error('[Classrooms/Activities]', err.message);
    res.status(500).json({ error: 'Failed to fetch classroom activities' });
  }
});

// ── Teacher: Approve or reject a member ─────────────────────
router.post('/:id/members/:userId/:action', requireAuth, requireRole('teacher'), async (req, res) => {
  const { id, userId, action } = req.params;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be approve or reject' });
  }

  try {
    const classroom = await pool.query(
      'SELECT id FROM classrooms WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );
    if (classroom.rows.length === 0) return res.status(404).json({ error: 'Classroom not found' });

    const membership = await pool.query(
      'SELECT id FROM class_memberships WHERE classroom_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (membership.rows.length === 0) return res.status(404).json({ error: 'Membership not found' });

    const status = action === 'approve' ? 'approved' : 'rejected';
    const approved_at = action === 'approve' ? new Date() : null;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE class_memberships SET status = $1, approved_at = $2 WHERE classroom_id = $3 AND user_id = $4',
        [status, approved_at, id, userId]
      );

      // If approved, link the parent's children to this teacher
      if (action === 'approve') {
        await client.query(
          `UPDATE children SET teacher_id = $1
           WHERE parent_id = $2 AND (teacher_id IS NULL OR teacher_id = $1)`,
          [req.user.id, userId]
        );

        // Remove any child assignments for this parent when they are removed
        await client.query(
          `DELETE FROM classroom_child_assignments
           WHERE classroom_id = $1 AND parent_id = $2`,
          [id, userId]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ success: true, status });
  } catch (err) {
    console.error('[Classrooms/Action]', err.message);
    res.status(500).json({ error: 'Failed to update membership' });
  }
});

// ── Teacher: Delete classroom ────────────────────────────────
router.delete('/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM classrooms WHERE id = $1 AND teacher_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Classroom not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Classrooms/Delete]', err.message);
    res.status(500).json({ error: 'Failed to delete classroom' });
  }
});

// ── Teacher: Remove member from classroom ┇
router.delete('/:id/members/:userId', requireAuth, requireRole('teacher'), async (req, res) => {
  const { id, userId } = req.params;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Delete membership
      await client.query(
        `DELETE FROM class_memberships WHERE classroom_id = $1 AND user_id = $2`,
        [id, userId]
      );
      // Delete any child assignments for this parent in this classroom
      await client.query(
        `DELETE FROM classroom_child_assignments WHERE classroom_id = $1 AND parent_id = $2`,
        [id, userId]
      );
      // If the removed parent was the teacher for any of their children, clear the teacher linkage
      await client.query(
        `UPDATE children SET teacher_id = NULL WHERE parent_id = $1 AND teacher_id = (SELECT teacher_id FROM classrooms WHERE id = $2)`,
        [userId, id]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Classrooms/RemoveMember]', err.message);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// ── Parent: Assign child to an approved classroom ┇
router.post('/:id/children', requireAuth, requireRole('parent'), async (req, res) => {
  const { id } = req.params;
  const { childId } = req.body;
  if (!childId) return res.status(400).json({ error: 'childId is required' });
  try {
    // Verify parent membership is approved for this classroom
    const membershipRes = await pool.query(
      'SELECT status FROM class_memberships WHERE classroom_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!membershipRes.rows.length || membershipRes.rows[0].status !== 'approved') {
      return res.status(403).json({ error: 'You are not an approved member of this classroom' });
    }
    // Verify the child belongs to this parent
    const childRes = await pool.query(
      'SELECT id FROM children WHERE id = $1 AND parent_id = $2',
      [childId, req.user.id]
    );
    if (!childRes.rows.length) return res.status(404).json({ error: 'Child not found or does not belong to you' });
    // Insert assignment, avoid duplicates
    await pool.query(
      `INSERT INTO classroom_child_assignments (classroom_id, parent_id, child_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (classroom_id, child_id) DO NOTHING`,
      [id, req.user.id, childId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Classrooms/AssignChild]', err.message);
    res.status(500).json({ error: 'Failed to assign child to classroom' });
  }
});

module.exports = router;