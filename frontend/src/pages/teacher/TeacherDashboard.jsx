// ============================================================
// TeacherDashboard.jsx — Redesigned to match ParentDashboard style
// Soft pastels · Lucide icons · No emojis · Nunito + Fredoka One
// Includes burger menu for small devices
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ClipboardList, BookOpen, ArrowRight,
  GraduationCap, BarChart2, PlusCircle,
  ChevronRight, Sparkles, Menu, X,
  LayoutDashboard, Activity, Settings,
  School, TrendingUp,
} from 'lucide-react';
import api from '../../utils/api';

// ─── Design tokens (mirrored from ParentDashboard) ───────────
const C = {
  page: '#F2F0FA',
  white: '#FFFFFF',
  border: '#DDD8F2',
  shadowSm: '0 1px 8px rgba(80,60,160,0.07)',
  shadowMd: '0 4px 24px rgba(80,60,160,0.10)',

  teacher: {
    pageBg: '#EBF4EF',
    cardBg: '#F4FBF7',
    border: '#B8D8C4',
    accent: '#3A7A5C',
    accentLight: '#CCEADB',
    textDark: '#1A4A38',
    btnBg: '#3A7A5C',
    btnText: '#FFFFFF',
    iconBg: '#D0EDE0',
    iconColor: '#3A7A5C',
  },

  parent: {
    pageBg: '#FDF0E8',
    border: '#F0C8A8',
    accent: '#C06038',
    accentLight: '#FAE0C8',
    textDark: '#6A2810',
    iconBg: '#FAD8C0',
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

// ─── Student row ──────────────────────────────────────────────
function StudentRow({ child }) {
  const [hov, setHov] = useState(false);
  const initials = `${child.first_name?.[0] ?? ''}${child.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <Link
      to={`/teacher/children/${child.id}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderRadius: 14,
        background: hov ? C.teacher.pageBg : C.white,
        border: `1.5px solid ${hov ? C.teacher.border : C.border}`,
        transition: 'all 0.15s',
        textDecoration: 'none',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 42, height: 42, borderRadius: 14,
        background: C.teacher.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontFamily: '"Fredoka One", cursive',
        fontSize: 16, color: C.teacher.accent,
      }}>
        {initials || <GraduationCap size={18} style={{ color: C.teacher.accent }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: 0 }}>
          {child.first_name} {child.last_name}
        </p>
        {child.parent_name && (
          <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={12} />
            Parent: {child.parent_name}
          </p>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 20,
        background: C.teacher.accentLight,
        border: `1px solid ${C.teacher.border}`,
        fontSize: 12, fontWeight: 700, color: C.teacher.textDark,
      }}>
        View <ChevronRight size={12} />
      </div>
    </Link>
  );
}

// ─── Burger / Mobile Nav ──────────────────────────────────────
const NAV_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard',         to: '/teacher/dashboard' },
  { icon: Users,           label: 'Students',          to: '/teacher/children' },
  { icon: ClipboardList,   label: 'Assessments',       to: '/teacher/assessments' },
  { icon: BarChart2,       label: 'Analytics',         to: '/teacher/analytics' },
  { icon: PlusCircle,      label: 'Create Assessment', to: '/teacher/assessments/new' },
  { icon: Settings,        label: 'Settings',          to: '/teacher/settings' },
];

