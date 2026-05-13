import { Outlet, NavLink } from 'react-router-dom';

export default function TeacherLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="text-lg font-semibold">Teacher Dashboard</div>
          <nav className="flex items-center gap-3 text-sm">
            <NavLink to="/teacher/dashboard" className="text-slate-600 hover:text-sky">Home</NavLink>
            <NavLink to="/teacher/children" className="text-slate-600 hover:text-sky">Children</NavLink>
            <NavLink to="/teacher/assessments" className="text-slate-600 hover:text-sky">Assessments</NavLink>
            <NavLink to="/teacher/reports" className="text-slate-600 hover:text-sky">Reports</NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
