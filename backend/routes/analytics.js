const router = require('express').Router();
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

// Get teacher's class overview statistics
router.get('/dashboard/:teacherId', requireRole('teacher'), async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Verify teacher owns this data
    if (req.user.id !== parseInt(teacherId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get all children taught by this teacher
    const childrenResult = await pool.query(
      `SELECT id, first_name, last_name, age FROM children WHERE teacher_id=$1`,
      [teacherId]
    );
    const children = childrenResult.rows;
    const childIds = children.map(c => c.id);

    if (childIds.length === 0) {
      return res.json({
        total_students: 0,
        avg_score: 0,
        this_week_attempts: 0,
        mastery_count: 0,
        students: [],
        class_skill_breakdown: {},
      });
    }

    // Get all assessment sessions for this teacher's students
    const sessionsResult = await pool.query(
      `SELECT 
        s.id,
        s.child_id,
        s.assessment_id,
        s.percentage,
        s.status,
        s.started_at,
        a.difficulty_level,
        a.autism_focus_areas
       FROM assessment_sessions s
       JOIN assessments a ON s.assessment_id = a.id
       WHERE s.child_id = ANY($1::int[])
       ORDER BY s.started_at DESC`,
      [childIds]
    );
    const sessions = sessionsResult.rows;

    // Get detailed question answers
    const answersResult = await pool.query(
      `SELECT 
        sa.session_id,
        sa.child_id,
        sa.is_correct,
        sa.points_earned,
        sa.time_spent_seconds,
        aq.question_category,
        aq.difficulty_score
       FROM session_answers sa
       JOIN assessment_questions aq ON sa.question_id = aq.id
       JOIN assessment_sessions asess ON sa.session_id = asess.id
       WHERE sa.child_id = ANY($1::int[])`,
      [childIds]
    );
    const answers = answersResult.rows;

    // Calculate class statistics
    const totalScore = sessions.reduce((sum, s) => sum + s.percentage, 0);
    const avgScore = sessions.length > 0 ? Math.round(totalScore / sessions.length) : 0;

    // This week attempts
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekAttempts = sessions.filter(s => new Date(s.started_at) > oneWeekAgo).length;

    // Mastery (score >= 80%)
    const masteryCount = sessions.filter(s => s.percentage >= 80).length;

    // Skill breakdown across all children
    const skillBreakdown = {
      literal: { correct: 0, total: 0 },
      inference: { correct: 0, total: 0 },
      vocabulary: { correct: 0, total: 0 },
      sequence: { correct: 0, total: 0 },
      emotion: { correct: 0, total: 0 },
    };

    answers.forEach(ans => {
      const category = ans.question_category || 'literal';
      if (skillBreakdown[category]) {
        skillBreakdown[category].total++;
        if (ans.is_correct) {
          skillBreakdown[category].correct++;
        }
      }
    });

    // Convert to percentages
    const classSkillBreakdown = {};
    Object.keys(skillBreakdown).forEach(skill => {
      const data = skillBreakdown[skill];
      classSkillBreakdown[skill] = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    });

    // Per-student summary
    const studentSummaries = children.map(child => {
      const childSessions = sessions.filter(s => s.child_id === child.id);
      const childAnswers = answers.filter(a => a.child_id === child.id);

      const childScore = childSessions.length > 0
        ? Math.round(childSessions.reduce((sum, s) => sum + s.percentage, 0) / childSessions.length)
        : 0;

      // Child's skill breakdown
      const childSkillBreakdown = {
        literal: { correct: 0, total: 0 },
        inference: { correct: 0, total: 0 },
        vocabulary: { correct: 0, total: 0 },
        sequence: { correct: 0, total: 0 },
        emotion: { correct: 0, total: 0 },
      };

      childAnswers.forEach(ans => {
        const category = ans.question_category || 'literal';
        if (childSkillBreakdown[category]) {
          childSkillBreakdown[category].total++;
          if (ans.is_correct) {
            childSkillBreakdown[category].correct++;
          }
        }
      });

      const childSkillPercentages = {};
      Object.keys(childSkillBreakdown).forEach(skill => {
        const data = childSkillBreakdown[skill];
        childSkillPercentages[skill] = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      });

      const currentLevel = childSessions.length > 0
        ? childSessions[0].difficulty_level
        : 1;

      return {
        id: child.id,
        name: `${child.first_name} ${child.last_name}`,
        age: child.age,
        avg_score: childScore,
        current_level: currentLevel,
        attempts: childSessions.length,
        skill_breakdown: childSkillPercentages,
        literal_score: childSkillPercentages.literal,
        inference_score: childSkillPercentages.inference,
        strength_area: Math.max(...Object.values(childSkillPercentages)),
        growth_area: Math.min(...Object.values(childSkillPercentages).filter(v => v > 0)),
      };
    }).sort((a, b) => b.avg_score - a.avg_score);

    res.json({
      total_students: children.length,
      avg_score: avgScore,
      this_week_attempts: thisWeekAttempts,
      mastery_count: masteryCount,
      students: studentSummaries,
      class_skill_breakdown: classSkillBreakdown,
    });
  } catch (err) {
    console.error('[Analytics/Dashboard]', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Get detailed analytics for a single student
router.get('/student/:studentId', requireRole('teacher'), async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify teacher has access to this student
    const childResult = await pool.query(
      `SELECT id, first_name, last_name, age, teacher_id FROM children WHERE id=$1`,
      [studentId]
    );

    if (!childResult.rows[0]) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const child = childResult.rows[0];
    if (child.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get all sessions for this student
    const sessionsResult = await pool.query(
      `SELECT 
        s.id,
        s.assessment_id,
        s.percentage,
        s.status,
        s.total_score,
        s.max_score,
        s.time_spent_seconds,
        s.started_at,
        s.completed_at,
        a.title,
        a.difficulty_level,
        a.autism_focus_areas
       FROM assessment_sessions s
       JOIN assessments a ON s.assessment_id = a.id
       WHERE s.child_id=$1
       ORDER BY s.started_at DESC`,
      [studentId]
    );
    const sessions = sessionsResult.rows;

    // Get detailed answers
    const answersResult = await pool.query(
      `SELECT 
        sa.session_id,
        sa.is_correct,
        sa.points_earned,
        sa.time_spent_seconds,
        sa.attempt_number,
        sa.hint_used,
        aq.question_category,
        aq.difficulty_score,
        aq.question_text,
        aq.time_estimate
       FROM session_answers sa
       JOIN assessment_questions aq ON sa.question_id = aq.id
       WHERE sa.child_id=$1
       ORDER BY sa.answered_at`,
      [studentId]
    );
    const answers = answersResult.rows;

    // Skill breakdown
    const skillBreakdown = {
      literal: { correct: 0, total: 0 },
      inference: { correct: 0, total: 0 },
      vocabulary: { correct: 0, total: 0 },
      sequence: { correct: 0, total: 0 },
      emotion: { correct: 0, total: 0 },
    };

    answers.forEach(ans => {
      const category = ans.question_category || 'literal';
      if (skillBreakdown[category]) {
        skillBreakdown[category].total++;
        if (ans.is_correct) {
          skillBreakdown[category].correct++;
        }
      }
    });

    const skillPercentages = {};
    Object.keys(skillBreakdown).forEach(skill => {
      const data = skillBreakdown[skill];
      skillPercentages[skill] = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    });

    // Time analysis
    const totalTimeSeconds = answers.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);
    const avgTimePerQuestion = answers.length > 0 ? Math.round(totalTimeSeconds / answers.length) : 0;
    const avgTimeEstimate = answers.length > 0 
      ? Math.round(answers.reduce((sum, a) => sum + (a.time_estimate || 0), 0) / answers.length)
      : 0;

    // Attempt analysis
    const firstTryCorrect = answers.filter(a => a.attempt_number === 1 && a.is_correct).length;
    const hintsUsed = answers.filter(a => a.hint_used).length;

    // Difficulty progression
    const difficultyProgression = sessions.map(s => ({
      date: s.started_at,
      level: s.difficulty_level,
      score: s.percentage,
      title: s.title,
    }));

    // Overall stats
    const overallScore = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.percentage, 0) / sessions.length)
      : 0;

    const maxDifficultyReached = Math.max(...sessions.map(s => s.difficulty_level), 1);

    res.json({
      student: {
        id: child.id,
        name: `${child.first_name} ${child.last_name}`,
        age: child.age,
      },
      overall_score: overallScore,
      total_attempts: sessions.length,
      max_difficulty_reached: maxDifficultyReached,
      skill_breakdown: skillPercentages,
      time_analysis: {
        total_time_seconds: totalTimeSeconds,
        avg_time_per_question: avgTimePerQuestion,
        avg_time_estimate: avgTimeEstimate,
        processing_speed_ratio: avgTimeEstimate > 0 ? Math.round((avgTimePerQuestion / avgTimeEstimate) * 100) : 0,
      },
      attempt_analysis: {
        first_try_correct: firstTryCorrect,
        first_try_percentage: answers.length > 0 ? Math.round((firstTryCorrect / answers.length) * 100) : 0,
        hints_used: hintsUsed,
        hints_percentage: answers.length > 0 ? Math.round((hintsUsed / answers.length) * 100) : 0,
      },
      difficulty_progression: difficultyProgression,
      sessions: sessions.slice(0, 10), // Last 10 sessions
      strength_areas: Object.entries(skillPercentages)
        .filter(([_, score]) => score >= 80)
        .map(([skill, score]) => ({ skill, score })),
      growth_areas: Object.entries(skillPercentages)
        .filter(([_, score]) => score < 70 && score > 0)
        .map(([skill, score]) => ({ skill, score })),
    });
  } catch (err) {
    console.error('[Analytics/Student]', err.message);
    res.status(500).json({ error: 'Failed to fetch student analytics' });
  }
});

