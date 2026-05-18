// ============================================================
// ClassroomsListPage.jsx — Redesigned to match AssessmentsListPage
// Soft pastels · Lucide icons · No emojis · Nunito + Fredoka One
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Users, PlusCircle, BookOpen, Copy, Check,
  ChevronRight, Bell, Info, X, Sparkles,
  CheckCircle2, Clock, Hash, UserCheck,
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

  textPrimary:   '#28264A',
  textSecondary: '#6A6898',
  textMuted:     '#9A98C0',
  primary:       '#5A50A0',
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
    <button
      type={type} onClick={onClick} disabled={disabled}
      style={outline ? outlined : filled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  );
}

// ─── Classroom card ───────────────────────────────────────────
function ClassroomCard({ classroom, onCopy, copied, onManage }) {
  const [hov, setHov] = useState(false);
  const memberCount  = parseInt(classroom.member_count)  || 0;
  const pendingCount = parseInt(classroom.pending_count) || 0;
  const hasPending   = pendingCount > 0;
  const scheme       = hasPending ? C.parent : C.teacher;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? scheme.pageBg : C.white,
        border: `1.5px solid ${hov ? scheme.border : C.border}`,
        borderRadius: 18,
        padding: '22px 22px 18px',
        boxShadow: hov ? C.shadowMd : C.shadowSm,
        transition: 'all 0.18s',
        transform: hov ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}
    >
      {/* Header row: icon + status badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: scheme.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={20} style={{ color: scheme.accent }} />
        </div>
        {hasPending ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 20,
            background: C.parent.accentLight,
            border: `1px solid ${C.parent.border}`,
            fontSize: 11, fontWeight: 800, color: C.parent.textDark,
            whiteSpace: 'nowrap',
          }}>
            <Bell size={11} /> {pendingCount} pending
          </span>
        ) : (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 20,
            background: C.teacher.accentLight,
            border: `1px solid ${C.teacher.border}`,
            fontSize: 11, fontWeight: 800, color: C.teacher.textDark,
            whiteSpace: 'nowrap',
          }}>
            <CheckCircle2 size={11} /> Active
          </span>
        )}
      </div>

      {/* Name + created date */}
      <div>
        <p style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, margin: '0 0 5px', lineHeight: 1.3 }}>
          {classroom.name}
        </p>
        {classroom.created_at && (
          <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>
            Created {new Date(classroom.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* Meta chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: C.student.accentLight, border: `1px solid ${C.student.border}`,
          fontSize: 11, fontWeight: 700, color: C.student.textDark,
        }}>
          <Users size={10} /> {memberCount} member{memberCount !== 1 ? 's' : ''}
        </div>
        {/* Clickable join code chip */}
        <button
          onClick={() => onCopy(classroom.code)}
          title="Click to copy join code"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20,
            background: '#F0EDF8', border: `1px solid ${C.border}`,
            fontSize: 11, fontWeight: 700, color: C.textSecondary,
            cursor: 'pointer', transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#E8E4F4'; e.currentTarget.style.borderColor = '#C8C0F0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F0EDF8'; e.currentTarget.style.borderColor = C.border; }}
        >
          <Hash size={10} />
          <span style={{ fontFamily: '"Courier New", monospace', letterSpacing: '0.04em' }}>
            {classroom.code}
          </span>
          {copied === classroom.code
            ? <Check size={10} style={{ color: C.teacher.accent }} />
            : <Copy size={10} />}
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button
          onClick={() => onManage(classroom.id)}
          style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            background: scheme.accent, color: '#FFFFFF',
            fontFamily: 'Nunito, sans-serif', fontWeight: 700,
            fontSize: 13, cursor: 'pointer',
            border: `2px solid ${scheme.accent}`,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <UserCheck size={13} /> Manage
        </button>
        <button
          onClick={() => onCopy(classroom.code)}
          title="Copy join code"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            background: 'transparent', color: C.textSecondary,
            fontFamily: 'Nunito, sans-serif', fontWeight: 700,
            fontSize: 13, cursor: 'pointer',
            border: `2px solid ${C.border}`,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.page; e.currentTarget.style.borderColor = scheme.border; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border; }}
        >
          {copied === classroom.code ? <Check size={13} /> : <Copy size={13} />}
          {copied === classroom.code ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function ClassroomsListPage() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName]       = useState('');
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState('');
  const [copied, setCopied]         = useState(null);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => { fetchClassrooms(); }, []);

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

  const totalMembers = classrooms.reduce((s, c) => s + (parseInt(c.member_count)  || 0), 0);
  const totalPending = classrooms.reduce((s, c) => s + (parseInt(c.pending_count) || 0), 0);

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
          Loading classrooms…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Dashboard ───────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: '"Nunito", sans-serif',
      color: C.textPrimary,
      maxWidth: 900,
      display: 'flex', flexDirection: 'column', gap: 36,
    }}>
      <style>{`@keyframes modalPop { from { opacity:0; transform:scale(0.93) translateY(10px);} to { opacity:1; transform:none;} }`}</style>

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
          <SectionLabel icon={<Users size={12} />} text="Classrooms" />
          <SectionTitle>Your classrooms</SectionTitle>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: '6px 0 0', lineHeight: 1.6, maxWidth: 460 }}>
            Create classrooms and share the join code with parents so their students can join.
          </p>
        </div>
        <SoftButton
          color={C.teacher.accent}
          onClick={() => { setShowCreate(true); setCreateError(''); }}
          style={{ flexShrink: 0 }}
        >
          <PlusCircle size={16} /> Create Classroom
        </SoftButton>
      </div>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {[
          { icon: BookOpen, label: 'Total',   value: classrooms.length, scheme: C.teacher },
          { icon: Users,    label: 'Members', value: totalMembers,      scheme: C.student },
          { icon: Clock,    label: 'Pending', value: totalPending,      scheme: C.parent  },
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

      {/* ── How it works info banner ─────────────────────────── */}
      <div style={{
        padding: '16px 20px',
        background: C.student.pageBg,
        border: `1.5px solid ${C.student.border}`,
        borderRadius: 16, display: 'flex', gap: 12, boxShadow: C.shadowSm,
      }}>
        <Info size={20} style={{ color: C.student.accent, flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: C.textPrimary, lineHeight: 1.7 }}>
          <strong>How it works:</strong>
          <ol style={{ margin: '4px 0 0', paddingLeft: 16, listStyleType: 'decimal' }}>
            <li>Create a classroom to get a unique 6-character join code.</li>
            <li>Share that code with parents via email or verbally.</li>
            <li>Parents enter the code on their Classroom page to request access.</li>
            <li>Click <strong>Manage</strong> on any classroom to approve or reject requests.</li>
          </ol>
        </div>
      </div>

      {/* ── Classrooms grid ──────────────────────────────────── */}
      <section>
        <SectionLabel icon={<Sparkles size={13} />} text="All Classrooms" />
        <SectionTitle style={{ marginBottom: 16 }}>Browse your classrooms</SectionTitle>

        {classrooms.length === 0 ? (
          <div style={{
            background: C.teacher.pageBg,
            border: `1.5px solid ${C.teacher.border}`,
            borderRadius: 20, padding: '40px 28px',
            textAlign: 'center', boxShadow: C.shadowSm,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: C.teacher.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <BookOpen size={28} style={{ color: C.teacher.accent }} />
            </div>
            <p style={{
              fontFamily: '"Fredoka One", cursive',
              fontSize: 20, color: C.teacher.textDark, margin: '0 0 6px',
            }}>
              No classrooms yet
            </p>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 20px', lineHeight: 1.6 }}>
              Create your first classroom to start managing students and sharing paths.
            </p>
            <SoftButton color={C.teacher.accent} onClick={() => setShowCreate(true)}>
              Create Classroom <ChevronRight size={14} />
            </SoftButton>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: 16,
          }}>
            {classrooms.map(classroom => (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                onCopy={copyCode}
                copied={copied}
                onManage={(id) => navigate(`/teacher/classrooms/${id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Create classroom modal ───────────────────────────── */}
      {showCreate && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div style={{
            width: '100%', maxWidth: 400,
            borderRadius: 20, background: C.white,
            border: `1.5px solid ${C.border}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            animation: 'modalPop 0.22s ease-out',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 22px', borderBottom: `1.5px solid ${C.border}`,
            }}>
              <p style={{ fontFamily: '"Fredoka One", cursive', fontSize: 18, color: C.textPrimary, margin: 0 }}>
                Create Classroom
              </p>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createClassroom} style={{ padding: 22 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 800,
                color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase',
              }}>
                Classroom Name <span style={{ color: '#C03030' }}>*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="e.g. Room 3B — Reading Group"
                autoFocus
                maxLength={100}
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '11px 14px', borderRadius: 12,
                  border: `1.5px solid ${inputFocused ? C.teacher.accent : C.border}`,
                  background: '#FAFAF8', color: C.textPrimary,
                  fontSize: 14, fontFamily: 'Nunito, sans-serif',
                  outline: 'none', transition: 'border-color 0.15s',
                }}
              />
              {createError && (
                <p style={{ color: '#C03030', fontSize: 12, fontWeight: 700, margin: '6px 0 0' }}>{createError}</p>
              )}
              <p style={{ fontSize: 11, color: C.textMuted, margin: '8px 0 20px' }}>
                A unique 6-character join code will be generated automatically.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <SoftButton type="button" onClick={() => setShowCreate(false)} outline color={C.textSecondary} style={{ flex: 1 }}>
                  Cancel
                </SoftButton>
                <SoftButton type="submit" disabled={creating || !newName.trim()} color={C.teacher.accent} style={{ flex: 1 }}>
                  {creating ? 'Creating…' : 'Create Classroom'}
                </SoftButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}