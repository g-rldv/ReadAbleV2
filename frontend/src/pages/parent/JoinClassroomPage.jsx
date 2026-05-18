// ============================================================
// JoinClassroomPage — Redesigned to match ParentDashboard style
// Soft pastels · Lucide icons · No emojis · Nunito + Fredoka One
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  Key, BookOpen, CheckCircle, AlertCircle,
  Clock, XCircle, GraduationCap, ChevronRight,
  CalendarDays, Sparkles,
} from 'lucide-react';

// ─── Design tokens (mirrored from ParentDashboard) ───────────
const C = {
  white: '#FFFFFF',
  border: '#DDD8F2',
  shadowSm: '0 1px 8px rgba(80,60,160,0.07)',
  shadowMd: '0 4px 24px rgba(80,60,160,0.10)',

  parent: {
    pageBg: '#FDF0E8',
    border: '#F0C8A8',
    accent: '#C06038',
    accentLight: '#FAE0C8',
    textDark: '#6A2810',
    iconBg: '#FAD8C0',
  },

  teacher: {
    pageBg: '#EBF4EF',
    border: '#B8D8C4',
    accent: '#3A7A5C',
    accentLight: '#CCEADB',
    textDark: '#1A4A38',
    iconBg: '#D0EDE0',
  },

  student: {
    pageBg: '#EBF0FF',
    border: '#B8C8F0',
    accent: '#4058C0',
    accentLight: '#D0D8F8',
    textDark: '#1A2870',
    iconBg: '#D0D8F8',
  },

  amber: {
    pageBg: '#FFFBEB',
    border: '#FDE68A',
    accent: '#B45309',
    accentLight: '#FEF3C7',
    textDark: '#78350F',
    iconBg: '#FEF3C7',
  },

  rose: {
    pageBg: '#FFF1F2',
    border: '#FECDD3',
    accent: '#BE123C',
    accentLight: '#FFE4E6',
    textDark: '#881337',
    iconBg: '#FFE4E6',
  },

  textPrimary: '#28264A',
  textSecondary: '#6A6898',
  textMuted: '#9A98C0',
  primary: '#5A50A0',
};

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG = {
  approved: { label: 'Approved', icon: CheckCircle, scheme: C.teacher },
  pending:  { label: 'Pending',  icon: Clock,       scheme: C.amber   },
  rejected: { label: 'Rejected', icon: XCircle,     scheme: C.rose    },
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

// ─── Classroom status row ─────────────────────────────────────
function ClassroomRow({ classroom }) {
  const [hov, setHov] = useState(false);
  const cfg = STATUS_CONFIG[classroom.status] || STATUS_CONFIG.pending;
  const { scheme } = cfg;
  const StatusIcon = cfg.icon;
  const date = classroom.requested_at
    ? new Date(classroom.requested_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? scheme.pageBg : C.white,
        border: `1.5px solid ${hov ? scheme.border : C.border}`,
        borderRadius: 16,
        padding: '16px 18px',
        boxShadow: hov ? C.shadowMd : C.shadowSm,
        transition: 'all 0.18s',
        transform: hov ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        {/* Left: info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: 0 }}>
            {classroom.name}
          </p>
          {(classroom.teacher_first || classroom.teacher_last) && (
            <p style={{
              fontSize: 12, color: C.textSecondary, margin: '3px 0 0',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <GraduationCap size={12} />
              {classroom.teacher_first} {classroom.teacher_last}
            </p>
          )}
          {date && (
            <p style={{
              fontSize: 11, color: C.textMuted, margin: '4px 0 0',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <CalendarDays size={11} />
              Requested {date}
            </p>
          )}
        </div>

        {/* Right: status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          padding: '5px 11px', borderRadius: 20,
          background: scheme.accentLight,
          border: `1px solid ${scheme.border}`,
          fontSize: 11, fontWeight: 800, color: scheme.textDark,
        }}>
          <StatusIcon size={12} />
          {cfg.label}
        </div>
      </div>

      {/* Footer for pending/approved */}
      {classroom.status === 'pending' && (
        <p style={{
          fontSize: 12, color: C.amber.accent,
          margin: '10px 0 0', paddingTop: 10,
          borderTop: `1px solid ${C.border}`,
          fontWeight: 600,
        }}>
          Waiting for teacher approval…
        </p>
      )}
      {classroom.status === 'approved' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`,
        }}>
          <p style={{ fontSize: 12, color: C.teacher.accent, fontWeight: 600, margin: 0 }}>
            You have access to this classroom.
          </p>
          <Link
            to={`/parent/classrooms/${classroom.id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 800, color: C.parent.accent,
              textDecoration: 'none',
            }}
          >
            View Activities <ChevronRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function JoinClassroomPage() {
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [flash, setFlash] = useState(null); // { type: 'success'|'error', msg }
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
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

  const isReady = code.length === 6;

  return (
    <div style={{
      fontFamily: '"Nunito", sans-serif',
      color: C.textPrimary,
      maxWidth: 900,
      display: 'flex', flexDirection: 'column', gap: 32,
    }}>

      {/* ── Page header ───────────────────────────────────── */}
      <div style={{
        borderRadius: 22,
        background: C.parent.pageBg,
        border: `1.5px solid ${C.parent.border}`,
        padding: '28px 28px 24px',
        boxShadow: C.shadowSm,
      }}>
        <SectionLabel icon={<Sparkles size={12} />} text="Classrooms" />
        <SectionTitle>Join a Classroom</SectionTitle>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: '6px 0 0', lineHeight: 1.6, maxWidth: 520 }}>
          Enter the 6-character code your child's teacher gave you to request access to their classroom.
        </p>
      </div>

      {/* ── Two-column grid ───────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* ── Join by code panel ───────────────────────────── */}
        <div style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: '24px 24px 20px',
          boxShadow: C.shadowSm,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <div>
            <SectionLabel icon={<Key size={12} />} text="Enter Code" />
            <SectionTitle>Classroom Code</SectionTitle>
          </div>

          <form onSubmit={joinClassroom} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Code input */}
            <div>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 800,
                color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                6-Character Code
              </label>
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="AB12XY"
                maxLength={6}
                autoComplete="off"
                spellCheck="false"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: `2px solid ${inputFocused ? C.parent.accent : C.border}`,
                  background: inputFocused ? C.parent.pageBg : '#FAFAF8',
                  fontFamily: '"Courier New", monospace',
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: '0.45em',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  color: C.textPrimary,
                  outline: 'none',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              />
              {/* Character count dots */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8,
              }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: i < code.length ? C.parent.accent : C.border,
                    transition: 'background 0.12s',
                  }} />
                ))}
              </div>
            </div>

            {/* Flash message */}
            {flash && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px', borderRadius: 12,
                background: flash.type === 'success' ? C.teacher.pageBg : C.rose.pageBg,
                border: `1.5px solid ${flash.type === 'success' ? C.teacher.border : C.rose.border}`,
              }}>
                {flash.type === 'success'
                  ? <CheckCircle size={15} style={{ color: C.teacher.accent, flexShrink: 0, marginTop: 1 }} />
                  : <AlertCircle size={15} style={{ color: C.rose.accent, flexShrink: 0, marginTop: 1 }} />}
                <p style={{
                  fontSize: 12, fontWeight: 700, margin: 0, lineHeight: 1.5,
                  color: flash.type === 'success' ? C.teacher.textDark : C.rose.textDark,
                }}>
                  {flash.msg}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={joining || !isReady}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: 14,
                border: 'none',
                background: isReady && !joining ? C.parent.accent : C.border,
                color: isReady && !joining ? '#FFFFFF' : C.textMuted,
                fontSize: 14, fontWeight: 800,
                fontFamily: 'Nunito, sans-serif',
                cursor: isReady && !joining ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Key size={15} />
              {joining ? 'Sending request…' : 'Request to Join'}
            </button>
          </form>

          <p style={{
            fontSize: 11, color: C.textMuted, lineHeight: 1.6,
            margin: 0, paddingTop: 14, borderTop: `1px solid ${C.border}`,
          }}>
            After you submit, the teacher will approve or decline your request.
            You'll see the status in the list once they respond.
          </p>
        </div>

        {/* ── My classrooms panel ───────────────────────────── */}
        <div style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: '24px 24px 20px',
          boxShadow: C.shadowSm,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div>
            <SectionLabel icon={<BookOpen size={12} />} text="My Classrooms" />
            <SectionTitle>Your Classrooms</SectionTitle>
          </div>

          {loading ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '32px 0', gap: 12,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: `3px solid ${C.parent.accentLight}`,
                borderTop: `3px solid ${C.parent.accent}`,
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, margin: 0 }}>
                Loading classrooms…
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : classrooms.length === 0 ? (
            /* Empty state */
            <div style={{
              background: C.teacher.pageBg,
              border: `1.5px solid ${C.teacher.border}`,
              borderRadius: 16,
              padding: '36px 20px',
              textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: C.teacher.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <BookOpen size={22} style={{ color: C.teacher.accent }} />
              </div>
              <p style={{
                fontFamily: '"Fredoka One", cursive',
                fontSize: 17, color: C.teacher.textDark, margin: '0 0 5px',
              }}>
                No classrooms yet
              </p>
              <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: 1.5 }}>
                Enter a code on the left to get started.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {classrooms.map(classroom => (
                <ClassroomRow key={classroom.id} classroom={classroom} />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}