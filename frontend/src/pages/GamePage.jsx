import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, ArrowRight, Check, BookOpen, ClipboardList, Play, Star } from 'lucide-react';

const C = {
  white: '#FFFFFF',
  border: '#DDD8F2',
  shadowSm: '0 1px 8px rgba(80,60,160,0.07)',
  shadowMd: '0 4px 24px rgba(80,60,160,0.10)',
  student: {
    pageBg:      '#EBF0FF',
    border:      '#B8C8F0',
    accent:      '#4058C0',
    accentLight: '#D0D8F8',
    textDark:    '#1A2870',
    iconBg:      '#D0D8F8',
  },
  textPrimary:   '#28264A',
  textSecondary: '#6A6898',
};

export default function GamePage() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [pages, setPages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentStep, setCurrentStep] = useState(0); // 0: intro, 1..N: pages, N+1..M: questions, M+1: outro
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch session
        const sessionRes = await api.get(`/sessions/${sessionId}`);
        setSession(sessionRes.data.session);
        
        // 2. Fetch assessment details
        const assessmentRes = await api.get(`/assessments/${sessionRes.data.session.assessment_id}`);
        setAssessment(assessmentRes.data.assessment);
        setPages(assessmentRes.data.pages || []);
        setQuestions(assessmentRes.data.questions || []);
        
        // Pre-fill answers if any exist
        const savedAnswers = {};
        (sessionRes.data.answers || []).forEach(ans => {
          if (ans.given_answer !== null) {
            try {
              savedAnswers[ans.question_id] = JSON.parse(ans.given_answer);
            } catch (e) {
              savedAnswers[ans.question_id] = ans.given_answer;
            }
          }
        });
        setAnswers(savedAnswers);
        
      } catch (err) {
        console.error('Failed to load session data:', err);
        setError('Failed to load the activity. Please ask your parent for help.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSaveAnswer = async (questionId) => {
    try {
      await api.post(`/sessions/${sessionId}/answer`, {
        question_id: questionId,
        given_answer: answers[questionId],
        time_spent_seconds: 10, // dummy time for now
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const handleNext = async () => {
    const totalSteps = 1 + pages.length + questions.length;
    
    // If we are leaving a question step, save the answer
    const currentQuestionIdx = currentStep - 1 - pages.length;
    if (currentQuestionIdx >= 0 && currentQuestionIdx < questions.length) {
      const q = questions[currentQuestionIdx];
      if (answers[q.id] !== undefined) {
        await handleSaveAnswer(q.id);
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete session
      try {
        setSubmitting(true);
        await api.post(`/sessions/${sessionId}/complete`);
        setCurrentStep(currentStep + 1); // Go to outro
      } catch (err) {
        console.error('Failed to complete session:', err);
        setError('Failed to save your results. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-screen flex flex-col items-center justify-center bg-student-pageBg" style={{ background: C.student.pageBg, height: '100vh' }}>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: C.student.textDark }}>Loading your activity...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-screen flex flex-col items-center justify-center bg-student-pageBg" style={{ background: C.student.pageBg, height: '100vh' }}>
        <div style={{ maxWidth: 400, textAlign: 'center', background: '#FFF', padding: 30, borderRadius: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#C03030', marginBottom: 10 }}>Oops!</div>
          <p style={{ color: C.textSecondary }}>{error}</p>
          <button onClick={() => navigate('/parent/dashboard')} style={{ marginTop: 20, padding: '10px 20px', background: C.student.accent, color: '#FFF', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalPages = pages.length;
  const totalQuestions = questions.length;
  const totalSteps = 1 + totalPages + totalQuestions; // intro + pages + questions

  // Determine what to render based on currentStep
  let content = null;
  let stepTitle = "";

  if (currentStep === 0) {
    stepTitle = "Get Ready!";
    content = (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: C.student.iconBg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <BookOpen size={40} style={{ color: C.student.accent }} />
        </div>
        <h2 style={{ fontFamily: '"Fredoka One", cursive', fontSize: 32, color: C.student.textDark, marginBottom: 10 }}>
          {assessment?.title}
        </h2>
        <p style={{ fontSize: 18, color: C.textSecondary, marginBottom: 30 }}>
          {assessment?.description}
        </p>
        <button onClick={handleNext} style={{ padding: '15px 40px', fontSize: 20, fontWeight: 'bold', background: C.student.accent, color: '#FFF', borderRadius: 15, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <Play size={20} /> Start
        </button>
      </div>
    );
  } else if (currentStep <= totalPages) {
    const page = pages[currentStep - 1];
    stepTitle = `Story: Page ${currentStep} of ${totalPages}`;
    content = (
      <div>
        {page.image_url && (
          <img src={page.image_url} alt={page.image_description || "Story illustration"} style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 15, marginBottom: 20 }} />
        )}
        <div style={{ fontSize: 24, color: C.textPrimary, lineHeight: 1.6, background: '#F8FAF4', padding: 20, borderRadius: 15, border: `1px solid ${C.border}` }}>
          {page.page_text}
        </div>
      </div>
    );
  } else if (currentStep <= totalPages + totalQuestions) {
    const questionIdx = currentStep - 1 - totalPages;
    const question = questions[questionIdx];
    stepTitle = `Question ${questionIdx + 1} of ${totalQuestions}`;
    
    let options = [];
    try {
      options = typeof question.options === 'string' ? JSON.parse(question.options) : (question.options || []);
    } catch (e) {
      options = [];
    }

    content = (
      <div>
        <div style={{ fontSize: 22, fontWeight: 'bold', color: C.student.textDark, marginBottom: 20, background: '#F0F4FF', padding: 15, borderRadius: 10 }}>
          {question.question_text}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((option, idx) => {
            const isSelected = answers[question.id] === option;
            return (
              <button
                key={idx}
                onClick={() => handleAnswerChange(question.id, option)}
                style={{
                  padding: '16px 20px',
                  fontSize: 18,
                  textAlign: 'left',
                  background: isSelected ? C.student.accentLight : '#FFF',
                  border: `2px solid ${isSelected ? C.student.accent : C.border}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}
              >
                <span>{option}</span>
                {isSelected && <Check size={20} style={{ color: C.student.accent }} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  } else {
    // Outro
    stepTitle = "All Done!";
    content = (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: '#E6F4EA', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Star size={40} style={{ color: '#137333' }} />
        </div>
        <h2 style={{ fontFamily: '"Fredoka One", cursive', fontSize: 32, color: C.student.textDark, marginBottom: 10 }}>
          Great Job!
        </h2>
        <p style={{ fontSize: 18, color: C.textSecondary, marginBottom: 30 }}>
          You have finished the activity. You can close this now.
        </p>
        <button onClick={() => navigate('/parent/dashboard')} style={{ padding: '12px 30px', fontSize: 16, fontWeight: 'bold', background: C.student.accent, color: '#FFF', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: C.student.pageBg, minHeight: '100vh', padding: '20px', fontFamily: '"Nunito", sans-serif' }}>
      <div style={{ maxWidth: 650, margin: '40px auto', background: '#FFF', borderRadius: 24, padding: '30px', boxShadow: C.shadowMd }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 15 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>
            {stepTitle}
          </span>
          {currentStep > 0 && currentStep <= totalSteps && (
            <div style={{ height: 6, background: '#E0E0E0', borderRadius: 3, width: 100 }}>
              <div style={{ height: '100%', background: C.student.accent, borderRadius: 3, width: `${(currentStep / totalSteps) * 100}%` }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ minHeight: 300 }}>
          {content}
        </div>

        {/* Footer Navigation */}
        {currentStep > 0 && currentStep <= totalSteps && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                background: '#FFF', color: C.textSecondary, cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                opacity: currentStep === 1 ? 0.5 : 1,
                fontSize: 14, fontWeight: 700,
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={submitting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: C.student.accent, color: '#FFF', cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 700,
              }}
            >
              {submitting ? 'Saving...' : currentStep === totalSteps ? 'Finish' : 'Next'} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