function BurgerMenu() {
  const [open, setOpen] = useState(false);
  const scheme = C.teacher;

  return (
    <>
      {/* Trigger button — visible only on small screens */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        style={{
          display: 'none',
          alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 12,
          background: scheme.iconBg,
          border: `1.5px solid ${scheme.border}`,
          cursor: 'pointer',
          // shown via the <style> block below
        }}
        className="burger-trigger"
      >
        <Menu size={20} style={{ color: scheme.accent }} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(28,26,60,0.35)',
            zIndex: 200,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 280,
        background: C.white,
        borderRight: `2px solid ${scheme.border}`,
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: open ? C.shadowMd : 'none',
      }}>
        {/* Drawer header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: `1px solid ${scheme.border}`,
          background: scheme.pageBg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: scheme.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <School size={18} style={{ color: scheme.accent }} />
            </div>
            <span style={{
              fontFamily: '"Fredoka One", cursive',
              fontSize: 18, color: scheme.textDark,
            }}>
              Teacher Menu
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'transparent',
              border: `1px solid ${scheme.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} style={{ color: scheme.accent }} />
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_LINKS.map(({ icon: Icon, label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                textDecoration: 'none',
                color: C.textPrimary,
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700, fontSize: 14,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = scheme.pageBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: scheme.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={17} style={{ color: scheme.accent }} />
              </div>
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${scheme.border}`,
          fontSize: 11, color: C.textMuted, fontWeight: 600,
          fontFamily: 'Nunito, sans-serif',
        }}>
          ReadAble · Teacher Portal
        </div>
      </div>

      {/* CSS to show burger button only on small screens */}
      <style>{`
        @media (max-width: 640px) {
          .burger-trigger { display: flex !important; }
        }
      `}</style>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    childrenCount: 0,
    assessmentsCount: 0,
    recentSessions: 0,
  });
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [childrenRes, assessmentsRes] = await Promise.all([
          api.get('/teacher/children'),
          api.get('/assessments'),
        ]);

        const childrenList = childrenRes.data.children || [];
        const assessmentsList = assessmentsRes.data.assessments || [];

        setChildren(childrenList);
        setStats({
          childrenCount: childrenList.length,
          assessmentsCount: assessmentsList.length,
          recentSessions: 0,
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
          border: `3px solid ${C.teacher.accentLight}`,
          borderTop: `3px solid ${C.teacher.accent}`,
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
        background: C.teacher.pageBg,
        border: `1.5px solid ${C.teacher.border}`,
        padding: '28px 28px 24px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 18,
        boxShadow: C.shadowSm,
      }}>
        <div>
          <SectionLabel icon={<School size={12} />} text="Teacher Dashboard" />
          <SectionTitle>Welcome to ReadAble</SectionTitle>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: '6px 0 0', lineHeight: 1.6, maxWidth: 480 }}>
            Manage your students, track assessments, and monitor reading progress.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Burger menu — visible only on mobile */}
          <BurgerMenu />
          <SoftButton to="/teacher/assessments/new" color={C.teacher.accent} style={{ flexShrink: 0 }}>
            <PlusCircle size={16} /> Create Assessment
          </SoftButton>
        </div>
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
            label="Your Students"
            value={stats.childrenCount}
            sub="Active students"
            scheme={C.teacher}
          />
          <StatCard
            icon={ClipboardList}
            label="Assessments"
            value={stats.assessmentsCount}
            sub="Created assessments"
            scheme={{
              ...C.teacher,
              accent: '#4058C0',
              iconBg: C.student.iconBg,
              accentLight: C.student.accentLight,
              border: C.student.border,
              textDark: C.student.textDark,
              pageBg: C.student.pageBg,
            }}
          />
          <StatCard
            icon={Activity}
            label="Active Sessions"
            value={stats.recentSessions}
            sub="In progress"
            scheme={{
              ...C.teacher,
              accent: '#C06038',
              iconBg: C.parent.iconBg,
              accentLight: C.parent.accentLight,
              border: C.parent.border,
              textDark: C.parent.textDark,
              pageBg: C.parent.pageBg,
            }}
          />
        </div>
      </section>

      {/* ── Quick actions ─────────────────────────────────── */}
      <section>
        <SectionLabel icon={<Sparkles size={13} />} text="Quick Actions" />
        <SectionTitle style={{ marginBottom: 16 }}>Where would you like to go?</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <ActionTile
            icon={BarChart2}
            label="View Analytics"
            desc="Track student progress and reading trends"
            to="/teacher/analytics"
            scheme={{
              pageBg: '#EBF0FF', iconBg: '#D0D8F8',
              border: '#B8C8F0', accent: '#4058C0',
            }}
          />
          <ActionTile
            icon={Users}
            label="View Students"
            desc="Browse and manage your student roster"
            to="/teacher/children"
            scheme={C.teacher}
          />
          <ActionTile
            icon={ClipboardList}
            label="View Assessments"
            desc="Review all created reading assessments"
            to="/teacher/assessments"
            scheme={{
              pageBg: '#FDF0E8', iconBg: '#FAD8C0',
              border: '#F0C8A8', accent: '#C06038',
            }}
          />
          <ActionTile
            icon={PlusCircle}
            label="Create Assessment"
            desc="Build a new reading assessment for your class"
            to="/teacher/assessments/new"
            scheme={C.teacher}
          />
        </div>
      </section>



    </div>
  );
}