import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    childrenCount: 0,
    assessmentsCount: 0,
    recentSessions: 0,
  });
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [childrenRes, assessmentsRes] = await Promise.all([
          api.get('/teacher/children'),
          api.get('/assessments'),
        ]);

        const childrenList = childrenRes.data.children || [];
        const assessmentsList = assessmentsRes.data.assessments || [];

        setChildren(childrenList);
        setStats({
          childrenCount: childrenList.length,
          assessmentsCount: assessmentsList.length,
          recentSessions: 0,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
      <p className="text-slate-600 mb-6">View your classes, active assessments, and recent sessions.</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="text-slate-600 text-sm font-medium">Your Students</div>
          <div className="text-4xl font-bold text-sky mt-2">{stats.childrenCount}</div>
          <p className="text-slate-500 text-xs mt-2">Active students</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="text-slate-600 text-sm font-medium">Assessments</div>
          <div className="text-4xl font-bold text-green-500 mt-2">{stats.assessmentsCount}</div>
          <p className="text-slate-500 text-xs mt-2">Created assessments</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="text-slate-600 text-sm font-medium">Active Sessions</div>
          <div className="text-4xl font-bold text-orange-500 mt-2">{stats.recentSessions}</div>
          <p className="text-slate-500 text-xs mt-2">In progress</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4 flex-wrap">
          <Link
            to="/teacher/analytics"
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium"
          >
            📊 View Analytics
          </Link>
          <Link
            to="/teacher/children"
            className="inline-block px-4 py-2 bg-sky text-white rounded hover:bg-sky/80 font-medium"
          >
            View Students
          </Link>
          <Link
            to="/teacher/assessments"
            className="inline-block px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 font-medium"
          >
            View Assessments
          </Link>
          <Link
            to="/teacher/assessment-builder"
            className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium"
          >
            Create Assessment
          </Link>
        </div>
      </div>

      {/* Recent Students */}
      {children.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Your Students</h2>
          <div className="space-y-3">
            {children.slice(0, 5).map((child) => (
              <Link
                key={child.id}
                to={`/teacher/children/${child.id}`}
                className="flex items-center justify-between p-3 border border-slate-200 rounded hover:bg-sky/5 transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {child.first_name} {child.last_name}
                  </div>
                  {child.parent_name && (
                    <div className="text-sm text-slate-600">
                      Parent: {child.parent_name}
                    </div>
                  )}
                </div>
                <div className="text-slate-600 hover:text-sky">→</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
