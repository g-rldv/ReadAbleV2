// ============================================================
// StudentModePage — ASD-optimized assessment launcher for parents
// Fixed: uses GET /assessments (not /assessments/assigned)
// Fixed: starts a session first, then navigates with session ID
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import {
  Play, AlertCircle, Baby, BookOpen,
  BarChart2, ChevronDown, Users, Loader2,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────
const C = {
  white:  '#FFFFFF',
  border: '#DDD8F2',
  shadowSm: '0 1px 8px rgba(80,60,160,0.07)',
  shadowMd: '0 4px 24px rgba(80,60,160,0.12)',
  student: {
    pageBg:      '#EBF0FF',
    border:      '#B8C8F0',
    accent:      '#4058C0',
    accentLight: '#D0D8F8',
    textDark:    '#1A2870',
    iconBg:      '#D0D8F8',
  },
  teacher: {
    pageBg:      '#EBF4EF',
    border:      '#B8D8C4',
    accent:      '#3A7A5C',
    accentLight: '#CCEADB',
    textDark:    '#1A4A38',
    iconBg:      '#D0EDE0',
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
};

const DIFFICULTY_META = {
  1: { label: 'Foundational', color: '#3A7A5C', bg: '#CCEADB', border: '#B8D8C4' },
  2: { label: 'Basic',        color: '#4058C0', bg: '#D0D8F8', border: '#B8C8F0' },
  3: { label: 'Paragraphs',   color: '#7050C0', bg: '#E8DEFF', border: '#C8B8F0' },
  4: { label: 'Complex',      color: '#C06038', bg: '#FAE0C8', border: '#F0C8A8' },
};

function DifficultyBadge({ level }) {
  const m = DIFFICULTY_META[level] || DIFFICULTY_META[1];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 8, fontSize: 11,
      fontWeight: 800, background: m.bg,
      border: `1.5px solid ${m.border}`, color: m.color,
    }}>
      <BarChart2 size={10} /> {m.label}
    </span>
  );
}

