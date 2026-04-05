import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Profile from "./pages/Profile";
import Schedule from "./pages/Schedule";
import NotFound from "./pages/NotFound";
import ConfirmEmail from "./pages/ConfirmEmail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Notifications from "./pages/Notifications";
import HelpCenter from "./pages/HelpCenter";
import ContactUs from "./pages/ContactUs";
import FAQ from "./pages/FAQ";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import InstructorSignup from "./pages/InstructorSignup";
import Quiz from "./pages/Quiz";
import { PaymentModal } from "@/components/auth/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import React from "react";

const queryClient = new QueryClient();

const GlobalPaymentHandler = () => {
  const { user, userData } = useAuth();
  const [isDismissed, setIsDismissed] = React.useState(false);

  // The modal should be open if student is logged in, verified, but hasn't paid
  const shouldShow = !!(
    user &&
    userData &&
    userData.isVerified &&
    !userData.hasPaid &&
    userData.role === "student" &&
    !isDismissed
  );

  // Debugging: This will help the user see exactly why the modal is not showing in their browser console
  React.useEffect(() => {
    if (user && userData) {
      console.log(
        `💳 [PAYMENT CHECK] Role: ${userData.role} | Verified: ${userData.isVerified} | Paid: ${userData.hasPaid} | ShowModal: ${shouldShow} | Dismissed: ${isDismissed}`,
      );
    }
  }, [user, userData, shouldShow, isDismissed]);

  return (
    <PaymentModal isOpen={shouldShow} onClose={() => setIsDismissed(true)} />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GlobalPaymentHandler />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/instructor/signup" element={<InstructorSignup />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetails />} />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute>
                  <Schedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
