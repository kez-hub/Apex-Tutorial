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
  
  // If already on confirm-email page, allow access while userData loads
  if (location.pathname === '/confirm-email') {
    return <>{children}</>;
  }
  
  // If userData still loading, show loading state (don't redirect yet)
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Check verification status: trust Firebase's emailVerified if available, otherwise use our custom flag
  // Also allow access if user has already paid (indicates they've been verified before)
  const isUserVerified = user.emailVerified || userData.isVerified || userData.hasPaid;
  
  // Only redirect to confirm-email if user is NOT verified
  if (!isUserVerified) {
    return <Navigate to={`/confirm-email?email=${encodeURIComponent(user.email || "")}`} replace />;
  }

  return <>{children}</>;
}
