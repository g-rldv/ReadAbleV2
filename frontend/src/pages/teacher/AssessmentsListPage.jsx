import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function AssessmentsListPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await api.get('/assessments');
        setAssessments(res.data.assessments || []);
      } catch (err) {
        console.error('Failed to fetch assessments:', err);
        setError(err.message || 'Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Assessments</h1>
          <p className="text-slate-600">Create and manage literacy assessments for your students.</p>
        </div>
        <Link
          to="/teacher/assessments/new"
          className="px-4 py-2 bg-sky text-white rounded hover:bg-sky/80 font-medium"
        >
          Create Assessment
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading assessments...</div>
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-slate-100 rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-600 mb-2">No assessments created yet.</p>
          <p className="text-slate-500 text-sm mb-4">Click "Create Assessment" to build your first assessment.</p>
          <Link
            to="/teacher/assessments/new"
            className="inline-block px-4 py-2 bg-sky text-white rounded hover:bg-sky/80 font-medium"
          >
            Create Assessment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {assessment.title}
                </h3>
                {assessment.description && (
                  <p className="text-sm text-slate-600">
                    {assessment.description}
                  </p>
                )}
              </div>

              <div className="text-xs text-slate-500 mb-4 space-y-1">
                <p>Theme: {assessment.story_theme || 'N/A'}</p>
                <p>Difficulty: {assessment.difficulty || 'N/A'}</p>
                <p>Created: {formatDate(assessment.created_at)}</p>
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/teacher/assessments/${assessment.id}/edit`}
                  className="flex-1 px-3 py-2 bg-sky text-white rounded hover:bg-sky/80 font-medium text-center text-sm"
                >
                  Edit
                </Link>
                <button
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium text-sm"
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
