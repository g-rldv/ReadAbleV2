import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function TeacherLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="text-lg font-semibold">Teacher Dashboard</div>
          <nav className="flex items-center gap-6 text-sm">
            <NavLink to="/teacher/dashboard" className="text-slate-600 hover:text-sky hover:font-medium">Home</NavLink>
            <NavLink to="/teacher/children" className="text-slate-600 hover:text-sky hover:font-medium">Children</NavLink>
            <NavLink to="/teacher/assessments" className="text-slate-600 hover:text-sky hover:font-medium">Assessments</NavLink>
            <NavLink to="/teacher/reports" className="text-slate-600 hover:text-sky hover:font-medium">Reports</NavLink>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <span className="text-slate-600">{user?.first_name || user?.username}</span>
              <button
                onClick={handleLogout}
                className="rounded bg-sky px-3 py-1 text-white hover:bg-sky/80 font-medium"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
