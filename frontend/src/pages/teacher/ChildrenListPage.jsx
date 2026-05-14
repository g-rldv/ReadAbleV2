import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function ChildrenListPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    age: '',
    gender: '',
    asd_notes: '',
    parent_email: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchChildren = async () => {
    try {
      const res = await api.get('/teacher/children');
      setChildren(res.data.children || []);
    } catch (err) {
      console.error('Failed to fetch children:', err);
      setError(err.message || 'Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/teacher/children', formData);
      setFormData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        age: '',
        gender: '',
        asd_notes: '',
        parent_email: '',
      });
      setShowAddForm(false);
      await fetchChildren();
    } catch (err) {
      setError(err.message || 'Failed to add child');
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !showAddForm) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 text-sm text-red-600 hover:text-red-700"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-slate-600">Manage students assigned to your classes.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-sky text-white rounded hover:bg-sky/80 font-medium"
        >
          {showAddForm ? 'Cancel' : 'Add Student'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Student</h2>
          <form onSubmit={handleAddChild} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-sky"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-sky"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-sky"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="18"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-sky"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-sky"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                ASD Notes (Optional)
              </label>
              <textarea
                name="asd_notes"
                value={formData.asd_notes}
                onChange={handleInputChange}
                placeholder="Any notes about the student's ASD profile..."
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-sky h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Parent Email
              </label>
              <input
                type="email"
                name="parent_email"
                value={formData.parent_email}
                onChange={handleInputChange}
                placeholder="parent@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-sky"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-sky text-white rounded hover:bg-sky/80 disabled:bg-slate-400 font-medium"
              >
                {submitting ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading students...</div>
        </div>
      ) : children.length === 0 ? (
        <div className="bg-slate-100 rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-600 mb-2">No students added yet.</p>
          <p className="text-slate-500 text-sm">Click "Add Student" to add your first student.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Age</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Parent</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {children.map((child) => (
                <tr key={child.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {child.first_name} {child.last_name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{child.age}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {child.parent_name || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/teacher/children/${child.id}`}
                      className="text-sky hover:text-sky/80 font-medium"
                    >
                      View
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