// Get recommendations for a student
router.get('/recommendations/:studentId', requireRole('teacher'), async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify access
    const childResult = await pool.query(
      `SELECT id, teacher_id FROM children WHERE id=$1`,
      [studentId]
    );

    if (!childResult.rows[0] || (childResult.rows[0].teacher_id !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get student analytics
    const analyticsResult = await pool.query(
      `SELECT 
        sa.session_id,
        sa.is_correct,
        sa.time_spent_seconds,
        aq.question_category,
        aq.difficulty_score,
        aq.time_estimate,
        asess.percentage,
        a.difficulty_level
       FROM session_answers sa
       JOIN assessment_questions aq ON sa.question_id = aq.id
       JOIN assessment_sessions asess ON sa.session_id = asess.id
       JOIN assessments a ON asess.assessment_id = a.id
       WHERE sa.child_id=$1
       ORDER BY sa.answered_at DESC LIMIT 100`,
      [studentId]
    );

    const analytics = analyticsResult.rows;
    const recommendations = [];

    if (analytics.length === 0) {
      return res.json({ recommendations: ['Complete at least one assessment to get recommendations'] });
    }

    // Analyze skill performance
    const skillScores = {};
    analytics.forEach(row => {
      const cat = row.question_category || 'literal';
      if (!skillScores[cat]) skillScores[cat] = { correct: 0, total: 0 };
      skillScores[cat].total++;
      if (row.is_correct) skillScores[cat].correct++;
    });

    const skillPercentages = Object.entries(skillScores).map(([skill, data]) => ({
      skill,
      percentage: Math.round((data.correct / data.total) * 100),
    }));

    // Check for processing speed issues
    const avgTimeRatio = analytics.reduce((sum, row) => {
      const ratio = row.time_spent_seconds / (row.time_estimate || 60);
      return sum + ratio;
    }, 0) / analytics.length;

    // Build recommendations
    const overallScore = analytics.reduce((sum, row) => sum + row.percentage, 0) / analytics.length;

    if (overallScore < 50) {
      recommendations.push({
        priority: 'high',
        title: 'Struggling Overall',
        description: `Overall score is ${Math.round(overallScore)}%. Consider starting with Level 1 foundational assessments.`,
        action: 'Assign Level 1 assessments',
      });
    }

    // Inference vs literal gap
    const literalScore = skillPercentages.find(s => s.skill === 'literal')?.percentage || 0;
    const inferenceScore = skillPercentages.find(s => s.skill === 'inference')?.percentage || 0;
    if (literalScore - inferenceScore > 20) {
      recommendations.push({
        priority: 'high',
        title: 'Work on Inference Skills',
        description: `Student excels at literal questions (${literalScore}%) but struggles with inference (${inferenceScore}%). Add visual scaffolds and explicit reasoning questions.`,
        action: 'Create inference-focused assessment with picture support',
      });
    }

    // Processing speed
    if (avgTimeRatio > 2.5) {
      recommendations.push({
        priority: 'medium',
        title: 'Processing Time Support',
        description: `Student takes ${(avgTimeRatio * 100).toFixed(0)}% longer than expected. May benefit from extended time, breaks, or chunked sessions.`,
        action: 'Enable break intervals and session pausing',
      });
    }

    if (avgTimeRatio < 0.5) {
      recommendations.push({
        priority: 'medium',
        title: 'Possible Rushing',
        description: 'Student completes questions very quickly. May benefit from reflection prompts or more challenging content.',
        action: 'Increase difficulty level to Level 3+',
      });
    }

    // Emotion/social skills
    const emotionScore = skillPercentages.find(s => s.skill === 'emotion')?.percentage || 0;
    if (emotionScore > 0 && emotionScore < 60) {
      recommendations.push({
        priority: 'medium',
        title: 'Emotion/Social Understanding',
        description: `Emotion comprehension score is ${emotionScore}%. This is a growth area for many students with ASD. Use social stories and explicit emotion teaching.`,
        action: 'Assign emotion-focused activities from Level 3+',
      });
    }

    // Vocabulary
    const vocabScore = skillPercentages.find(s => s.skill === 'vocabulary')?.percentage || 0;
    if (vocabScore > 0 && vocabScore < 70) {
      recommendations.push({
        priority: 'low',
        title: 'Vocabulary Building',
        description: `Vocabulary score is ${vocabScore}%. Pre-teach vocabulary before assessments and use picture supports.`,
        action: 'Review vocabulary before next assessment',
      });
    }

    res.json({ recommendations });
  } catch (err) {
    console.error('[Analytics/Recommendations]', err.message);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;
