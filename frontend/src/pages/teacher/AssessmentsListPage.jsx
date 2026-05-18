// ============================================================
// AssessmentsListPage.jsx — Redesigned to match TeacherDashboard
// Soft pastels · Lucide icons · No emojis · Nunito + Fredoka One
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, PlusCircle, Edit2, Share2,
  BarChart2, BookOpen, Calendar, Tag,
  ChevronRight, Sparkles, CheckCircle2, Clock,
} from 'lucide-react';
import api from '../../utils/api';

// ─── Design tokens (exact mirror of TeacherDashboard) ────────
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

const DIFFICULTY_LABELS = {
  1: 'Level 1 · Foundational',
  2: 'Level 2 · Basic',
  3: 'Level 3 · Paragraphs',
  4: 'Level 4 · Complex',
};
const DIFFICULTY_SCHEMES = {
  1: C.teacher,
  2: C.student,
  3: C.parent,
  4: { pageBg:'#F5EBF8', border:'#D8B8E8', accent:'#7A3A8A', accentLight:'#EDD8F8', textDark:'#3A1048', iconBg:'#EDD8F8' },
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

function SoftButton({ children, to, onClick, color, outline, small, style: extra = {} }) {
  const [hov, setHov] = useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: small ? '7px 16px' : '10px 20px',
    borderRadius: 12, fontSize: small ? 13 : 14, fontWeight: 700,
    fontFamily: 'Nunito, sans-serif', cursor: 'pointer',
    border: `2px solid ${color || C.primary}`,
    transition: 'all 0.15s', textDecoration: 'none',
    ...extra,
  };
  const s = outline
    ? { ...base, background: hov ? `${color}12` : 'transparent', color: color || C.primary }
    : { ...base, background: hov ? `${color}DD` : (color || C.primary), color: '#FFFFFF' };

  if (to) return <Link to={to} style={s} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>{children}</Link>;
  return <button onClick={onClick} style={s} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>{children}</button>;
}

// ─── Assessment card ──────────────────────────────────────────
function AssessmentCard({ assessment, formatDate }) {
  const [hov, setHov] = useState(false);
  const lvl = assessment.difficulty_level || 1;
  const scheme = DIFFICULTY_SCHEMES[lvl] || C.teacher;
  const diffLabel = DIFFICULTY_LABELS[lvl] || `Level ${lvl}`;

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: scheme.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ClipboardList size={20} style={{ color: scheme.accent }} />
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 20,
          background: assessment.is_published ? C.teacher.accentLight : '#F4F0FF',
          border: `1px solid ${assessment.is_published ? C.teacher.border : C.border}`,
          fontSize: 11, fontWeight: 800,
          color: assessment.is_published ? C.teacher.textDark : C.textMuted,
          display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
        }}>
          {assessment.is_published
            ? <><CheckCircle2 size={11} /> Published</>
            : <><Clock size={11} /> Draft</>}
        </div>
      </div>

      {/* Title + desc */}
      <div>
        <p style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, margin: '0 0 5px', lineHeight: 1.3 }}>
          {assessment.title}
        </p>
        {assessment.description && (
          <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {assessment.description}
          </p>
        )}
      </div>

      {/* Meta chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {assessment.story_theme && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20,
            background: '#F0EDF8', border: `1px solid ${C.border}`,
            fontSize: 11, fontWeight: 700, color: C.textSecondary,
          }}>
            <Tag size={10} /> {assessment.story_theme}
          </div>
        )}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20,
          background: scheme.accentLight,
          border: `1px solid ${scheme.border}`,
          fontSize: 11, fontWeight: 700, color: scheme.textDark,
        }}>
          <BarChart2 size={10} /> {diffLabel}
        </div>
        {assessment.created_at && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20,
            background: '#F0EDF8', border: `1px solid ${C.border}`,
            fontSize: 11, fontWeight: 700, color: C.textMuted,
          }}>
            <Calendar size={10} /> {formatDate(assessment.created_at)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <Link
          to={`/teacher/assessments/${assessment.id}/edit`}
          style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            background: scheme.accent, color: '#FFFFFF',
            fontFamily: 'Nunito, sans-serif', fontWeight: 700,
            fontSize: 13, textDecoration: 'none',
            border: `2px solid ${scheme.accent}`,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Edit2 size={13} /> Edit
        </Link>
        <button
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
          <Share2 size={13} /> Share
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function AssessmentsListPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await api.get('/assessments');
        setAssessments(res.data.assessments || []);
      } catch (err) {
        console.error('Failed to fetch assessments:', err);
        setError(err.message || 'Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

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
          Loading assessments…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        padding: '18px 20px', borderRadius: 14,
        background: '#FEF0F0', border: '1.5px solid #F8C8C8',
        color: '#C03030', fontFamily: 'Nunito, sans-serif',
        fontSize: 13, fontWeight: 700,
      }}>
        {error}
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
          <SectionLabel icon={<ClipboardList size={12} />} text="Assessments" />
          <SectionTitle>Your assessments</SectionTitle>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: '6px 0 0', lineHeight: 1.6, maxWidth: 460 }}>
            Create and manage literacy assessments for your students.
          </p>
        </div>
        <SoftButton to="/teacher/assessments/new" color={C.teacher.accent} style={{ flexShrink: 0 }}>
          <PlusCircle size={16} /> Create Assessment
        </SoftButton>
      </div>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {[
          { icon: ClipboardList, label: 'Total', value: assessments.length, scheme: C.teacher },
          { icon: CheckCircle2,  label: 'Published', value: assessments.filter(a => a.is_published).length, scheme: C.student },
          { icon: Clock,         label: 'Drafts', value: assessments.filter(a => !a.is_published).length, scheme: C.parent },
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

      {/* ── List / Grid ──────────────────────────────────────── */}
      <section>
        <SectionLabel icon={<Sparkles size={13} />} text="All Assessments" />
        <SectionTitle style={{ marginBottom: 16 }}>Browse your library</SectionTitle>

        {assessments.length === 0 ? (
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
              No assessments yet
            </p>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 20px', lineHeight: 1.6 }}>
              Click "Create Assessment" to build your first reading assessment.
            </p>
            <SoftButton to="/teacher/assessments/new" color={C.teacher.accent}>
              Create Assessment <ChevronRight size={14} />
            </SoftButton>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: 16,
          }}>
            {assessments.map(assessment => (
              <AssessmentCard key={assessment.id} assessment={assessment} formatDate={formatDate} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}