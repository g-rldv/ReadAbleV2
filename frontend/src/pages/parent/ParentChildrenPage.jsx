import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function ParentChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [asdNotes, setAsdNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState(null); // {type:'success'|'error', msg}

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

  const addChild = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    setAdding(true);
    try {
      const res = await api.post('/parent/children', {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob || null,
        gender: gender || null,
        asd_notes: asdNotes || null,
      });
      setChildren((prev) => [res.data.child, ...prev]);
      setFirstName(''); setLastName(''); setDob(''); setGender(''); setAsdNotes('');
    } catch (err) {
      console.error('Failed to add child:', err);
      const msg = err.response?.data?.error || 'Failed to add child';
      setError(msg);
      setFlash({ type: 'error', msg });
    } finally {
      setAdding(false);
    }
  };

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
      {flash && (
        <div className={`mb-4 p-3 rounded ${flash.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {flash.msg}
        </div>
      )}
      <p className="text-slate-600 mb-6">Browse your children and manage sessions for each of them.</p>

      {children.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-100 rounded-lg border border-slate-200 p-6">
            <p className="text-slate-600 mb-3">No children registered yet.</p>
            <p className="text-slate-500 text-sm mb-4">Add your child here so teachers can link them to classrooms.</p>
            <form onSubmit={addChild} className="space-y-3">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="w-full px-3 py-2 rounded border" />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="w-full px-3 py-2 rounded border" />
              <div className="flex gap-2">
                <input value={dob} onChange={(e) => setDob(e.target.value)} placeholder="YYYY-MM-DD" className="w-1/2 px-3 py-2 rounded border" />
                <input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Gender" className="w-1/2 px-3 py-2 rounded border" />
              </div>
              <textarea value={asdNotes} onChange={(e) => setAsdNotes(e.target.value)} placeholder="Notes (e.g. ASD support needs)" className="w-full px-3 py-2 rounded border" />
              <div>
                <button type="submit" disabled={adding} className="px-4 py-2 bg-sky text-white rounded">
                  {adding ? 'Adding…' : 'Add Child'}
                </button>
              </div>
            </form>
          </div>
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
