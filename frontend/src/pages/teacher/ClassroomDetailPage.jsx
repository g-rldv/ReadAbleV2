// ============================================================
// ClassroomDetailPage — Teacher approves / rejects parent requests
// ============================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  ArrowLeft, UserCheck, UserX, Users,
  Copy, Check, Clock, RefreshCw,
} from 'lucide-react';

const STATUS_STYLES = {
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100  text-red-700  border-red-200',
  pending:  'bg-amber-100 text-amber-700 border-amber-200',
};

const STATUS_LABEL = {
  approved: '✓ Approved',
  rejected: '✗ Rejected',
  pending:  '⏳ Pending',
};

export default function ClassroomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // userId being actioned
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, membersRes] = await Promise.all([
        api.get(`/classrooms/${id}`),
        api.get(`/classrooms/${id}/members`),
      ]);
      setClassroom(classRes.data.classroom);
      setMembers(membersRes.data.members || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/teacher/classrooms', { replace: true });
      } else {
        setError(err.response?.data?.error || 'Failed to load classroom');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    setActionLoading(userId);
    try {
      await api.post(`/classrooms/${id}/members/${userId}/${action}`);
      // Optimistic update
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === userId
            ? { ...m, status: action === 'approve' ? 'approved' : 'rejected' }
            : m
        )
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const copyCode = () => {
    if (!classroom) return;
    navigator.clipboard.writeText(classroom.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pending  = members.filter((m) => m.status === 'pending');
  const approved = members.filter((m) => m.status === 'approved');
  const rejected = members.filter((m) => m.status === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-500">Loading classroom…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button onClick={() => navigate('/teacher/classrooms')} className="text-sky font-medium mb-4 flex items-center gap-1">
          <ArrowLeft size={16} /> Back to Classrooms
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      </div>
    );
  }

  if (!classroom) return null;

  return (
    <div>
      {/* ── Back ────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/teacher/classrooms')}
        className="flex items-center gap-1.5 text-sky hover:text-sky/80 font-medium text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Classrooms
      </button>

      {/* ── Header card ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{classroom.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Created {new Date(classroom.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Code display */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wide">Join Code</p>
              <div className="flex items-center gap-2 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg px-4 py-2">
                <span className="font-mono font-black text-2xl tracking-[0.3em] text-slate-800">
                  {classroom.code}
                </span>
                <button
                  onClick={copyCode}
                  className="ml-2 p-1 rounded text-slate-400 hover:text-sky transition-colors"
                  title="Copy code"
                >
                  {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Share with parents</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-6 text-sm">
          <span className="text-slate-600">
            <span className="font-bold text-slate-900">{members.length}</span> total requests
          </span>
          <span className="text-green-700">
            <span className="font-bold">{approved.length}</span> approved
          </span>
          {pending.length > 0 && (
            <span className="text-amber-700 animate-pulse">
              <span className="font-bold">{pending.length}</span> pending approval
            </span>
          )}
          <button
            onClick={fetchData}
            className="ml-auto flex items-center gap-1 text-slate-400 hover:text-sky text-xs transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Pending requests (prominent) ────────────────────── */}
      {pending.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-semibold text-amber-700 flex items-center gap-2 mb-3">
            <Clock size={16} />
            Pending Requests ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                onAction={handleAction}
                isLoading={actionLoading === m.user_id}
                showActions
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Approved members ────────────────────────────────── */}
      {approved.length > 0 && (
        <section className="mb-6">
          <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Users size={16} />
            Approved Members ({approved.length})
          </h2>
          <div className="space-y-2">
            {approved.map((m) => (
              <MemberRow key={m.id} member={m} onAction={handleAction} isLoading={false} />
            ))}
          </div>
        </section>
      )}

      {/* ── Rejected ────────────────────────────────────────── */}
      {rejected.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-400 flex items-center gap-2 mb-3">
            Rejected ({rejected.length})
          </h2>
          <div className="space-y-2">
            {rejected.map((m) => (
              <MemberRow key={m.id} member={m} onAction={handleAction} isLoading={false} />
            ))}
          </div>
        </section>
      )}

      {/* ── No members yet ──────────────────────────────────── */}
      {members.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Users size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-500 mb-1">No join requests yet</h3>
          <p className="text-sm text-slate-400">
            Share the code <strong className="font-mono text-slate-600">{classroom.code}</strong> with parents.
            They'll enter it in their <em>Classroom</em> page to request access.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Member row component ──────────────────────────────────────
function MemberRow({ member, onAction, isLoading, showActions }) {
  const initials = `${(member.first_name || '?')[0]}${(member.last_name || '?')[0]}`.toUpperCase();
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-4">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-sky/20 text-sky flex items-center justify-center font-bold text-sm flex-shrink-0">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">
          {member.first_name} {member.last_name}
        </p>
        <p className="text-xs text-slate-400 truncate">{member.email}</p>
      </div>

      {/* Requested date */}
      <span className="text-xs text-slate-400 hidden sm:block flex-shrink-0">
        {new Date(member.requested_at).toLocaleDateString()}
      </span>

      {/* Status badge / actions */}
      {showActions && member.status === 'pending' ? (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onAction(member.user_id, 'approve')}
            disabled={isLoading}
            title="Approve"
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            <UserCheck size={14} />
            {isLoading ? '…' : 'Approve'}
          </button>
          <button
            onClick={() => onAction(member.user_id, 'reject')}
            disabled={isLoading}
            title="Reject"
            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            <UserX size={14} />
            Reject
          </button>
        </div>
      ) : (
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${
            STATUS_STYLES[member.status] || STATUS_STYLES.pending
          }`}
        >
          {STATUS_LABEL[member.status] || member.status}
        </span>
      )}
    </div>
  );
}