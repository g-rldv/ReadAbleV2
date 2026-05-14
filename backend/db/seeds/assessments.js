// ============================================================
// Assessment Seed Script - Creates ASD-optimized assessments
// Run: node db/seeds/assessments.js
// ============================================================
require('dotenv').config({ path: '../../.env' });
const pool = require('../index');

// Example difficulty-based assessments for teachers to use as templates
const assessmentsData = [
  {
    title: 'Picture & Word Matching - Level 1',
    description: 'Students match pictures to single words. Perfect for foundational reading skills.',
    story_theme: 'Animals',
    difficulty_level: 1,
    autism_focus_areas: ['literal', 'vocabulary'],
    recommended_age_min: 5,
    recommended_age_max: 7,
    pages: [
      {
        page_number: 1,
        page_text: 'Look at the pictures below. Can you name each animal?',
        image_url: '/images/activities/animals.png',
        image_description: 'Four colorful animals: dog, cat, bird, fish',
        audio_hint: 'Listen to the sounds each animal makes',
      }
    ],
    questions: [
      { order_index: 1, question_text: '🐶', question_type: 'multiple_choice', question_category: 'literal', points: 1, difficulty_score: 1, time_estimate: 30, options: ['Dog', 'Cat', 'Bird'], correct_answer: 'Dog', image_url: '🐶' },
      { order_index: 2, question_text: '🐱', question_type: 'multiple_choice', question_category: 'literal', points: 1, difficulty_score: 1, time_estimate: 30, options: ['Dog', 'Cat', 'Fish'], correct_answer: 'Cat', image_url: '🐱' },
      { order_index: 3, question_text: '🐦', question_type: 'multiple_choice', question_category: 'literal', points: 1, difficulty_score: 1, time_estimate: 30, options: ['Bird', 'Cat', 'Fish'], correct_answer: 'Bird', image_url: '🐦' },
      { order_index: 4, question_text: '🐠', question_type: 'multiple_choice', question_category: 'literal', points: 1, difficulty_score: 1, time_estimate: 30, options: ['Dog', 'Bird', 'Fish'], correct_answer: 'Fish', image_url: '🐠' },
    ]
  },
  {
    title: 'Simple Sentences - Level 2',
    description: 'Students read simple sentences and answer basic yes/no questions about them.',
    story_theme: 'Daily Routines',
    difficulty_level: 2,
    autism_focus_areas: ['literal', 'vocabulary', 'sequence'],
    recommended_age_min: 8,
    recommended_age_max: 10,
    pages: [
      {
        page_number: 1,
        page_text: 'The boy eats breakfast. He drinks juice. He puts on his shoes.',
        image_url: '/images/activities/morning-routine.png',
        image_description: 'A boy having breakfast and getting ready for school',
      },
      {
        page_number: 2,
        page_text: 'The boy goes to school. He plays at recess. He learns to read.',
        image_url: '/images/activities/school-day.png',
        image_description: 'A boy at school, playing and learning',
      }
    ],
    questions: [
      { order_index: 1, question_text: 'Does the boy drink juice?', question_type: 'yes_no', question_category: 'literal', points: 1, difficulty_score: 2, time_estimate: 30, options: ['Yes', 'No'], correct_answer: 'Yes' },
      { order_index: 2, question_text: 'Does he eat breakfast first?', question_type: 'yes_no', question_category: 'sequence', points: 1, difficulty_score: 2, time_estimate: 30, options: ['Yes', 'No'], correct_answer: 'Yes' },
      { order_index: 3, question_text: 'What does he do at school?', question_type: 'multiple_choice', question_category: 'literal', points: 2, difficulty_score: 3, time_estimate: 45, options: ['Eats breakfast', 'Plays and learns', 'Sleeps'], correct_answer: 'Plays and learns' },
      { order_index: 4, question_text: 'Put in order: He ___ at school', question_type: 'multiple_choice', question_category: 'sequence', points: 2, difficulty_score: 3, time_estimate: 45, options: ['eats breakfast', 'plays at recess', 'learns to read'], correct_answer: 'plays at recess' },
    ]
  },
  {
    title: 'The Butterfly Story - Level 3',
    description: 'Students read a paragraph and answer questions about main ideas and details.',
    story_theme: 'Nature & Growth',
    difficulty_level: 3,
    autism_focus_areas: ['literal', 'vocabulary', 'sequence', 'inference'],
    recommended_age_min: 11,
    recommended_age_max: 13,
    pages: [
      {
        page_number: 1,
        page_text: 'A tiny caterpillar crawls on a leaf. It eats the green leaf all day. The caterpillar grows bigger and bigger. After many days, it feels tired and spins a cocoon around itself.',
        image_url: '/images/activities/butterfly-lifecycle-1.png',
        image_description: 'A caterpillar on a leaf and building a cocoon',
      },
      {
        page_number: 2,
        page_text: 'Inside the cocoon, something amazing happens! The caterpillar changes into a butterfly. This change is called metamorphosis. After a few weeks, the butterfly pushes out of the cocoon. It has beautiful, colorful wings.',
        image_url: '/images/activities/butterfly-lifecycle-2.png',
        image_description: 'A butterfly emerging from a cocoon with colorful wings',
      }
    ],
    questions: [
      { order_index: 1, question_text: 'What does the caterpillar eat?', question_type: 'multiple_choice', question_category: 'literal', points: 1, difficulty_score: 4, time_estimate: 30, options: ['Flowers', 'Leaves', 'Insects', 'Dirt'], correct_answer: 'Leaves' },
      { order_index: 2, question_text: 'What is the process called when a caterpillar becomes a butterfly?', question_type: 'short_answer', question_category: 'vocabulary', points: 2, difficulty_score: 5, time_estimate: 45, correct_answer: 'metamorphosis' },
      { order_index: 3, question_text: 'Why do you think the caterpillar spins a cocoon?', question_type: 'multiple_choice', question_category: 'inference', points: 2, difficulty_score: 6, time_estimate: 60, options: ['To hide from predators', 'To keep warm while changing', 'To store food', 'To rest during change'], correct_answer: 'To keep warm while changing' },
      { order_index: 4, question_text: 'Put these in the correct order: 1) Caterpillar eats, 2) Butterfly emerges, 3) Caterpillar makes cocoon', question_type: 'multiple_choice', question_category: 'sequence', points: 2, difficulty_score: 5, time_estimate: 60, options: ['1, 3, 2', '2, 1, 3', '1, 2, 3', '3, 1, 2'], correct_answer: '1, 3, 2' },
      { order_index: 5, question_text: 'How long does the butterfly stay in the cocoon?', question_type: 'short_answer', question_category: 'literal', points: 1, difficulty_score: 4, time_estimate: 30, correct_answer: 'a few weeks' },
    ]
  },
  {
    title: 'Space Exploration - Level 4',
    description: 'Students read about space and answer inference questions, predict outcomes, and explain reasoning.',
    story_theme: 'Space & Science',
    difficulty_level: 4,
    autism_focus_areas: ['literal', 'inference', 'vocabulary', 'sequence', 'emotion'],
    recommended_age_min: 14,
    recommended_age_max: 18,
    pages: [
      {
        page_number: 1,
        page_text: 'The Moon is Earth\'s closest neighbor in space. It orbits Earth about once every 27 days. The Moon has no atmosphere, which means there is no air to breathe or weather like rain and wind. However, the Moon is covered with impact craters from meteorites and asteroids that have crashed into it over billions of years.',
        image_url: '/images/activities/moon.png',
        image_description: 'The Moon showing craters and surface features',
      },
      {
        page_number: 2,
        page_text: 'In 1969, astronaut Neil Armstrong became the first human to walk on the Moon during the Apollo 11 mission. Walking on the Moon was dangerous because of the harsh environment. Astronauts wore special suits to protect them from extreme temperatures, which range from 127°C during the day to -173°C at night. The Moon\'s gravity is much weaker than Earth\'s—only about 1/6 as strong—which is why astronauts could bounce around so easily.',
        image_url: '/images/activities/moon-landing.png',
        image_description: 'An astronaut in a space suit on the Moon',
      }
    ],
    questions: [
      { order_index: 1, question_text: 'How long does it take the Moon to orbit Earth?', question_type: 'short_answer', question_category: 'literal', points: 1, difficulty_score: 5, time_estimate: 30, correct_answer: '27 days' },
      { order_index: 2, question_text: 'Why do you think astronauts need special suits on the Moon?', question_type: 'multiple_choice', question_category: 'inference', points: 2, difficulty_score: 7, time_estimate: 60, options: ['To look official', 'To protect from extreme temperatures and lack of air', 'To communicate better', 'To store food'], correct_answer: 'To protect from extreme temperatures and lack of air' },
      { order_index: 3, question_text: 'Which statement best explains why astronauts can bounce on the Moon?', question_type: 'multiple_choice', question_category: 'inference', points: 2, difficulty_score: 7, time_estimate: 60, options: ['The Moon has more gravity than Earth', 'The Moon\'s gravity is weaker than Earth\'s', 'There is no gravity on the Moon', 'The suits are made of bouncy material'], correct_answer: 'The Moon\'s gravity is weaker than Earth\'s' },
      { order_index: 4, question_text: 'What created the craters on the Moon?', question_type: 'short_answer', question_category: 'literal', points: 1, difficulty_score: 5, time_estimate: 30, correct_answer: 'meteorites and asteroids' },
      { order_index: 5, question_text: 'How would you feel walking on the Moon for the first time? Why?', question_type: 'multiple_choice', question_category: 'emotion', points: 2, difficulty_score: 8, time_estimate: 75, options: ['Scared because it\'s dangerous', 'Excited by the new experience and achievement', 'Bored because there\'s nothing to do', 'Confused about the location'], correct_answer: 'Excited by the new experience and achievement' },
    ]
  },
];

