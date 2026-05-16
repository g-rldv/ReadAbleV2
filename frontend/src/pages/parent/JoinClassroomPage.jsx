// ============================================================
// JoinClassroomPage — Parent enters a code to join a classroom
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Key, BookOpen, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  approved: { label: 'Approved',  icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50  border-green-200'  },
  pending:  { label: 'Pending',   icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-50  border-amber-200'  },
  rejected: { label: 'Rejected',  icon: XCircle,     color: 'text-red-600',    bg: 'bg-red-50    border-red-200'    },
};

export default function JoinClassroomPage() {
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [flash, setFlash] = useState(null);   // { type: 'success'|'error', msg }
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => { fetchMyClassrooms(); }, []);

  const fetchMyClassrooms = async () => {
    try {
      const res = await api.get('/classrooms/my');
      setClassrooms(res.data.classrooms || []);
    } catch (err) {
      console.error('[JoinClassroom]', err);
    } finally {
      setLoading(false);
    }
  };

  const joinClassroom = async (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) return;
    setJoining(true);
    setFlash(null);
    try {
      await api.post('/classrooms/join', { code: trimmed });
      setFlash({ type: 'success', msg: 'Request sent! The teacher will approve your access shortly.' });
      setCode('');
      fetchMyClassrooms();
    } catch (err) {
      setFlash({ type: 'error', msg: err.response?.data?.error || 'Failed to join classroom' });
    } finally {
      setJoining(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-1">Classroom</h1>
      <p className="text-slate-500 mb-8">
        Enter the 6-character code your child's teacher gave you to request access to their classroom.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Join by code ─────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-sky/10 rounded-lg">
              <Key size={20} className="text-sky" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Enter Classroom Code</h2>
          </div>

          <form onSubmit={joinClassroom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                6-Character Code
              </label>
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. AB12XY"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50
                           font-mono text-center text-2xl tracking-[0.5em] uppercase
                           focus:outline-none focus:ring-2 focus:ring-sky focus:border-sky
                           placeholder:text-slate-300 placeholder:text-base placeholder:tracking-normal"
                maxLength={6}
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            {flash && (
              <div className={`flex items-start gap-2 p-3 rounded-lg text-sm border ${
                flash.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {flash.type === 'success'
                  ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                  : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
                {flash.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={joining || code.length !== 6}
              className="w-full py-3 rounded-xl bg-sky text-white font-semibold text-sm
                         hover:bg-sky/80 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {joining ? 'Sending request…' : 'Request to Join'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              After you submit, the teacher will approve or decline your request.
              You'll see the status below once they respond.
            </p>
          </div>
        </div>

        {/* ── My classrooms ─────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <BookOpen size={20} className="text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">My Classrooms</h2>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : classrooms.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No classrooms joined yet.</p>
              <p className="text-xs text-slate-300 mt-1">Enter a code on the left to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classrooms.map((classroom) => {
                const cfg = STATUS_CONFIG[classroom.status] || STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                return (
                  <div
                    key={classroom.id}
                    className={`p-4 rounded-xl border ${cfg.bg}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">
                          {classroom.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Teacher: {classroom.teacher_first} {classroom.teacher_last}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Requested {new Date(classroom.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-semibold flex-shrink-0 ${cfg.color}`}>
                        <StatusIcon size={13} />
                        {cfg.label}
                      </span>
                    </div>
                    {classroom.status === 'pending' && (
                      <p className="text-xs text-amber-600 mt-2">
                        Waiting for teacher approval…
                      </p>
                    )}
                    {classroom.status === 'approved' && (
                      <p className="text-xs text-green-600 mt-2">
                        You have access to this classroom.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}