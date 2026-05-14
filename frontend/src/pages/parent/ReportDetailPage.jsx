import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { ArrowLeft, Download, Share2, TrendingUp, BookOpen, Zap } from 'lucide-react';

// Determine proficiency level color and label
function getProficiencyLevel(percentage) {
  if (percentage >= 80) {
    return { label: 'Mastery', color: '#6BCB77', bgColor: '#D4F4DD', textColor: '#006400' };
  } else if (percentage >= 60) {
    return { label: 'Proficient', color: '#4ECDC4', bgColor: '#D1F0EE', textColor: '#0B5B52' };
  } else if (percentage >= 40) {
    return { label: 'Developing', color: '#FFD93D', bgColor: '#FFF8DC', textColor: '#B8860B' };
  } else if (percentage > 0) {
    return { label: 'Emerging', color: '#FF6B6B', bgColor: '#FFE0E0', textColor: '#8B0000' };
  }
  return { label: 'Not Started', color: '#999', bgColor: '#F0F0F0', textColor: '#333' };
}

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

  const handleDownloadPDF = () => {
    // Simple print to PDF functionality
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/parent/reports')}
          className="flex items-center gap-2 text-sky hover:text-sky/80 font-medium mb-4">
          <ArrowLeft size={20} /> Back to Reports
        </button>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/parent/reports')}
          className="flex items-center gap-2 text-sky hover:text-sky/80 font-medium mb-4">
          <ArrowLeft size={20} /> Back to Reports
        </button>
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-700 font-semibold">Report not found</p>
        </div>
      </div>
    );
  }

  // Parse detailed breakdown if available
  let detailedData = {};
  if (report.detailed_breakdown) {
    try {
      detailedData = typeof report.detailed_breakdown === 'string' 
        ? JSON.parse(report.detailed_breakdown)
        : report.detailed_breakdown;
    } catch (e) {
      // Keep detailedData empty if parsing fails
    }
  }

  // Parse recommendations if available
  let recommendationsData = [];
  if (report.recommendations) {
    try {
      recommendationsData = typeof report.recommendations === 'string'
        ? JSON.parse(report.recommendations)
        : Array.isArray(report.recommendations) ? report.recommendations : [];
    } catch (e) {
      // If it's just plain text, convert to array
      if (typeof report.recommendations === 'string' && report.recommendations.length > 0) {
        recommendationsData = [{ title: 'Summary', description: report.recommendations, priority: 'medium' }];
      }
    }
  }

  const overallScore = detailedData.score || report.overall_score || 0;
  const proficiency = getProficiencyLevel(overallScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/parent/reports')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            <ArrowLeft size={20} /> Back to Reports
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              title="Download as PDF">
              <Download size={18} /> PDF
            </button>
          </div>
        </div>

        {/* Main Report Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8">
            <div className="mb-6">
              <p className="text-blue-100 text-sm mb-1">Assessment Report</p>
              <h1 className="text-4xl font-bold">{report.title}</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-blue-100 text-sm">
              <div>
                <p className="opacity-75">Child</p>
                <p className="font-semibold">{report.child_first_name} {report.child_last_name}</p>
              </div>
              <div>
                <p className="opacity-75">Teacher</p>
                <p className="font-semibold">{report.teacher_first_name} {report.teacher_last_name}</p>
              </div>
              <div>
                <p className="opacity-75">Sent Date</p>
                <p className="font-semibold">{formatDate(report.sent_at)}</p>
              </div>
              <div>
                <p className="opacity-75">Status</p>
                <p className="font-semibold">{report.is_read ? '✓ Read' : 'New'}</p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 space-y-8">
            {/* Score Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-center">
                <div style={{ backgroundColor: proficiency.bgColor }} className="w-48 h-48 rounded-full flex flex-col items-center justify-center border-4" style={{ borderColor: proficiency.color }}>
                  <div style={{ color: proficiency.textColor }} className="text-6xl font-bold">{overallScore}%</div>
                  <div style={{ color: proficiency.textColor }} className="text-xl font-semibold mt-2">{proficiency.label}</div>
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-blue-900 text-sm font-semibold">What This Means</p>
                  <p className="text-blue-800 mt-1 text-sm">
                    {proficiency.label === 'Mastery' && "Your child has demonstrated excellent understanding of the reading comprehension skills tested. Keep challenging them with more complex materials!"}
                    {proficiency.label === 'Proficient' && "Your child is showing good progress and understanding. With continued practice, they will reach mastery level."}
                    {proficiency.label === 'Developing' && "Your child is making progress but needs additional support in some areas. Regular practice will help improve their skills."}
                    {proficiency.label === 'Emerging' && "Your child is just beginning to develop these skills. More practice and support will help them make progress."}
                  </p>
                </div>

                {detailedData.attempts && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-700 font-semibold">Total Questions Answered</span>
                      <span className="text-slate-900 text-2xl font-bold">{detailedData.attempts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 font-semibold">Correct Answers</span>
                      <span className="text-green-600 text-2xl font-bold">{Math.round(detailedData.attempts * overallScore / 100)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary from Teacher */}
            {report.summary && (
              <div className="bg-amber-50 rounded-lg p-6 border-l-4 border-amber-500">
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-3">
                  <BookOpen size={24} className="text-amber-600" />
                  Teacher's Summary
                </h2>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{report.summary}</p>
              </div>
            )}

            {/* Recommendations for Parents */}
            {recommendationsData.length > 0 && (
              <div className="bg-emerald-50 rounded-lg p-6 border-l-4 border-emerald-500">
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
                  <Zap size={24} className="text-emerald-600" />
                  Recommendations for Home
                </h2>
                <div className="space-y-3">
                  {recommendationsData.map((rec, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-emerald-400">
                      <p className="font-semibold text-slate-900">{rec.title || rec.action || `Tip ${idx + 1}`}</p>
                      <p className="text-slate-700 mt-1 text-sm">{rec.description || rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-indigo-50 rounded-lg p-6 border-l-4 border-indigo-500">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
                <TrendingUp size={24} className="text-indigo-600" />
                What's Next
              </h2>
              <ul className="space-y-2 text-slate-800">
                <li className="flex gap-3">
                  <span className="text-indigo-600 font-bold">1.</span>
                  <span>Review this report with your child's teacher to discuss progress</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-600 font-bold">2.</span>
                  <span>Practice reading activities at home using recommended strategies</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-600 font-bold">3.</span>
                  <span>Attend the next check-in session to monitor progress</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-600 font-bold">4.</span>
                  <span>Keep communication open with the teacher about any concerns</span>
                </li>
              </ul>
            </div>

            {/* Contact Teacher */}
            <div className="bg-slate-100 rounded-lg p-6 text-center">
              <p className="text-slate-700 mb-3">Have questions about this report?</p>
              <p className="text-slate-600 text-sm">
                Contact {report.teacher_first_name} {report.teacher_last_name} to discuss your child's progress and next steps.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-600 text-sm">
          <p>This report was generated on {formatDate(report.sent_at)}</p>
          <p className="mt-1">ReadAble Assessment System for Reading Comprehension</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none; }
        }
      `}</style>
    </div>
  );
}
