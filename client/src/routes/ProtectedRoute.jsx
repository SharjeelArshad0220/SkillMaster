import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApp } from "../hooks/useApp";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function ProtectedRoute() {
  const { user } = useAuth();
  const { isRestoring } = useApp();

  if (!user) return <Navigate to="/auth" replace />;
  
  // Show spinner while restoring state from localStorage/API on reload
  if (isRestoring) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy">
        <LoadingSpinner />
      </div>
    );
  }

  return <Outlet />;
}

