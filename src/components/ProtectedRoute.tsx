import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // If the user's data has loaded but they are not verified, kick them back to confirm
  // (We skip this check if they are ALREADY on the confirm-email screen to avoid loops)
  if (userData && !userData.isVerified && location.pathname !== '/confirm-email') {
    return <Navigate to={`/confirm-email?email=${encodeURIComponent(user.email || "")}`} replace />;
  }

  return <>{children}</>;
}
