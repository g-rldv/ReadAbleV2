// ============================================================
// ParentClassroomPage.jsx — Redesigned to match ParentDashboard
// Soft pastels · Lucide icons · No emojis · Nunito + Fredoka One
// ============================================================
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Hash, CalendarDays,
  ClipboardList, GraduationCap, ChevronRight,
  Sparkles, AlertCircle, FileText,
} from 'lucide-react';
import api from '../../utils/api';

// ─── Design tokens (mirrored from ParentDashboard) ───────────
const C = {
  page: '#F2F0FA',
  white: '#FFFFFF',
  border: '#DDD8F2',
  shadowSm: '0 1px 8px rgba(80,60,160,0.07)',
  shadowMd: '0 4px 24px rgba(80,60,160,0.10)',

  parent: {
    pageBg: '#FDF0E8',
    cardBg: '#FFFAF6',
    border: '#F0C8A8',
    accent: '#C06038',
    accentLight: '#FAE0C8',
    textDark: '#6A2810',
    btnBg: '#C06038',
    btnText: '#FFFFFF',
    iconBg: '#FAD8C0',
    iconColor: '#C06038',
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

  textPrimary: '#28264A',
  textSecondary: '#6A6898',
  textMuted: '#9A98C0',
  primary: '#5A50A0',
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

function BackButton({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 12,
        background: hov ? C.parent.pageBg : C.white,
        border: `1.5px solid ${hov ? C.parent.border : C.border}`,
        color: C.parent.accent,
        fontSize: 13, fontWeight: 700,
        fontFamily: 'Nunito, sans-serif',
        cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: C.shadowSm,
      }}
    >
      <ArrowLeft size={14} />
      Back to Classrooms
    </button>
  );
}

// ─── Activity card ────────────────────────────────────────────
function ActivityCard({ activity }) {
  const [hov, setHov] = useState(false);
  const date = activity.created_at
    ? new Date(activity.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.student.pageBg : C.white,
        border: `1.5px solid ${hov ? C.student.border : C.border}`,
        borderRadius: 16,
        padding: '18px 20px',
        boxShadow: hov ? C.shadowMd : C.shadowSm,
        transition: 'all 0.18s',
        transform: hov ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      {/* Icon + Title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: C.student.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={18} style={{ color: C.student.accent }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 800, color: C.textPrimary,
            margin: 0, lineHeight: 1.3,
          }}>
            {activity.title}
          </p>
          {activity.description && (
            <p style={{
              fontSize: 12, color: C.textSecondary,
              margin: '4px 0 0', lineHeight: 1.5,
            }}>
              {activity.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      {date && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          paddingTop: 6,
          borderTop: `1px solid ${C.border}`,
        }}>
          <CalendarDays size={11} style={{ color: C.textMuted }} />
          <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>
            Published {date}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function ParentClassroomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/classrooms/${id}/activities`);
        setClassroom(res.data.classroom || null);
        setActivities(res.data.activities || []);
      } catch (err) {
        console.error('[ParentClassroom] Failed to load activities:', err);
        setError(err.response?.data?.error || 'Failed to load classroom activities');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '64px 0', gap: 14,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `3px solid ${C.parent.accentLight}`,
          borderTop: `3px solid ${C.parent.accent}`,
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, margin: 0 }}>
          Loading classroom…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        fontFamily: 'Nunito, sans-serif',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <BackButton onClick={() => navigate('/parent/join-classroom')} />
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '18px 20px', borderRadius: 16,
          background: '#FEF2F2', border: '1.5px solid #FECACA',
          boxShadow: C.shadowSm,
        }}>
          <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  // ── Main page ─────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: '"Nunito", sans-serif',
      color: C.textPrimary,
      maxWidth: 900,
      display: 'flex', flexDirection: 'column', gap: 28,
    }}>

      {/* Back button */}
      <div>
        <BackButton onClick={() => navigate('/parent/join-classroom')} />
      </div>

      {/* ── Classroom header ──────────────────────────────── */}
      <div style={{
        borderRadius: 22,
        background: C.parent.pageBg,
        border: `1.5px solid ${C.parent.border}`,
        padding: '28px 28px 24px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 18,
        boxShadow: C.shadowSm,
      }}>
        <div>
          <SectionLabel icon={<GraduationCap size={12} />} text="Classroom" />
          <SectionTitle>{classroom?.name || 'Classroom'}</SectionTitle>

          {classroom?.code && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 8,
              padding: '5px 12px', borderRadius: 20,
              background: C.parent.accentLight,
              border: `1px solid ${C.parent.border}`,
            }}>
              <Hash size={12} style={{ color: C.parent.accent }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: C.parent.textDark }}>
                {classroom.code}
              </span>
            </div>
          )}
        </div>

        {/* Activity count badge */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
        }}>
          <div style={{
            padding: '10px 20px', borderRadius: 16,
            background: C.white,
            border: `1.5px solid ${C.parent.border}`,
            boxShadow: C.shadowSm,
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: '"Fredoka One", cursive',
              fontSize: 28, color: C.parent.accent, margin: 0, lineHeight: 1,
            }}>
              {activities.length}
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, margin: '3px 0 0' }}>
              {activities.length === 1 ? 'Activity' : 'Activities'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Activities section ────────────────────────────── */}
      <section>
        <div style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: '24px 24px 20px',
          boxShadow: C.shadowSm,
        }}>
          <div style={{ marginBottom: 20 }}>
            <SectionLabel icon={<ClipboardList size={12} />} text="Activities" />
            <SectionTitle>Assigned Activities</SectionTitle>
          </div>

          {activities.length === 0 ? (
            /* Empty state */
            <div style={{
              background: C.student.pageBg,
              border: `1.5px solid ${C.student.border}`,
              borderRadius: 16,
              padding: '40px 28px',
              textAlign: 'center',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: C.student.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <FileText size={24} style={{ color: C.student.accent }} />
              </div>
              <p style={{
                fontFamily: '"Fredoka One", cursive',
                fontSize: 18, color: C.student.textDark, margin: '0 0 6px',
              }}>
                No activities yet
              </p>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>
                The teacher hasn't assigned any activities to this classroom.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 14,
            }}>
              {activities.map(a => (
                <ActivityCard key={a.id} activity={a} />
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}