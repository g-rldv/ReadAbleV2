import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function ChildDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/teacher/children/${id}`);
        setChild(res.data.child);
        setSessions(res.data.sessions || []);
        setReports(res.data.reports || []);
      } catch (err) {
        console.error('Failed to fetch child details:', err);
        setError(err.message || 'Failed to load child details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      <div>
        <button
          onClick={() => navigate('/teacher/children')}
          className="text-sky hover:text-sky/80 font-medium mb-4"
        >
          ← Back to Children
        </button>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div>
        <button
          onClick={() => navigate('/teacher/children')}
          className="text-sky hover:text-sky/80 font-medium mb-4"
        >
          ← Back to Children
        </button>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-700">Child not found</p>
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
        ← Back to Children
      </button>

      {/* Child Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          {child.first_name} {child.last_name}
        </h1>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-600">Age:</span>
            <p className="font-medium text-slate-900">{child.age}</p>
          </div>
          <div>
            <span className="text-slate-600">Gender:</span>
            <p className="font-medium text-slate-900">{child.gender || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-600">Parent:</span>
            <p className="font-medium text-slate-900">{child.parent_first_name || 'Not assigned'}</p>
          </div>
          <div>
            <span className="text-slate-600">Date of Birth:</span>
            <p className="font-medium text-slate-900">{formatDate(child.date_of_birth)}</p>
          </div>
        </div>
        {child.asd_notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">ASD Notes:</p>
            <p className="text-sm text-blue-800">{child.asd_notes}</p>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">Assessment Sessions</h2>
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

      {/* Reports */}
      {reports.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Reports</h2>
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{report.title}</p>
                  <p className="text-sm text-slate-600">{formatDate(report.sent_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
