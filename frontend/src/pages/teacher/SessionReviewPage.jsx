import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function SessionReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/sessions/${id}`);
        setSession(res.data.session);
        setAnswers(res.data.answers || []);
      } catch (err) {
        console.error('Failed to fetch session:', err);
        setError(err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      multiple_choice: 'Multiple Choice',
      yes_no: 'Yes/No',
      picture_choice: 'Picture Choice',
      short_answer: 'Short Answer',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading session review...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button
          onClick={() => navigate('/teacher/children')}
          className="text-sky hover:text-sky/80 font-medium mb-4"
        >
          ← Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <button
          onClick={() => navigate('/teacher/children')}
          className="text-sky hover:text-sky/80 font-medium mb-4"
        >
          ← Back
        </button>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-700">Session not found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/teacher/children')}
        className="text-sky hover:text-sky/80 font-medium mb-4"
      >
        ← Back
      </button>

      {/* Session Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {session.assessment_title}
            </h1>
            <p className="text-slate-600">
              {session.child_first_name} {session.child_last_name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-sky">{session.percentage || 0}%</div>
            <p className="text-slate-600 text-sm">
              Score: {session.total_score || 0} / {session.max_score || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-slate-200 pt-4">
          <div>
            <span className="text-slate-600">Started:</span>
            <p className="font-medium text-slate-900">{formatDate(session.started_at)}</p>
          </div>
          <div>
            <span className="text-slate-600">Completed:</span>
            <p className="font-medium text-slate-900">
              {session.completed_at ? formatDate(session.completed_at) : 'Not completed'}
            </p>
          </div>
          <div>
            <span className="text-slate-600">Status:</span>
            <p className="font-medium text-slate-900 capitalize">{session.status}</p>
          </div>
          <div>
            <span className="text-slate-600">Time Spent:</span>
            <p className="font-medium text-slate-900">
              {Math.floor((session.time_spent_seconds || 0) / 60)} min
            </p>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Answer Review</h2>
        <div className="space-y-4">
          {answers.length === 0 ? (
            <p className="text-slate-600 text-center py-6">No answers recorded for this session.</p>
          ) : (
            answers.map((answer, index) => (
              <div
                key={answer.question_id}
                className={`border rounded-lg p-4 ${
                  answer.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-slate-900">Question {index + 1}</p>
                    <p className="text-sm text-slate-600">{getQuestionTypeLabel(answer.question_type)}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${
                      answer.is_correct ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {answer.is_correct ? '✔ Correct' : '✗ Incorrect'}
                    </div>
                    <p className="text-xs text-slate-600">
                      {answer.points_earned || 0} / {answer.points || 0} points
                    </p>
                  </div>
                </div>

                <div className="mb-2">
                  <p className="text-sm font-medium text-slate-700 mb-1">Question:</p>
                  <p className="text-slate-800">{answer.question_text}</p>
                </div>

                {answer.question_type !== 'short_answer' && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Correct Answer:</p>
                    <p className="text-slate-800 font-mono text-sm">
                      {typeof answer.correct_answer === 'string'
                        ? answer.correct_answer
                        : JSON.stringify(answer.correct_answer)}
                    </p>
                  </div>
                )}

                {answer.given_answer && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-slate-700 mb-1">Student's Answer:</p>
                    <p className="text-slate-800 font-mono text-sm">
                      {typeof answer.given_answer === 'string'
                        ? answer.given_answer
                        : JSON.stringify(answer.given_answer)}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