async function runSeeds() {
  const client = await pool.connect();
  try {
    // Note: These assessments are created without a specific teacher_id
    // In a real scenario, you would assign them to an admin/demo teacher
    // or update them after creation
    
    console.log('[Seed Assessments] Creating template assessments...');
    
    for (const assessmentData of assessmentsData) {
      try {
        // Create assessment (without teacher_id initially)
        const assessmentRes = await client.query(
          `INSERT INTO assessments 
           (title, description, story_theme, difficulty_level, autism_focus_areas, 
            recommended_age_min, recommended_age_max, is_published, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW(), NOW())
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [
            assessmentData.title,
            assessmentData.description,
            assessmentData.story_theme,
            assessmentData.difficulty_level,
            JSON.stringify(assessmentData.autism_focus_areas),
            assessmentData.recommended_age_min,
            assessmentData.recommended_age_max,
          ]
        );

        if (assessmentData.pages && assessmentRes.rows.length > 0) {
          const assessmentId = assessmentRes.rows[0].id;

          // Add pages
          for (const page of assessmentData.pages) {
            await client.query(
              `INSERT INTO assessment_pages
               (assessment_id, page_number, page_text, image_url, image_description, audio_hint, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
              [assessmentId, page.page_number, page.page_text, page.image_url, page.image_description, page.audio_hint]
            );
          }

          // Add questions
          if (assessmentData.questions) {
            for (const question of assessmentData.questions) {
              await client.query(
                `INSERT INTO assessment_questions
                 (assessment_id, order_index, question_text, question_type, question_category, 
                  difficulty_score, time_estimate, options, correct_answer, points, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
                [
                  assessmentId,
                  question.order_index,
                  question.question_text,
                  question.question_type,
                  question.question_category,
                  question.difficulty_score,
                  question.time_estimate,
                  question.options ? JSON.stringify(question.options) : JSON.stringify(['Yes', 'No']),
                  JSON.stringify({ answer: question.correct_answer }),
                  question.points,
                ]
              );
            }
          }

          console.log(`[Seed Assessments] ✅ Created: "${assessmentData.title}" (Level ${assessmentData.difficulty_level})`);
        }
      } catch (err) {
        console.error(`[Seed Assessments] Error creating "${assessmentData.title}":`, err.message);
      }
    }

    console.log('[Seed Assessments] 🎉 Assessment seeding complete!');
  } catch (err) {
    console.error('[Seed Assessments] ❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeeds().catch((err) => {
  console.error(err);
  process.exit(1);
});
