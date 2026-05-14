// ============================================================
// ClassroomsListPage — Teacher manages their classrooms
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import {
  Plus, Users, Copy, Check,
  BookOpen, Calendar, UserPlus,
} from 'lucide-react';

function ClassroomsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/classrooms');
      setClassrooms(res.data.classrooms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createClassroom = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/classrooms', { name: newName.trim() });
      setNewName('');
      setShowCreate(false);
      fetchClassrooms();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="p-6">Loading classrooms...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display text-gray-900 dark:text-white">My Classrooms</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-game bg-sky text-white flex items-center gap-2"
        >
          <Plus size={18} />
          Create Classroom
        </button>
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No classrooms yet</h2>
          <p className="text-gray-500 mb-4">Create your first classroom to start managing students.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-game bg-sky text-white"
          >
            Create Your First Classroom
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {classrooms.map((classroom) => (
            <div key={classroom.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{classroom.name}</h3>
                  <p className="text-sm text-gray-500">{classroom.member_count} members</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyCode(classroom.code)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    {copied === classroom.code ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                    {classroom.code}
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/classrooms/${classroom.id}`)}
                    className="btn-game bg-emerald-600 text-white flex items-center gap-2"
                  >
                    <Users size={16} />
                    Manage
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Created {new Date(classroom.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-display mb-4 text-gray-900 dark:text-white">Create Classroom</h2>
            <form onSubmit={createClassroom}>
              <input
                type="text"
                placeholder="Classroom name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 btn-game bg-sky text-white disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassroomsListPage;