// ============================================================
// ClassroomsListPage.jsx — Teacher creates and manages classrooms
// Parents join via a 6-character code shown here.
// Design-synced with TeacherDashboard (Sage green accent hierarchy)
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Plus, Users, Copy, Check,
  BookOpen, ChevronRight, X, Bell,
  Sparkles, Info, AlertCircle
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

  // ── Added missing parent scheme ──────────────────────────
  parent: {
    pageBg:      '#EEF3FF',
    border:      '#C0CEFA',
    accent:      '#3D55C4',
    accentLight: '#D4DCFA',
    textDark:    '#1B2B80',
    iconBg:      '#D4DCFA',
  },

  amber: {
    pageBg:      'rgba(245, 158, 11, 0.12)',
    border:      'rgba(245, 158, 11, 0.35)',
    accent:      '#B45309',
    textDark:    'var(--text-primary, #78350F)',
  },

  textPrimary: 'var(--text-primary, #28264A)',
  textSecondary: 'var(--text-muted, #6A6898)',
  textMuted: 'var(--text-muted, #9A98C0)',
  primary: 'var(--accent, #3A7A5C)', 
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

// ─── Custom Soft Button Primitives ───────────────────────────
function SoftButton({ children, onClick, color, outline, small, disabled, type = 'button', style: extra = {} }) {
  const [hov, setHov] = useState(false);
  const col = color || C.primary;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: small ? '7px 16px' : '10px 22px',
    borderRadius: 12, fontSize: small ? 13 : 14, fontWeight: 700,
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

// ─── Panel Layout Primitives ─────────────────────────────────
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

export default function ClassroomsListPage() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [copied, setCopied] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);

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
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 0', gap: 14, width: '100%'
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `3px solid ${C.teacher.accentLight}`,
          borderTop: `3px solid ${C.teacher.accent}`,
          animation: 'classroomListSpin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, margin: 0 }}>
          Loading classrooms…
        </p>
        <style>{`@keyframes classroomListSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: '"Nunito", sans-serif',
      color: C.textPrimary,
      maxWidth: 900,
      display: 'flex', flexDirection: 'column', gap: 32,
      width: '100%',
    }}>
      <style>{`
        @keyframes modalPop  { from { opacity:0; transform:scale(0.93) translateY(10px);} to { opacity:1; transform:none;} }
        @media (max-width: 560px) {
          .list-page-header { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .list-page-header button { width: 100% !important; }
          .classroom-card-row { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .classroom-card-actions { width: 100% !important; justify-content: space-between !important; }
          .classroom-card-actions button { flex: 1 !important; }
          .classroom-card-actions > div { flex: 1 !important; width: 100% !important; justify-content: center !important; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="list-page-header" style={{
        borderRadius: 22,
        background: C.teacher.pageBg,
        border: `1.5px solid ${C.teacher.border}`,
        padding: '28px 28px 24px',
        boxShadow: C.shadowSm,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SectionLabel icon={<Users size={12} />} text="Classrooms" />
            {totalPending > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20,
                background: C.amber.pageBg, border: `1px solid ${C.amber.border}`,
                fontSize: 11, fontWeight: 800, color: C.amber.accent,
                marginBottom: 10,
              }}>
                <Bell size={11} />
                {totalPending} pending
              </span>
            )}
          </div>
          <SectionTitle>Classrooms</SectionTitle>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: '6px 0 0', lineHeight: 1.6, maxWidth: 540 }}>
            Create classrooms and share the code with parents so their students can join.
          </p>
        </div>
        <SoftButton
          color={C.teacher.accent}
          onClick={() => { setShowCreate(true); setCreateError(''); }}
          style={{ flexShrink: 0 }}
        >
          <Plus size={16} /> New Classroom
        </SoftButton>
      </div>

      {/* ── How it works banner ────────────────────────────── */}
      <div style={{
        padding: '16px 20px', background: C.parent.pageBg, border: `1.5px solid ${C.parent.border}`,
        borderRadius: 16, display: 'flex', gap: 12, boxShadow: C.shadowSm
      }}>
        <Info size={20} style={{ color: C.parent.accent, flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>
          <strong>How it works:</strong>
          <ol style={{ margin: '4px 0 0', paddingLeft: '16px', listStyleType: 'decimal' }}>
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
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div style={{
            width: '100%', maxWidth: 400,
            borderRadius: 20, background: C.white,
            border: `1.5px solid ${C.border}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
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
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.textMuted, display: 'flex', padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createClassroom} style={{ padding: '22px' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
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
                  background: '#FAFAF8',
                  color: C.textPrimary, fontSize: 14,
                  fontFamily: 'Nunito, sans-serif', outline: 'none',
                  transition: 'border-color 0.15s', marginBottom: 4
                }}
              />
              {createError && (
                <p style={{ color: '#C03030', fontSize: 12, fontWeight: 700, marginTop: 6, margin: '6px 0 0' }}>{createError}</p>
              )}
              <p style={{ fontSize: 11, color: C.textMuted, marginTop: 8, marginBottom: 20 }}>
                A unique 6-character join code will be generated automatically.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <SoftButton type="button" onClick={() => setShowCreate(false)} outline color={C.textPrimary} style={{ flex: 1 }}>
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

      {/* ── Classrooms List Rows Container ────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {classrooms.length === 0 ? (
          <Panel scheme={C.teacher} style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: C.white,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              border: `1px solid ${C.teacher.border}`
            }}>
              <BookOpen size={26} style={{ color: C.teacher.accent }} />
            </div>
            <p style={{ fontFamily: '"Fredoka One", cursive', fontSize: 19, color: C.textPrimary, margin: '0 0 6px' }}>
              No classrooms yet
            </p>
            <p style={{ fontSize: 13, color: C.textMuted, margin: '0 0 20px', lineHeight: 1.5 }}>
              Create your first classroom to start managing students and sharing paths.
            </p>
            <SoftButton onClick={() => setShowCreate(true)} color={C.teacher.accent}>
              Create Your First Classroom
            </SoftButton>
          </Panel>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {classrooms.map((classroom) => {
              const memberCount  = parseInt(classroom.member_count)  || 0;
              const pendingCount = parseInt(classroom.pending_count) || 0;

              return (
                <div
                  key={classroom.id}
                  style={{
                    background: C.white, border: `1.5px solid ${C.border}`,
                    borderRadius: 20, padding: '20px 24px', boxShadow: C.shadowSm,
                  }}
                >
                  <div className="classroom-card-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    {/* Left Side Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: C.textPrimary, margin: 0 }}>
                          {classroom.name}
                        </h3>
                        {pendingCount > 0 && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 9px', borderRadius: 20,
                            background: C.amber.pageBg, border: `1px solid ${C.amber.border}`,
                            fontSize: 11, fontWeight: 800, color: C.amber.accent,
                          }}>
                            <Bell size={10} />
                            {pendingCount} pending
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 6 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.textSecondary }}>
                          <Users size={14} style={{ color: C.textMuted }} />
                          {memberCount} approved member{memberCount !== 1 ? 's' : ''}
                        </span>
                        <span style={{ color: C.border }}>·</span>
                        <span style={{ fontSize: 11, color: C.textMuted }}>
                          Created {new Date(classroom.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Right Side Code Chip & View Details Action */}
                    <div className="classroom-card-actions" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: C.parent.pageBg, border: `1.5px solid ${C.parent.border}`,
                        borderRadius: 12, padding: '8px 14px', height: 42, boxSizing: 'border-box'
                      }}>
                        <span style={{ fontSize: 10, color: C.parent.textDark, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Code</span>
                        <span style={{ fontFamily: '"Courier New", monospace', fontWeight: 900, color: C.textPrimary, letterSpacing: '0.05em', fontSize: 15 }}>
                          {classroom.code}
                        </span>
                        <button
                          onClick={() => copyCode(classroom.code)}
                          title="Copy code"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'flex', padding: 2, marginLeft: 2,
                            color: copied === classroom.code ? C.teacher.accent : C.textMuted,
                            transition: 'color 0.12s'
                          }}
                        >
                          {copied === classroom.code ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>

                      <SoftButton
                        onClick={() => navigate(`/teacher/classrooms/${classroom.id}`)}
                        color={C.parent.accent}
                        style={{ height: 42, minWidth: 110 }}
                      >
                        Manage
                        <ChevronRight size={14} />
                      </SoftButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}