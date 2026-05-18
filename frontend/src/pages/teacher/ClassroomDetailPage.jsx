// ============================================================
// ClassroomDetailPage.jsx — Teacher approves / rejects parent requests
// Design-synced with TeacherDashboard (Sage green accent hierarchy)
// ============================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  ArrowLeft, UserCheck, UserX, Users,
  Copy, Check, Clock, RefreshCw, Sparkles,
  GraduationCap, CalendarDays, ClipboardList,
  User, CheckCircle2, AlertCircle, X, Baby
} from 'lucide-react';

// ─── Design tokens linked to Global CSS Variables ────────────
const C = {
  page: 'var(--bg-primary, #F2F0FA)',
  white: 'var(--bg-card, #FFFFFF)',
  border: 'var(--border-color, #DDD8F2)',
  shadowSm: 'var(--shadow, 0 1px 8px rgba(80,60,160,0.07))',
  shadowMd: '0 4px 24px rgba(80,60,160,0.10)',

  teacher: {
    pageBg:      'var(--bg-sidebar, #EBF4EF)',
    border:      'var(--border-color, #B8D8C4)',
    accent:      'var(--accent, #3A7A5C)',
    accentLight: 'var(--bg-primary, #CCEADB)',
    textDark:    'var(--text-primary, #1A4A38)',
    iconBg:      'var(--bg-sidebar, #D0EDE0)',
  },

  student: {
    pageBg:      '#EBF0FF',
    border:      '#B8C8F0',
    accent:      '#4058C0',
    accentLight: '#D0D8F8',
    textDark:    '#1A2870',
    iconBg:      '#D0D8F8',
  },

  amber: {
    pageBg:      'rgba(245, 158, 11, 0.12)',
    border:      'rgba(245, 158, 11, 0.35)',
    accent:      '#B45309',
    accentLight: 'rgba(245, 158, 11, 0.15)',
    textDark:    'var(--text-primary, #78350F)',
  },

  rose: {
    pageBg:      'rgba(232, 48, 96, 0.1)',
    border:      '#FECDD3',
    accent:      '#E83060',
    accentLight: 'rgba(232, 48, 96, 0.15)',
    textDark:    'var(--text-primary, #881337)',
  },

  textPrimary: 'var(--text-primary, #28264A)',
  textSecondary: 'var(--text-muted, #6A6898)',
  textMuted: 'var(--text-muted, #9A98C0)',
  primary: 'var(--accent, #3A7A5C)',
};

// ─── Status primitive token variables ─────────────────────────
const STATUS_THEMES = {
  approved: { text: C.teacher.textDark, bg: C.teacher.pageBg, border: C.teacher.border, label: 'Approved' },
  rejected: { text: C.rose.textDark, bg: C.rose.pageBg, border: C.rose.border, label: 'Rejected' },
  pending:  { text: C.amber.textDark, bg: C.amber.pageBg, border: C.amber.border, label: 'Pending' },
};

// ─── Shared primitives ────────────────────────────────────────
function SectionLabel({ icon, text }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 20,
      background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', marginBottom: 10,
    }}>
      <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase' }}>
        {text}
      </span>
    </div>
  );
}

function SectionTitle({ children, style = {} }) {
  return (
    <h2 style={{
      fontFamily: '"Fredoka One", cursive',
      fontSize: 'clamp(18px, 2.5vw, 22px)',
      color: C.textPrimary, margin: '0 0 4px', lineHeight: 1.2,
      ...style,
    }}>
      {children}
    </h2>
  );
}

function SoftButton({ children, onClick, color, outline, small, disabled, type = 'button', style: extra = {} }) {
  const [hov, setHov] = useState(false);
  const col = color || C.primary;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: small ? '6px 14px' : '10px 20px',
    borderRadius: 12, fontSize: small ? 12 : 13, fontWeight: 700,
    fontFamily: 'Nunito, sans-serif', cursor: disabled ? 'not-allowed' : 'pointer',
    border: `2px solid ${col}`, transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1, ...extra,
  };
  const filled  = { ...base, background: hov && !disabled ? `${col}DD` : col, color: '#FFF' };
  const outline_ = { ...base, background: hov && !disabled ? `${col}12` : 'transparent', color: col };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={outline ? outline_ : filled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  );
}

