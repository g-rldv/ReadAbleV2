// ============================================================
// ChildrenListPage — Teacher views students assigned via classrooms
// Add students through the Classrooms feature (code-based joining)
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

export default function ChildrenListPage() {
  const [children, setChildren] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [childrenRes, classroomsRes] = await Promise.all([
          api.get('/teacher/children'),
          api.get('/classrooms'),
        ]);
        setChildren(childrenRes.data.children || []);
        setClassrooms(classroomsRes.data.classrooms || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="mt-1 text-sm text-red-600 hover:text-red-700 underline">
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Students</h1>
        <p className="text-slate-500 mt-1">
          Students join your class by entering a classroom code. Create or manage classrooms below.
        </p>
      </div>

      {/* How students join banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3 items-start">
        <span className="text-2xl flex-shrink-0">💡</span>
        <div className="text-sm text-blue-800">
          <strong>How to add students:</strong> Go to{' '}
          <Link to="/teacher/classrooms" className="underline font-semibold hover:text-blue-900">
            Classrooms
          </Link>{' '}
          → create a classroom → share the 6-character code with parents → approve their join requests.
          Students will then appear here once their parent has been approved.
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-slate-500">Loading students…</div>
        </div>
      ) : children.length === 0 ? (
        <EmptyState classrooms={classrooms} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <Users size={18} />
              <span className="font-semibold">{children.length} student{children.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Age</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Parent</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">ASD Notes</th>
                <th className="px-6 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {children.map((child) => (
                <tr key={child.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {child.first_name} {child.last_name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{child.age || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {child.parent_name || child.parent_first_name
                      ? `${child.parent_first_name || ''} ${child.parent_last_name || ''}`.trim()
                      : <span className="text-slate-400 italic">Not linked</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {child.asd_notes
                      ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Has notes</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/teacher/children/${child.id}`}
                      className="inline-flex items-center gap-1.5 text-sky hover:text-sky/80 font-medium text-sm transition-colors"
                    >
                      View <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState({ classrooms }) {
  return (
    <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
      <Users size={48} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-xl font-semibold text-slate-600 mb-2">No students yet</h2>
      <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
        {classrooms.length === 0
          ? "Create a classroom first, then share the code with parents so their students can join."
          : "Share your classroom code with parents. Once they join and you approve them, their students will appear here."}
      </p>
      <Link
        to="/teacher/classrooms"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky text-white rounded-lg font-medium hover:bg-sky/80 transition-colors"
      >
        <BookOpen size={16} />
        {classrooms.length === 0 ? 'Create a Classroom' : 'Manage Classrooms'}
      </Link>
    </div>
  );
}