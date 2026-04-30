import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import ProjectsPage from "./pages/ProjectsPage";
import BugsPage from "./pages/BugsPage";
import AgentPage from "./pages/AgentPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import AuditPage from "./pages/AuditPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="projects/overview" element={<ProjectDetailPage />} />
        <Route path="bugs" element={<BugsPage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route
          path="agent/audit"
          element={
            <ProtectedRoute roles={["administrator"]}>
              <AuditPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
