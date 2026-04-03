import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const instructorSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Full name is required"),
});

function getFriendlyErrorMessage(errorMsg: string) {
  if (errorMsg.includes("auth/email-already-in-use")) {
    return "An instructor account with this email already exists. Please sign in instead.";
  }
  return errorMsg.replace(/Firebase:/g, "").replace(/Error/g, "").replace(/\(.*?\)/g, "").trim() || "An unexpected error occurred. Please try again.";
}

export default function InstructorSignup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signUp, signInWithGoogle, user, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    try {
      instructorSchema.parse({ email, password, name });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
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
      const { error } = await signUp(email, password, name, 'instructor');
      if (error) {
        toast({
          title: "Signup failed",
          description: getFriendlyErrorMessage(error.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome aboard! 🍎",
          description: "Your instructor account has been created. Redirecting to verification...",
        });
        navigate(`/confirm-email?email=${encodeURIComponent(email)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans">
      {/* Left side - Content */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-card shadow-2xl z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center lg:text-left mb-10 animate-fade-in">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 lg:mb-6">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Teacher Portal
            </h2>
            <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
              Join our elite community of industry experts and start sharing your knowledge today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Professional Name</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Dr. John Smith"
                  className="pl-10 h-12 border-muted hover:border-primary/50 focus:border-primary transition-all bg-muted/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Work Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="instructor@apex.edu"
                  className="pl-10 h-12 border-muted hover:border-primary/50 focus:border-primary transition-all bg-muted/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {errors.email && <p className="text-xs text-destructive font-medium">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Secure Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 border-muted hover:border-primary/50 focus:border-primary transition-all bg-muted/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive font-medium">{errors.password}</p>}
            </div>

            <Button type="submit" variant="gradient" className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-xl" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Applying...
                </span>
              ) : (
                <>
                  Generate Instructor Profile
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <p className="text-sm text-muted-foreground">
              Already an instructor?{" "}
              <Link to="/auth" className="font-bold text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
                Sign in to your portal
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Visual block */}
      <div className="hidden lg:block relative flex-1 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-slate-950 z-10" />
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-60 scale-105 hover:scale-100 transition-transform duration-10000"
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&h=1080&fit=crop"
          alt="Instructor teaching"
        />
        
        <div className="absolute inset-0 flex items-center justify-center p-20 z-20">
          <div className="max-w-2xl space-y-8 text-white backdrop-blur-sm bg-black/20 p-12 rounded-3xl border border-white/10 shadow-2xl">
            <div className="flex gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-1 w-12 rounded-full bg-primary/50" />
              ))}
            </div>
            <h3 className="text-4xl font-bold font-heading leading-tight italic">
              "Teaching is the highest form of understanding. Join Apex and inspire the next generation of African tech talent."
            </h3>
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-accent p-1">
                <div className="h-full w-full rounded-xl bg-slate-900 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold">Professor Adebayo</p>
                <p className="text-primary font-medium tracking-wide">Head of Curriculum @ Apex</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
