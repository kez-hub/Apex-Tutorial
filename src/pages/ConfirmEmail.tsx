import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code sent to your email.",
        variant: "destructive"
      });
      return;
    }

    if (!user || !userData) {
       toast({
         title: "Error",
         description: "You must be signed in to verify an email.",
         variant: "destructive"
       });
       return;
    }
    
    setIsLoading(true);
    
    try {
      if (userData?.verificationCode === otp) {
        // Correct OTP! Let's update the database
        await updateDoc(doc(db, "users", user.uid), {
          isVerified: true
        });

        // 2. Add Welcome Notification
        await addDoc(collection(db, "users", user.uid, "notifications"), {
          title: "Welcome to Apex Tutorials!",
          message: "Your account is officially verified and your dashboard is ready.",
          type: "welcome",
          isRead: false,
          createdAt: serverTimestamp(),
        });
        
        toast({
          title: "Verified! 🎉",
          description: "Your account is now fully verified. Welcome aboard!",
        });
        
        // Minor delay to let state flush before navigation
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        toast({
          title: "Incorrect Code",
          description: "The verification code you entered is invalid.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      
      <div className="max-w-md w-full text-center relative z-10 animate-fade-in shadow-elevated rounded-3xl p-8 bg-card border border-border/50">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Mail className="w-10 h-10 text-primary" />
        </div>

        <h1 className="font-heading text-3xl font-bold mb-3 tracking-tight">
          Verify your email
        </h1>

        <p className="text-muted-foreground mb-2">
          We've sent a 6-digit confirmation code to:
        </p>
        
        {email && (
          <div className="bg-muted/50 rounded-lg p-3 mb-8 border border-border inline-block px-6">
            <p className="font-medium text-foreground tracking-wide">
              {email}
            </p>
          </div>
        )}
        
        <form onSubmit={handleVerify} className="space-y-8">
          <div className="flex flex-col items-center">
            <Input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-56 text-center text-4xl tracking-[0.25em] font-mono h-20 rounded-2xl border-2 border-primary/20 focus-visible:border-primary focus-visible:ring-primary shadow-sm"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full text-lg h-14 rounded-xl shadow-lg hover:shadow-xl transition-all"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify Code"}
            {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-8">
          Didn't receive the email?{" "}
          <button className="text-primary hover:underline font-medium transition-colors">
            Resend Code
          </button>
        </p>
      </div>
    </div>
  );
}