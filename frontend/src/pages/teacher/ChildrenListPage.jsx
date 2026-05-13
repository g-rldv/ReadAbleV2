import { Link } from 'react-router-dom';

export default function ChildrenListPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Children</h1>
          <p className="text-slate-600">Manage students assigned to your classes.</p>
        </div>
        <Link to="/teacher/children/new" className="btn-game bg-sky text-white">Add Child</Link>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-500">No child list implementation yet.</p>
      </div>
    </div>
  );
}
