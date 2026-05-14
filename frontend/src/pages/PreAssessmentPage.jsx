// ============================================================
// PreAssessmentPage - Initial assessment to determine student level
// Students answer a mix of questions from all 4 difficulty levels
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { AlertCircle, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';

export default function PreAssessmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { speak, settings } = useSettings();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  const isStudentMode = settings.student_mode;

  useEffect(() => {
    fetchPreAssessmentQuestions();
  }, []);

  const fetchPreAssessmentQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/pre-assessments/questions');
      if (res.data?.questions && res.data.questions.length > 0) {
        setQuestions(res.data.questions);
        setError(null);
      } else {
        setError('No pre-assessment questions available. Please ask your teacher to publish assessments.');
        setQuestions([]);
      }
    } catch (err) {
      console.error('Failed to fetch pre-assessment:', err);
      setError('Failed to load pre-assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedOption(answer);
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIdx];
    if (!answers[currentQuestion.id]) {
      alert('Please select an answer before proceeding.');
      return;
    }

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedOption(null);
    } else {
      submitPreAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
      const prevQuestion = questions[currentQuestionIdx - 1];
      setSelectedOption(answers[prevQuestion.id] || null);
    }
  };

  const submitPreAssessment = async () => {
    try {
      setSubmitted(true);

      // Prepare answers with correctness check
      const answerData = questions.map(q => ({
        question_id: q.id,
        given_answer: answers[q.id],
        is_correct: answers[q.id] === q.correct_answer
      }));

      const res = await api.post('/api/pre-assessments/recommend-level', {
        answers: answerData
      });

      setResult(res.data);
      if (settings.tts_enabled) {
        const text = `Congratulations! Your recommended level is ${res.data.recommended_level}. Your overall score is ${res.data.overall_score}%.`;
        speak(text);
      }
    } catch (err) {
      console.error('Failed to submit pre-assessment:', err);
      alert('Failed to submit pre-assessment. Please try again.');
      setSubmitted(false);
    }
  };

  const handleReset = () => {
    setCurrentQuestionIdx(0);
    setAnswers({});
    setResult(null);
    setSelectedOption(null);
    setSubmitted(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="inline-block w-10 h-10 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600">Loading pre-assessment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
          <div>
            <p className="font-semibold text-red-800">Cannot Load Pre-Assessment</p>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-slate-600">No questions available</p>
      </div>
    );
  }

  // Results view
  if (submitted && result) {
    const proficiencyLevels = {
      1: { label: 'Foundation', description: 'Perfect for starting with basic reading skills' },
      2: { label: 'Elementary', description: 'Ready for simple stories and sentences' },
      3: { label: 'Intermediate', description: 'Prepared for more complex narratives' },
      4: { label: 'Advanced', description: 'Ready for challenging and detailed stories' }
    };

    const level = result.recommended_level;
    const proficiency = proficiencyLevels[level];

    return (
      <div className={`min-h-screen ${isStudentMode ? 'bg-white' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} py-8 px-4`}>
        <div className={`max-w-2xl mx-auto`}>
          {/* Results Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 text-center">
              <CheckCircle size={48} className="mx-auto mb-4" />
              <h1 className={`font-bold mb-2 ${isStudentMode ? 'text-4xl' : 'text-3xl'}`}>
                Pre-Assessment Complete!
              </h1>
              <p className="text-green-100 text-lg">Your reading level has been determined.</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className={`${isStudentMode ? 'text-6xl' : 'text-5xl'} font-bold text-blue-600 mb-2`}>
                  {result.overall_score}%
                </div>
                <p className={`text-slate-600 ${isStudentMode ? 'text-xl' : 'text-lg'}`}>
                  Overall Performance
                </p>
              </div>

              {/* Recommended Level */}
              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-300 text-center">
                <p className="text-blue-700 text-sm font-semibold mb-2">RECOMMENDED STARTING LEVEL</p>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className={`${isStudentMode ? 'text-5xl' : 'text-4xl'} font-bold text-blue-600`}>
                    {level}
                  </div>
                  <div>
                    <p className={`font-bold text-blue-800 ${isStudentMode ? 'text-2xl' : 'text-xl'}`}>
                      {proficiency.label}
                    </p>
                    <p className="text-blue-700 text-sm">{proficiency.description}</p>
                  </div>
                </div>
              </div>

              {/* Scores by Level */}
              <div className="bg-slate-50 rounded-lg p-6">
                <p className="font-bold text-slate-900 mb-4">Your Performance by Level:</p>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(lvl => (
                    <div key={lvl} className="flex items-center gap-4">
                      <span className="font-semibold text-slate-700 w-16">Level {lvl}:</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 flex items-center justify-end pr-2 text-xs font-bold text-white ${
                            lvl === level ? 'bg-blue-500' : lvl < level ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${result.scores_by_level[lvl]}%` }}>
                          {result.scores_by_level[lvl] > 10 && `${result.scores_by_level[lvl]}%`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-6 border-l-4 border-amber-400">
                  <p className="font-bold text-slate-900 mb-3">Recommendations for Your Teacher:</p>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-700">
                        <span className="font-bold text-amber-600">•</span>
                        <div>
                          <p className="font-semibold text-amber-900">{rec.title}</p>
                          <p className="text-sm text-amber-800">{rec.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center flex-wrap pt-4">
                <button
                  onClick={() => navigate('/parent/dashboard')}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                  style={{fontSize: isStudentMode ? '18px' : '16px', padding: isStudentMode ? '16px 24px' : undefined}}>
                  Go to Dashboard <ArrowRight size={20} />
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                  style={{fontSize: isStudentMode ? '18px' : '16px', padding: isStudentMode ? '16px 24px' : undefined}}>
                  <RotateCcw size={20} /> Try Again
                </button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center text-slate-600 text-sm">
            <p>Share these results with your teacher to get the best assessment for your reading level.</p>
          </div>
        </div>
      </div>
    );
  }

  // Question view
  const currentQuestion = questions[currentQuestionIdx];
  const progress = Math.round(((currentQuestionIdx + 1) / questions.length) * 100);
  const textScale = isStudentMode ? 1.3 : 1.0;

  return (
    <div className={`min-h-screen ${isStudentMode ? 'bg-white' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} py-8 px-4`}>
      <div className={`max-w-2xl mx-auto`}>
        {/* Header */}
        <div className={`mb-6 ${isStudentMode ? 'mb-12' : ''}`}>
          <h1 className={`font-bold text-slate-900 mb-2 ${isStudentMode ? 'text-4xl' : 'text-2xl'}`}>
            Reading Level Assessment
          </h1>
          <p className={`text-slate-600 ${isStudentMode ? 'text-xl' : ''}`}>
            Question {currentQuestionIdx + 1} of {questions.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 bg-slate-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}>
          </div>
        </div>

        {/* Question Card */}
        <div className={`bg-white rounded-lg shadow-lg p-6 ${isStudentMode ? 'p-8 mb-8' : 'mb-6'}`}>
          {/* Question Text */}
          <div className={`mb-6 ${isStudentMode ? 'mb-8' : ''}`}>
            <h2 className={`font-semibold text-slate-900 ${isStudentMode ? 'text-2xl' : 'text-lg'}`}>
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Answer Options */}
          <div className={`space-y-3 ${isStudentMode ? 'space-y-4' : ''}`}>
            {currentQuestion.options && currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedOption === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
                } ${isStudentMode ? 'p-6 text-xl' : ''}`}
                style={{ fontSize: isStudentMode ? '18px' : undefined }}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === option
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-slate-300'
                  }`}>
                    {selectedOption === option && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className={`flex gap-3 justify-between ${isStudentMode ? 'gap-4' : ''}`}>
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIdx === 0}
            className={`px-6 py-3 bg-slate-500 hover:bg-slate-600 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors ${
              isStudentMode ? 'px-8 py-4 text-lg' : ''
            }`}>
            ← Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!selectedOption}
            className={`px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors flex items-center gap-2 ${
              isStudentMode ? 'px-8 py-4 text-lg' : ''
            }`}>
            {currentQuestionIdx === questions.length - 1 ? (
              <>See Results</>
            ) : (
              <>Next →</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
