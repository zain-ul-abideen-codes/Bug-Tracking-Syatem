import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import PageSkeleton from "./components/common/PageSkeleton";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const AssignedProjectsPage = lazy(() => import("./pages/AssignedProjectsPage"));
const BugsPage = lazy(() => import("./pages/BugsPage"));
const AgentPage = lazy(() => import("./pages/AgentPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const AuditPage = lazy(() => import("./pages/AuditPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

function LazyPage({ children }) {
  return <Suspense fallback={<PageSkeleton cards={3} rows={4} />}>{children}</Suspense>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LazyPage><LoginPage /></LazyPage>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LazyPage><DashboardPage /></LazyPage>} />
        <Route path="users" element={<LazyPage><UsersPage /></LazyPage>} />
        <Route path="projects" element={<LazyPage><ProjectsPage /></LazyPage>} />
        <Route path="assigned-projects" element={<LazyPage><AssignedProjectsPage /></LazyPage>} />
        <Route path="projects/:projectId" element={<LazyPage><ProjectDetailPage /></LazyPage>} />
        <Route path="projects/overview" element={<LazyPage><ProjectDetailPage /></LazyPage>} />
        <Route path="bugs" element={<LazyPage><BugsPage /></LazyPage>} />
        <Route path="agent" element={<LazyPage><AgentPage /></LazyPage>} />
        <Route path="profile" element={<LazyPage><ProfilePage /></LazyPage>} />
        <Route path="settings" element={<LazyPage><SettingsPage /></LazyPage>} />
        <Route
          path="agent/audit"
          element={
            <ProtectedRoute roles={["administrator"]}>
              <LazyPage><AuditPage /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute roles={["administrator"]}>
              <LazyPage><AuditPage /></LazyPage>
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
