import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, authReady } = useAuth();

  if (!authReady) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}