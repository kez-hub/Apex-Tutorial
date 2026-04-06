import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  // Show loading while auth data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user, redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Only redirect to confirm-email if userData exists AND user is not verified
  // AND we're not already on the confirm-email page
  // This prevents redirects during userData temporary null states
  if (userData && !userData.isVerified && location.pathname !== '/confirm-email') {
    return <Navigate to={`/confirm-email?email=${encodeURIComponent(user.email || "")}`} replace />;
  }

  // If we have a user but userData is null (still loading), show loading state
  // This prevents showing content before userData is ready
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
