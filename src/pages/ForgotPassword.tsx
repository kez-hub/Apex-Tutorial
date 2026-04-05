import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

function getFriendlyErrorMessage(errorMsg: string) {
  if (errorMsg.includes("No account found")) {
    return "No account found with this email address. Please check your email or sign up for a new account.";
  }
  if (errorMsg.includes("Failed to send")) {
    return "Failed to send reset email. Please try again.";
  }
  return (
    errorMsg
      .replace(/Firebase:/g, "")
      .replace(/Error/g, "")
      .replace(/\(.*?\)/g, "")
      .trim() || "An unexpected error occurred. Please try again."
  );
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { sendPasswordResetCode, verifyResetCode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateEmail = () => {
    try {
      emailSchema.parse({ email });
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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      const { error } = await sendPasswordResetCode(email);
      if (error) {
        toast({
          title: "Failed to send reset code",
          description: getFriendlyErrorMessage(error.message),
          variant: "destructive",
        });
      } else {
        setCodeSent(true);
        toast({
          title: "Reset code sent",
          description: "Please check your email for the reset code.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digits

    const newCode = [...resetCode];
    newCode[index] = value;
    setResetCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !resetCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeString = resetCode.join("");

    if (codeString.length !== 6) {
      setErrors({ code: "Please enter all 6 digits" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await verifyResetCode(email, codeString);
      if (error) {
        toast({
          title: "Invalid code",
          description: getFriendlyErrorMessage(error.message),
          variant: "destructive",
        });
      } else {
        // Navigate to reset password page with email and code
        navigate(
          `/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(codeString)}`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="animate-fade-in">
            <Link
              to="/auth"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Link>

            <h2 className="font-heading text-2xl font-bold tracking-tight">
              {codeSent ? "Enter reset code" : "Forgot your password?"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {codeSent
                ? "We've sent a reset code to your email. Enter it below to continue."
                : "Enter your email address and we'll send you a reset code."}
            </p>
          </div>

          {!codeSent ? (
            <form
              onSubmit={handleSendCode}
              className="space-y-5 mt-8 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
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
                    Sending reset email...
                  </span>
                ) : (
                  <>
                    Send reset email
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={handleVerifyCode}
              className="space-y-5 mt-8 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="space-y-2">
                <Label>Reset Code</Label>
                <div className="flex gap-2 justify-center">
                  {resetCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-semibold border-2 border-input rounded-md focus:border-primary focus:ring-1 focus:ring-primary text-foreground bg-background"
                      required
                    />
                  ))}
                </div>
                {errors.code && (
                  <p className="text-sm text-destructive text-center">
                    {errors.code}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCodeSent(false)}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  className="flex-1"
                  disabled={isLoading || resetCode.some((digit) => !digit)}
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
                      Verifying...
                    </span>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="text-sm text-primary hover:underline"
                  disabled={isLoading}
                >
                  Didn't receive the code? Send again
                </button>
              </div>
            </form>
          )}
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
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Secure Password Reset
            </h3>
            <p className="text-muted-foreground">
              We'll send you a secure reset code to help you regain access to
              your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
