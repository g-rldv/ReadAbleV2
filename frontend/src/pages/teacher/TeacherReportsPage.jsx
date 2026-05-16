// ============================================================
// TeacherReportsPage — Reports scoped by classroom → student
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, ChevronDown, ChevronRight, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

export default function TeacherReportsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [reports, setReports] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [expandedClassrooms, setExpandedClassrooms] = useState({});
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [classroomsRes, childrenRes, reportsRes, sessionsRes] = await Promise.all([
          api.get('/classrooms'),
          api.get('/teacher/children'),
          api.get('/reports'),
          api.get('/sessions'),
        ]);
        setClassrooms(classroomsRes.data.classrooms || []);
        setChildren(childrenRes.data.children || []);
        setReports(reportsRes.data.reports || []);
        setSessions(sessionsRes.data.sessions || []);

        // Auto-expand first classroom
        const cls = classroomsRes.data.classrooms || [];
        if (cls.length > 0) {
          setExpandedClassrooms({ [cls[0].id]: true });
        }
      } catch (err) {
        console.error('[TeacherReports]', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  const toggleClassroom = (id) => {
    setExpandedClassrooms((prev) => ({ ...prev, [id]: !prev[id] }));
    if (selectedClassroom?.id !== id) {
      setSelectedClassroom(classrooms.find((c) => c.id === id) || null);
      setSelectedChild(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // Children who belong to a classroom (via teacher_id assigned when parent approved)
  const getChildrenForClassroom = (classroom) => {
    return children.filter((c) => c.teacher_id === classroom.teacher_id || true)
      .filter((c) => c.teacher_id != null); // all teacher's children for now
  };

  // Reports for a specific child
  const getReportsForChild = (childId) =>
    reports.filter((r) => r.child_id === childId);

  // Sessions for a specific child
  const getSessionsForChild = (childId) =>
    sessions.filter((s) => s.child_id === childId);

  // All children across ALL classrooms (teacher-scoped)
  const allChildren = children;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-slate-500">Loading reports…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Progress Reports</h1>
        <p className="text-slate-500 mt-1">
          View reports and session results per classroom and student.
        </p>
      </div>

      {classrooms.length === 0 ? (
        <NoClassroomsState />
      ) : (
        <div className="flex gap-6 min-h-[600px]">
          {/* ── Left: Classroom + Student Tree ─────────────────── */}
          <aside className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Classrooms
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {classrooms.map((classroom) => {
                  const classroomChildren = allChildren; // teacher sees all their children
                  const isExpanded = expandedClassrooms[classroom.id];

                  return (
                    <div key={classroom.id}>
                      {/* Classroom row */}
                      <button
                        onClick={() => toggleClassroom(classroom.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                          selectedClassroom?.id === classroom.id && !selectedChild
                            ? 'bg-sky/5'
                            : ''
                        }`}
                      >
                        {isExpanded
                          ? <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                          : <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
                        <BookOpen size={15} className="text-sky flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {classroom.name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">{classroom.code}</p>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {classroom.member_count ?? 0}
                        </span>
                      </button>

                      {/* Children under classroom */}
                      {isExpanded && (
                        <div className="bg-slate-50/50">
                          {classroomChildren.length === 0 ? (
                            <p className="px-9 py-2 text-xs text-slate-400 italic">No students yet</p>
                          ) : (
                            classroomChildren.map((child) => {
                              const childReports = getReportsForChild(child.id);
                              const unread = childReports.filter((r) => !r.is_read).length;
                              return (
                                <button
                                  key={child.id}
                                  onClick={() => {
                                    setSelectedClassroom(classroom);
                                    setSelectedChild(child);
                                  }}
                                  className={`w-full flex items-center gap-3 px-9 py-2.5 text-left hover:bg-slate-100 transition-colors ${
                                    selectedChild?.id === child.id ? 'bg-sky/10' : ''
                                  }`}
                                >
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                    style={{ background: 'rgba(77,150,255,0.15)', color: '#4D96FF' }}
                                  >
                                    {child.first_name?.[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate">
                                      {child.first_name} {child.last_name}
                                    </p>
                                  </div>
                                  {unread > 0 && (
                                    <span className="text-xs bg-orange-400 text-white rounded-full px-1.5 py-0.5 font-bold flex-shrink-0">
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

          {/* ── Right: Detail Panel ──────────────────────────── */}
          <div className="flex-1 min-w-0">
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
                children={allChildren}
                reports={reports}
                sessions={sessions}
                formatDate={formatDate}
                onSelectChild={(child) => setSelectedChild(child)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function NoClassroomsState() {
  return (
    <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
      <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
      <h2 className="text-lg font-semibold text-slate-600 mb-2">No classrooms yet</h2>
      <p className="text-slate-400 text-sm mb-6">
        Create a classroom and add students to start generating reports.
      </p>
      <Link
        to="/teacher/classrooms"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky text-white rounded-lg font-medium hover:bg-sky/80 transition-colors"
      >
        <BookOpen size={16} /> Manage Classrooms
      </Link>
    </div>
  );
}

function SelectPrompt() {
  return (
    <div className="h-full flex items-center justify-center bg-white rounded-xl border border-slate-200">
      <div className="text-center py-16">
        <FileText size={40} className="mx-auto text-slate-200 mb-3" />
        <p className="text-slate-400 text-sm">Select a classroom or student to view reports</p>
      </div>
    </div>
  );
}

function ClassroomOverviewPanel({ classroom, children, reports, sessions, formatDate, onSelectChild }) {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const avgScore = completedSessions > 0
    ? Math.round(sessions.filter((s) => s.status === 'completed').reduce((sum, s) => sum + (s.percentage || 0), 0) / completedSessions)
    : 0;

  return (
    <div className="space-y-4">
      {/* Classroom header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{classroom.name}</h2>
            <p className="text-sm text-slate-500 mt-1">Code: <span className="font-mono font-bold">{classroom.code}</span></p>
          </div>
          <Link
            to={`/teacher/classrooms/${classroom.id}`}
            className="text-xs text-sky hover:text-sky/80 font-medium"
          >
            Manage →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <Stat label="Students" value={children.length} />
          <Stat label="Sessions" value={totalSessions} />
          <Stat label="Avg Score" value={`${avgScore}%`} color={avgScore >= 70 ? 'text-green-600' : 'text-orange-500'} />
        </div>
      </div>

      {/* Per-student summary */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Students in this classroom</h3>
        </div>
        {children.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">No students have joined yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {children.map((child) => {
              const childSessions = sessions.filter((s) => s.child_id === child.id);
              const childReports = reports.filter((r) => r.child_id === child.id);
              const completed = childSessions.filter((s) => s.status === 'completed');
              const childAvg = completed.length > 0
                ? Math.round(completed.reduce((sum, s) => sum + (s.percentage || 0), 0) / completed.length)
                : null;
              const unread = childReports.filter((r) => !r.is_read).length;

              return (
                <button
                  key={child.id}
                  onClick={() => onSelectChild(child)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'rgba(77,150,255,0.15)', color: '#4D96FF' }}
                  >
                    {child.first_name?.[0]}{child.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{child.first_name} {child.last_name}</p>
                    <p className="text-xs text-slate-400">{completed.length} completed session{completed.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {childAvg !== null && (
                      <span className={`text-sm font-bold ${childAvg >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                        {childAvg}%
                      </span>
                    )}
                    {unread > 0 && (
                      <span className="text-xs bg-orange-400 text-white rounded-full px-2 py-0.5 font-bold">
                        {unread} new
                      </span>
                    )}
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentReportPanel({ child, reports, sessions, formatDate }) {
  const completed = sessions.filter((s) => s.status === 'completed');
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((sum, s) => sum + (s.percentage || 0), 0) / completed.length)
    : null;

  return (
    <div className="space-y-4">
      {/* Student header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: 'rgba(77,150,255,0.15)', color: '#4D96FF' }}
          >
            {child.first_name?.[0]}{child.last_name?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{child.first_name} {child.last_name}</h2>
            <p className="text-sm text-slate-500">
              {child.age ? `Age ${child.age}` : ''}
              {child.age && child.gender ? ' · ' : ''}
              {child.gender || ''}
            </p>
          </div>
          <Link
            to={`/teacher/children/${child.id}`}
            className="text-xs text-sky hover:text-sky/80 font-medium"
          >
            Full Profile →
          </Link>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Stat label="Sessions" value={sessions.length} />
          <Stat label="Completed" value={completed.length} />
          <Stat
            label="Avg Score"
            value={avgScore !== null ? `${avgScore}%` : '—'}
            color={avgScore !== null ? (avgScore >= 70 ? 'text-green-600' : 'text-orange-500') : 'text-slate-400'}
          />
        </div>

        {/* ASD Notes */}
        {child.asd_notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-1">ASD Notes</p>
            <p className="text-sm text-blue-800">{child.asd_notes}</p>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Assessment Sessions</h3>
          <span className="text-xs text-slate-400">{sessions.length} total</span>
        </div>
        {sessions.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">No sessions yet for this student.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.slice(0, 10).map((session) => (
              <div key={session.id} className="flex items-center gap-4 px-6 py-3">
                <StatusDot status={session.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {session.assessment_title || 'Assessment'}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(session.started_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {session.percentage != null ? (
                    <span className={`text-sm font-bold ${session.percentage >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                      {Math.round(session.percentage)}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">In progress</span>
                  )}
                </div>
                <Link
                  to={`/teacher/sessions/${session.id}`}
                  className="text-xs text-sky hover:text-sky/80 font-medium ml-2"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reports */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Reports Sent</h3>
          <span className="text-xs text-slate-400">{reports.length} total</span>
        </div>
        {reports.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">No reports sent yet for this student.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center gap-4 px-6 py-3">
                <FileText size={15} className={report.is_read ? 'text-slate-300' : 'text-orange-400'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{report.title}</p>
                  <p className="text-xs text-slate-400">
                    Sent {formatDate(report.sent_at)}
                    {report.parent_first_name && ` · to ${report.parent_first_name} ${report.parent_last_name}`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {report.is_read ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle size={12} /> Read
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-medium">
                      <Clock size={12} /> Unread
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'text-slate-900' }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    completed: 'bg-green-400',
    in_progress: 'bg-orange-400',
    default: 'bg-slate-300',
  };
  return (
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status] || colors.default}`} />
  );
}