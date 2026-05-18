const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const VALID_QUESTION_TYPES = ['multiple_choice', 'yes_no', 'picture_choice', 'short_answer'];

async function getAssessmentById(id) {
  const result = await pool.query('SELECT * FROM assessments WHERE id=$1', [id]);
  return result.rows[0];
}

async function childTeacherIdsForParent(parentId) {
  const result = await pool.query('SELECT DISTINCT teacher_id FROM children WHERE parent_id=$1', [parentId]);
  return result.rows.map(r => r.teacher_id);
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const result = await pool.query(
        `SELECT * FROM assessments WHERE teacher_id=$1 ORDER BY created_at DESC`,
        [req.user.id]
      );
      return res.json({ assessments: result.rows });
    }

    const teacherIds = await childTeacherIdsForParent(req.user.id);
    if (teacherIds.length === 0) return res.json({ assessments: [] });

    const result = await pool.query(
      `SELECT * FROM assessments
       WHERE is_published = TRUE
         AND teacher_id = ANY($1::int[])
       ORDER BY created_at DESC`,
      [teacherIds]
    );
    res.json({ assessments: result.rows });
  } catch (err) {
    console.error('[Assessments/List]', err.message);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

router.post('/', requireRole('teacher'), async (req, res) => {
  try {
    const { title, description, story_theme, difficulty, difficulty_level, autism_focus_areas, recommended_age_min, recommended_age_max, break_interval, classroom_id } = req.body;
    if (!title || !description || !story_theme) {
      return res.status(400).json({ error: 'Title, description, and story theme are required' });
    }
    const result = await pool.query(
      `INSERT INTO assessments
         (title, description, story_theme, difficulty, difficulty_level, autism_focus_areas, recommended_age_min, recommended_age_max, break_interval, teacher_id, is_published, created_at, updated_at, classroom_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE,NOW(),NOW(),$11)
       RETURNING *`,
      [
        title.trim(),
        description.trim(),
        story_theme.trim(),
        difficulty?.trim() || 'easy',
        difficulty_level || 1,
        JSON.stringify(autism_focus_areas || []),
        recommended_age_min || null,
        recommended_age_max || null,
        break_interval || 10,
        req.user.id,
        classroom_id || null
      ]
    );
    res.status(201).json({ assessment: result.rows[0] });
  } catch (err) {
    console.error('[Assessments/Create]', err.message);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await getAssessmentById(id);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (req.user.role === 'teacher' && assessment.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'parent') {
      if (!assessment.is_published) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const teacherIds = await childTeacherIdsForParent(req.user.id);
      if (!teacherIds.includes(assessment.teacher_id)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const pagesResult = await pool.query(
      `SELECT * FROM assessment_pages WHERE assessment_id=$1 ORDER BY page_number ASC`,
      [id]
    );
    const questionsResult = await pool.query(
      `SELECT * FROM assessment_questions WHERE assessment_id=$1 ORDER BY order_index ASC`,
      [id]
    );
    res.json({
      assessment,
      pages: pagesResult.rows,
      questions: questionsResult.rows,
    });
  } catch (err) {
    console.error('[Assessments/Detail]', err.message);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

router.put('/:id', requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, story_theme, difficulty, difficulty_level, autism_focus_areas, recommended_age_min, recommended_age_max, break_interval, classroom_id } = req.body;
    const assessment = await getAssessmentById(id);
    if (!assessment || assessment.teacher_id !== req.user.id) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const result = await pool.query(
      `UPDATE assessments SET
         title=$1, description=$2, story_theme=$3,
         difficulty=$4, difficulty_level=$5, autism_focus_areas=$6,
         recommended_age_min=$7, recommended_age_max=$8, break_interval=$9, updated_at=NOW(),
         classroom_id=$11
       WHERE id=$10 RETURNING *`,
      [
        title || assessment.title,
        description || assessment.description,
        story_theme || assessment.story_theme,
        difficulty || assessment.difficulty,
        difficulty_level !== undefined ? difficulty_level : assessment.difficulty_level,
        autism_focus_areas ? JSON.stringify(autism_focus_areas) : assessment.autism_focus_areas,
        recommended_age_min !== undefined ? recommended_age_min : assessment.recommended_age_min,
        recommended_age_max !== undefined ? recommended_age_max : assessment.recommended_age_max,
        break_interval || assessment.break_interval,
        id,
        classroom_id !== undefined ? classroom_id : assessment.classroom_id
      ]
    );
    res.json({ assessment: result.rows[0] });
  } catch (err) {
    console.error('[Assessments/Update]', err.message);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

router.delete('/:id', requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM assessments WHERE id=$1 AND teacher_id=$2 RETURNING id',
      [id, req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Assessment not found or not owned by you' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Assessments/Delete]', err.message);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

router.put('/:id/publish', requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await getAssessmentById(id);
    if (!assessment || assessment.teacher_id !== req.user.id) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const result = await pool.query(
      `UPDATE assessments
       SET is_published = NOT is_published, updated_at = NOW()
       WHERE id=$1 RETURNING *`,
      [id]
    );
    res.json({ assessment: result.rows[0] });
  } catch (err) {
    console.error('[Assessments/Publish]', err.message);
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
});

router.post('/:id/pages', requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await getAssessmentById(id);
    if (!assessment || assessment.teacher_id !== req.user.id) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const { page_number, page_text, image_description, image_url, audio_hint } = req.body;
    if (page_number === undefined || !page_text) {
      return res.status(400).json({ error: 'Page number and text are required' });
    }
    const result = await pool.query(
      `INSERT INTO assessment_pages
         (assessment_id, page_number, page_text, image_description, image_url, audio_hint, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
      [id, page_number, page_text, image_description || null, image_url || null, audio_hint || null]
    );
    res.status(201).json({ page: result.rows[0] });
  } catch (err) {
    console.error('[Assessments/AddPage]', err.message);
    res.status(500).json({ error: 'Failed to add page' });
  }
});

router.put('/:id/pages/:pageId', requireRole('teacher'), async (req, res) => {
  try {
    const { id, pageId } = req.params;
    const assessment = await getAssessmentById(id);
    if (!assessment || assessment.teacher_id !== req.user.id) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const { page_number, page_text, image_description, image_url, audio_hint } = req.body;
    const updateResult = await pool.query(
      `UPDATE assessment_pages SET
         page_number = COALESCE($1, page_number),
         page_text = COALESCE($2, page_text),
         image_description = COALESCE($3, image_description),
         image_url = COALESCE($4, image_url),
         audio_hint = COALESCE($5, audio_hint)
       WHERE id=$6 AND assessment_id=$7 RETURNING *`,
      [page_number, page_text, image_description, image_url, audio_hint, pageId, id]
    );
    if (!updateResult.rows[0]) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json({ page: updateResult.rows[0] });
  } catch (err) {
    console.error('[Assessments/UpdatePage]', err.message);
    res.status(500).json({ error: 'Failed to update page' });
  }
});

router.delete('/:id/pages/:pageId', requireRole('teacher'), async (req, res) => {
  try {
    const { id, pageId } = req.params;
    const assessment = await getAssessmentById(id);
    if (!assessment || assessment.teacher_id !== req.user.id) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const result = await pool.query(
      'DELETE FROM assessment_pages WHERE id=$1 AND assessment_id=$2 RETURNING id',
      [pageId, id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Assessments/DeletePage]', err.message);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

router.post('/:id/questions', requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await getAssessmentById(id);
    if (!assessment || assessment.teacher_id !== req.user.id) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const { question_text, question_type, options, correct_answer, points, order_index, image_url, question_category, difficulty_score, time_estimate } = req.body;
    if (!question_text || !question_type) {
      return res.status(400).json({ error: 'Question text and type are required' });
    }
    if (!VALID_QUESTION_TYPES.includes(question_type)) {
      return res.status(400).json({ error: 'Invalid question type' });
    }
    let normalizedOptions = options;
    let normalizedAnswer = correct_answer;
    if (question_type === 'yes_no') {
      normalizedOptions = ['Yes', 'No'];
    }
    if (question_type === 'short_answer') {
      normalizedOptions = null;
      normalizedAnswer = normalizedAnswer || null;
    }
    const result = await pool.query(
      `INSERT INTO assessment_questions
         (assessment_id, question_text, question_type, question_category, difficulty_score, time_estimate, options, correct_answer, points, order_index, image_url, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING *`,
      [
        id,
        question_text,
        question_type,
        question_category || 'literal',
        difficulty_score || 5,
        time_estimate || 60,
        normalizedOptions ? JSON.stringify(normalizedOptions) : null,
        normalizedAnswer ? JSON.stringify(normalizedAnswer) : null,
        points || 1,
        order_index || 0,
        image_url || null,
      ]
    );
    res.status(201).json({ question: result.rows[0] });
  } catch (err) {
    console.error('[Assessments/AddQuestion]', err.message);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

router.put('/:id/questions/:qId', requireRole('teacher'), async (req, res) => {
  try {
    const { id, qId } = req.params;
    const assessment = await getAssessmentById(id);
    if (!assessment || assessment.teacher_id !== req.user.id) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const { question_text, question_type, options, correct_answer, points, order_index, image_url, question_category, difficulty_score, time_estimate } = req.body;
    if (question_type && !VALID_QUESTION_TYPES.includes(question_type)) {
      return res.status(400).json({ error: 'Invalid question type' });
    }
    const questionResult = await pool.query(
      'SELECT * FROM assessment_questions WHERE id=$1 AND assessment_id=$2',
      [qId, id]
    );
    if (!questionResult.rows[0]) {
      return res.status(404).json({ error: 'Question not found' });
    }
    const question = questionResult.rows[0];
    const type = question_type || question.question_type;
    let normalizedOptions = options !== undefined ? options : question.options;
    let normalizedAnswer = correct_answer !== undefined ? correct_answer : question.correct_answer;
    if (type === 'yes_no') normalizedOptions = ['Yes', 'No'];
    if (type === 'short_answer') {
      normalizedOptions = null;
      if (normalizedAnswer === undefined) normalizedAnswer = question.correct_answer;
    }
    const updateResult = await pool.query(
      `UPDATE assessment_questions SET
         question_text = COALESCE($1, question_text),
         question_type = COALESCE($2, question_type),
         question_category = COALESCE($3, question_category),
         difficulty_score = COALESCE($4, difficulty_score),
         time_estimate = COALESCE($5, time_estimate),
         options = $6,
         correct_answer = $7,
         points = COALESCE($8, points),
         order_index = COALESCE($9, order_index),
         image_url = COALESCE($10, image_url)
       WHERE id=$11 AND assessment_id=$12 RETURNING *`,
      [
        question_text,
        type,
        question_category,
        difficulty_score,
        time_estimate,
        normalizedOptions ? JSON.stringify(normalizedOptions) : null,
        normalizedAnswer ? JSON.stringify(normalizedAnswer) : null,
        points,
        order_index,
        image_url,
        qId,
        id,
      ]
    );
    res.json({ question: updateResult.rows[0] });
  } catch (err) {
    console.error('[Assessments/UpdateQuestion]', err.message);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/:id/questions/:qId', requireRole('teacher'), async (req, res) => {
  try {
    const { id, qId } = req.params;
    const assessment = await getAssessmentById(id);
    if (!assessment || assessment.teacher_id !== req.user.id) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    const result = await pool.query(
      'DELETE FROM assessment_questions WHERE id=$1 AND assessment_id=$2 RETURNING id',
      [qId, id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Assessments/DeleteQuestion]', err.message);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

module.exports = router;
