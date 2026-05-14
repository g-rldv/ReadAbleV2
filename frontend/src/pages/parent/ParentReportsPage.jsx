import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function ParentReportsPage() {
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
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  const unreadReports = reports.filter(r => !r.is_read);
  const readReports = reports.filter(r => r.is_read);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Progress Reports</h1>
      <p className="text-slate-600 mb-6">Review reports created by teachers and track reading progress.</p>

      {reports.length === 0 ? (
        <div className="bg-slate-100 rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-600 mb-2">No reports available yet.</p>
          <p className="text-slate-500 text-sm">Your teachers will send reports here as they become available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {unreadReports.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-orange-600">New Reports ({unreadReports.length})</h2>
              <div className="space-y-2">
                {unreadReports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/parent/reports/${report.id}`}
                    className="block bg-orange-50 border-l-4 border-orange-400 p-4 rounded hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{report.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {report.child_first_name} {report.child_last_name} •{' '}
                          {report.teacher_first_name} {report.teacher_last_name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(report.sent_at)}
                        </p>
                      </div>
                      <div className="text-orange-600 font-medium text-sm">NEW</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {readReports.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Previous Reports</h2>
              <div className="space-y-2">
                {readReports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/parent/reports/${report.id}`}
                    className="block bg-white border border-slate-200 p-4 rounded hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{report.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {report.child_first_name} {report.child_last_name} •{' '}
                          {report.teacher_first_name} {report.teacher_last_name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(report.sent_at)}
                        </p>
                      </div>
                      <div className="text-slate-400">→</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
