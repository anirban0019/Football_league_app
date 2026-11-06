import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RequireAuth() {
  const { user, loading, error } = useAuth();
  if (loading) return <p role="status">Checking your session...</p>;
  if (error) return <p role="alert">{error}</p>;
  return user ? <Outlet /> : <Navigate to="/admin-login" replace />;
}
