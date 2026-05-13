// ============================================================
// App.jsx — role-based routing and lazy-loaded pages
// ============================================================
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AchievementProvider } from './components/ui/AchievementNotification';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.default })));
const RegisterPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.RegisterPage })));
const TeacherLayout = lazy(() => import('./components/layout/TeacherLayout'));
const ParentLayout = lazy(() => import('./components/layout/ParentLayout'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const ChildrenListPage = lazy(() => import('./pages/teacher/ChildrenListPage'));
const ChildDetailPage = lazy(() => import('./pages/teacher/ChildDetailPage'));
const AssessmentsListPage = lazy(() => import('./pages/teacher/AssessmentsListPage'));
const AssessmentBuilderPage = lazy(() => import('./pages/teacher/AssessmentBuilderPage'));
const SessionReviewPage = lazy(() => import('./pages/teacher/SessionReviewPage'));
const TeacherReportsPage = lazy(() => import('./pages/teacher/TeacherReportsPage'));
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const ParentChildrenPage = lazy(() => import('./pages/parent/ParentChildrenPage'));
const ParentChildDetailPage = lazy(() => import('./pages/parent/ParentChildDetailPage'));
const ParentReportsPage = lazy(() => import('./pages/parent/ParentReportsPage'));
const ReportDetailPage = lazy(() => import('./pages/parent/ReportDetailPage'));
const StudentModePage = lazy(() => import('./pages/StudentModePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function Spinner({ message = 'Loading…' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--bg-primary, #FFF8F0)' }}>
      <div className="w-10 h-10 rounded-full border-4 border-sky border-t-transparent animate-spin" />
      <p className="font-display text-lg text-sky">{message}</p>
    </div>
  );
}

function ErrorBoundary({ children }) {
  return children; // Browser already handles errors gracefully here.
}

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner message="Loading ReadAble…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <Spinner message="Loading ReadAble…" />;

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute allowedRoles={['teacher']}><TeacherLayout /></ProtectedRoute>}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/children" element={<ChildrenListPage />} />
          <Route path="/teacher/children/:id" element={<ChildDetailPage />} />
          <Route path="/teacher/assessments" element={<AssessmentsListPage />} />
          <Route path="/teacher/assessments/new" element={<AssessmentBuilderPage />} />
          <Route path="/teacher/assessments/:id/edit" element={<AssessmentBuilderPage />} />
          <Route path="/teacher/sessions/:id" element={<SessionReviewPage />} />
          <Route path="/teacher/reports" element={<TeacherReportsPage />} />
          <Route path="/teacher/settings" element={<SettingsPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['parent']}><ParentLayout /></ProtectedRoute>}>
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent/children" element={<ParentChildrenPage />} />
          <Route path="/parent/children/:id" element={<ParentChildDetailPage />} />
          <Route path="/parent/reports" element={<ParentReportsPage />} />
          <Route path="/parent/reports/:id" element={<ReportDetailPage />} />
          <Route path="/parent/settings" element={<SettingsPage />} />
        </Route>

        <Route path="/student-mode/:sessionId" element={<ProtectedRoute allowedRoles={['parent']}><StudentModePage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <AchievementProvider>
            <AppRoutes />
          </AchievementProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
