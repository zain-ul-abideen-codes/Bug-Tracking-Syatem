import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import PageSkeleton from "../common/PageSkeleton";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageSkeleton cards={3} rows={4} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