function Panel({ children, scheme = null, style: extra = {} }) {
  const bg    = scheme ? scheme.pageBg  : C.white;
  const bdr   = scheme ? scheme.border  : C.border;
  return (
    <div style={{
      background: bg, border: `1.5px solid ${bdr}`,
      borderRadius: 20, padding: '24px 26px',
      boxShadow: C.shadowSm, ...extra,
    }}>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function ClassroomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [members, setMembers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); 
  const [flash, setFlash] = useState(null);
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
      
      try {
        const kids = await api.get(`/classrooms/${id}/children`);
        setStudents(kids.data.children || []);
      } catch (e) {
        setStudents([]);
      }
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
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === userId
            ? { ...m, status: action === 'approve' ? 'approved' : 'rejected' }
            : m
        )
      );
      if (action === 'approve') {
        try {
          const kids = await api.get(`/classrooms/${id}/children`);
          setStudents(kids.data.children || []);
        } catch (e) {
          // ignore
        }
        setFlash({ type: 'success', msg: 'Member approved and student connections updated.' });
        setTimeout(() => setFlash(null), 3000);
      } else {
        setFlash({ type: 'info', msg: 'Membership request updated.' });
        setTimeout(() => setFlash(null), 2500);
      }
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
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 0', gap: 14, width: '100%'
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `3px solid ${C.teacher.accentLight}`,
          borderTop: `3px solid ${C.teacher.accent}`,
          animation: 'classroomDetailSpin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, margin: 0 }}>
          Loading classroom roster details…
        </p>
        <style>{`@keyframes classroomDetailSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        <div>
          <SoftButton onClick={() => navigate('/teacher/classrooms')} outline color={C.teacher.accent}>
            <ArrowLeft size={14} /> Back to Classrooms
          </SoftButton>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 14,
          background: '#FEF0F0', border: '1.5px solid #F8C8C8', color: '#C03030', fontSize: 13, fontWeight: 700
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: '"Nunito", sans-serif',
      color: C.textPrimary,
      maxWidth: 900,
      display: 'flex', flexDirection: 'column', gap: 30,
      width: '100%',
    }}>
      <style>{`
        @keyframes toastSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @media (max-width: 600px) {
          .detail-header-row { flex-direction: column !important; align-items: stretch !important; gap: 20px !important; }
          .code-box-wrapper { justify-content: center !important; }
          .member-card-wrapper { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .member-card-actions { width: 100% !important; justify-content: flex-end !important; }
        }
      `}</style>

      {/* ── Toast Messages ──────────────────────────────────── */}
      {flash && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 14,
          background: flash.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-sidebar)',
          border: `1.5px solid ${flash.type === 'success' ? 'var(--border-interactive)' : 'var(--border-color)'}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
          animation: 'toastSlide 0.22s ease-out'
        }}>
          {flash.type === 'success' ? <CheckCircle2 size={15} style={{ color: 'green' }} /> : <Info size={15} style={{ color: C.teacher.accent }} />}
          {flash.msg}
        </div>
      )}

      {/* ── Back Trigger ──────────────────────────────── */}
      <div>
        <SoftButton onClick={() => navigate('/teacher/classrooms')} outline color={C.textSecondary} small>
          <ArrowLeft size={14} /> Back to Classrooms
        </SoftButton>
      </div>

      {/* ── Header Surface Panel ────────────────────────────── */}
      <div className="detail-header-row" style={{
        borderRadius: 22, background: C.teacher.pageBg, border: `1.5px solid ${C.teacher.border}`,
        padding: '28px 28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
        boxShadow: C.shadowSm,
      }}>
        <div>
          <SectionLabel icon={<GraduationCap size={12} />} text="Class Management" />
          <SectionTitle style={{ fontSize: 'clamp(20px, 3vw, 25px)' }}>{classroom.name}</SectionTitle>
          <p style={{ fontSize: 12, color: C.textSecondary, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarDays size={12} /> Established {new Date(classroom.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Sync code block structure with the ClassroomList code presentation style */}
        <div className="code-box-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: C.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>Join Code</p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, background: C.white,
              border: `1.5px solid ${C.teacher.border}`, borderRadius: 14, padding: '8px 16px', height: 44, boxSizing: 'border-box'
            }}>
              <span style={{ fontFamily: '"Courier New", monospace', fontWeight: 900, color: C.textPrimary, letterSpacing: '0.05em', fontSize: 18 }}>
                {classroom.code}
              </span>
              <button onClick={copyCode} title="Copy Code" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2, color: copied ? C.teacher.accent : C.textMuted }}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Statistics Summary Bar ──────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '14px 20px', borderRadius: 16, background: C.white, border: `1.5px solid ${C.border}`, boxShadow: C.shadowSm, fontSize: 13
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontWeight: 700 }}>
          <span style={{ color: C.textPrimary }}><span style={{ fontSize: 15, fontFamily: '"Fredoka One", cursive' }}>{members.length}</span> Total Requests</span>
          <span style={{ color: C.teacher.textDark }}><span style={{ fontSize: 15, fontFamily: '"Fredoka One", cursive', color: C.teacher.accent }}>{approved.length}</span> Active Connections</span>
          {pending.length > 0 && (
            <span style={{ color: C.amber.accent, display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 15, fontFamily: '"Fredoka One", cursive' }}>{pending.length}</span> Pending Approval</span>
          )}
        </div>
        <button onClick={fetchData} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted,
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, textTransform: 'uppercase'
        }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* ── Section: Pending Enrollment Requests ────────────── */}
      {pending.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SectionLabel icon={<Clock size={12} />} text="Requests" />
            <SectionTitle style={{ fontSize: 16 }}>Pending Roster Verifications ({pending.length})</SectionTitle>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map((m) => (
              <MemberRow key={m.user_id} member={m} onAction={handleAction} isLoading={actionLoading === m.user_id} showActions />
            ))}
          </div>
        </section>
      )}

      {/* ── Section: Classroom Students ─────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SectionLabel icon={<Baby size={12} />} text="Students" />
          <SectionTitle style={{ fontSize: 16 }}>Enrolled Students ({students.length})</SectionTitle>
        </div>
        {students.length === 0 ? (
          <div style={{
            background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16,
            padding: '32px 20px', textAlign: 'center', color: C.textMuted, fontSize: 13, fontWeight: 600
          }}>
            No students are currently linked to this classroom workspace. Approving linked family units will display student profiles here.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {students.map((s) => (
              <div key={s.id} style={{
                background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16,
                padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: C.shadowSm
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.first_name} {s.last_name}
                  </p>
                  <p style={{ fontSize: 11, color: C.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={12} /> Parent: {s.parent_name || '—'}
                  </p>
                </div>
                <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, flexShrink: 0 }}>
                  {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section: Verified Active Members ────────────────── */}
      {approved.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SectionLabel icon={<Users size={12} />} text="Roster" />
            <SectionTitle style={{ fontSize: 16 }}>Approved Family Guardians ({approved.length})</SectionTitle>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {approved.map((m) => (
              <MemberRow key={m.user_id} member={m} onAction={handleAction} isLoading={false} />
            ))}
          </div>
        </section>
      )}

      {/* ── Section: Denied / Archived Requests ─────────────── */}
      {rejected.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SectionLabel icon={<UserX size={12} />} text="Archived" />
            <SectionTitle style={{ fontSize: 16, color: C.textMuted }}>Rejected Profiles ({rejected.length})</SectionTitle>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.75 }}>
            {rejected.map((m) => (
              <MemberRow key={m.user_id} member={m} onAction={handleAction} isLoading={false} />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty Fallback ─────────── */}
      {members.length === 0 && (
        <Panel style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, background: C.teacher.pageBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <ClipboardList size={24} style={{ color: C.teacher.accent }} />
          </div>
          <SectionTitle style={{ fontSize: 18, marginBottom: 6 }}>No join requests received yet</SectionTitle>
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
            Provide the unique 6-digit code string <strong style={{ fontFamily: 'monospace', color: C.textPrimary }}>{classroom.code}</strong> directly to student parents to request classroom entry routing.
          </p>
        </Panel>
      )}
    </div>
  );
}

