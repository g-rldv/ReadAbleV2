import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function ParentDashboard() {
  const [stats, setStats] = useState({
    childrenCount: 0,
    pendingReports: 0,
    enrolledClassrooms: 0,
  });
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [childrenRes, reportsRes, classroomsRes] = await Promise.all([
          api.get('/parent/children'),
          api.get('/reports'),
          api.get('/classrooms/my'),
        ]);

        const childrenList = childrenRes.data.children || [];
        const reports = reportsRes.data.reports || [];
        const unreadReports = reports.filter(r => !r.is_read).length;

        setChildren(childrenList);
        const classrooms = classroomsRes.data.classrooms || [];
        const approvedCount = classrooms.filter(c => c.status === 'approved').length;
        setStats({
          childrenCount: childrenList.length,
          pendingReports: unreadReports,
          enrolledClassrooms: approvedCount,
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
      <h1 className="text-3xl font-bold mb-2">Welcome to ReadAble</h1>
      <p className="text-slate-600 mb-6">Monitor your child's reading assessments and launch student sessions.</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="text-slate-600 text-sm font-medium">Your Children</div>
          <div className="text-4xl font-bold text-sky mt-2">{stats.childrenCount}</div>
          <p className="text-slate-500 text-xs mt-2">Registered students</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="text-slate-600 text-sm font-medium">Pending Reports</div>
          <div className="text-4xl font-bold text-orange-500 mt-2">{stats.pendingReports}</div>
          <p className="text-slate-500 text-xs mt-2">New reports to read</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="text-slate-600 text-sm font-medium">Enrolled Classrooms</div>
          <div className="text-4xl font-bold text-green-500 mt-2">{stats.enrolledClassrooms || 0}</div>
          <p className="text-slate-500 text-xs mt-2">Approved classrooms</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            to="/parent/children"
            className="inline-block px-4 py-2 bg-sky text-white rounded hover:bg-sky/80 font-medium"
          >
            View Children
          </Link>
          <Link
            to="/parent/reports"
            className="inline-block px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 font-medium"
          >
            View Reports
          </Link>
          <Link
            to="/student-mode"
            className="inline-block px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 font-medium"
          >
            Student Mode
          </Link>
        </div>
      </div>

      {/* Children Overview */}
      {children.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Your Children</h2>
          <div className="space-y-3">
            {children.map((child) => (
              <Link
                key={child.id}
                to={`/parent/children/${child.id}`}
                className="flex items-center justify-between p-3 border border-slate-200 rounded hover:bg-sky/5 transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {child.first_name} {child.last_name}
                  </div>
                  {child.teacher_first_name && (
                    <div className="text-sm text-slate-600">
                      Teacher: {child.teacher_first_name} {child.teacher_last_name}
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