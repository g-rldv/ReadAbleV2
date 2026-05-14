import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import { SkillBreakdownChart, ProgressionChart, ComparisonChart, DifficultyHeatmap } from '../../components/analytics/ChartComponents';
import { AlertCircle, TrendingUp, Users, Target, Award } from 'lucide-react';

export default function TeacherAnalyticsDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAnalytics, setStudentAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadDashboard();
    }
  }, [user?.id]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/analytics/dashboard/${user.id}`);
      setDashboardData(response.data);
      setError('');

      // Load first student's analytics if available
      if (response.data.students?.length > 0) {
        loadStudentAnalytics(response.data.students[0].id);
        setSelectedStudent(response.data.students[0]);
      }
    } catch (err) {
      setError('Failed to load analytics dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAnalytics = async (studentId) => {
    try {
      const analyticsRes = await api.get(`/api/analytics/student/${studentId}`);
      setStudentAnalytics(analyticsRes.data);

      const recommendationsRes = await api.get(`/api/analytics/recommendations/${studentId}`);
      setRecommendations(recommendationsRes.data.recommendations);
    } catch (err) {
      console.error('Failed to load student analytics:', err);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    loadStudentAnalytics(student.id);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center text-slate-500">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Class Analytics Dashboard</h1>
        <p className="text-slate-600 mt-2">Monitor student progress and identify learning needs</p>
      </div>

      {/* Class Overview Stats */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-slate-900">{dashboardData.total_students}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Average Score</p>
                <p className="text-3xl font-bold text-slate-900">{dashboardData.avg_score}%</p>
              </div>
              <Target className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">This Week</p>
                <p className="text-3xl font-bold text-slate-900">{dashboardData.this_week_attempts}</p>
                <p className="text-xs text-slate-500">attempts</p>
              </div>
              <TrendingUp className="text-orange-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Mastery (80%+)</p>
                <p className="text-3xl font-bold text-slate-900">{dashboardData.mastery_count}</p>
              </div>
              <Award className="text-purple-500" size={32} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Class Overview & Heatmap */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class Skill Breakdown */}
          {dashboardData?.class_skill_breakdown && (
            <div className="bg-white rounded-lg shadow p-6">
              <SkillBreakdownChart
                data={dashboardData.class_skill_breakdown}
                title="📊 Class Average - Skill Breakdown"
              />
            </div>
          )}

          {/* Difficulty Heatmap */}
          {dashboardData?.students && (
            <div className="bg-white rounded-lg shadow p-6">
              <DifficultyHeatmap
                students={dashboardData.students.map(s => ({
                  ...s,
                  sessions: dashboardData.students.flatMap(st =>
                    st.difficulty_progression || []
                  ),
                }))}
                title="🔥 Difficulty Level Mastery Heatmap"
              />
            </div>
          )}
        </div>

        {/* Right Column: Student List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">Students</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {dashboardData?.students?.length === 0 ? (
              <p className="text-slate-500 text-sm">No students yet</p>
            ) : (
              dashboardData?.students?.map(student => (
                <button
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedStudent?.id === student.id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-600">Age {student.age}</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{student.avg_score}%</span>
                  </div>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Level {student.current_level}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {student.attempts} attempts
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Student Detailed Analytics */}
      {selectedStudent && studentAnalytics && (
        <div className="space-y-6">
          <div className="border-t-2 border-slate-200 pt-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              📈 {selectedStudent.name}'s Detailed Analytics
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skill Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <SkillBreakdownChart
                  data={studentAnalytics.skill_breakdown}
                  title="Individual Skill Breakdown"
                />
              </div>

              {/* vs Class Average */}
              <div className="bg-white rounded-lg shadow p-6">
                <ComparisonChart
                  studentData={studentAnalytics.skill_breakdown}
                  classAverage={dashboardData?.class_skill_breakdown}
                  title="Performance vs Class Average"
                />
              </div>

              {/* Progress Over Time */}
              {studentAnalytics.difficulty_progression?.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <ProgressionChart
                    data={studentAnalytics.difficulty_progression}
                    title="Progress Over Time"
                  />
                </div>
              )}

              {/* Time Analysis */}
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">⏱️ Processing Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span className="text-slate-700">Avg Time Per Question</span>
                    <span className="font-bold text-slate-900">
                      {studentAnalytics.time_analysis.avg_time_per_question}s
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span className="text-slate-700">Estimated Time</span>
                    <span className="font-bold text-slate-900">
                      {studentAnalytics.time_analysis.avg_time_estimate}s
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span className="text-slate-700">Speed Ratio</span>
                    <span className="font-bold text-slate-900">
                      {studentAnalytics.time_analysis.processing_speed_ratio}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Attempt Analysis */}
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">🎯 Attempt Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span className="text-slate-700">First Try Success</span>
                    <span className="font-bold text-slate-900">
                      {studentAnalytics.attempt_analysis.first_try_percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span className="text-slate-700">Hints Used</span>
                    <span className="font-bold text-slate-900">
                      {studentAnalytics.attempt_analysis.hints_percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span className="text-slate-700">Total Questions</span>
                    <span className="font-bold text-slate-900">
                      {Object.values(studentAnalytics.skill_breakdown).reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Growth Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Strength Areas */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-green-700 mb-4">✅ Strength Areas</h3>
                {studentAnalytics.strength_areas?.length > 0 ? (
                  <div className="space-y-2">
                    {studentAnalytics.strength_areas.map(area => (
                      <div key={area.skill} className="p-3 bg-green-50 rounded-lg">
                        <div className="font-medium text-green-900">
                          {area.skill.charAt(0).toUpperCase() + area.skill.slice(1)}
                        </div>
                        <div className="text-sm text-green-700">{area.score}% - Excellent!</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No areas at 80%+ yet</p>
                )}
              </div>

              {/* Growth Areas */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-orange-700 mb-4">📈 Growth Areas</h3>
                {studentAnalytics.growth_areas?.length > 0 ? (
                  <div className="space-y-2">
                    {studentAnalytics.growth_areas.map(area => (
                      <div key={area.skill} className="p-3 bg-orange-50 rounded-lg">
                        <div className="font-medium text-orange-900">
                          {area.skill.charAt(0).toUpperCase() + area.skill.slice(1)}
                        </div>
                        <div className="text-sm text-orange-700">{area.score}% - Keep working!</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">Great job! No areas below 70%</p>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">💡 Recommendations</h3>
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        rec.priority === 'high'
                          ? 'bg-red-50 border-red-400'
                          : rec.priority === 'medium'
                          ? 'bg-yellow-50 border-yellow-400'
                          : 'bg-blue-50 border-blue-400'
                      }`}
                    >
                      <div className="font-semibold text-slate-900">{rec.title}</div>
                      <p className="text-sm text-slate-700 mt-1">{rec.description}</p>
                      <button className="mt-2 px-3 py-1 bg-slate-600 text-white text-xs rounded hover:bg-slate-700">
                        {rec.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