// ── Member row component ──────────────────────────────────────
function MemberRow({ member, onAction, isLoading, showActions }) {
  const initials = `${(member.first_name || '?')[0]}${(member.last_name || '?')[0]}`.toUpperCase();
  const theme = STATUS_THEMES[member.status] || STATUS_THEMES.pending;

  return (
    <div className="member-card-wrapper" style={{
      background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16,
      padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      boxShadow: C.shadowSm
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, background: C.teacher.pageBg,
          color: C.teacher.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Fredoka One", cursive', fontSize: 14, flexShrink: 0, border: `1.5px solid ${C.teacher.border}`
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.first_name} {member.last_name}
          </p>
          <p style={{ fontSize: 11, color: C.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</p>
        </div>
      </div>

      <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, display: 'none' }} className="sm:block">
        {member.requested_at ? new Date(member.requested_at).toLocaleDateString() : '—'}
      </span>

      {showActions && member.status === 'pending' ? (
        <div className="member-card-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <SoftButton onClick={() => onAction(member.user_id, 'approve')} disabled={isLoading} color={C.teacher.accent} small>
            <UserCheck size={14} />
            {isLoading ? '…' : 'Approve'}
          </SoftButton>
          <SoftButton onClick={() => onAction(member.user_id, 'reject')} disabled={isLoading} color={C.rose.accent} outline small>
            <UserX size={14} />
            Reject
          </SoftButton>
        </div>
      ) : (
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
          background: theme.bg, border: `1.5px solid ${theme.border}`, color: theme.text, flexShrink: 0
        }}>
          {theme.label}
        </span>
      )}
    </div>
  );
}