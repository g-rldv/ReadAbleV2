// ============================================================
// Pre-Assessments Route - Initial assessment to determine student level
// Endpoint: GET /api/pre-assessments/questions
// Purpose: Get questions from all 4 difficulty levels
// ============================================================
const router = require('express').Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// Get pre-assessment questions (mix from all difficulty levels)
router.get('/questions', requireAuth, async (req, res) => {
  try {
    // Get 3 questions from each difficulty level (12 total)
    // This gives a comprehensive view of student's skills across all levels
    const questions = [];

    for (let level = 1; level <= 4; level++) {
      const result = await pool.query(
        `SELECT 
          aq.id,
          aq.question_text,
          aq.question_type,
          aq.question_category,
          aq.options,
          aq.correct_answer,
          aq.difficulty_score,
          aq.time_estimate,
          aq.points,
          a.difficulty_level,
          a.title as assessment_title
         FROM assessment_questions aq
         JOIN assessments a ON aq.assessment_id = a.id
         WHERE a.difficulty_level = $1
         AND a.is_published = TRUE
         ORDER BY RANDOM()
         LIMIT 3`,
        [level]
      );
      
      questions.push(...result.rows.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correct_answer: typeof q.correct_answer === 'string' ? JSON.parse(q.correct_answer) : q.correct_answer,
      })));
    }

    if (questions.length === 0) {
      return res.status(404).json({ 
        error: 'No questions available for pre-assessment. Teacher must publish assessments first.',
        questions: []
      });
    }

    res.json({ 
      questions,
      total_questions: questions.length,
      info: 'This pre-assessment has questions from all 4 difficulty levels to help determine student placement.'
    });
  } catch (err) {
    console.error('[PreAssessments/Questions]', err.message);
    res.status(500).json({ error: 'Failed to fetch pre-assessment questions' });
  }
});

// Calculate recommended level based on pre-assessment answers
router.post('/recommend-level', requireAuth, async (req, res) => {
  try {
    const { answers } = req.body; // answers: [{ question_id, given_answer, is_correct }, ...]
    
    if (!answers || answers.length === 0) {
      return res.status(400).json({ error: 'No answers provided' });
    }

    // Group answers by difficulty level
    const scoreByLevel = { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 }, 4: { correct: 0, total: 0 } };

    // Get question difficulty levels
    const questionIds = answers.map(a => a.question_id);
    const questionsResult = await pool.query(
      `SELECT 
        aq.id,
        a.difficulty_level
       FROM assessment_questions aq
       JOIN assessments a ON aq.assessment_id = a.id
       WHERE aq.id = ANY($1::int[])`,
      [questionIds]
    );

    const questionsByLevel = {};
    questionsResult.rows.forEach(q => {
      questionsByLevel[q.id] = q.difficulty_level;
    });

    // Calculate scores by level
    answers.forEach(answer => {
      const level = questionsByLevel[answer.question_id];
      if (level && scoreByLevel[level]) {
        scoreByLevel[level].total++;
        if (answer.is_correct) {
          scoreByLevel[level].correct++;
        }
      }
    });

    // Calculate percentages
    const percentagesByLevel = {};
    Object.keys(scoreByLevel).forEach(level => {
      const data = scoreByLevel[level];
      percentagesByLevel[level] = data.total > 0 
        ? Math.round((data.correct / data.total) * 100) 
        : 0;
    });

    // Recommend level based on performance
    let recommendedLevel = 1;
    const overallPercentage = Math.round(
      answers.filter(a => a.is_correct).length / answers.length * 100
    );

    // Logic for level recommendation
    if (percentagesByLevel[4] >= 70) {
      recommendedLevel = 4;
    } else if (percentagesByLevel[3] >= 70 || (percentagesByLevel[4] >= 50 && overallPercentage >= 60)) {
      recommendedLevel = 3;
    } else if (percentagesByLevel[2] >= 70 || (percentagesByLevel[3] >= 50 && overallPercentage >= 50)) {
      recommendedLevel = 2;
    } else {
      recommendedLevel = 1;
    }

    // Generate personalized recommendations
    const recommendations = generateRecommendations(percentagesByLevel, recommendedLevel);

    res.json({
      overall_score: overallPercentage,
      recommended_level: recommendedLevel,
      scores_by_level: percentagesByLevel,
      recommendations,
      placement_info: {
        1: 'Foundation level - Focus on basic vocabulary and literal comprehension',
        2: 'Elementary level - Simple sentences and basic sequence understanding',
        3: 'Intermediate level - Short paragraphs with inference and emotion',
        4: 'Advanced level - Complex stories with multiple themes and deeper analysis'
      }
    });
  } catch (err) {
    console.error('[PreAssessments/RecommendLevel]', err.message);
    res.status(500).json({ error: 'Failed to calculate recommended level' });
  }
});

function generateRecommendations(scoresByLevel, recommendedLevel) {
  const recommendations = [];

  // Level-specific feedback
  if (recommendedLevel === 1) {
    recommendations.push({
      priority: 'high',
      title: 'Start with Foundation Skills',
      description: 'Your child will begin with Level 1 assessments focusing on vocabulary and picture-text matching.',
      action: 'Assign Level 1 assessments'
    });
    if (scoresByLevel[2] >= 50) {
      recommendations.push({
        priority: 'medium',
        title: 'Quick Progression Possible',
        description: 'Your child showed some ability at Level 2. After mastering Level 1, progress can be rapid.',
        action: 'Monitor progress and advance when ready'
      });
    }
  } else if (recommendedLevel === 2) {
    recommendations.push({
      priority: 'high',
      title: 'Level 2 - Simple Stories',
      description: 'Recommended placement in Level 2 with simple sentences and basic story comprehension.',
      action: 'Assign Level 2 assessments'
    });
    if (scoresByLevel[1] < 70) {
      recommendations.push({
        priority: 'medium',
        title: 'Review Foundation Skills',
        description: 'Strengthen basic vocabulary and picture recognition before progressing.',
        action: 'Include some Level 1 review activities'
      });
    }
  } else if (recommendedLevel === 3) {
    recommendations.push({
      priority: 'high',
      title: 'Level 3 - Intermediate Stories',
      description: 'Your child is ready for Level 3 with paragraphs involving inference and emotions.',
      action: 'Assign Level 3 assessments'
    });
    if (scoresByLevel[4] >= 40) {
      recommendations.push({
        priority: 'low',
        title: 'Advanced Content Ready',
        description: 'Your child showed some capability with advanced questions. Progress may be possible.',
        action: 'Watch for advancement opportunities'
      });
    }
  } else if (recommendedLevel === 4) {
    recommendations.push({
      priority: 'high',
      title: 'Level 4 - Advanced Stories',
      description: 'Your child demonstrates strong reading comprehension and is ready for Level 4.',
      action: 'Assign Level 4 advanced assessments'
    });
    recommendations.push({
      priority: 'medium',
      title: 'Continue Challenging Growth',
      description: 'Continue with advanced materials to build complex reasoning skills.',
      action: 'Assign increasingly complex materials'
    });
  }

  // Skill-specific recommendations
  if (scoresByLevel[1] < 50) {
    recommendations.push({
      priority: 'high',
      title: 'Focus on Vocabulary',
      description: 'Work on basic vocabulary recognition through picture matching activities.',
      action: 'Practice vocabulary daily'
    });
  }

  return recommendations;
}

module.exports = router;
