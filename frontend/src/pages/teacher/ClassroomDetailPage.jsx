// ============================================================
// ClassroomDetailPage.jsx — Redesigned to match AssessmentsListPage
// Soft pastels · Lucide icons · No emojis · Nunito + Fredoka One
// ============================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  ArrowLeft, UserCheck, UserX, Users,
  Copy, Check, Clock, RefreshCw, Sparkles,
  GraduationCap, CalendarDays, ClipboardList,
  User, CheckCircle2, AlertCircle, Baby,
  Hash, BookOpen, Trash2,
} from 'lucide-react';

// ─── Design tokens (exact mirror of AssessmentsListPage) ─────
const C = {
  page:  '#F2F0FA',
  white: '#FFFFFF',
  border:'#DDD8F2',
  shadowSm: '0 1px 8px rgba(80,60,160,0.07)',
  shadowMd: '0 4px 24px rgba(80,60,160,0.10)',

  teacher: {
    pageBg:      '#EBF4EF',
    border:      '#B8D8C4',
    accent:      '#3A7A5C',
    accentLight: '#CCEADB',
    textDark:    '#1A4A38',
    iconBg:      '#D0EDE0',
  },
  student: {
    pageBg:      '#EBF0FF',
    border:      '#B8C8F0',
    accent:      '#4058C0',
    accentLight: '#D0D8F8',
    textDark:    '#1A2870',
    iconBg:      '#D0D8F8',
  },
  parent: {
    pageBg:      '#FDF0E8',
    border:      '#F0C8A8',
    accent:      '#C06038',
    accentLight: '#FAE0C8',
    textDark:    '#6A2810',
    iconBg:      '#FAD8C0',
  },
  rose: {
    pageBg:      '#FEF0F3',
    border:      '#FECDD3',
    accent:      '#E83060',
    accentLight: '#FDD8E0',
    textDark:    '#881337',
    iconBg:      '#FDDDE4',
  },

  textPrimary:   '#28264A',
  textSecondary: '#6A6898',
  textMuted:     '#9A98C0',
  primary:       '#5A50A0',
};

// ─── Status themes keyed to the shared token palette ─────────
const STATUS_THEMES = {
  approved: { text: C.teacher.textDark, bg: C.teacher.pageBg, border: C.teacher.border, label: 'Approved' },
  rejected: { text: C.rose.textDark,   bg: C.rose.pageBg,    border: C.rose.border,    label: 'Rejected' },
  pending:  { text: C.parent.textDark,  bg: C.parent.pageBg,  border: C.parent.border,  label: 'Pending'  },
};

// ─── Shared primitives ────────────────────────────────────────
function SectionLabel({ icon, text }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 20,
      background: '#EDE8FF', border: '1px solid #C8C0F0', marginBottom: 10,
    }}>
      <span style={{ color: '#6050B0', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6050B0', textTransform: 'uppercase' }}>
        {text}
      </span>
    </div>
  );
}

