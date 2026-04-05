import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const email = searchParams.get("email");
  const code = searchParams.get("code");

  useEffect(() => {
    if (!email || !code) {
      navigate("/forgot-password");
    }
  }, [email, code, navigate]);

  const validateForm = () => {
    try {
      passwordSchema.parse({ password, confirmPassword });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code || !validateForm()) return;

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
          title: "Password reset successful!",
          description:
            "Your password has been updated. Please sign in with your new password.",
        });
        // Wait a moment then redirect to sign in
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
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
              Create New Password
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your reset code has been verified. Please enter your new password
              below.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 mt-8 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                • At least 8 characters
                <br />• At least one uppercase letter
                <br />• At least one number
                <br />• At least one special character
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Resetting...
                </span>
              ) : (
                "Reset Password"
              )}
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
            <h3 className="text-xl font-semibold mb-2">Secure Your Account</h3>
            <p className="text-muted-foreground">
              Create a strong password to protect your account and keep your
              learning data safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
