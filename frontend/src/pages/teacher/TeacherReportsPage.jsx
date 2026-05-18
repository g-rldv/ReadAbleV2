// ============================================================
// TeacherReportsPage.jsx — Redesigned to match AssessmentsListPage
// Soft pastels · Lucide icons · No emojis · Nunito + Fredoka One
// Responsive Layout Enhancements for Mobile Devices Included
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, ChevronDown, ChevronRight, FileText,
  Clock, CheckCircle2, AlertCircle, BarChart2, Baby,
  Sparkles, GraduationCap, CalendarDays, Hash, ArrowRight,
} from 'lucide-react';
import api from '../../utils/api';

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

// ─── Sub-component Elements ───────────────────────────────────
function StudentReportPanel({ child, reports, sessions, formatDate }) {
  const completed = sessions.filter(s => s.status === 'completed');
  const avgScore  = completed.length > 0
    ? Math.round(completed.reduce((sum, s) => sum + (s.percentage || 0), 0) / completed.length)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* Student header */}
      <div className="reports-panel-header" style={{
        background: C.student.pageBg,
        border: `1.5px solid ${C.student.border}`,
        borderRadius: 20, padding: '24px 26px',
        boxShadow: C.shadowSm,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: C.student.iconBg, border: `1.5px solid ${C.student.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Fredoka One", cursive', fontSize: 20, color: C.student.accent,
          }}>
            {(child.first_name?.[0] || '?').toUpperCase()}{(child.last_name?.[0] || '').toUpperCase()}
          </div>
          <div>
            <SectionLabel icon={<Baby size={12} />} text="Student" />
            <SectionTitle style={{ fontSize: 'clamp(18px, 2.5vw, 22px)' }}>
              {child.first_name} {child.last_name}
            </SectionTitle>
            {(child.age || child.gender) && (
              <p style={{ fontSize: 12, color: C.textSecondary, margin: '2px 0 0' }}>
                {[child.age ? `Age ${child.age}` : null, child.gender].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        <SoftButton
          to={`/teacher/children/${child.id}`}
          color={C.student.accent}
          className="reports-action-btn"
          style={{ minWidth: '130px' }}
        >
          Full Profile <ArrowRight size={13} />
        </SoftButton>
      </div>

      {/* Stats strip */}
      <div className="reports-stats-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, width: '100%' }}>
        <StatTile icon={Sparkles}    label="Sessions"   value={sessions.length}   scheme={C.teacher} />
        <StatTile icon={CheckCircle2} label="Completed" value={completed.length}  scheme={C.student} />
        <StatTile icon={BarChart2}   label="Avg Score"  value={avgScore != null ? `${avgScore}%` : '—'}
          scheme={avgScore != null ? (avgScore >= 70 ? C.teacher : C.parent) : { accent: C.textMuted, iconBg: '#F0EDF8' }} />
      </div>

      {/* ASD Notes */}
      {child.asd_notes && (
        <div style={{
          padding: '14px 18px', borderRadius: 14,
          background: C.student.pageBg, border: `1.5px solid ${C.student.border}`,
          boxShadow: C.shadowSm,
        }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: C.student.textDark, margin: '0 0 5px', textTransform: 'uppercase' }}>
            ASD Notes
          </p>
          <p style={{ fontSize: 13, color: C.textPrimary, margin: 0, lineHeight: 1.6 }}>{child.asd_notes}</p>
        </div>
      )}

      {/* Sessions table */}
      <div style={{
        background: C.white, border: `1.5px solid ${C.border}`,
        borderRadius: 20, overflow: 'hidden', boxShadow: C.shadowSm, width: '100%'
      }}>
        <div style={{
          padding: '14px 22px', borderBottom: `1.5px solid ${C.border}`,
          background: C.teacher.pageBg,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Sparkles size={14} style={{ color: C.teacher.accent }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: C.teacher.textDark }}>Assessment Sessions</span>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.textMuted,
            background: '#F0EDF8', border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '2px 10px', flexShrink: 0
          }}>
            {sessions.length} total
          </span>
        </div>
        {sessions.length === 0 ? (
          <div style={{ padding: '32px 22px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>No sessions yet for this student.</p>
          </div>
        ) : (
          sessions.slice(0, 10).map((session, idx) => (
            <SessionRow key={session.id} session={session} formatDate={formatDate} hasBorder={idx < sessions.length - 1} />
          ))
        )}
      </div>

      {/* Reports table */}
      <div style={{
        background: C.white, border: `1.5px solid ${C.border}`,
        borderRadius: 20, overflow: 'hidden', boxShadow: C.shadowSm, width: '100%'
      }}>
        <div style={{
          padding: '14px 22px', borderBottom: `1.5px solid ${C.border}`,
          background: C.student.pageBg,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <FileText size={14} style={{ color: C.student.accent }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: C.student.textDark }}>Reports Sent</span>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, color: C.textMuted,
            background: '#F0EDF8', border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '2px 10px', flexShrink: 0
          }}>
            {reports.length} total
          </span>
        </div>
        {reports.length === 0 ? (
          <div style={{ padding: '32px 22px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>No reports sent yet for this student.</p>
          </div>
        ) : (
          reports.map((report, idx) => (
            <ReportRow key={report.id} report={report} formatDate={formatDate} hasBorder={idx < reports.length - 1} />
          ))
        )}
      </div>
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

function SoftButton({ children, onClick, to, color, outline, small, disabled, className = '', style: extra = {} }) {
  const [hov, setHov] = useState(false);
  const col = color || C.primary;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: small ? '7px 16px' : '10px 20px',
    borderRadius: 12, fontSize: small ? 13 : 14, fontWeight: 700,
    fontFamily: 'Nunito, sans-serif', cursor: disabled ? 'not-allowed' : 'pointer',
    border: `2px solid ${col}`, transition: 'all 0.15s', textDecoration: 'none',
    opacity: disabled ? 0.5 : 1, boxSizing: 'border-box', ...extra,
  };
  const filled  = { ...base, background: hov && !disabled ? `${col}DD` : col, color: '#FFF' };
  const outlined = { ...base, background: hov && !disabled ? `${col}12` : 'transparent', color: col };
  const s = outline ? outlined : filled;
  if (to) return <Link to={to} className={className} style={s} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>{children}</Link>;
  return <button onClick={onClick} disabled={disabled} className={className} style={s} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>{children}</button>;
}

function StatTile({ icon: Icon, label, value, scheme }) {
  return (
    <div style={{
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
        <p style={{ fontFamily: '"Fredoka One", cursive', fontSize: 26, color: scheme.accent, margin: 0, lineHeight: 1 }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ScoreBadge({ pct }) {
  if (pct == null) return <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 700 }}>—</span>;
  const good = pct >= 70;
  return (
    <span style={{
      fontSize: 13, fontWeight: 800,
      color: good ? C.teacher.accent : C.parent.accent,
    }}>
      {Math.round(pct)}%
    </span>
  );
}

function StatusChip({ status }) {
  const map = {
    completed:   { label: 'Done',        bg: C.teacher.accentLight, border: C.teacher.border, color: C.teacher.textDark, icon: CheckCircle2 },
    in_progress: { label: 'In Progress', bg: C.parent.accentLight,  border: C.parent.border,  color: C.parent.textDark,  icon: Clock },
  };
  const t = map[status] || { label: status, bg: '#F0EDF8', border: C.border, color: C.textMuted, icon: Clock };
  const Icon = t.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20,
      background: t.bg, border: `1px solid ${t.border}`,
      fontSize: 11, fontWeight: 800, color: t.color, whiteSpace: 'nowrap',
    }}>
      <Icon size={10} /> {t.label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function TeacherReportsPage() {
  const [classrooms,              setClassrooms]             = useState([]);
  const [reports,                setReports]                = useState([]);
  const [sessions,               setSessions]               = useState([]);
  const [children,               setChildren]               = useState([]);
  const [selectedClassroom,      setSelectedClassroom]      = useState(null);
  const [selectedChild,          setSelectedChild]          = useState(null);
  const [expandedClassrooms,     setExpandedClassrooms]     = useState({});
  const [classroomStudents,      setClassroomStudents]      = useState({});
  const [loadingClassroomStudents, setLoadingClassroomStudents] = useState({});
  const [loading,                setLoading]                = useState(true);
  const [error,                  setError]                  = useState(null);

  const fetchClassroomChildren = async (classroomId) => {
    if (classroomStudents[classroomId] != null) return;
    setLoadingClassroomStudents(p => ({ ...p, [classroomId]: true }));
    try {
      const res = await api.get(`/classrooms/${classroomId}/children`);
      setClassroomStudents(p => ({ ...p, [classroomId]: res.data.children || [] }));
    } catch {
      classroomStudents[classroomId] = [];
      setClassroomStudents(p => ({ ...p, [classroomId]: [] }));
    } finally {
      setLoadingClassroomStudents(p => { const n = { ...p }; delete n[classroomId]; return n; });
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [clsRes, kidRes, repRes, sesRes] = await Promise.all([
          api.get('/classrooms'),
          api.get('/teacher/children'),
          api.get('/reports'),
          api.get('/sessions'),
        ]);
        setClassrooms(clsRes.data.classrooms || []);
        setChildren(kidRes.data.children || []);
        setReports(repRes.data.reports || []);
        setSessions(sesRes.data.sessions || []);

        const cls = clsRes.data.classrooms || [];
        if (cls.length > 0) {
          setExpandedClassrooms({ [cls[0].id]: true });
          fetchClassroomChildren(cls[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const toggleClassroom = (id) => {
    const opening = !expandedClassrooms[id];
    setExpandedClassrooms(p => ({ ...p, [id]: !p[id] }));
    if (selectedClassroom?.id !== id) {
      setSelectedClassroom(classrooms.find(c => c.id === id) || null);
      setSelectedChild(null);
    }
    if (opening) fetchClassroomChildren(id);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getChildrenForClassroom = (classroom) => classroomStudents[classroom.id] || [];
  const getReportsForChild  = (id) => reports.filter(r => r.child_id === id);
  const getSessionsForChild = (id) => sessions.filter(s => s.child_id === id);

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
        <p style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, margin: 0 }}>Loading reports…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 18px', borderRadius: 14,
        background: C.rose.pageBg, border: `1.5px solid ${C.rose.border}`,
        color: C.rose.textDark, fontSize: 13, fontWeight: 700,
        fontFamily: 'Nunito, sans-serif',
      }}>
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  return (
    <div className="reports-page-container" style={{
      fontFamily: '"Nunito", sans-serif',
      color: C.textPrimary,
      maxWidth: 1100,
      display: 'flex', flexDirection: 'column', gap: 36,
      width: '100%',
    }}>
      {/* Responsive media styling anchors */}
      <style>{`
        .reports-split-row { display: flex; gap: 20px; alignItems: flex-start; width: 100%; }
        @media (max-width: 768px) {
          .reports-split-row { flex-direction: column !important; align-items: stretch !important; }
          .reports-sidebar-aside { width: 100% !important; }
          .reports-panel-header { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .reports-action-btn { width: 100% !important; }
          .reports-stats-strip { grid-template-columns: 1fr !important; }
          .row-item-card { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .row-item-badges { width: 100% !important; justify-content: space-between !important; }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{
        borderRadius: 22,
        background: C.teacher.pageBg,
        border: `1.5px solid ${C.teacher.border}`,
        padding: '28px 28px 24px',
        boxShadow: C.shadowSm,
      }}>
        <SectionLabel icon={<FileText size={12} />} text="Reports" />
        <SectionTitle>Progress Reports</SectionTitle>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: '6px 0 0', lineHeight: 1.6 }}>
          View assessment sessions and reports per classroom and student.
        </p>
      </div>

      {classrooms.length === 0 ? (
        <div style={{
          background: C.teacher.pageBg,
          border: `1.5px solid ${C.teacher.border}`,
          borderRadius: 20, padding: '48px 28px',
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
          <p style={{ fontFamily: '"Fredoka One", cursive', fontSize: 20, color: C.teacher.textDark, margin: '0 0 6px' }}>
            No classrooms yet
          </p>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 20px', lineHeight: 1.6 }}>
            Create a classroom and add students to start generating reports.
          </p>
          <SoftButton to="/teacher/classrooms" color={C.teacher.accent}>
            <BookOpen size={15} /> Manage Classrooms
          </SoftButton>
        </div>
      ) : (
        <div className="reports-split-row">

          {/* ── Left sidebar: classroom + student tree ─────────── */}
          <aside className="reports-sidebar-aside" style={{ width: 264, flexShrink: 0 }}>
            <div style={{
              background: C.white,
              border: `1.5px solid ${C.border}`,
              borderRadius: 20, overflow: 'hidden',
              boxShadow: C.shadowSm,
            }}>
              <div style={{
                padding: '14px 18px',
                background: C.teacher.pageBg,
                borderBottom: `1.5px solid ${C.teacher.border}`,
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <GraduationCap size={14} style={{ color: C.teacher.accent }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: C.teacher.textDark, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Classrooms
                </span>
              </div>

              <div>
                {classrooms.map((classroom, idx) => {
                  const classroomChildren = getChildrenForClassroom(classroom);
                  const isExpanded = expandedClassrooms[classroom.id];
                  const isActive   = selectedClassroom?.id === classroom.id && !selectedChild;
                  const isLoading  = loadingClassroomStudents[classroom.id];

                  return (
                    <div
                      key={classroom.id}
                      style={{ borderBottom: idx < classrooms.length - 1 ? `1px solid ${C.border}` : 'none' }}
                    >
                      <button
                        onClick={() => toggleClassroom(classroom.id)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 16px', textAlign: 'left', cursor: 'pointer',
                          background: isActive ? C.teacher.pageBg : 'transparent',
                          border: 'none', borderLeft: isActive ? `3px solid ${C.teacher.accent}` : '3px solid transparent',
                          transition: 'all 0.15s', fontFamily: 'Nunito, sans-serif',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F6F4FD'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ color: C.textMuted, display: 'flex', flexShrink: 0 }}>
                          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </span>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: C.teacher.iconBg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <BookOpen size={13} style={{ color: C.teacher.accent }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {classroom.name}
                          </p>
                          <p style={{ fontSize: 10, color: C.textMuted, margin: 0, fontFamily: '"Courier New", monospace' }}>
                            {classroom.code}
                          </p>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 800, color: C.textMuted,
                          background: '#F0EDF8', border: `1px solid ${C.border}`,
                          borderRadius: 20, padding: '1px 7px', flexShrink: 0,
                        }}>
                          {classroom.member_count ?? 0}
                        </span>
                      </button>

                      {isExpanded && (
                        <div style={{ background: '#FAFAF8', borderTop: `1px solid ${C.border}` }}>
                          {isLoading ? (
                            <p style={{ padding: '8px 20px 8px 46px', fontSize: 11, color: C.textMuted, margin: 0 }}>Loading…</p>
                          ) : classroomChildren.length === 0 ? (
                            <p style={{ padding: '8px 20px 8px 46px', fontSize: 11, color: C.textMuted, fontStyle: 'italic', margin: 0 }}>No students yet</p>
                          ) : (
                            classroomChildren.map(child => {
                              const unread = getReportsForChild(child.id).filter(r => !r.is_read).length;
                              const isChildActive = selectedChild?.id === child.id;
                              return (
                                <button
                                  key={child.id}
                                  onClick={() => { setSelectedClassroom(classroom); setSelectedChild(child); }}
                                  style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                                    padding: '9px 14px 9px 36px', textAlign: 'left', cursor: 'pointer',
                                    background: isChildActive ? C.student.pageBg : 'transparent',
                                    border: 'none', borderLeft: isChildActive ? `3px solid ${C.student.accent}` : '3px solid transparent',
                                    marginLeft: 0, transition: 'all 0.15s', fontFamily: 'Nunito, sans-serif',
                                    boxSizing: 'border-box'
                                  }}
                                  onMouseEnter={e => { if (!isChildActive) e.currentTarget.style.background = C.student.pageBg + '88'; }}
                                  onMouseLeave={e => { if (!isChildActive) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <div style={{
                                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                                    background: C.student.iconBg,
                                    border: `1.5px solid ${C.student.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: '"Fredoka One", cursive', fontSize: 11, color: C.student.accent,
                                  }}>
                                    {(child.first_name?.[0] || '?').toUpperCase()}
                                  </div>
                                  <p style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {child.first_name} {child.last_name}
                                  </p>
                                  {unread > 0 && (
                                    <span style={{
                                      fontSize: 10, fontWeight: 800,
                                      background: C.parent.accent, color: '#FFF',
                                      borderRadius: 20, padding: '1px 7px', flexShrink: 0,
                                    }}>
                                      {unread}
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── Right: detail panel ─────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {!selectedChild && !selectedClassroom ? (
              <SelectPrompt />
            ) : selectedChild ? (
              <StudentReportPanel
                child={selectedChild}
                reports={getReportsForChild(selectedChild.id)}
                sessions={getSessionsForChild(selectedChild.id)}
                formatDate={formatDate}
              />
            ) : (
              <ClassroomOverviewPanel
                classroom={selectedClassroom}
                children={children}
                reports={reports}
                sessions={sessions}
                formatDate={formatDate}
                onSelectChild={c => setSelectedChild(c)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Select prompt ────────────────────────────────────────────
function SelectPrompt() {
  return (
    <div style={{
      background: C.white,
      border: `1.5px solid ${C.border}`,
      borderRadius: 20, padding: '64px 28px',
      textAlign: 'center', boxShadow: C.shadowSm, width: '100%', boxSizing: 'border-box'
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: '#EDE8FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 14px',
      }}>
        <FileText size={24} style={{ color: C.primary }} />
      </div>
      <p style={{ fontFamily: '"Fredoka One", cursive', fontSize: 18, color: C.textPrimary, margin: '0 0 6px' }}>
        Select a classroom or student
      </p>
      <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
        Choose from the sidebar to view reports and session data.
      </p>
    </div>
  );
}

// ─── Classroom overview panel ─────────────────────────────────
function ClassroomOverviewPanel({ classroom, children, reports, sessions, formatDate, onSelectChild }) {
  const completed = sessions.filter(s => s.status === 'completed');
  const avgScore  = completed.length > 0
    ? Math.round(completed.reduce((sum, s) => sum + (s.percentage || 0), 0) / completed.length)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      <div className="reports-panel-header" style={{
        background: C.teacher.pageBg,
        border: `1.5px solid ${C.teacher.border}`,
        borderRadius: 20, padding: '24px 26px',
        boxShadow: C.shadowSm,
        display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <SectionLabel icon={<GraduationCap size={12} />} text="Classroom Overview" />
          <SectionTitle>{classroom.name}</SectionTitle>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
            padding: '3px 10px', borderRadius: 20,
            background: C.white, border: `1px solid ${C.teacher.border}`,
            fontSize: 11, fontWeight: 700, color: C.textMuted,
          }}>
            <Hash size={10} />
            <span style={{ fontFamily: '"Courier New", monospace', letterSpacing: '0.04em' }}>{classroom.code}</span>
          </div>
        </div>
        <Link
          to={`/teacher/classrooms/${classroom.id}`}
          className="reports-action-btn"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 12,
            background: C.teacher.accent, color: '#FFF',
            fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13,
            textDecoration: 'none', border: `2px solid ${C.teacher.accent}`,
            transition: 'opacity 0.15s', justifycontent: 'center', boxSizing: 'border-box'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Manage <ArrowRight size={13} />
        </Link>
      </div>

      {/* Stats strip */}
      <div className="reports-stats-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, width: '100%' }}>
        <StatTile icon={Baby}        label="Students"  value={children.length}   scheme={C.student} />
        <StatTile icon={Sparkles}    label="Sessions"  value={sessions.length}   scheme={C.teacher} />
        <StatTile icon={BarChart2}   label="Avg Score" value={avgScore != null ? `${avgScore}%` : '—'}
          scheme={avgScore != null ? (avgScore >= 70 ? C.teacher : C.parent) : { accent: C.textMuted, iconBg: '#F0EDF8' }} />
      </div>

      {/* Per-student rows */}
      <div style={{
        background: C.white, border: `1.5px solid ${C.border}`,
        borderRadius: 20, overflow: 'hidden', boxShadow: C.shadowSm, width: '100%'
      }}>
        <div style={{
          padding: '14px 22px',
          borderBottom: `1.5px solid ${C.border}`,
          background: C.teacher.pageBg,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <Baby size={14} style={{ color: C.teacher.accent }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: C.teacher.textDark }}>
            Students in this classroom
          </span>
        </div>
        {children.length === 0 ? (
          <div style={{ padding: '32px 22px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>No students have joined yet.</p>
          </div>
        ) : (
          children.map((child, idx) => {
            const childSessions = sessions.filter(s => s.child_id === child.id);
            const childReports  = reports.filter(r => r.child_id === child.id);
            const done     = childSessions.filter(s => s.status === 'completed');
            const childAvg = done.length > 0
              ? Math.round(done.reduce((sum, s) => sum + (s.percentage || 0), 0) / done.length)
              : null;
            const unread = childReports.filter(r => !r.is_read).length;

            return (
              <StudentRow
                key={child.id}
                child={child}
                completedCount={done.length}
                avgScore={childAvg}
                unread={unread}
                onClick={() => onSelectChild(child)}
                hasBorder={idx < children.length - 1}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Student row (inside classroom overview) ──────────────────
function StudentRow({ child, completedCount, avgScore, unread, onClick, hasBorder }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 22px', textAlign: 'left', cursor: 'pointer',
        background: hov ? C.student.pageBg : 'transparent',
        border: 'none',
        borderBottom: hasBorder ? `1px solid ${C.border}` : 'none',
        transition: 'background 0.15s', fontFamily: 'Nunito, sans-serif',
        boxSizing: 'border-box', flexWrap: 'wrap'
      }}
    >
      <div className="row-item-card" style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: C.student.iconBg, border: `1.5px solid ${C.student.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Fredoka One", cursive', fontSize: 14, color: C.student.accent,
          }}>
            {(child.first_name?.[0] || '?').toUpperCase()}{(child.last_name?.[0] || '').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {child.first_name} {child.last_name}
            </p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
              {completedCount} completed session{completedCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="row-item-badges" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <ScoreBadge pct={avgScore} />
          {unread > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 800,
              background: C.parent.accent, color: '#FFF',
              borderRadius: 20, padding: '2px 8px',
            }}>
              {unread} new
            </span>
          )}
          <ChevronRight size={14} style={{ color: C.textMuted }} />
        </div>
      </div>
    </button>
  );
}

// ─── Session row ──────────────────────────────────────────────
function SessionRow({ session, formatDate, hasBorder }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 22px',
        background: hov ? C.teacher.pageBg : 'transparent',
        borderBottom: hasBorder ? `1px solid ${C.border}` : 'none',
        transition: 'background 0.15s', flexWrap: 'wrap'
      }}
    >
      <div className="row-item-card" style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          <StatusChip status={session.status} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.assessment_title || 'Assessment'}
            </p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarDays size={10} /> {formatDate(session.started_at)}
            </p>
          </div>
        </div>
        <div className="row-item-badges" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <ScoreBadge pct={session.percentage} />
          <Link
            to={`/teacher/sessions/${session.id}`}
            style={{
              fontSize: 12, fontWeight: 700, color: C.student.accent,
              textDecoration: 'none', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Review <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Report row ───────────────────────────────────────────────
function ReportRow({ report, formatDate, hasBorder }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 22px',
        background: hov ? C.student.pageBg : 'transparent',
        borderBottom: hasBorder ? `1px solid ${C.border}` : 'none',
        transition: 'background 0.15s', flexWrap: 'wrap'
      }}
    >
      <div className="row-item-card" style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: report.is_read ? '#F0EDF8' : C.parent.accentLight,
            border: `1.5px solid ${report.is_read ? C.border : C.parent.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={14} style={{ color: report.is_read ? C.textMuted : C.parent.accent }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {report.title}
            </p>
            <p style={{ fontSize: 11, color: C.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Sent {formatDate(report.sent_at)}
              {report.parent_first_name && ` · to ${report.parent_first_name} ${report.parent_last_name}`}
            </p>
          </div>
        </div>
        <div className="row-item-badges" style={{ flexShrink: 0 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 20,
            background: report.is_read ? C.teacher.accentLight : C.parent.accentLight,
            border: `1px solid ${report.is_read ? C.teacher.border : C.parent.border}`,
            fontSize: 11, fontWeight: 800,
            color: report.is_read ? C.teacher.textDark : C.parent.textDark,
            whiteSpace: 'nowrap',
          }}>
            {report.is_read
              ? <><CheckCircle2 size={10} /> Read</>
              : <><Clock size={10} /> Unread</>}
          </span>
        </div>
      </div>
    </div>
  );
}