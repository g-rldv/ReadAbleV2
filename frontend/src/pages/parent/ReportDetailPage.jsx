import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        setReport(res.data.report);
      } catch (err) {
        console.error('Failed to fetch report:', err);
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button
          onClick={() => navigate('/parent/reports')}
          className="text-sky hover:text-sky/80 font-medium mb-4"
        >
          ← Back to Reports
        </button>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <button
          onClick={() => navigate('/parent/reports')}
          className="text-sky hover:text-sky/80 font-medium mb-4"
        >
          ← Back to Reports
        </button>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-700">Report not found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/parent/reports')}
        className="text-sky hover:text-sky/80 font-medium mb-4"
      >
        ← Back to Reports
      </button>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{report.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <div>
              <span className="font-semibold">Child:</span> {report.child_first_name} {report.child_last_name}
            </div>
            <div>
              <span className="font-semibold">Teacher:</span> {report.teacher_first_name} {report.teacher_last_name}
            </div>
            <div>
              <span className="font-semibold">Date:</span> {formatDate(report.sent_at)}
            </div>
          </div>
        </div>

        {/* Summary */}
        {report.summary && (
          <div className="mb-6 pb-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Summary</h2>
            <div className="bg-sky/5 rounded-lg p-4 text-slate-800 whitespace-pre-wrap">
              {report.summary}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Recommendations</h2>
            <div className="bg-green-50 rounded-lg p-4 text-slate-800 whitespace-pre-wrap">
              {report.recommendations}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Report sent on {formatDate(report.sent_at)}
            {report.read_at && ` • Read on ${formatDate(report.read_at)}`}
          </p>
        </div>
      </div>
    </div>
  );
}