export default function StudentModePage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [assessments, setAssessments]       = useState([]);
  const [children,    setChildren]          = useState([]);
  const [loading,     setLoading]           = useState(true);
  const [error,       setError]             = useState(null);

  // Per-assessment state: which child is selected + loading flag
  const [selectedChild, setSelectedChild]   = useState({});   // { [assessmentId]: childId }
  const [starting,      setStarting]        = useState(null); // assessmentId being started

  // ── Load assessments + children on mount ─────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [assessRes, childRes] = await Promise.all([
          api.get('/assessments'),           // returns published assessments for this parent
          api.get('/parent/children'),
        ]);

        const published = (assessRes.data.assessments || []).filter(a => a.is_published);
        setAssessments(published);
        setChildren(childRes.data.children || []);
        setError(null);
      } catch (err) {
        console.error('StudentModePage fetch error:', err);
        setError('Could not load assessments. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Start session then navigate to GamePage ──────────────────
  const handleStart = async (assessment) => {
    const childId = selectedChild[assessment.id];
    if (!childId) {
      alert('Please select a child before starting.');
      return;
    }

    setStarting(assessment.id);
    try {
      const res = await api.post('/sessions/start', {
        assessment_id: assessment.id,
        child_id:      childId,
      });
      const sessionId = res.data.session?.id;
      if (!sessionId) throw new Error('No session ID returned');
      navigate(`/assessment/${sessionId}`);
    } catch (err) {
      console.error('Failed to start session:', err);
      alert(err.response?.data?.error || 'Could not start assessment. Please try again.');
    } finally {
      setStarting(null);
    }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      fontFamily: 'Nunito, sans-serif',
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `3px solid ${C.student.accentLight}`,
        borderTop: `3px solid ${C.student.accent}`,
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 14, fontWeight: 700, color: C.textSecondary, margin: 0 }}>
        Loading assessments…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────
  if (error) return (
    <div style={{
      fontFamily: 'Nunito, sans-serif',
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '18px 20px', borderRadius: 16, maxWidth: 560,
      background: '#FEF0F0', border: '1.5px solid #F8C8C8',
      color: '#C03030', fontWeight: 700, fontSize: 13,
    }}>
      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      {error}
    </div>
  );

  // ── No assessments ────────────────────────────────────────────
  if (assessments.length === 0) return (
    <div style={{
      fontFamily: 'Nunito, sans-serif',
      maxWidth: 560, margin: '0 auto',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{
        background: C.student.pageBg,
        border: `1.5px solid ${C.student.border}`,
        borderRadius: 22, padding: '28px',
        marginBottom: 24, boxShadow: C.shadowSm,
      }}>
        <h1 style={{
          fontFamily: '"Fredoka One", cursive',
          fontSize: 28, color: C.student.textDark, margin: '0 0 6px',
        }}>
          Student Mode
        </h1>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>
          No published assessments are available yet. Ask your child's teacher to publish one.
        </p>
      </div>

      <button
        onClick={() => navigate('/parent/dashboard')}
        style={{
          padding: '10px 22px', borderRadius: 12,
          border: `2px solid ${C.student.accent}`,
          background: 'transparent', color: C.student.accent,
          fontFamily: 'Nunito, sans-serif', fontWeight: 700,
          fontSize: 14, cursor: 'pointer',
        }}
      >
        ← Back to Dashboard
      </button>
    </div>
  );

  // ── No children ───────────────────────────────────────────────
  if (children.length === 0) return (
    <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: 560, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        background: C.parent.pageBg,
        border: `1.5px solid ${C.parent.border}`,
        borderRadius: 22, padding: '28px',
        marginBottom: 24, boxShadow: C.shadowSm,
        textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: C.parent.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }}>
          <Baby size={26} style={{ color: C.parent.accent }} />
        </div>
        <h2 style={{
          fontFamily: '"Fredoka One", cursive',
          fontSize: 22, color: C.parent.textDark, margin: '0 0 6px',
        }}>
          No children yet
        </h2>
        <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>
          Add a child profile first before starting an assessment session.
        </p>
      </div>
      <button
        onClick={() => navigate('/parent/children')}
        style={{
          padding: '10px 22px', borderRadius: 12,
          border: `2px solid ${C.parent.accent}`,
          background: C.parent.accent, color: '#FFF',
          fontFamily: 'Nunito, sans-serif', fontWeight: 700,
          fontSize: 14, cursor: 'pointer',
        }}
      >
        Add a Child
      </button>
    </div>
  );

  // ── Main view ─────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: '"Nunito", sans-serif',
      color: C.textPrimary,
      maxWidth: 720,
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hero header */}
      <div style={{
        background: C.student.pageBg,
        border: `1.5px solid ${C.student.border}`,
        borderRadius: 22, padding: '26px 28px',
        boxShadow: C.shadowSm,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: C.student.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={24} style={{ color: C.student.accent }} />
          </div>
          <h1 style={{
            fontFamily: '"Fredoka One", cursive',
            fontSize: 'clamp(22px, 4vw, 30px)',
            color: C.student.textDark, margin: 0, lineHeight: 1.1,
          }}>
            Let's Read Together!
          </h1>
        </div>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>
          Choose an assessment below. Select which child will do the reading, then tap Start.
        </p>
      </div>

      {/* Assessment cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {assessments.map(assessment => {
          const childId    = selectedChild[assessment.id] || '';
          const isStarting = starting === assessment.id;
          const canStart   = childId && !isStarting;

          return (
            <div key={assessment.id} style={{
              background: C.white,
              border: `1.5px solid ${C.border}`,
              borderRadius: 20, overflow: 'hidden',
              boxShadow: C.shadowSm,
            }}>
              {/* Top colour stripe */}
              <div style={{
                height: 5,
                background: DIFFICULTY_META[assessment.difficulty_level]?.color || C.student.accent,
              }} />

              <div style={{ padding: '20px 22px' }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: C.student.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BookOpen size={18} style={{ color: C.student.accent }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 16, fontWeight: 900, color: C.textPrimary,
                      margin: '0 0 5px', lineHeight: 1.2,
                    }}>
                      {assessment.title}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      <DifficultyBadge level={assessment.difficulty_level} />
                      {assessment.story_theme && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: C.textMuted,
                          background: '#F0EFFA', border: `1px solid ${C.border}`,
                          padding: '2px 8px', borderRadius: 8,
                        }}>
                          {assessment.story_theme}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {assessment.description && (
                  <p style={{
                    fontSize: 13, color: C.textSecondary, lineHeight: 1.55,
                    margin: '0 0 14px',
                  }}>
                    {assessment.description}
                  </p>
                )}

                {/* Age note */}
                {(assessment.recommended_age_min || assessment.recommended_age_max) && (
                  <p style={{
                    fontSize: 11, color: C.textMuted, fontWeight: 700,
                    margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Users size={10} />
                    Recommended ages {assessment.recommended_age_min}–{assessment.recommended_age_max}
                  </p>
                )}

                {/* Child picker + Start button */}
                <div style={{
                  display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                  paddingTop: 14, borderTop: `1px solid ${C.border}`,
                }}>
                  {/* Child selector */}
                  <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
                    <ChevronDown size={13} style={{
                      position: 'absolute', right: 10, top: '50%',
                      transform: 'translateY(-50%)', color: C.textMuted,
                      pointerEvents: 'none',
                    }} />
                    <select
                      value={childId}
                      onChange={e => setSelectedChild(prev => ({
                        ...prev,
                        [assessment.id]: e.target.value,
                      }))}
                      style={{
                        width: '100%', appearance: 'none',
                        padding: '9px 32px 9px 12px', borderRadius: 10,
                        border: `1.5px solid ${childId ? C.student.border : C.border}`,
                        background: childId ? C.student.pageBg : '#FAFAF8',
                        color: childId ? C.textPrimary : C.textMuted,
                        fontFamily: 'Nunito, sans-serif',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        outline: 'none', transition: 'border-color 0.15s',
                      }}
                    >
                      <option value="">Select child…</option>
                      {children.map(child => (
                        <option key={child.id} value={child.id}>
                          {child.first_name} {child.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start button */}
                  <button
                    onClick={() => handleStart(assessment)}
                    disabled={!canStart}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 22px', borderRadius: 12,
                      border: `2px solid ${canStart ? C.student.accent : C.border}`,
                      background: canStart ? C.student.accent : C.border,
                      color: canStart ? '#FFFFFF' : C.textMuted,
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 800, fontSize: 14,
                      cursor: canStart ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { if (canStart) e.currentTarget.style.opacity = '0.85'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  >
                    {isStarting
                      ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Starting…</>
                      : <><Play size={16} /> Start</>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Back link */}
      <button
        onClick={() => navigate('/parent/dashboard')}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 18px', borderRadius: 10,
          border: `1.5px solid ${C.border}`, background: 'transparent',
          color: C.textSecondary, fontFamily: 'Nunito, sans-serif',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.student.border; e.currentTarget.style.color = C.student.accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSecondary; }}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}