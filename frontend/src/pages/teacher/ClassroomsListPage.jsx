// ============================================================
// ClassroomsListPage — Teacher creates and manages classrooms
// Parents join via a 6-character code shown here.
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Plus, Users, Copy, Check,
  BookOpen, ChevronRight, X, Bell,
} from 'lucide-react';

export default function ClassroomsListPage() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classrooms');
      setClassrooms(res.data.classrooms || []);
    } catch (err) {
      console.error('[Classrooms]', err);
    } finally {
      setLoading(false);
    }
  };

  const createClassroom = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/classrooms', { name: newName.trim() });
      setNewName('');
      setShowCreate(false);
      fetchClassrooms();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create classroom');
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalPending = classrooms.reduce((sum, c) => sum + (parseInt(c.pending_count) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-500">Loading classrooms…</div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">Classrooms</h1>
            {totalPending > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full animate-pulse">
                <Bell size={11} />
                {totalPending} pending
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1">
            Create classrooms and share the code with parents so their students can join.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-sky text-white rounded-lg hover:bg-sky/80 font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          New Classroom
        </button>
      </div>

      {/* ── How it works banner ────────────────────────────── */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
        <span className="text-2xl flex-shrink-0">💡</span>
        <div className="text-sm text-blue-800">
          <strong>How it works:</strong>
          <ol className="mt-1 list-decimal list-inside space-y-0.5 text-blue-700">
            <li>Create a classroom and get a unique 6-character code</li>
            <li>Share the code with parents (via email or verbally)</li>
            <li>Parents enter the code on their <em>Classroom</em> page to request access</li>
            <li>Click <strong>Manage</strong> to approve or reject their requests</li>
          </ol>
        </div>
      </div>

      {/* ── Create modal ───────────────────────────────────── */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-pop">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Create Classroom</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createClassroom} className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Classroom Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Room 3B — Reading Group"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-sky focus:border-sky mb-1"
                autoFocus
                maxLength={100}
                required
              />
              {createError && (
                <p className="text-red-600 text-xs mt-1 mb-3">{createError}</p>
              )}
              <p className="text-xs text-slate-400 mb-5">
                A unique 6-character join code will be generated automatically.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700
                             text-sm hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-sky text-white text-sm font-semibold
                             hover:bg-sky/80 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creating…' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────── */}
      {classrooms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">No classrooms yet</h2>
          <p className="text-slate-400 text-sm mb-6">
            Create your first classroom to start managing students.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-sky text-white rounded-lg font-medium hover:bg-sky/80 transition-colors"
          >
            Create Your First Classroom
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {classrooms.map((classroom) => {
            const memberCount  = parseInt(classroom.member_count)  || 0;
            const pendingCount = parseInt(classroom.pending_count) || 0;

            return (
              <div
                key={classroom.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900 truncate">{classroom.name}</h3>
                      {pendingCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700
                                         text-xs font-bold rounded-full">
                          <Bell size={10} />
                          {pendingCount} pending
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                        <Users size={14} />
                        {memberCount} approved member{memberCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">
                        Created {new Date(classroom.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Right: code chip + actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Code chip */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Code</span>
                      <span className="font-mono font-black text-slate-800 tracking-widest text-sm">
                        {classroom.code}
                      </span>
                      <button
                        onClick={() => copyCode(classroom.code)}
                        title="Copy code"
                        className="ml-1 p-0.5 rounded text-slate-400 hover:text-sky transition-colors"
                      >
                        {copied === classroom.code
                          ? <Check size={14} className="text-green-600" />
                          : <Copy size={14} />}
                      </button>
                    </div>

                    {/* Manage button */}
                    <button
                      onClick={() => navigate(`/teacher/classrooms/${classroom.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-sky text-white rounded-lg
                                 text-sm font-semibold hover:bg-sky/80 transition-colors"
                    >
                      Manage
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}