// ============================================================
// StudentModePage — Activation point for ASD-optimized student mode
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import api from '../utils/api';
import { Play, AlertCircle } from 'lucide-react';

export default function StudentModePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setStudentMode, text_size } = useSettings();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Text scaling
  const sizeMap = { small: 0.8, medium: 1.0, large: 1.3 };
  const textScale = sizeMap[text_size] || 1.0;

  useEffect(() => {
    fetchAssignedAssessments();
  }, []);

  const fetchAssignedAssessments = async () => {
    try {
      setLoading(true);
      // Get assessments assigned to this student
      const res = await api.get('/assessments/assigned');
      if (res.data?.assessments) {
        setAssessments(res.data.assessments);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load assessments:', err);
      setError('Could not load assessments. Please try again.');
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = (assessmentId) => {
    setStudentMode(true);
    navigate(`/assessment/${assessmentId}`);
  };

  const isParentAccount = user?.role === 'parent';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 
            className="font-bold text-blue-600 dark:text-blue-400 mb-4"
            style={{ fontSize: `${40 * textScale}px` }}>
            📚 Let's Practice Reading!
          </h1>
          <p 
            className="text-slate-700 dark:text-slate-300 mb-6"
            style={{ fontSize: `${20 * textScale}px` }}>
            Choose an activity to get started.
          </p>
        </div>

        {/* Warning for parents */}
        {isParentAccount && (
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={28} className="text-blue-600 flex-shrink-0 mt-1" />
              <p 
                className="text-blue-700 dark:text-blue-300"
                style={{ fontSize: `${16 * textScale}px` }}>
                <strong>Parent Note:</strong> Your child will use this page to access and complete reading assessments in a simplified, distraction-free format designed for their needs.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div 
                className="w-12 h-12 border-4 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin"
                style={{ fontSize: `${18 * textScale}px` }}>
              </div>
            </div>
            <p 
              className="text-slate-600 dark:text-slate-400 mt-4"
              style={{ fontSize: `${18 * textScale}px` }}>
              Loading assessments...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 bg-rose-50 dark:bg-rose-900/30 border-2 border-rose-300 dark:border-rose-600 rounded-xl">
            <p 
              className="text-rose-700 dark:text-rose-300"
              style={{ fontSize: `${18 * textScale}px` }}>
              {error}
            </p>
          </div>
        )}

        {/* Assessments Grid */}
        {!loading && assessments.length > 0 && (
          <div className="grid grid-cols-1 gap-6 mb-12">
            {assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="p-6 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-2xl hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 
                      className="font-bold text-blue-700 dark:text-blue-300 mb-2"
                      style={{ fontSize: `${26 * textScale}px` }}>
                      {assessment.title}
                    </h2>
                    {assessment.story_theme && (
                      <p 
                        className="text-slate-600 dark:text-slate-400"
                        style={{ fontSize: `${16 * textScale}px` }}>
                        Theme: {assessment.story_theme}
                      </p>
                    )}
                    <p 
                      className="text-slate-600 dark:text-slate-400 mt-2"
                      style={{ fontSize: `${14 * textScale}px` }}>
                      {assessment.question_count || 'Multiple'} questions
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartAssessment(assessment.id)}
                    className="flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-600 whitespace-nowrap"
                    style={{ fontSize: `${18 * textScale}px` }}>
                    <Play size={24} />
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Assessments State */}
        {!loading && assessments.length === 0 && !error && (
          <div className="text-center py-12 p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p 
              className="text-slate-600 dark:text-slate-400"
              style={{ fontSize: `${20 * textScale}px` }}>
              No assessments available yet.
            </p>
            {isParentAccount && (
              <p 
                className="text-slate-600 dark:text-slate-400 mt-3"
                style={{ fontSize: `${16 * textScale}px` }}>
                Please ask your child's teacher to assign activities.
              </p>
            )}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            style={{ fontSize: `${16 * textScale}px` }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
