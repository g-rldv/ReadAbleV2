import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function TeacherReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports');
        setReports(res.data.reports || []);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
        setError(err.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Progress Reports</h1>
      <p className="text-slate-600 mb-6">Send progress reports to parents and review submitted summaries.</p>

      {reports.length === 0 ? (
        <div className="bg-slate-100 rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-600 mb-2">No reports created yet.</p>
          <p className="text-slate-500 text-sm">Reports will appear here as they are created.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Title</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Student</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Parent</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Sent</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{report.title}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {report.child_first_name} {report.child_last_name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {report.parent_first_name} {report.parent_last_name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(report.sent_at)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${report.is_read ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {report.is_read ? 'Read' : 'Unread'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