function SectionTitle({ children, style = {} }) {
  return (
    <h2 style={{
      fontFamily: '"Fredoka One", cursive',
      fontSize: 'clamp(20px, 3vw, 26px)',
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
    padding: small ? '7px 16px' : '10px 20px',
    borderRadius: 12, fontSize: small ? 13 : 14, fontWeight: 700,
    fontFamily: 'Nunito, sans-serif', cursor: disabled ? 'not-allowed' : 'pointer',
    border: `2px solid ${col}`, transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1, ...extra,
  };
  const filled  = { ...base, background: hov && !disabled ? `${col}DD` : col, color: '#FFF' };
  const outlined = { ...base, background: hov && !disabled ? `${col}12` : 'transparent', color: col };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={outline ? outlined : filled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  );
}

// ─── Member row ───────────────────────────────────────────────
function MemberRow({ member, onAction, isLoading, showActions }) {
  const [hov, setHov] = useState(false);
  const initials = `${(member.first_name || '?')[0]}${(member.last_name || '?')[0]}`.toUpperCase();
  const theme    = STATUS_THEMES[member.status] || STATUS_THEMES.pending;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.teacher.pageBg : C.white,
        border: `1.5px solid ${hov ? C.teacher.border : C.border}`,
        borderRadius: 16,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        boxShadow: hov ? C.shadowMd : C.shadowSm,
        transition: 'all 0.18s',
        transform: hov ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Avatar + name/email */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 13, flexShrink: 0,
          background: C.teacher.iconBg,
          border: `1.5px solid ${C.teacher.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Fredoka One", cursive', fontSize: 15, color: C.teacher.accent,
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.first_name} {member.last_name}
          </p>
          <p style={{ fontSize: 11, color: C.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.email}
          </p>
        </div>
      </div>

      {/* Date */}
      {member.requested_at && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: '#F0EDF8', border: `1px solid ${C.border}`,
          fontSize: 11, fontWeight: 700, color: C.textMuted,
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          <CalendarDays size={10} />
          {new Date(member.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}

      {/* Actions or status badge */}
      {showActions && member.status === 'pending' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <SoftButton onClick={() => onAction(member.user_id, 'approve')} disabled={isLoading} color={C.teacher.accent} small>
            <UserCheck size={13} /> {isLoading ? '…' : 'Approve'}
          </SoftButton>
          <SoftButton onClick={() => onAction(member.user_id, 'reject')} disabled={isLoading} color={C.rose.accent} outline small>
            <UserX size={13} /> Reject
          </SoftButton>
        </div>
      ) : (
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
          background: theme.bg, border: `1.5px solid ${theme.border}`,
          color: theme.text, flexShrink: 0, whiteSpace: 'nowrap',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          {member.status === 'approved' && <CheckCircle2 size={11} />}
          {member.status === 'rejected' && <UserX size={11} />}
          {member.status === 'pending'  && <Clock size={11} />}
          {theme.label}
        </span>
      )}
    </div>
  );
}

// ─── Student card ─────────────────────────────────────────────
function StudentCard({ student, onRemove, onAction, isRemoving, isActing }) {
  const [hov, setHov] = useState(false);
  const theme = STATUS_THEMES[student.status] || STATUS_THEMES.pending;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.student.pageBg : C.white,
        border: `1.5px solid ${hov ? C.student.border : C.border}`,
        borderRadius: 16, padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: hov ? C.shadowMd : C.shadowSm,
        transition: 'all 0.18s',
        transform: hov ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 13, flexShrink: 0,
        background: C.student.iconBg,
        border: `1.5px solid ${C.student.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Baby size={18} style={{ color: C.student.accent }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Link to={`/teacher/children/${student.id}`} style={{ color: C.student.accent, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            {student.first_name} {student.last_name}
          </Link>
        </p>
        <p style={{ fontSize: 11, color: C.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <User size={10} /> Parent: {student.parent_first_name ? `${student.parent_first_name} ${student.parent_last_name}` : '—'}
        </p>
        {student.date_of_birth && (
          <p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarDays size={10} /> DOB: {new Date(student.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        )}
        {student.gender && (
          <p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <User size={10} /> Gender: {student.gender}
          </p>
        )}
        {student.asd_notes && (
          <p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            <ClipboardList size={10} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              Notes: {student.asd_notes}
            </span>
          </p>
        )}
        <span style={{
          fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10,
          background: theme.bg, border: `1px solid ${theme.border}`,
          color: theme.text, display: 'inline-flex', alignItems: 'center', gap: 2,
          marginTop: 4,
        }}>
          {theme.label}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {student.assigned_at && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: C.textMuted,
            whiteSpace: 'nowrap',
          }}>
            Joined {new Date(student.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        
        {student.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => onAction(student.id, 'approve')}
              disabled={isActing}
              style={{
                background: C.teacher.accent, color: '#FFF', border: 'none',
                borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Approve
            </button>
            <button
              onClick={() => onAction(student.id, 'reject')}
              disabled={isActing}
              style={{
                background: 'none', border: `1.5px solid ${C.rose.accent}`,
                color: C.rose.accent, borderRadius: 8, padding: '4px 8px',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Reject
            </button>
          </div>
        ) : (
          <button
            onClick={() => onRemove(student.id)}
            disabled={isRemoving}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 800, color: C.rose.accent,
              padding: 0, display: 'inline-flex', alignItems: 'center', gap: 2,
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.rose.textDark}
            onMouseLeave={e => e.currentTarget.style.color = C.rose.accent}
          >
            <UserX size={12} /> {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function ClassroomDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [classroom,     setClassroom]     = useState(null);
  const [members,       setMembers]       = useState([]);
  const [students,      setStudents]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [flash,         setFlash]         = useState(null);
  const [copied,        setCopied]        = useState(false);

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
      } catch { setStudents([]); }
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
      setMembers(prev =>
        prev.map(m => m.user_id === userId
          ? { ...m, status: action === 'approve' ? 'approved' : 'rejected' }
          : m
        )
      );
      if (action === 'approve') {
        try {
          const kids = await api.get(`/classrooms/${id}/children`);
          setStudents(kids.data.children || []);
        } catch { /* ignore */ }
        setFlash({ type: 'success', msg: 'Member approved — student connections updated.' });
      } else {
        setFlash({ type: 'info', msg: 'Membership request updated.' });
      }
      setTimeout(() => setFlash(null), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveStudent = async (childId) => {
    if (!window.confirm('Are you sure you want to remove this student from the classroom?')) return;
    setActionLoading(`student-${childId}`);
    try {
      await api.delete(`/classrooms/${id}/children/${childId}`);
      setStudents(prev => prev.filter(s => s.id !== childId));
      setFlash({ type: 'success', msg: 'Student removed from classroom.' });
      setTimeout(() => setFlash(null), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove student');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChildAction = async (childId, action) => {
    setActionLoading(`child-action-${childId}`);
    try {
      await api.post(`/classrooms/${id}/children/${childId}/${action}`);
      setStudents(prev =>
        prev.map(s => s.id === childId ? { ...s, status: action === 'approve' ? 'approved' : 'rejected' } : s)
      );
      setFlash({ type: 'success', msg: `Student enrollment ${action === 'approve' ? 'approved' : 'rejected'}.` });
      setTimeout(() => setFlash(null), 3000);
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

  const handleDeleteClassroom = async () => {
    if (!window.confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) return;
    try {
      await api.delete(`/classrooms/${id}`);
      setFlash({ type: 'success', msg: 'Classroom deleted successfully.' });
      setTimeout(() => navigate('/teacher/classrooms'), 1500);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete classroom');
    }
  };

  const pendingStudents  = students.filter(s => s.status === 'pending');
  const approvedStudents = students.filter(s => s.status === 'approved');

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 0', gap: 14,
        fontFamily: 'Nunito, sans-serif',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `3px solid ${C.teacher.accentLight}`,
          borderTop: `3px solid ${C.teacher.accent}`,
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, margin: 0 }}>
          Loading classroom…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SoftButton onClick={() => navigate('/teacher/classrooms')} outline color={C.textSecondary} small>
          <ArrowLeft size={14} /> Back to Classrooms
        </SoftButton>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', borderRadius: 14,
          background: C.rose.pageBg, border: `1.5px solid ${C.rose.border}`,
          color: C.rose.textDark, fontSize: 13, fontWeight: 700,
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  // ── Detail view ─────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: '"Nunito", sans-serif',
      color: C.textPrimary,
      maxWidth: 900,
      display: 'flex', flexDirection: 'column', gap: 36,
    }}>
      <style>{`@keyframes toastSlide { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }`}</style>

      {/* ── Toast ───────────────────────────────────────────── */}
      {flash && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', borderRadius: 14,
          background: flash.type === 'success' ? C.teacher.pageBg : C.student.pageBg,
          border: `1.5px solid ${flash.type === 'success' ? C.teacher.border : C.student.border}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          fontSize: 13, fontWeight: 700, color: C.textPrimary,
          animation: 'toastSlide 0.22s ease-out',
        }}>
          {flash.type === 'success'
            ? <CheckCircle2 size={15} style={{ color: C.teacher.accent }} />
            : <CheckCircle2 size={15} style={{ color: C.student.accent }} />}
          {flash.msg}
        </div>
      )}

      {/* ── Back button ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SoftButton onClick={() => navigate('/teacher/classrooms')} outline color={C.textSecondary} small>
          <ArrowLeft size={14} /> Back to Classrooms
        </SoftButton>
        <SoftButton onClick={handleDeleteClassroom} color={C.rose.accent} small>
          <Trash2 size={14} /> Delete Classroom
        </SoftButton>
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{
        borderRadius: 22,
        background: C.teacher.pageBg,
        border: `1.5px solid ${C.teacher.border}`,
        padding: '28px 28px 24px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 18,
        boxShadow: C.shadowSm,
      }}>
        <div>
          <SectionLabel icon={<GraduationCap size={12} />} text="Class Management" />
          <SectionTitle>{classroom.name}</SectionTitle>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
            <CalendarDays size={13} />
            Established {new Date(classroom.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Join code chip */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <p style={{ fontSize: 10, color: C.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Join Code
          </p>
          <button
            onClick={copyCode}
            title="Click to copy"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: C.white, border: `1.5px solid ${C.teacher.border}`,
              borderRadius: 14, padding: '9px 16px',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.teacher.accent; e.currentTarget.style.background = C.teacher.accentLight; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.teacher.border; e.currentTarget.style.background = C.white; }}
          >
            <Hash size={14} style={{ color: C.textMuted }} />
            <span style={{ fontFamily: '"Courier New", monospace', fontWeight: 900, color: C.textPrimary, letterSpacing: '0.06em', fontSize: 18 }}>
              {classroom.code}
            </span>
            {copied
              ? <Check size={15} style={{ color: C.teacher.accent }} />
              : <Copy size={15} style={{ color: C.textMuted }} />}
          </button>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {[
          { icon: Baby,         label: 'Total Students', value: students.length, scheme: { accent: '#5A50A0', iconBg: '#EDE8FF' } },
          { icon: CheckCircle2, label: 'Approved',       value: approvedStudents.length, scheme: C.student },
          { icon: Clock,        label: 'Pending',        value: pendingStudents.length,  scheme: C.parent  },
        ].map(({ icon: Icon, label, value, scheme }) => (
          <div key={label} style={{
            background: C.white, border: `1.5px solid ${C.border}`,
            borderRadius: 16, padding: '16px 18px',
            boxShadow: C.shadowSm,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: scheme.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={18} style={{ color: scheme.accent }} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, margin: 0 }}>{label}</p>
              <p style={{
                fontFamily: '"Fredoka One", cursive',
                fontSize: 26, color: scheme.accent, margin: 0, lineHeight: 1,
              }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pending requests ────────────────────────────────── */}


      {/* ── Enrolled students ────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <SectionLabel icon={<Baby size={12} />} text="Students" />
          <SectionTitle style={{ fontSize: 'clamp(17px, 2.5vw, 21px)', marginBottom: 14 }}>
            Enrolled students ({students.length})
          </SectionTitle>
        </div>
        {students.length === 0 ? (
          <div style={{
            background: C.student.pageBg,
            border: `1.5px solid ${C.student.border}`,
            borderRadius: 20, padding: '32px 24px',
            textAlign: 'center', boxShadow: C.shadowSm,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: C.student.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <Baby size={22} style={{ color: C.student.accent }} />
            </div>
            <p style={{ fontFamily: '"Fredoka One", cursive', fontSize: 17, color: C.student.textDark, margin: '0 0 4px' }}>
              No students yet
            </p>
            <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>
              Approving a parent's request will link their students here.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 12,
          }}>
            {students.map(s => (
              <StudentCard
                key={s.id}
                student={s}
                onRemove={handleRemoveStudent}
                onAction={handleChildAction}
                isRemoving={actionLoading === `student-${s.id}`}
                isActing={actionLoading === `child-action-${s.id}`}
              />
            ))}
          </div>
        )}
      </section>



      {/* ── Refresh ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={fetchData}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 800, color: C.textMuted,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            padding: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.textSecondary}
          onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
    </div>
  );
}