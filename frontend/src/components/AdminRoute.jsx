/**
 * AdminRoute — Renders children only if the current user has role 'admin'.
 * Redirects to / if not admin, and to /login if not authenticated.
 */
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function AdminRoute({ children }) {
  const { user, loading } = useUser();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
