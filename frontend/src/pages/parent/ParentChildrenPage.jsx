import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function ParentChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await api.get('/parent/children');
        setChildren(res.data.children || []);
      } catch (err) {
        console.error('Failed to fetch children:', err);
        setError(err.message || 'Failed to load children');
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading children...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Your Children</h1>
      <p className="text-slate-600 mb-6">Browse your children and manage sessions for each of them.</p>

      {children.length === 0 ? (
        <div className="bg-slate-100 rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-600 mb-2">No children registered yet.</p>
          <p className="text-slate-500 text-sm">Contact your teacher to add your children to the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <div
              key={child.id}
              className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900">
                  {child.first_name} {child.last_name}
                </h3>
                {child.teacher_first_name && (
                  <p className="text-sm text-slate-600 mt-1">
                    Teacher: {child.teacher_first_name} {child.teacher_last_name}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/parent/children/${child.id}`}
                  className="flex-1 px-3 py-2 bg-sky text-white rounded hover:bg-sky/80 font-medium text-center text-sm"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
