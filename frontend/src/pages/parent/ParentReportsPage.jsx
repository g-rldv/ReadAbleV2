// ============================================================
// ParentReportsPage — Redesigned to match ParentDashboard style
// Soft pastels · Lucide icons · No emojis · Nunito + Fredoka One
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  FileText, GraduationCap, CalendarDays,
  ChevronRight, AlertCircle, Bell, BookOpen,
  CheckCheck,
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

  textPrimary: '#28264A',
  textSecondary: '#6A6898',
  textMuted: '#9A98C0',
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

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

// ─── Report row ───────────────────────────────────────────────
function ReportRow({ report, unread }) {
  const [hov, setHov] = useState(false);
  const scheme = unread ? C.parent : C.teacher;

  return (
    <Link
      to={`/parent/reports/${report.id}`}
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
      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 13, flexShrink: 0,
        background: scheme.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileText size={19} style={{ color: scheme.accent }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: 0 }}>
          {report.title}
        </p>
        <p style={{
          fontSize: 12, color: C.textSecondary, margin: '3px 0 0',
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <BookOpen size={11} />
            {report.child_first_name} {report.child_last_name}
          </span>
          <span style={{ color: C.textMuted }}>·</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <GraduationCap size={11} />
            {report.teacher_first_name} {report.teacher_last_name}
          </span>
        </p>
        {report.sent_at && (
          <p style={{
            fontSize: 11, color: C.textMuted, margin: '4px 0 0',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <CalendarDays size={11} />
            {formatDate(report.sent_at)}
          </p>
        )}
      </div>

      {/* Right: badge or chevron */}
      {unread ? (
        <div style={{
          padding: '4px 10px', borderRadius: 20, flexShrink: 0,
          background: C.parent.accentLight,
          border: `1px solid ${C.parent.border}`,
          fontSize: 10, fontWeight: 800, color: C.parent.textDark,
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          New
        </div>
      ) : (
        <ChevronRight size={15} style={{ color: C.textMuted, flexShrink: 0 }} />
      )}
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function ParentReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports');
        setReports(res.data.reports || []);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
        setError(err.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // ── Loading ───────────────────────────────────────────────
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
          Loading reports…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '18px 20px', borderRadius: 16,
        background: '#FEF2F2', border: '1.5px solid #FECACA',
        boxShadow: C.shadowSm, fontFamily: 'Nunito, sans-serif',
      }}>
        <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', margin: 0 }}>
          {error}
        </p>
      </div>
    );
  }

  const unreadReports = reports.filter(r => !r.is_read);
  const readReports = reports.filter(r => r.is_read);

  // ── Main page ─────────────────────────────────────────────
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
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <SectionLabel icon={<FileText size={12} />} text="Reports" />
          <SectionTitle>Progress Reports</SectionTitle>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: '6px 0 0', lineHeight: 1.6, maxWidth: 480 }}>
            Review reports created by teachers and track your child's reading progress.
          </p>
        </div>
        {unreadReports.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 14,
            background: C.parent.accentLight,
            border: `1.5px solid ${C.parent.border}`,
            boxShadow: C.shadowSm,
          }}>
            <Bell size={15} style={{ color: C.parent.accent }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: C.parent.textDark }}>
              {unreadReports.length} unread
            </span>
          </div>
        )}
      </div>

      {/* ── Empty state ───────────────────────────────────── */}
      {reports.length === 0 && (
        <div style={{
          background: C.teacher.pageBg,
          border: `1.5px solid ${C.teacher.border}`,
          borderRadius: 20,
          padding: '44px 28px',
          textAlign: 'center',
          boxShadow: C.shadowSm,
        }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            background: C.teacher.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <FileText size={26} style={{ color: C.teacher.accent }} />
          </div>
          <p style={{
            fontFamily: '"Fredoka One", cursive',
            fontSize: 20, color: C.teacher.textDark, margin: '0 0 6px',
          }}>
            No reports yet
          </p>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: 0, lineHeight: 1.6 }}>
            Your teachers will send reports here as they become available.
          </p>
        </div>
      )}

      {/* ── Unread reports ────────────────────────────────── */}
      {unreadReports.length > 0 && (
        <section>
          <div style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: '24px 24px 20px',
            boxShadow: C.shadowSm,
          }}>
            <div style={{ marginBottom: 18 }}>
              <SectionLabel icon={<Bell size={12} />} text="New" />
              <SectionTitle>
                New Reports
                <span style={{
                  marginLeft: 10,
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: 14, fontWeight: 800,
                  color: C.parent.accent,
                  verticalAlign: 'middle',
                }}>
                  ({unreadReports.length})
                </span>
              </SectionTitle>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {unreadReports.map(report => (
                <ReportRow key={report.id} report={report} unread />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Read reports ──────────────────────────────────── */}
      {readReports.length > 0 && (
        <section>
          <div style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: '24px 24px 20px',
            boxShadow: C.shadowSm,
          }}>
            <div style={{ marginBottom: 18 }}>
              <SectionLabel icon={<CheckCheck size={12} />} text="Previous" />
              <SectionTitle>Previous Reports</SectionTitle>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {readReports.map(report => (
                <ReportRow key={report.id} report={report} unread={false} />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}