import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

function getFriendlyErrorMessage(errorMsg: string) {
  return (
    errorMsg
      .replace(/Firebase:/g, "")
      .replace(/Error/g, "")
      .replace(/\(.*?\)/g, "")
      .trim() || "An unexpected error occurred. Please try again."
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const email = searchParams.get("email");
  const code = searchParams.get("code");

  useEffect(() => {
    if (!email || !code) {
      navigate("/forgot-password");
    }
  }, [email, code, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) return;

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(email, code, password);
      if (error) {
        toast({
          title: "Password reset failed",
          description: getFriendlyErrorMessage(error.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password reset successful",
          description:
            "Your password has been updated. You can now sign in with your new password.",
        });
        navigate("/auth");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !code) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen gradient-hero flex">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="animate-fade-in">
            <Link
              to="/forgot-password"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>

            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Set New Password
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your reset code has been verified. Please enter your new password
              below.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 animate-fade-in space-y-6"
            style={{ animationDelay: "0.1s" }}
          >
            <div>
              <Label htmlFor="password">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex lg:flex-1 lg:justify-center lg:items-center lg:px-8">
        <div
          className="max-w-md animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="text-center">
            <div className="mx-auto h-32 w-32 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Lock className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Secure Password Update
            </h3>
            <p className="text-muted-foreground">
              Enter your new password below. Make sure it's strong and secure.
              Your password will be hashed and stored securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
