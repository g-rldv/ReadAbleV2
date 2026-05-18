// ============================================================
// ParentDashboard.jsx — Redesigned to match LandingPage style
// Soft pastels · Lucide icons · No emojis · Nunito + Fredoka One
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FileText, BookOpen, ArrowRight,
  GraduationCap, BarChart2, PlayCircle,
  CheckCircle2, Clock, ChevronRight, Sparkles,
  Baby, Home,
} from 'lucide-react';
import api from '../../utils/api';

// ─── Design tokens (mirrored from LandingPage) ───────────────
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
  const filled = {
    ...base,
    background: hov ? `${color}DD` : (color || C.primary),
    color: '#FFFFFF',
  };
  const outlineStyle = {
    ...base,
    background: hov ? `${color}12` : 'transparent',
    color: color || C.primary,
  };
  const s = outline ? outlineStyle : filled;

  if (to) {
    return (
      <Link to={to} style={s}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} style={s}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  );
}

// ─── Stat card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, scheme, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? scheme.pageBg : C.white,
        border: `1.5px solid ${hov ? scheme.border : C.border}`,
        borderRadius: 18, padding: '22px 22px 18px',
        boxShadow: hov ? C.shadowMd : C.shadowSm,
        transition: 'all 0.18s',
        transform: hov ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: scheme.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} style={{ color: scheme.accent }} />
        </div>
        {badge != null && badge > 0 && (
          <div style={{
            padding: '3px 10px', borderRadius: 20,
            background: scheme.accentLight,
            border: `1px solid ${scheme.border}`,
            fontSize: 11, fontWeight: 800, color: scheme.textDark,
          }}>
            {badge} new
          </div>
        )}
      </div>

      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, margin: '0 0 4px' }}>
          {label}
        </p>
        <p style={{
          fontFamily: '"Fredoka One", cursive',
          fontSize: 36, color: scheme.accent, margin: 0, lineHeight: 1,
        }}>
          {value}
        </p>
        <p style={{ fontSize: 12, color: C.textMuted, margin: '4px 0 0' }}>{sub}</p>
      </div>
    </div>
  );
}

// ─── Quick action tile ────────────────────────────────────────
function ActionTile({ icon: Icon, label, desc, to, scheme }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 18px',
        borderRadius: 16,
        background: hov ? scheme.pageBg : C.white,
        border: `1.5px solid ${hov ? scheme.border : C.border}`,
        boxShadow: hov ? C.shadowMd : C.shadowSm,
        transition: 'all 0.18s',
        transform: hov ? 'translateY(-1px)' : 'none',
        textDecoration: 'none',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: scheme.iconBg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} style={{ color: scheme.accent }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 0' }}>{desc}</p>
      </div>
      <ChevronRight size={16} style={{ color: C.textMuted, flexShrink: 0 }} />
    </Link>
  );
}

