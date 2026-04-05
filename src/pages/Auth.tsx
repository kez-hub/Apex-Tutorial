import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Full name is required").optional(),
  department: z.string().min(1, "Please select a department").optional(),
  whatsapp: z
    .string()
    .regex(/^\d{11}$/, "WhatsApp number must be exactly 11 digits")
    .optional(),
});

function getFriendlyErrorMessage(errorMsg: string) {
  if (
    errorMsg.includes("auth/invalid-credential") ||
    errorMsg.includes("auth/user-not-found") ||
    errorMsg.includes("auth/wrong-password")
  ) {
    return "The email or password you entered is incorrect. Please try again.";
  }
  if (errorMsg.includes("auth/email-already-in-use")) {
    return "An account with this email address already exists. Please navigate to 'Sign In' instead.";
  }
  if (errorMsg.includes("auth/weak-password")) {
    return "Your password is too weak. Please use a stronger password with at least 6 characters.";
  }
  if (errorMsg.includes("auth/network-request-failed")) {
    return "Network error. Please check your internet connection and try again.";
  }
  if (errorMsg.includes("auth/too-many-requests")) {
    return "Too many failed attempts. For your security, please wait a few minutes before trying again.";
  }
  if (errorMsg.includes("auth/popup-closed-by-user")) {
    return "Sign in popup was closed before completion.";
  }

  // Return a cleaned up version of the unknown error
  return (
    errorMsg
      .replace(/Firebase:/g, "")
      .replace(/Error/g, "")
      .replace(/\(.*?\)/g, "")
      .trim() || "An unexpected error occurred. Please try again."
  );
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSignup = searchParams.get("mode") === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user, loading } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user && !isSignup) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate, isSignup]);

  const validateForm = () => {
    try {
      authSchema.parse({
        email,
        password,
        name: isSignup ? name : undefined,
        department: isSignup ? department : undefined,
        whatsapp: isSignup ? whatsapp : undefined,
      });
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

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isSignup) {
        const { error } = await signUp(
          email,
          password,
          name,
          "student",
          department,
          whatsapp,
        );
        if (error) {
          toast({
            title: "Sign up failed",
            description: getFriendlyErrorMessage(error.message),
            variant: "destructive",
          });
        } else {
          navigate(`/confirm-email?email=${encodeURIComponent(email)}`);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: getFriendlyErrorMessage(error.message),
            variant: "destructive",
          });
        } else {
          navigate("/dashboard");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const socialProviders = [];

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <Link
                    to="/auth"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <Link
                    to="/auth?mode=signup"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </p>
          </div>

          {/* Social Login Buttons */}
          <div
            className="mt-8 grid grid-cols-1 gap-3 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            {socialProviders.map((provider) => (
              <Button
                key={provider.name}
                variant="outline"
                className="w-full"
                onClick={provider.onClick}
                disabled={isLoading}
              >
                {provider.icon}
                <span className="sr-only">{provider.name}</span>
              </Button>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
            )}

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

            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Biological Science(s)">
                      Biological Science(s)
                    </SelectItem>
                    <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                    <SelectItem value="Microbiology">Microbiology</SelectItem>
                    <SelectItem value="Pure and Industrial Chemistry">
                      Pure and Industrial Chemistry
                    </SelectItem>
                    <SelectItem value="Faculty of Physical Sciences">
                      Faculty of Physical Sciences
                    </SelectItem>
                    <SelectItem value="Computer Science">
                      Computer Science
                    </SelectItem>
                    <SelectItem value="Geology">Geology</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Industrial Physics">
                      Industrial Physics
                    </SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Statistics">Statistics</SelectItem>
                    <SelectItem value="Nursing Science">
                      Nursing Science
                    </SelectItem>
                    <SelectItem value="Medical Laboratory Science">
                      Medical Laboratory Science
                    </SelectItem>
                    <SelectItem value="Anatomy">Anatomy</SelectItem>
                    <SelectItem value="Physiology">Physiology</SelectItem>
                    <SelectItem value="Medicine and Surgery">
                      Medicine and Surgery
                    </SelectItem>
                    <SelectItem value="Faculty of Engineering">
                      Faculty of Engineering
                    </SelectItem>
                    <SelectItem value="Civil Engineering">
                      Civil Engineering
                    </SelectItem>
                    <SelectItem value="Electrical/Electronic Engineering">
                      Electrical/Electronic Engineering
                    </SelectItem>
                    <SelectItem value="Mechanical Engineering">
                      Mechanical Engineering
                    </SelectItem>
                    <SelectItem value="Agricultural Economics and Extension">
                      Agricultural Economics and Extension
                    </SelectItem>
                    <SelectItem value="Animal Science">
                      Animal Science
                    </SelectItem>
                    <SelectItem value="Crop Science And Horticulture">
                      Crop Science And Horticulture
                    </SelectItem>
                    <SelectItem value="Soil Science">Soil Science</SelectItem>
                    <SelectItem value="Fishery & Aquaculture">
                      Fishery & Aquaculture
                    </SelectItem>
                    <SelectItem value="Food Science & Technology">
                      Food Science & Technology
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-sm text-destructive">
                    {errors.department}
                  </p>
                )}
              </div>
            )}

            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="08012345678"
                    className="pl-10"
                    maxLength={11}
                    value={whatsapp}
                    onChange={(e) =>
                      setWhatsapp(
                        e.target.value.replace(/\D/g, "").slice(0, 11),
                      )
                    }
                    required
                  />
                </div>
                {errors.whatsapp && (
                  <p className="text-sm text-destructive">{errors.whatsapp}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
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
            </div>

            {!isSignup && (
              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

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
                  Processing...
                </span>
              ) : (
                <>
                  {isSignup ? "Create account" : "Sign in"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {isSignup && (
            <p
              className="mt-6 text-center text-xs text-muted-foreground animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              By signing up, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          )}
        </div>
      </div>

      {/* Right side - Image */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 gradient-primary opacity-90" />
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&h=1080&fit=crop"
          alt="Students learning"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-12">
          <blockquote className="space-y-4 text-primary-foreground">
            <p className="text-xl font-medium leading-relaxed">
              "Apex Tutorial transformed my career. I went from complete
              beginner to landing my dream job in just 6 months."
            </p>
            <footer className="flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
                alt="Sarah Chen"
                className="h-12 w-12 rounded-full border-2 border-primary-foreground/30"
              />
              <div>
                <p className="font-semibold">Sarah Chen</p>
                <p className="text-sm text-primary-foreground/80">
                  Software Engineer at Google
                </p>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
