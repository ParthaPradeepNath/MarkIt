import { Suspense, lazy, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/Logo";
import type { Role } from "@/types";

const TeacherDashboard = lazy(() => import("@/pages/TeacherDashboard"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const Students = lazy(() => import("@/pages/Students"));
const Classes = lazy(() => import("@/pages/Classes"));
const Attendance = lazy(() => import("@/pages/Attendance"));
const MarkAttendance = lazy(() => import("@/pages/MarkAttendance"));
const AttendanceHistory = lazy(() => import("@/pages/AttendanceHistory"));
const Reports = lazy(() => import("@/pages/Reports"));
const Profile = lazy(() => import("@/pages/Profile"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <Logo className="size-8 animate-pulse" />
        <p className="text-xs text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background" aria-busy="true">
      <div className="flex flex-col items-center gap-3">
        <Logo className="size-9 animate-pulse" />
        <p className="text-xs text-muted-foreground">Loading MarkIt…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

function DashboardRoute() {
  const { user } = useAuth();
  return withSuspense(user?.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />);
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardRoute />} />

              <Route
                path="/classes"
                element={
                  <ProtectedRoute roles={["teacher"]}>{withSuspense(<Classes />)}</ProtectedRoute>
                }
              />
              <Route
                path="/students"
                element={
                  <ProtectedRoute roles={["teacher"]}>{withSuspense(<Students />)}</ProtectedRoute>
                }
              />
              <Route
                path="/mark-attendance"
                element={
                  <ProtectedRoute roles={["teacher"]}>
                    {withSuspense(<MarkAttendance />)}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute roles={["teacher"]}>{withSuspense(<Attendance />)}</ProtectedRoute>
                }
              />
              <Route path="/history" element={withSuspense(<AttendanceHistory />)} />
              <Route path="/reports" element={withSuspense(<Reports />)} />
              <Route path="/profile" element={withSuspense(<Profile />)} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster position="top-right" closeButton />
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
