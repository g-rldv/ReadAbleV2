import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function ParentChildDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingSession, setStartingSession] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [childRes, assessmentsRes] = await Promise.all([
          api.get(`/parent/children/${id}`),
          api.get('/assessments'),
        ]);

        setChild(childRes.data.child);
        setSessions(childRes.data.sessions || []);
        setAssessments(assessmentsRes.data.assessments || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Failed to load child details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleStartSession = async (assessmentId) => {
    setStartingSession(assessmentId);
    try {
      const res = await api.post('/sessions/start', {
        assessment_id: assessmentId,
        child_id: id,
      });
      navigate(`/student-mode/${res.data.session.id}`);
    } catch (err) {
      console.error('Failed to start session:', err);
      setError(err.message || 'Failed to start session');
      setStartingSession(null);
    }
  };

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

  const getSessionStatus = (session) => {
    if (session.status === 'completed') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Completed</span>;
    }
    if (session.status === 'in_progress') {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">In Progress</span>;
    }
    return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">{session.status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading child details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <p className="text-yellow-700\">Child not found</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/parent/children')}
        className="text-sky hover:text-sky/80 font-medium mb-4"
      >
        ← Back to Children
      </button>

      {/* Child Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          {child.first_name} {child.last_name}
        </h1>
        {child.teacher_first_name && (
          <p className="text-slate-600 mt-2">
            Teacher: {child.teacher_first_name} {child.teacher_last_name}
          </p>
        )}
      </div>

      {/* Available Assessments */}
      {assessments.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4\">Available Assessments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-sky/5 transition-colors"
              >
                <h3 className="font-semibold text-slate-900">{assessment.title}</h3>
                {assessment.description && (
                  <p className="text-sm text-slate-600 mt-2">{assessment.description}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleStartSession(assessment.id)}
                    disabled={startingSession === assessment.id}
                    className="px-3 py-2 bg-sky text-white rounded hover:bg-sky/80 disabled:bg-slate-400 font-medium text-sm"
                  >
                    {startingSession === assessment.id ? 'Starting...' : 'Start Assessment'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4\">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-slate-600 text-center py-6">No sessions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-2 font-semibold text-slate-900">Assessment</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-900">Started</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-900">Status</th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-900">Score</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-900 font-medium">
                      {session.assessment_title || 'Assessment'}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {formatDate(session.started_at)}
                    </td>
                    <td className="px-4 py-2">
                      {getSessionStatus(session)}
                    </td>
                    <td className="px-4 py-2 text-slate-900 font-medium">
                      {session.percentage ? `${session.percentage}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