// ─── Child row ────────────────────────────────────────────────
function ChildRow({ child }) {
  const [hov, setHov] = useState(false);
  const initials = `${child.first_name?.[0] ?? ''}${child.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <Link
      to={`/parent/children/${child.id}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderRadius: 14,
        background: hov ? C.parent.pageBg : C.white,
        border: `1.5px solid ${hov ? C.parent.border : C.border}`,
        transition: 'all 0.15s',
        textDecoration: 'none',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 42, height: 42, borderRadius: 14,
        background: C.parent.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontFamily: '"Fredoka One", cursive',
        fontSize: 16, color: C.parent.accent,
      }}>
        {initials || <Baby size={18} style={{ color: C.parent.accent }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: 0 }}>
          {child.first_name} {child.last_name}
        </p>
        {child.teacher_first_name && (
          <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <GraduationCap size={12} />
            {child.teacher_first_name} {child.teacher_last_name}
          </p>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 20,
        background: C.parent.accentLight,
        border: `1px solid ${C.parent.border}`,
        fontSize: 12, fontWeight: 700, color: C.parent.textDark,
      }}>
        View <ChevronRight size={12} />
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function ParentDashboard() {
  const [stats, setStats] = useState({
    childrenCount: 0,
    pendingReports: 0,
    enrolledClassrooms: 0,
  });
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [childrenRes, reportsRes, classroomsRes] = await Promise.all([
          api.get('/parent/children'),
          api.get('/reports'),
          api.get('/classrooms/my'),
        ]);

        const childrenList = childrenRes.data.children || [];
        const reports = reportsRes.data.reports || [];
        const unreadReports = reports.filter(r => !r.is_read).length;
        const classrooms = classroomsRes.data.classrooms || [];
        const approvedCount = classrooms.filter(c => c.status === 'approved').length;

        setChildren(childrenList);
        setStats({
          childrenCount: childrenList.length,
          pendingReports: unreadReports,
          enrolledClassrooms: approvedCount,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
          Loading dashboard…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: '"Nunito", sans-serif',
      color: C.textPrimary,
      maxWidth: 900,
      display: 'flex', flexDirection: 'column', gap: 36,
    }}>

      {/* ── Welcome header ───────────────────────────────── */}
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
          <SectionLabel icon={<Home size={12} />} text="Parent Dashboard" />
          <SectionTitle>Welcome to ReadAble</SectionTitle>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: '6px 0 0', lineHeight: 1.6, maxWidth: 480 }}>
            Monitor your child's reading assessments and launch student sessions at home.
          </p>
        </div>
        <SoftButton to="/student-mode" color={C.parent.accent} style={{ flexShrink: 0 }}>
          <PlayCircle size={16} /> Launch Student Mode
        </SoftButton>
      </div>

      {/* ── Stats ────────────────────────────────────────── */}
      <section>
        <SectionLabel icon={<BarChart2 size={13} />} text="Overview" />
        <SectionTitle style={{ marginBottom: 16 }}>Your snapshot</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}>
          <StatCard
            icon={Users}
            label="Your Children"
            value={stats.childrenCount}
            sub="Registered students"
            scheme={C.parent}
          />
          <StatCard
            icon={FileText}
            label="Pending Reports"
            value={stats.pendingReports}
            sub="New reports to read"
            scheme={{
              ...C.parent,
              accent: stats.pendingReports > 0 ? '#C06038' : '#3A7A5C',
              iconBg: stats.pendingReports > 0 ? C.parent.iconBg : C.teacher.iconBg,
              accentLight: stats.pendingReports > 0 ? C.parent.accentLight : C.teacher.accentLight,
              border: stats.pendingReports > 0 ? C.parent.border : C.teacher.border,
              textDark: stats.pendingReports > 0 ? C.parent.textDark : C.teacher.textDark,
              pageBg: stats.pendingReports > 0 ? C.parent.pageBg : C.teacher.pageBg,
            }}
            badge={stats.pendingReports}
          />
          <StatCard
            icon={BookOpen}
            label="Enrolled Classrooms"
            value={stats.enrolledClassrooms}
            sub="Approved classrooms"
            scheme={C.teacher}
          />
        </div>
      </section>

      {/* ── Quick actions ─────────────────────────────────── */}
      <section>
        <SectionLabel icon={<Sparkles size={13} />} text="Quick Actions" />
        <SectionTitle style={{ marginBottom: 16 }}>Where would you like to go?</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <ActionTile
            icon={Users}
            label="View Children"
            desc="See and manage your registered children"
            to="/parent/children"
            scheme={C.parent}
          />
          <ActionTile
            icon={FileText}
            label="View Reports"
            desc="Read progress reports from teachers"
            to="/parent/reports"
            scheme={{
              pageBg: '#EBF4EF', iconBg: '#D0EDE0',
              border: '#B8D8C4', accent: '#3A7A5C',
            }}
          />
          <ActionTile
            icon={PlayCircle}
            label="Student Mode"
            desc="Launch a calm reading session for your child"
            to="/student-mode"
            scheme={C.student}
          />
        </div>
      </section>

      {/* ── Children overview ─────────────────────────────── */}
      {children.length > 0 && (
        <section>
          <div style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: '24px 24px 20px',
            boxShadow: C.shadowSm,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: 18,
              flexWrap: 'wrap', gap: 10,
            }}>
              <div>
                <SectionLabel icon={<Users size={12} />} text="Children" />
                <SectionTitle>Your children</SectionTitle>
              </div>
              <SoftButton to="/parent/children" outline color={C.parent.accent} small>
                Manage all <ArrowRight size={13} />
              </SoftButton>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {children.map(child => (
                <ChildRow key={child.id} child={child} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Empty state for no children ───────────────────── */}
      {children.length === 0 && (
        <section>
          <div style={{
            background: C.parent.pageBg,
            border: `1.5px solid ${C.parent.border}`,
            borderRadius: 20,
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: C.shadowSm,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: C.parent.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <Baby size={28} style={{ color: C.parent.accent }} />
            </div>
            <p style={{
              fontFamily: '"Fredoka One", cursive',
              fontSize: 20, color: C.parent.textDark, margin: '0 0 6px',
            }}>
              No children yet
            </p>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 20px', lineHeight: 1.6 }}>
              Add your first child and join a classroom to get started.
            </p>
            <SoftButton to="/parent/children" color={C.parent.accent}>
              Add a Child <ArrowRight size={14} />
            </SoftButton>
          </div>
        </section>
      )}

    </div>
  );
}